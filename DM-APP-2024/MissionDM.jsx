import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from "react-native";
import { auth, db } from "./Firebase/AuthManager";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  getDoc,
} from "firebase/firestore";
import { getUserInfo } from "./api/index";
import { getUserData, updateUserData } from "./Firebase/UserManager";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";

const MissionDM = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [inGame, setInGame] = useState(false);
  const [userIDState, setUserIDState] = useState("");
  const [userInfo, setUserInfo] = useState({});
  const [rounds, setRounds] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [hasFetchedTarget, setHasFetchedTarget] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);

  const [targetName, setTargetName] = useState("");
  const [targetImageURL, setTargetImageURL] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [enteredCode, setEnteredCode] = useState("");

  useEffect(() => {
    getUserData()
      .then((data) => {
        console.log("Fetched User Data:", data);
        setUserIDState(data.donorID);
        if (data.inMissionDM) {
          setInGame(true);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });
  }, []);

  useEffect(() => {
    getUserInfo(userIDState)
      .then((data) => {
        setUserInfo(data);
      })
      .catch((err) => {
        console.error("Error fetching user info:", err);
      });
  }, [userIDState]);

  function formatToLocalDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  const getRoundInfo = async () => {
    const col = collection(db, "MissionDMGames");
    const snap = await getDocs(col);

    const rounds = [];

    snap.forEach((doc) => {
      const docData = doc.data();
      console.log("Doc Data:", docData);
      if (docData.round !== 0) {
        const start = new Date(
          docData.start.seconds * 1000 + docData.start.nanoseconds / 1e6
        );
        const end = new Date(
          docData.end.seconds * 1000 + docData.end.nanoseconds / 1e6
        );
        rounds.push({
          round: docData.round,
          start: formatToLocalDateTime(start),
          end: formatToLocalDateTime(end),
        });
      } else {
        rounds.push({
          round: docData.round,
          currentRound: docData.currentRound,
        });
      }
    });

    rounds.sort((a, b) => a.round - b.round);

    console.log("Rounds:", rounds);
    setRounds(rounds);
  };

  useEffect(() => {
    getRoundInfo();
  }, []);

  useEffect(() => {
    if (rounds.length > 0 && rounds[0].currentRound !== undefined) {
      const currentRoundData = rounds.find(
        (round) => round.round === rounds[0].currentRound
      );
      if (currentRoundData) {
        const tempDate = new Date(currentRoundData.start).getTime();
        const tempEnd = new Date(currentRoundData.end).getTime();

        if (tempDate !== startDate || tempEnd !== endDate) {
          setStartDate(tempDate);
          setEndDate(tempEnd);
          console.log("Updated Start and End Times:", {
            start: tempDate,
            end: tempEnd,
          });
        }
      }
    }
  }, [rounds, rounds[0]?.currentRound]);

  const enrollUser = async () => {
    try {
      const currentUID = auth.currentUser.uid;

      const colRef = collection(db, "MissionDMPlayers");
      const snapshot = await getDocs(colRef);
      const players = snapshot.docs.map((doc) => ({
        id: doc.data().id,
        uid: doc.id,
      }));
      const count = players.length + 1;
      const userid = count.toString();

      let target = "1";
      if (players.length > 0) {
        const lastPlayer = players[players.length - 1];
        target = lastPlayer.id;
      }

      await setDoc(
        doc(db, "MissionDMPlayers", currentUID),
        {
          name: userInfo.displayName,
          isEliminated: false,
          code: generateRandomCode(),
          eliminations: {},
          id: userid,
          targetId: target,
          imageURL: userInfo.avatarImageURL,
        },
        { merge: true }
      );

      const docRef = doc(db, "Users", currentUID);
      await updateDoc(docRef, {
        inMissionDM: true,
      });

      await updateUserData();

      Alert.alert("Success", "You have been enrolled in the game!");
      setInGame(true);
    } catch (error) {
      console.error("Error enrolling user:", error);
      Alert.alert("Error", "Failed to enroll. Please try again.");
    }
  };

  const unenrollUser = async () => {
    try {
      const currentUID = auth.currentUser.uid;
      const userDoc = doc(db, "MissionDMPlayers", currentUID);
      await deleteDoc(userDoc);

      const docRef = doc(db, "Users", currentUID);
      await updateDoc(docRef, {
        inMissionDM: false,
      });

      await updateUserData();

      Alert.alert("Success", "You have been unenrolled from the game!");
      setInGame(false);
    } catch (error) {
      console.error("Error unenrolling user:", error);
      Alert.alert("Error", "Failed to unenroll. Please try again.");
    }
  };

  function generateRandomCode() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters[randomIndex];
    }

    return code;
  }

  const calculateTimeLeft = () => {
    const now = Date.now();

    if (now < startDate) {
      return {
        active: false,
        timeLeft: startDate - now,
      };
    } else if (now >= startDate && now < endDate) {
      return {
        active: true,
        timeLeft: endDate - now,
      };
    } else {
      return {
        active: false,
        timeLeft: 0,
      };
    }
  };

  useEffect(() => {
    let roundProcessed = false;

    const timer = setInterval(async () => {
      const { active, timeLeft } = calculateTimeLeft();
      setGameActive(active);

      if (timeLeft > 0) {
        setTimeLeft({
          days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
          hours: Math.floor((timeLeft / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((timeLeft / (1000 * 60)) % 60),
          seconds: Math.floor((timeLeft / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });

        // Ensure `roundOver` is called only once
        if (!roundProcessed) {
          roundProcessed = true;
          await roundOver();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate, endDate]);

  const roundOver = async () => {
    try {
      const gameDocRef = doc(db, "MissionDMGames", "gameStats");
      const gameDoc = await getDoc(gameDocRef);

      if (gameDoc.exists()) {
        const currentRound = gameDoc.data().currentRound;

        await updateDoc(gameDocRef, {
          currentRound: currentRound + 1,
        });

        console.log(`Round successfully incremented to: ${currentRound + 1}`);
      } else {
        console.error("Game document does not exist.");
      }
    } catch (error) {
      console.error("Error incrementing round:", error);
    }
  };

  useEffect(() => {
    if (!hasFetchedTarget) {
      getTargetUserInfo();
      setHasFetchedTarget(true);
    }
  }, [hasFetchedTarget]);

  const getTargetUserInfo = async () => {
    try {
      const currentUID = auth.currentUser.uid;

      const userDocRef = doc(db, "MissionDMPlayers", currentUID);
      const userDoc = await getDoc(userDocRef);
      const targetID = userDoc.data().targetId;

      const usersRef = collection(db, "MissionDMPlayers");
      const q = query(usersRef, where("id", "==", targetID));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No user found with the specified targetId.");
        return null;
      }

      const targetUserDoc = querySnapshot.docs[0];
      const targetUserName = targetUserDoc.data().name;
      const targetImageURL = targetUserDoc.data().imageURL;
      const targetRole = targetUserDoc.data().role;
      const targetTeam = targetUserDoc.data().teamName;
      

      console.log(`Target user name: ${targetUserName}`);
      console.log(`Target image url: ${targetImageURL}`);
      setTargetName(targetUserName);
      setTargetImageURL(targetImageURL);
      setTargetRole(targetRole);
      setTargetTeam(targetTeam);
    } catch (error) {
      console.error("Error fetching target user:", error);
    }
  };

  const handleCodeSubmit = async () => {
    try {
      const currentUID = auth.currentUser.uid;
      const userDocRef = doc(db, "MissionDMPlayers", currentUID);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().code === enteredCode) {
        Alert.alert("Success", "Code accepted!");
        // Add any additional logic for when the code is accepted
      } else {
        Alert.alert("Error", "Invalid code. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      Alert.alert("Error", "Failed to verify code. Please try again.");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <View style={styles.roundBox}>
        <Text style={styles.header}>ROUND {currentRound}</Text>
        <View style={styles.inGameTimeContainer}>
          <View style={styles.inGameTimeBox}>
            <Text style={styles.inGameTimeValue}>{timeLeft.days}</Text>
            <Text style={styles.timeLabel}>Days</Text>
          </View>
          <Text style={styles.inGameTimeValue}> : </Text>
          <View style={styles.inGameTimeBox}>
            <Text style={styles.inGameTimeValue}>
              {String(timeLeft.hours).padStart(2, "0")}
            </Text>
            <Text style={styles.timeLabel}>Hours</Text>
          </View>
          <Text style={styles.inGameTimeValue}> : </Text>
          <View style={styles.inGameTimeBox}>
            <Text style={styles.inGameTimeValue}>
              {String(timeLeft.minutes).padStart(2, "0")}
            </Text>
            <Text style={styles.timeLabel}>Minutes</Text>
          </View>
          <Text style={styles.inGameTimeValue}> : </Text>
          <View style={styles.inGameTimeBox}>
            <Text style={styles.inGameTimeValue}>
              {String(timeLeft.seconds).padStart(2, "0")}
            </Text>
            <Text style={styles.timeLabel}>Seconds</Text>
          </View>
        </View>
      </View>
      <View style={styles.targetBox}>
        <View style={styles.tileHeader}>
          <FontAwesomeIcon icon={faBullseye} color="#f18221" size={18} />
          <Text style={styles.tileTitleText}>TARGET INFO</Text>
        </View>
        <View style={styles.targetInfoContainer}>
          <Image source={{ uri: targetImageURL }} style={styles.avatar} />
          <View style={styles.targetInfo}>
            <Text style={styles.targetName}>{targetName}</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.section}>
                <FontAwesome name="circle" size={15} color="#f18221" />
                <Text style={styles.targetTag}>Digital Marketing</Text>
              </View>
              <View style={styles.section}>
                <FontAwesome name="circle" size={15} color="#f18221" />
                <Text style={styles.targetTag}>Captain</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.enterCodeContainer}>
          <Text style={styles.enterCodeText}>If target is eliminated, enter their code here:</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter code"
            placeholderTextColor="#888"
            onChangeText={(text) => setEnteredCode(text)}
            value={enteredCode}
            onSubmitEditing={handleCodeSubmit}
          />
        </View>
      </View>
      <View style={styles.userBox}></View>
    </View>
  );

  if (inGame && gameActive) {
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
        <Text style={styles.missiondm}>MissionDM</Text>
        <View style={styles.interiorBox}>
          <View style={styles.buttonBox}>
            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => setIsTargetModalVisible(true)}
            >
              <Text style={styles.orangeButtonText}>Target Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => setIsStatsModalVisible(true)}
            >
              <Text style={styles.orangeButtonText}>Game Stats</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inGameTimeContainer}>
            <View style={styles.inGameTimeBox}>
              <Text style={styles.inGameTimeValue}>{timeLeft.days}</Text>
              <Text style={styles.timeLabel}>Days</Text>
            </View>
            <View style={styles.inGameTimeBox}>
              <Text style={styles.inGameTimeValue}>
                {String(timeLeft.hours).padStart(2, "0")}
              </Text>
              <Text style={styles.timeLabel}>Hours</Text>
            </View>
            <View style={styles.inGameTimeBox}>
              <Text style={styles.inGameTimeValue}>
                {String(timeLeft.minutes).padStart(2, "0")}
              </Text>
              <Text style={styles.timeLabel}>Minutes</Text>
            </View>
            <View style={styles.inGameTimeBox}>
              <Text style={styles.inGameTimeValue}>
                {String(timeLeft.seconds).padStart(2, "0")}
              </Text>
              <Text style={styles.timeLabel}>Seconds</Text>
            </View>
          </View>
        </View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isTargetModalVisible}
          onRequestClose={() => setIsTargetModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Target Information</Text>
              <Text style={styles.modalText}>{targetName}</Text>
              <Image
                style={styles.profileImage}
                resizeMode="contain"
                source={{ uri: targetImageURL }}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsTargetModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isStatsModalVisible}
          onRequestClose={() => setIsStatsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Game Stats</Text>
              <Text style={styles.modalText}>Here are your game stats!</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsStatsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#233563",
      }}
    >
      {inGame && startDate ? (
        <View style={styles.otherContainer}>
          <Text style={{ fontSize: 18, color: "green", marginBottom: 8 }}>
            You are enrolled! The game starts in:
          </Text>
          <View style={styles.timeContainer}>
            <View style={styles.timeBox}>
              <Text style={styles.timeValue}>{timeLeft.days}</Text>
              <Text style={styles.timeLabel}>Days</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeValue}>
                {String(timeLeft.hours).padStart(2, "0")}
              </Text>
              <Text style={styles.timeLabel}>Hours</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeValue}>
                {String(timeLeft.minutes).padStart(2, "0")}
              </Text>
              <Text style={styles.timeLabel}>Minutes</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeValue}>
                {String(timeLeft.seconds).padStart(2, "0")}
              </Text>
              <Text style={styles.timeLabel}>Seconds</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.enrollButton} onPress={unenrollUser}>
            <Text style={styles.enrollButtonText}>Leave Game</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.enrollButton} onPress={enrollUser}>
          <Text style={styles.enrollButtonText}>Enroll In MissionDM</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MissionDM;

const styles = StyleSheet.create({
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
    color: "white",
    textAlign: "center",
  },
  tileTitleText: {
    color: "white",
    fontSize: 14,
    
    textAlign: "left",
    marginLeft: 10,
  },
  tileHeader: {
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginLeft: 15,
    marginBottom: 0,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 25,
  },
  targetInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
  },
  targetName: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    minWidth: "80%",
    maxWidth: "80%",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagsContainer: {
    minWidth: "80%",
    maxWidth: "80%",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },

section: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

targetTag: {
    fontSize: 14,
    color: "white",
    marginRight: 5,
    marginLeft: 5,
  },
  enterCodeContainer: {
    paddingRight: 20,
    paddingLeft: 20,
    marginBottom: 20,
  },
  enterCodeText: {
    color: "white",
    fontSize: 12, 
    marginLeft: 10,
  },
  codeInput: {
    backgroundColor: "#1e1e1e",
    color: "white",
    padding: 15,
    borderRadius: 9,
    marginTop: 5,
  },
  button: {
    margin: 2,
    position: "absolute",
    top: 10,
    right: 10,
    fontSize: 20,
    color: "black",
  },
  enrollButton: {
    backgroundColor: "#E2883C",
    padding: 10,
    height: 45,
    width: "55%",
    borderRadius: 5,
    marginBottom: 10,
    marginTop: 85,
  },
  enrollButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  inGameTimeContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  otherContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  timeBox: {
    alignItems: "center",
    marginHorizontal: 6,
    padding: 10,
    backgroundColor: "#333333",
    borderRadius: 10,
    width: 80,
  },
  inGameTimeBox: {
    alignItems: "center",
    marginHorizontal: 0,
    marginBottom: 5,
    padding: 5,
    borderRadius: 10,
    width: 50,
    height: 70,
  },
  inGameTimeValue: {
    fontSize: 28,
    color: "#FFFFFF",
  },
  timeLabel: {
    fontSize: 9,
    color: "#FFFFFF",
    marginTop: 5,
  },
  roundBox: {
    marginTop: 100,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: '85%',
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
  },
  targetBox: {
    marginTop: 30,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: '85%',
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
  },
  userBox: {
    marginTop: 30,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: '85%',
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
  missiondm: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    textAlign: "left",
    width: 126,
    height: 28,
    alignItems: "center",
    display: "flex",
    color: "#fff",
    left: 27,
  },
  groupChild: {
    borderRadius: 10,
    backgroundColor: "#f18221",
    left: 0,
    top: 0,
  },
  showQrCode: {
    top: 10,
    left: 10,
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: "#fff",
    position: "absolute",
  },
  rectangleParent: {
    top: 295,
    left: 230,
  },
  buttonBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  orangeButton: {
    flex: 1,
    backgroundColor: "#f18221",
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    height: 40,
  },
  orangeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: "#E2883C",
    padding: 10,
    borderRadius: 5,
    width: "50%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
});
