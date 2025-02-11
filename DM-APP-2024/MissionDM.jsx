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
  arrayUnion,
} from "firebase/firestore";
import { getUserInfo } from "./api/index";
import { getUserData, updateUserData } from "./Firebase/UserManager";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { faBullseye } from "@fortawesome/free-solid-svg-icons";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import CrosshairOverImage from "./images/Crosshair Over Image.png";

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
  const [role, setRole] = useState("");

  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);

  const [targetName, setTargetName] = useState("");
  const [targetImageURL, setTargetImageURL] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [userCode, setUserCode] = useState("");

  useEffect(() => {
    getUserData()
      .then((data) => {
        console.log("Fetched User Data:", data);
        setUserIDState(data.donorID);
        setRole(data.role);
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

  const eliminate = async (data) => {
    const { eliminatorId, code } = data;

    if (!eliminatorId || !code) {
      throw new Error("Missing required fields.");
    }

    try {
      const eliminatedQuery = query(
        collection(db, "MissionDMPlayers"),
        where("code", "==", code)
      );
      const eliminatedSnapshot = await getDocs(eliminatedQuery);

      if (eliminatedSnapshot.empty) {
        throw new Error("Invalid code.");
      }

      const selfRef = doc(db, "MissionDMPlayers", eliminatorId);
      const selfDoc = await getDoc(selfRef);

      const eliminatedDoc = eliminatedSnapshot.docs[0];
      const eliminatedData = eliminatedDoc.data();
      const eliminatedTargetId = eliminatedData.targetId;

      const selfData = selfDoc.data();
      console.log("Self Target ID:", selfData.targetId);
      console.log("Eliminated Player ID:", eliminatedData.id);

      if (!selfDoc.exists()) {
        throw new Error("Eliminator does not exist");
      }

      if (selfDoc.data().targetId !== eliminatedData.id) {
        throw new Error("Incorrect target");
      }

      // if id == eliminatedTargetid
      // win screen
      // else update doc 

      await updateDoc(selfRef, {
        targetId: eliminatedTargetId,
        eliminations: arrayUnion(targetName)
      });

      await updateDoc(eliminatedDoc.ref, {
        isEliminated: true,
        targetId: null,
        //id: null,
      });

      return { message: "Elimination verified. New target assigned." };
    } catch (error) {
      console.error("Error in eliminate function:", error);
      throw new Error("Elimination failed.");
    }
  };

  const shuffleTargets = async () => {
    try {
      // First extract the players
      const playersRef = collection(db, "MissionDMPlayers");
      const snapshot = await getDocs(playersRef);

      if (snapshot.empty) {
        throw new Error("No players found.");
      }

      // Extract their info
      const players = snapshot.docs.map((doc) => ({
        id: doc.data().id,
        uid: doc.id, // Firebase UID (Not sure why I need this but CHAT recommended it)
        name: doc.data().name,
        isEliminated: doc.data().isEliminated,
      }));

      // Filter out eliminated players
      const activePlayers = players.filter((player) => !player.isEliminated);

      if (activePlayers.length < 2) {
        throw new Error("Not enough active players to shuffle.");
      }

      // Shuffle the active players
      const shuffledPlayers = [...activePlayers];
      for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [
          shuffledPlayers[j],
          shuffledPlayers[i],
        ];
      }

      // Assign new targets in a circular pattern
      for (let i = 0; i < shuffledPlayers.length; i++) {
        const currentPlayer = shuffledPlayers[i];
        const newTarget = shuffledPlayers[(i + 1) % shuffledPlayers.length];

        await updateDoc(doc(db, "MissionDMPlayers", currentPlayer.uid), {
          targetId: newTarget.id,
        });
      }

      console.log("Targets successfully shuffled.");
    } catch (error) {
      console.error("Error in shuffleTargets function:", error);
      throw new Error("Target shuffle failed.");
    }
  };

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
        setCurrentRound(currentRoundData.round);
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
          role: role,
          team: userInfo.teamName,
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

        shuffleTargets();

        console.log(`Round successfully incremented to: ${currentRound + 1}, targets shuffled.`);
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
      setUserCode(userDoc.data().code);

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
      const targetTeam = targetUserDoc.data().team;

      console.log(`Target user name: ${targetUserName}`);
      console.log(`Target image url: ${targetImageURL}`);
      console.log(`Target role: ${targetRole}`);
      console.log(`Target team: ${targetTeam}`);
      setTargetName(targetUserName);
      setTargetImageURL(targetImageURL);
      setTargetRole(targetRole);
      setTargetTeam(targetTeam);
    } catch (error) {
      console.error("Error fetching target user:", error);
    }
  };

  const handleCodeSubmit = async () => {
    if (!enteredCode) {
      Alert.alert("Error", "Please enter a code.");
      return;
    }
    try {
      const currentUID = auth.currentUser.uid;
      const userDocRef = doc(db, "MissionDMPlayers", currentUID);
      const userDoc = await getDoc(userDocRef);

      const result = await eliminate({
        eliminatorId: currentUID,
        code: enteredCode,
      });
      await getTargetUserInfo();
      Alert.alert("Success", result.message);
      setEnteredCode("");
    } catch (error) {
      console.error("Error verifying code:", error);
      Alert.alert("Error", "Failed to verify code. Please try again.");
    }
  };

  const [isImageModalVisible, setIsImageModalVisible] = useState(false);


  // *********THIS IS THE HTML FOR THE ELIMINATION SCREEN **************
  // return (
  //   <View
  //     style={{
  //       flex: 1,
  //       justifyContent: "center",
  //       alignItems: "center",
  //       backgroundColor: "#1F1F1F",
  //     }}
  //   >
  //     <View style={{ alignItems: "center" }}>
  //       <Image
  //         maxWidth="200"
  //         maxHeight="200"
  //         style={{ marginBottom: 20 }}
  //         source={require('./images/eliminated-icon.png')}
  //       />
  //       <Text style={{ color: "red", fontSize: 28, fontWeight: "bold" }}>
  //         You have been eliminated.
  //       </Text>
  //       <Text
  //         style={{
  //           color: "red",
  //           fontSize: 18,
  //           fontStyle: "italic",
  //           marginTop: 5,
  //           marginBottom: 20,
  //         }}
  //       >
  //         Thanks for playing!
  //       </Text>
  //       <View style={styles.buttonBox}>
  //         <TouchableOpacity style={styles.orangeButton}>
  //           <Text style={styles.orangeButtonText}>Buy Back In!</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   </View>
  // );

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
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.inGameTimeBox}>
            <Text style={styles.inGameTimeValue}>
              {String(timeLeft.hours).padStart(2, "0")}
            </Text>
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.inGameTimeBox}>
            <Text style={styles.inGameTimeValue}>
              {String(timeLeft.minutes).padStart(2, "0")}
            </Text>
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.inGameTimeBox}>
            <Text style={styles.inGameTimeValue}>
              {String(timeLeft.seconds).padStart(2, "0")}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.targetBox}>
        <View style={styles.tileHeader}>
          <FontAwesomeIcon icon={faBullseye} color="#f18221" size={18} />
          <Text style={styles.tileTitleText}>TARGET INFO</Text>
        </View>
        <View style={styles.targetInfoContainer}>
          <TouchableOpacity onPress={() => setIsImageModalVisible(true)}>
            <View style={styles.imageOverlay}>
              <Image source={{ uri: targetImageURL }} style={styles.avatar} />
              <Image
                source={CrosshairOverImage}
                style={styles.crosshairOverlay}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.targetInfo}>
            <Text style={styles.targetName}>{targetName}</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.section}>
                <FontAwesome name="circle" size={15} color="#f18221" />
                <Text style={styles.targetTag}>{targetTeam}</Text>
              </View>
              <View style={styles.section}>
                <FontAwesome name="circle" size={15} color="#f18221" />
                <Text style={styles.targetTag}>{targetRole}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.enterCodeContainer}>
          <Text style={styles.enterCodeText}>
            If target is eliminated, enter their code here:
          </Text>
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

      <View style={styles.userBox}>
        <View style={styles.tileHeader}>
          <FontAwesomeIcon icon={faCircleInfo} color="#f18221" size={18} />
          <Text style={styles.tileTitleText}>MY INFO</Text>
        </View>
        <View style={styles.eliminationContainer}>
          <FontAwesomeIcon icon={faCrosshairs} color="#FFFFFF" size={25} />
          <Text style={styles.eliminationHeader}>12 Eliminations</Text>
        </View>
        <View style={styles.buttonBox}>
          <TouchableOpacity
            style={[styles.orangeButton, { width: 125 }]}
            onPress={() => setIsStatsModalVisible(true)}
          >
            <Text style={styles.orangeButtonText}>Show My Code</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
          width: "95%",
        }}
      >
        <TouchableOpacity
          style={[
            styles.enrollButton,
            { flex: 1, marginRight: 5, marginTop: 10 },
          ]}
          onPress={unenrollUser}
        >
          <Text style={styles.enrollButtonText}>Leave Game</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.enrollButton,
            { flex: 1, marginLeft: 5, marginTop: 10 },
          ]}
          onPress={enrollUser}
        >
          <Text style={styles.enrollButtonText}>Enroll In MissionDM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.enrollButton,
            { flex: 1, marginRight: 5, marginTop: 10 },
          ]}
          onPress={shuffleTargets}
        >
          <Text style={styles.enrollButtonText}>Shuffle Targets</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isStatsModalVisible}
        onRequestClose={() => setIsStatsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.userCodeText}>{userCode}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsStatsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: targetImageURL }}
              style={styles.zoomedImage}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsImageModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    fontWeight: 800,
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
  eliminationHeader: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  imageOverlay: {
    marginRight: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  crosshairOverlay: {
    position: "absolute",
    top: -7,
    left: -7,
    width: 115,
    height: 115,
  },
  zoomedImage: {
    width: 300,
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
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
    marginBottom: 10,
    alignItems: "center",
  },
  eliminationContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
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
    width: 50,
    alignItems: "center",
  },
  inGameTimeValue: {
    fontSize: 32,
    margin: 2,
    fontWeight: 600,
    color: "#FFFFFF",
    alignText: "center",
  },
  colon: {
    fontSize: 32,
    fontWeight: 600,
    color: "#FFFFFF",
    marginBottom: 3,
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
    width: "85%",
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
    width: "85%",
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
    width: "85%",
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
  orangeButton: {
    backgroundColor: "#f18221",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    height: 40,
    width: 120,
  },
  buttonBox: {
    alignItems: "center",
    marginBottom: 20,
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
    backgroundColor: "#233d72",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
  },
  userCodeText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 48,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#f18221",
    padding: 10,
    borderRadius: 10,
    width: 80,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
});
