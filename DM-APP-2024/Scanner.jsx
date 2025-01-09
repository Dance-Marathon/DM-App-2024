import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from "react-native";
import CheckBox from "expo-checkbox"; // Updated import
import { CameraView, Camera } from "expo-camera";
import axios from "axios";
import getAccessToken from "./api/googleAuth";
import { getUserData } from "./Firebase/UserManager";
import { getUserInfo } from "./api/index";

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

  const [option1Checked, setOption1Checked] = useState(false);
  const [option2Checked, setOption2Checked] = useState(false);
  const [option3Checked, setOption3Checked] = useState(false);
  const [option4Checked, setOption4Checked] = useState(false);
  const [option5Checked, setOption5Checked] = useState(false);

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
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`
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
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range2}?key=${apiKey}`
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
    giver
  ) => {
    const SPREADSHEET_ID = "1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY";

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet3:append?valueInputOption=RAW`;

      const rowData = [recipient, team, reason, date, time, giver];

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
        error.response ? error.response.data : error.message
      );
      setRequestStatus("Failed to add row to sheet.");
    }
  };

  const getCurrentDate = () => {
    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
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
    setScanned(true);
    const extractedData = await parseQRCodeData(data);
    if (extractedData) {
      const ACCESS_TOKEN = await getAccessToken();
      setUserData(extractedData);

      const points = [
        option1Checked,
        option2Checked,
        option3Checked,
        option4Checked,
        option5Checked,
      ].filter(Boolean).length;
      const reasons = [
        "Checked-In",
        "Wore DM Shirt to Check-In",
        "Brought A Friend to Check-In",
        "Attended All-Member",
        "Attended Spirit Night",
      ].filter(
        (_, index) =>
          [
            option1Checked,
            option2Checked,
            option3Checked,
            option4Checked,
            option5Checked,
          ][index]
      );

      if (points > 0) {
        const date = getCurrentDate();
        const time = getCurrentTime();
        const giver = userInfo.displayName;

        for (const reason of reasons) {
          await postRowToSheet(
            ACCESS_TOKEN,
            extractedData.name,
            extractedData.team,
            reason,
            date,
            time,
            giver
          );
        }
      }
    } else {
      setUserData({ name: "Invalid QR code", team: "" });
    }
    setModalVisible(false);
    setScanned(false);
    setOption1Checked(false);
    setOption2Checked(false);
    setOption3Checked(false);
    setOption4Checked(false);
    setOption5Checked(false);
  };

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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <View style={styles.container}>
        <Text style={styles.header}>Scan Spirit Points</Text>
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={option1Checked}
            onValueChange={setOption1Checked}
            style={styles.checkbox}
          />
          <Text style={styles.optionText}> Checked-In</Text>
        </View>
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={option2Checked}
            onValueChange={setOption2Checked}
            style={styles.checkbox}
          />
          <Text style={styles.optionText}> Wore DM Shirt to Check-In</Text>
        </View>
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={option3Checked}
            onValueChange={setOption3Checked}
            style={styles.checkbox}
          />
          <Text style={styles.optionText}> Brought A Friend to Check-In</Text>
        </View>
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={option4Checked}
            onValueChange={setOption4Checked}
            style={styles.checkbox}
          />
          <Text style={styles.optionText}> Attended All-Member</Text>
        </View>
        <View style={styles.checkboxContainer}>
          <CheckBox
            value={option5Checked}
            onValueChange={setOption5Checked}
            style={styles.checkbox}
          />
          <Text style={styles.optionText}> Attended Spirit Night</Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.scannerOpen, { alignSelf: "center" }]}
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginLeft: 15,
  },
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
    color: "black",
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
    maxHeight: 290,
    marginTop: 5,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
  },
  checkbox: {
    marginRight: 8,
  },
  scannerOpen: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "#f18221",
    width: 140,
    height: 40,
    marginBottom: 10,
  },
  openScannerText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: "#fff",
    position: "absolute",
    top: 10,
    left: 15,
  },
  resultContainer: {
    marginTop: 20,
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
