import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MultiSelect } from "react-native-element-dropdown";
import { useIsFocused } from "@react-navigation/native";
import { CameraView, Camera } from "expo-camera";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import axios from "axios";
import getAccessToken from "./api/googleAuth";
import { getUserData } from "./Firebase/UserManager";
import { auth } from "./Firebase/AuthManager";
import { db } from "./Firebase/firestore";
import { getUserInfo } from "./api/index";
import { colors, card } from "./theme";

// The old Google Sheets logging path is being kept as a fallback during the
// Firestore-based spirit points trial, but disabled so it doesn't actually
// write on every scan. Flip this back to true to re-enable it if needed.
const LEGACY_SHEETS_WRITE_ENABLED = false;

const DEFAULT_SCANNER_OPTIONS = [
  {
    label: "Attend a Hospitality Night",
    value: "Attend a Hospitality Night",
    points: 1,
    sortOrder: 1,
  },
  {
    label: "Register a Miracle Maker",
    value: "Register a Miracle Maker",
    points: 5,
    sortOrder: 2,
  },
  {
    label: "Attend an organization's fundraiser",
    value: "Attend an organization's fundraiser",
    points: 3,
    sortOrder: 3,
  },
  {
    label: "Support a team fundraiser",
    value: "Support a team fundraiser",
    points: 3,
    sortOrder: 4,
  },
  {
    label: "Wear your DM merch at check-ins",
    value: "Wear your DM merch at check-ins",
    points: 1,
    sortOrder: 5,
  },
  {
    label: "Attend check-ins",
    value: "Attend check-ins",
    points: 1,
    sortOrder: 6,
  },
  {
    label: "Buy DM merch",
    value: "Buy DM merch",
    points: 3,
    sortOrder: 7,
  },
];

const Scanner = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [userData, setUserData] = useState({ name: "", team: "" });
  const [modalVisible, setModalVisible] = useState(false);
  // React Native's <Modal> doesn't unmount its contents when closed — it just
  // hides the native window, so the same CameraView instance (and its
  // internal camera session) persists across opens. If that session doesn't
  // fully reset, a later reopen in the same app session can come up with no
  // picture even though the very first open worked. Bumping this on every
  // open and using it as CameraView's key forces React to throw away the old
  // instance and mount a genuinely fresh one each time.
  const [cameraInstanceKey, setCameraInstanceKey] = useState(0);
  // Known expo-camera/expo-modules-core bug (expo/expo#49760): the native
  // camera session can fire its "ready" event before the JS side has
  // finished wiring up to receive it, and that event is silently dropped —
  // the camera genuinely starts (hence still seeing the "camera in use"
  // indicator) but JS never learns about it, so the preview never shows a
  // picture. This is a race, not a hard failure, so it doesn't happen every
  // time. Delaying the actual CameraView mount a beat after the modal opens
  // gives React/Fabric time to finish wiring handlers first, making it much
  // more likely the ready event has somewhere to land when it fires.
  const [shouldMountCamera, setShouldMountCamera] = useState(false);
  const cameraMountTimer = useRef(null);
  // Scanner is a stack screen inside a tab navigator — switching tabs (or
  // navigating elsewhere) doesn't unmount it, and React Native's <Modal>
  // doesn't unmount its contents when hidden either. Without this, opening
  // the camera and then switching tabs left the camera session running in
  // the background indefinitely, with nothing managing or resetting it —
  // a real, separate contributor to inconsistent camera behavior on top of
  // the race condition above.
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused && modalVisible) {
      setModalVisible(false);
    }
  }, [isFocused, modalVisible]);

  useEffect(() => {
    clearTimeout(cameraMountTimer.current);
    if (modalVisible && isFocused) {
      setShouldMountCamera(false);
      cameraMountTimer.current = setTimeout(
        () => setShouldMountCamera(true),
        300
      );
    } else {
      setShouldMountCamera(false);
    }
    return () => clearTimeout(cameraMountTimer.current);
  }, [modalVisible, cameraInstanceKey, isFocused]);

  const [userIDState, setUserIDState] = useState("");
  const [userInfo, setUserInfo] = useState({});

  const [requestStatus, setRequestStatus] = useState("");
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [isDropdownFocus, setIsDropdownFocus] = useState(false);
  const [scannerOptions, setScannerOptions] = useState(DEFAULT_SCANNER_OPTIONS);

  const scanLock = useRef(false);

  const removeSelectedReason = (reasonToRemove) => {
    setSelectedReasons((current) =>
      current.filter((reason) => reason !== reasonToRemove),
    );
  };

  useEffect(() => {
    const fetchScannerOptions = async () => {
      try {
        const opportunitiesQuery = query(
          collection(db, "SpiritPoints"),
          where("active", "==", true),
        );
        const querySnapshot = await getDocs(opportunitiesQuery);

        const fetchedOptions = querySnapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            const label = data.label?.trim();

            if (!label) {
              return null;
            }

            return {
              label,
              value: data.value?.trim() || label,
              points: Number(data.points) || 0,
              sortOrder: Number(data.sortOrder) || 999,
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        if (fetchedOptions.length > 0) {
          setScannerOptions(fetchedOptions);
        } else {
          setScannerOptions(DEFAULT_SCANNER_OPTIONS);
        }
      } catch (error) {
        console.error("Error fetching scanner opportunities:", error);
        setScannerOptions(DEFAULT_SCANNER_OPTIONS);
      }
    };

    fetchScannerOptions();
  }, []);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  useEffect(() => {
    getUserData()
      .then((data) => {
        setUserIDState(data.donorID);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    // userIDState is "" until getUserData() above resolves; calling
    // DonorDrive with no ID just logs "Missing DonorDrive participant ID"
    // for nothing.
    if (!userIDState) return;
    getUserInfo(userIDState)
      .then((data) => {
        setUserInfo(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [userIDState]);

  const postRowToSheet = async (
    token,
    recipient,
    team,
    reason,
    date,
    time,
    giver,
    value,
    captainTeam,
  ) => {
    const SPREADSHEET_ID = "1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY";

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet3:append?valueInputOption=RAW`;

      // captainTeam is always appended as the 8th (last) column, never
      // inserted mid-row — keeps "Value" and everything before it at their
      // existing fixed positions for anything else reading Sheet3.
      const rowData = [recipient, team, reason, date, time, giver, value, captainTeam];

      const postData = {
        values: [rowData],
      };

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      await axios.post(url, postData, config);

      setRequestStatus("Row added to sheet successfully!");
    } catch (error) {
      console.error(
        "Error adding row to sheet:",
        error.response ? error.response.data : error.message,
      );
      setRequestStatus("Failed to add row to sheet.");
    }
  };

  const getCurrentDate = () => {
    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getCurrentTime = () => {
    const currentDate = new Date();

    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  };

  // PARALLEL SYSTEM (in testing) — mirrors every scan into Firestore
  // alongside the existing Google Sheets write, so the two can be compared
  // before the Sheets/script-based system is retired. A failure here is
  // logged but never blocks the existing (working) Sheets flow.
  const awardSpiritPointsInFirestore = async (recipient, selectedOptions) => {
    if (!recipient.uid) {
      console.warn(
        "Skipping Firestore spirit points write: QR code has no uid (stale code from before this feature shipped).",
      );
      return;
    }

    try {
      const totalPoints = selectedOptions.reduce(
        (sum, option) => sum + Number(option.points || 0),
        0,
      );

      await updateDoc(doc(db, "Users", recipient.uid), {
        spiritPoints: increment(totalPoints),
        // Denormalized here so the leaderboard can display a name without
        // needing a separate (slow, rate-limited) DonorDrive lookup per user.
        displayName: recipient.name,
      });

      const awardsRef = collection(db, "SpiritPointAwards");
      for (const selectedOption of selectedOptions) {
        await addDoc(awardsRef, {
          recipientID: recipient.uid,
          recipientName: recipient.name,
          team: recipient.team,
          captainTeam: recipient.captainTeam,
          reason: selectedOption.label,
          points: selectedOption.points,
          giverID: auth.currentUser?.uid || null,
          giverName: userInfo.displayName || null,
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error writing spirit points to Firestore:", error);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setScanned(true);

    // Everything that can fail (parsing, network, Firestore writes) is
    // wrapped here, with the modal/lock reset moved into `finally`. Before
    // this, an unexpected error anywhere in here — including scanning
    // something that isn't a DM QR code at all, like Expo's own connection
    // QR — threw partway through and skipped the cleanup code entirely,
    // leaving the camera stuck open on "Scanned!" forever.
    try {
      const extractedData = await parseQRCodeData(data);
      if (extractedData) {
        setUserData(extractedData);

        const selectedOptions = scannerOptions.filter((option) =>
          selectedReasons.includes(option.value),
        );

        if (selectedOptions.length > 0) {
          if (LEGACY_SHEETS_WRITE_ENABLED) {
            const ACCESS_TOKEN = await getAccessToken();
            const date = getCurrentDate();
            const time = getCurrentTime();
            const giver = userInfo.displayName;

            for (const selectedOption of selectedOptions) {
              await postRowToSheet(
                ACCESS_TOKEN,
                extractedData.name,
                extractedData.team,
                selectedOption.label,
                date,
                time,
                giver,
                selectedOption.points,
                extractedData.captainTeam,
              );
            }
          }

          await awardSpiritPointsInFirestore(extractedData, selectedOptions);
        }
      } else {
        setUserData({ name: "Invalid QR code", team: "" });
      }
    } catch (error) {
      console.error("Error handling scanned code:", error);
      setUserData({ name: "Error processing scan", team: "" });
    } finally {
      setModalVisible(false);
      setScanned(false);
      setSelectedReasons([]);
      scanLock.current = false;
    }
  };

  // const handleBarCodeScanned = async ({ type, data }) => {
  //   setScanned(true);
  //   const extractedData = await parseQRCodeData(data);
  //   if (extractedData) {
  //     const ACCESS_TOKEN = await getAccessToken();
  //     setUserData(extractedData);

  //     const points = [
  //       option1Checked,
  //       option2Checked,
  //       option3Checked,
  //       option4Checked,
  //       option5Checked,
  //     ].filter(Boolean).length;
  //     const reasons = [
  //       "Checked-In",
  //       "Wore DM Shirt to Check-In",
  //       "Brought A Friend to Check-In",
  //       "Attended All-Member",
  //       "Attended Spirit Night",
  //     ].filter(
  //       (_, index) =>
  //         [
  //           option1Checked,
  //           option2Checked,
  //           option3Checked,
  //           option4Checked,
  //           option5Checked,
  //         ][index]
  //     );

  //     if (points > 0) {
  //       const date = getCurrentDate();
  //       const time = getCurrentTime();
  //       const giver = userInfo.displayName;

  //       for (const reason of reasons) {
  //         await postRowToSheet(
  //           ACCESS_TOKEN,
  //           extractedData.name,
  //           extractedData.team,
  //           reason,
  //           date,
  //           time,
  //           giver
  //         );
  //       }
  //     }
  //   } else {
  //     setUserData({ name: "Invalid QR code", team: "" });
  //   }
  //   setModalVisible(false);
  //   setScanned(false);
  //   setOption1Checked(false);
  //   setOption2Checked(false);
  //   setOption3Checked(false);
  //   setOption4Checked(false);
  //   setOption5Checked(false);
  // };

  // Function to parse the QR code data
  const parseQRCodeData = async (data) => {
    try {
      const parts = data.split(", ");
      const namePart = parts[0].split("name: ")[1];
      const teamPart = parts[1].split("team: ")[1];
      // Older QR codes won't have this segment at all; missing, blank, or
      // "N/A" all normalize to "N/A" so the org write is never blocked.
      const captainTeamPart = parts[2]?.split("captainTeam: ")[1];
      // uid was added later too — QR codes regenerate live each time the
      // Spirit screen renders, so this is only absent for a brief window
      // right after this change ships, never for long-lived stale codes.
      const uidPart = parts[3]?.split("uid: ")[1];
      if (namePart && teamPart) {
        return {
          name: namePart,
          team: teamPart,
          captainTeam: captainTeamPart || "N/A",
          uid: uidPart || null,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={[card, styles.container]}>
          <Text style={styles.header}>Scan Spirit Points</Text>
          <Text style={styles.dropdownLabel}>Select reason(s)</Text>
          <MultiSelect
            style={[styles.dropdown, isDropdownFocus && styles.dropdownFocused]}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            containerStyle={styles.dropdownContainer}
            itemTextStyle={styles.dropdownItemText}
            activeColor={colors.lightBlue}
            visibleSelectedItem={false}
            data={scannerOptions}
            labelField="label"
            valueField="value"
            placeholder="Choose one or more reasons"
            value={selectedReasons}
            onFocus={() => setIsDropdownFocus(true)}
            onBlur={() => setIsDropdownFocus(false)}
            onChange={(items) => {
              setSelectedReasons(items);
            }}
          />
          {selectedReasons.length > 0 && (
            <View style={styles.selectedReasonsContainer}>
              {selectedReasons.map((reason) => {
                const selectedOption = scannerOptions.find(
                  (option) => option.value === reason,
                );

                return (
                  <View key={reason} style={styles.selectedReasonPill}>
                    <Text style={styles.selectedReasonText}>
                      {selectedOption?.label || reason}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeSelectedReason(reason)}
                      style={styles.selectedReasonRemove}
                    >
                      <Text style={styles.selectedReasonRemoveText}>x</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            onPress={() => {
              setCameraInstanceKey((current) => current + 1);
              setModalVisible(true);
            }}
            style={styles.scannerOpen}
          >
            <Text style={styles.openScannerText}>Open Scanner</Text>
          </TouchableOpacity>
        </View>

        <View style={[card, styles.resultContainer]}>
          <Text style={styles.header}>Scanned User Data</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>User Name: </Text>
            {userData.name}
          </Text>

          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>User Team: </Text>
            {userData.team}
          </Text>
          {requestStatus ? (
            <Text style={styles.statusText}>{requestStatus}</Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {hasPermission === false ? (
            // hasPermission was being tracked but never actually checked
            // here before — a denied/revoked camera permission just showed
            // this same black box with no explanation. CameraView itself
            // can't show anything useful without permission, so check for
            // that case explicitly instead of rendering it regardless.
            <View style={styles.permissionDeniedContainer}>
              <Text style={styles.permissionDeniedText}>
                Camera access is turned off for this app, so the scanner
                can't show a picture.{"\n\n"}Go to your phone's Settings app →
                DM at UF → Camera, and turn it on. Then come back and try
                again.
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : !shouldMountCamera ? (
            // Deliberately not mounting CameraView yet — see the
            // shouldMountCamera effect above for why.
            <ActivityIndicator color="white" size="large" />
          ) : (
            <>
              <CameraView
                key={cameraInstanceKey}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "pdf417"],
                }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.infoContainer}>
                <Text style={styles.topText}>
                  THE PROCESS FINISHES WHEN THE CAMERA CLOSES AUTOMATICALLY
                </Text>
                {/* On some phones a camera-app bug keeps this screen black
                    even though scanning itself works fine — confirmed by
                    testing. This explains that instead of looking broken. */}
                <Text style={styles.topSubText}>
                  If you don't see a picture, that's okay — just aim at the
                  QR code and hold steady. It still scans.
                </Text>
              </View>
              {scanned ? (
                <View style={styles.scannedContainer}>
                  <Text style={styles.scannedText}>Scanned!</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close Camera</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  screenContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  permissionDeniedContainer: {
    padding: 24,
    alignItems: "center",
  },
  permissionDeniedText: {
    color: "white",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginVertical: 4,
    color: colors.text,
  },
  infoLabel: {
    fontWeight: "700",
  },
  closeButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: colors.danger,
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  topText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
  },
  topSubText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  infoContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 100,
  },
  scannedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
  },
  scannedContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 100,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  container: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  dropdownLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  dropdown: {
    minHeight: 46,
    backgroundColor: colors.pageBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
  },
  dropdownFocused: {
    borderColor: colors.orange,
  },
  dropdownPlaceholder: {
    color: colors.textMuted,
    fontSize: 15,
  },
  dropdownSelectedText: {
    color: colors.text,
    fontSize: 15,
  },
  dropdownContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 15,
  },
  selectedReasonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  selectedReasonPill: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightOrange,
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
  },
  selectedReasonText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
    paddingRight: 8,
  },
  selectedReasonRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(232,119,34,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedReasonRemoveText: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: "bold",
  },
  scannerOpen: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: colors.orange,
    paddingVertical: 12,
    alignItems: "center",
  },
  openScannerText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  resultContainer: {
    padding: 16,
  },
});

export default Scanner;
