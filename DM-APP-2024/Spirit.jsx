import React, { useState, useEffect, useContext } from "react";
import {
  View,
  StyleSheet,
  Button,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { getUserData } from "./Firebase/UserManager";
import { getUserInfo } from "./api/index";
import axios from "axios";
import { sheetsAPIKey } from "./api/apiKeys";
import { Icon } from "react-native-elements";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./Firebase/AuthManager";
import { UserContext } from "./api/calls";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';


const GenerateQRCode = ({ route }) => {
  const [userIDState, setUserIDState] = useState("");
  const [userInfo, setUserInfo] = useState({});
  const [qrVisible, setQrVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [individualLeaderboard, setIndividualLeaderboard] = useState([]);
  const [fullTeamLeaderboard, setFullTeamLeaderboard] = useState([]);
  const [fullIndividualLeaderboard, setFullIndividualLeaderboard] = useState(
    []
  );
  const SPREADSHEET_ID = "1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY";
  const range = `Sheet1!A2:B100`;
  const individualRange = `Sheet2!A2:B600`;
  const apiKey = sheetsAPIKey;
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerPermissions, setScannerPermissions] = useState({
      allowedRoles: [],
      teamBasedPermissions: {},
    });

  const navigation = useNavigation();

  const { role } = useContext(UserContext);

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
    if (userIDState) {
      getUserInfo(userIDState)
        .then((data) => {
          setUserInfo(data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [userIDState]);

  const userTeamScore =
    fullTeamLeaderboard.find((team) => team[0] === userInfo.teamName)?.[1] || 0;

  const individualScore =
    fullIndividualLeaderboard.find(
      (individual) => individual[0] === userInfo.displayName
    )?.[1] || 0;

  const fetchLeaderboardData = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`
      );

      setFullTeamLeaderboard(response.data.values);

      const sortedData = response.data.values
        .filter((row) => row[1])
        .map((row) => [row[0], parseInt(row[1], 10)])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      setLeaderboard(sortedData);
    } catch (error) {
      console.error("Error fetching leaderboard data", error);
    }
  };

  const fetchIndividualData = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${individualRange}?key=${apiKey}`
      );

      setFullIndividualLeaderboard(response.data.values);

      const sortedData = response.data.values
        .filter((row) => row[1])
        .map((row) => [row[0], parseInt(row[1], 10)])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      setIndividualLeaderboard(sortedData);
    } catch (error) {
      console.error("Error fetching individual leaderboard data", error);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    fetchIndividualData();
  }, []);

  useEffect(() => {
    const fetchScannerPermissions = async () => {
      try {
        const docRef = doc(db, "Permissions", "ScannerAccess");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const permissions = docSnap.data();
          setScannerPermissions(permissions);

          const isAllowed =
            permissions.allowedRoles.includes(role) ||
            (permissions.teamBasedPermissions[role] &&
              permissions.teamBasedPermissions[role].includes(
                userInfo.teamName
              ));

          setScannerVisible(isAllowed);
        } else {
          console.log("No permissions found for Scanner.");
        }
      } catch (error) {
        console.error("Error fetching scanner permissions:", error);
      }
    };

    fetchScannerPermissions();
  }, [userInfo]);

  console.log("Scanner Permissions:", scannerVisible); 

  const qrData = `name: ${userInfo.displayName}, team: ${userInfo.teamName}`;

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <Image
        style={styles.dmlogo}
        resizeMode="contain"
        source={require("./images/PrimaryLogo.png")}
      />
      <Text style={styles.spiritpoints}>Spirit Points</Text>
      <View style={styles.pointsBox}>
        <View style={styles.header}>
          <View style={styles.smallCircle} />
          <Text style={styles.headerText}>MY POINTS</Text>
        </View>
        <View style={styles.pointsText}>
          <Text style={{ color: "white", fontSize: 48, fontWeight: "bold" }}>
            {individualScore}
          </Text>
        </View>
        <View style={styles.pointsText}>
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "bold",
              marginTop: 5,
            }}
          >
            {userInfo.teamName}'s Points: {userTeamScore}
          </Text>
        </View>
        <View style={styles.header}>
          {scannerVisible ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("Scanner")}
              style={{ marginLeft: 6, marginTop: 13 }}
            >
              <Icon
                name="camera"
                type="font-awesome-5"
                color="white"
                size={28}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
          <TouchableOpacity
            style={[
              styles.qrButton,
              { alignSelf: "flex-end", marginRight: 18, marginTop: 10 },
            ]}
            onPress={() => setQrVisible(!qrVisible)}
          >
            <Text style={styles.showQrCode}>Show QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.leaderboardBox}>
        <View style={styles.header}>
          <View style={styles.smallCircle} />
          <Text style={styles.headerText}>LEADERBOARD</Text>
        </View>
        <View style={styles.bothLeaderboards}>
          <View style={styles.leaderboardWrapper}>
            <Text style={styles.leaderboardTitle}>Organizations</Text>
            <View style={styles.leaderboardContainer}>
              {leaderboard.map((team, index) => (
                <View
                  key={index}
                  style={[
                    styles.leaderboardItem,
                    index === leaderboard.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <Text style={styles.leaderboardText}>
                    {index + 1}. {team[0]} - {team[1]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.leaderboardWrapper}>
            <Text style={styles.leaderboardTitle}>Individuals</Text>
            <View style={styles.leaderboardContainer}>
              {individualLeaderboard.map((individual, index) => (
                <View
                  key={index}
                  style={[
                    styles.leaderboardItem,
                    index === individualLeaderboard.length - 1 && {
                      borderBottomWidth: 0,
                    },
                  ]}
                >
                  <Text style={styles.leaderboardText}>
                    {index + 1}. {individual[0]} - {individual[1]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <Modal
      // animationType="slide"
      animationType="fade"
      transparent={true}
      visible={qrVisible}
      onRequestClose={() => {
        setQrVisible(false);
      }}
    >
      <TouchableWithoutFeedback onPress={() => setQrVisible(false)}>
        <View style={styles.modalBackground}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.qrCode}>QR Code</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setQrVisible(false)}
                >
                  <FontAwesomeIcon icon={faX} size={24} color="white" />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  backgroundColor: "white",
                  padding: 5,
                }}
              >
                <QRCode value={qrData} size={300} />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#233D72",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButton: {
    bottom: 20,
    left: 90,
    justifyContent: "right",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
    color: "white",
    textAlign: "center",
  },
  pointsBox: {
    top: 180,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: 340,
    height: 180,
    position: "absolute",
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
  },
  leaderboardBox: {
    top: 380,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: 340,
    height: 370,
    position: "absolute",
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
  },
  dmlogo: {
    top: -280,
    width: "90%",
    height: 75,
  },
  spiritpoints: {
    top: 150,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    textAlign: "left",
    height: 28,
    alignItems: "center",
    display: "flex",
    color: "#fff",
    left: 27,
    position: "absolute",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    left: 10,
    top: 10,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
    left: 5,
  },
  smallCircle: {
    width: 15,
    height: 15,
    borderRadius: 50,
    backgroundColor: "#EB9F68",
  },
  pointsText: {
    alignItems: "center",
    justifyContent: "center",
    top: 2,
  },
  qrButton: {
    borderRadius: 10,
    backgroundColor: "#f18221",
    width: 140,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  showQrCode: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: "#fff",
    position: "absolute",
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  qrCode: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    right: 110,
    bottom: 20,
  },
  leaderboardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    marginBottom: 2,
    textAlign: "left",
    left: 2,
  },
  bothLeaderboards: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 25,
  },
  leaderboardWrapper: {
    width: "100%",
    marginBottom: 20,
  },
  leaderboardContainer: {
    backgroundColor: "#233563",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    borderColor: "white",
    borderWidth: 1,
  },
  leaderboardItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  leaderboardText: {
    fontSize: 16,
    color: "#fff",
  },
});

export default GenerateQRCode;
