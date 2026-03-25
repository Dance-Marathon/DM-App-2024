import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MultiSelect } from "react-native-element-dropdown";
import { CameraView, Camera } from "expo-camera";
import { collection, getDocs, query, where } from "firebase/firestore";
import axios from "axios";
import getAccessToken from "./api/googleAuth";
import { getUserData } from "./Firebase/UserManager";
import { db } from "./Firebase/firestore";
import { getUserInfo } from "./api/index";

const DEFAULT_SCANNER_OPTIONS = [
  { label: "Checked-In", value: "Checked-In", points: 1, sortOrder: 1 },
  {
    label: "Wore DM Shirt to Check-In",
    value: "Wore DM Shirt to Check-In",
    points: 1,
    sortOrder: 2,
  },
  {
    label: "Brought A Friend to Check-In",
    value: "Brought A Friend to Check-In",
    points: 1,
    sortOrder: 3,
  },
  {
    label: "Attended All-Member / Captain Meeting",
    value: "Attended All-Member / Captain Meeting",
    points: 1,
    sortOrder: 4,
  },
  {
    label: "Attended Spirit Night",
    value: "Attended Spirit Night",
    points: 2,
    sortOrder: 5,
  },
];

const Scanner = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [userData, setUserData] = useState({ name: "", team: "" });
  const [modalVisible, setModalVisible] = useState(false);
  const apiKey = "AIzaSyDvksLIbk2gll7Me9846sFHG46ZcKZjAX8";
  const range = `Sheet1!A$1:B100`;
  const range2 = `Sheet2!A$1:B500`;
  const SPREADSHEET_ID = "1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY";

  const [data, setData] = useState([]);
  const [individualData, setIndividualData] = useState([]);

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
    getUserInfo(userIDState)
      .then((data) => {
        setUserInfo(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [userIDState]);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`,
      );
      setData(response.data.values);
      return response.data.values;
    } catch (error) {
      console.error("Error fetching data from Google Sheets", error);
    }
  };

  const fetchIndividualData = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range2}?key=${apiKey}`,
      );
      setIndividualData(response.data.values);
      return response.data.values;
    } catch (error) {
      console.error("Error fetching data from Google Sheets", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchIndividualData();
  }, []);

  const postRowToSheet = async (
    token,
    recipient,
    team,
    reason,
    date,
    time,
    giver,
    value,
  ) => {
    const SPREADSHEET_ID = "1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY";

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet3:append?valueInputOption=RAW`;

      const rowData = [recipient, team, reason, date, time, giver, value];

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

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanLock.current) return;
    scanLock.current = true;
    setScanned(true);

    const extractedData = await parseQRCodeData(data);
    if (extractedData || extractedData.name !== "undefined") {
      const ACCESS_TOKEN = await getAccessToken();
      setUserData(extractedData);

      const selectedOptions = scannerOptions.filter((option) =>
        selectedReasons.includes(option.value),
      );

      if (selectedOptions.length > 0) {
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
          );
        }
      }
    } else {
      setUserData({ name: "Invalid QR code", team: "" });
    }
    setModalVisible(false);
    setScanned(false);
    setSelectedReasons([]);

    scanLock.current = false;
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
      if (namePart && teamPart) {
        return { name: namePart, team: teamPart };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <View style={styles.container}>
        <ScrollView
          style={styles.containerScroll}
          contentContainerStyle={styles.containerScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.header}>Scan Spirit Points</Text>
          <Text style={styles.dropdownLabel}>Select reason(s)</Text>
          <MultiSelect
            style={[styles.dropdown, isDropdownFocus && styles.dropdownFocused]}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            containerStyle={styles.dropdownContainer}
            itemTextStyle={styles.dropdownItemText}
            activeColor="#1F1F1F"
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
        </ScrollView>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.scannerOpen}
        >
          <Text style={styles.openScannerText}>Open Scanner</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <CameraView
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
        </View>
      </Modal>

      <View style={styles.resultContainer}>
        <Text style={[styles.header, { marginTop: 0 }]}>Scanned User Data</Text>
        <Text style={styles.infoText}>
          <Text style={{ fontWeight: "bold" }}>User Name: </Text>
          {userData.name}
        </Text>

        <Text style={styles.infoText}>
          <Text style={{ fontWeight: "bold" }}>User Team: </Text>
          {userData.team}
        </Text>
        {requestStatus ? (
          <Text style={styles.statusText}>{requestStatus}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 18,
    marginVertical: 5,
    color: "#fff",
  },
  closeButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "#ff5c5c",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
  },
  topText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
    backgroundColor: "black",
    padding: 10,
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
    color: "green",
    textAlign: "center",
    backgroundColor: "black",
    padding: 10,
  },
  scannedContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 100,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  container: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    width: 340,
    maxHeight: 360,
    marginTop: 40,
  },
  containerScroll: {
    maxHeight: 280,
  },
  containerScrollContent: {
    paddingBottom: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  dropdownLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
    width: "85%",
    alignSelf: "center",
  },
  dropdown: {
    minHeight: 50,
    width: "85%",
    backgroundColor: "#1F1F1F",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    alignSelf: "center",
  },
  dropdownFocused: {
    borderColor: "#E2883C",
  },
  dropdownPlaceholder: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  dropdownSelectedText: {
    color: "#fff",
    fontSize: 16,
  },
  dropdownContainer: {
    backgroundColor: "#233d72",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  dropdownItemText: {
    color: "#fff",
    fontSize: 15,
  },
  selectedReasonsContainer: {
    width: "85%",
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  selectedReasonPill: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E2883C",
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
  },
  selectedReasonText: {
    color: "#fff",
    fontSize: 14,
    flexShrink: 1,
    paddingRight: 8,
  },
  selectedReasonRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedReasonRemoveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  scannerOpen: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#f18221",
    width: 140,
    height: 40,
    marginBottom: 10,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  openScannerText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: "#fff",
  },
  resultContainer: {
    marginTop: 50,
    padding: 20,
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    width: 340,
    maxHeight: 200,
  },
});

export default Scanner;
