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
  increment,
  onSnapshot,
} from "firebase/firestore";
import { getUserInfo } from "./api/index";
import { getUserData, updateUserData } from "./Firebase/UserManager";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
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
  const [rounds, setRounds] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [gameActive, setGameActive] = useState(false);
  const [hasFetchedTarget, setHasFetchedTarget] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [role, setRole] = useState("");
  //const [inBetweenRounds, setInBetweenRounds] = useState(false);
  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
  const [targetName, setTargetName] = useState("");
  const [targetImageURL, setTargetImageURL] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [userCode, setUserCode] = useState("");
  const [isEliminated, setIsEliminated] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [eliminationsCount, setEliminationsCount] = useState(0);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [inRound, setInRound] = useState(false);
  const [firstRoundStart, setFirstRoundStart] = useState(null);
  const [lastRoundEnd, setLastRoundEnd] = useState(null);

  useEffect(() => {
    getUserData()
      .then((data) => {
        console.log("Fetched User Data:", data);
        setUserIDState(data.donorID);
        setRole(data.role);
        setInGame(data.inGame);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    if (userIDState) {
      getPlayerEliminations().then((count) => setEliminationsCount(count));
    }
  }, [userIDState]);

  useEffect(() => {
    if (userIDState) {
      getUserInfo(userIDState)
        .then((data) => {
          setUserInfo(data);
        })
        .catch((err) => {
          console.error("Error fetching user info:", err);
        });
    }
  }, [userIDState]);

  useEffect(() => {
    const docRef = doc(db, "MissionDMPlayers", auth.currentUser.uid);

    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setIsEliminated(docSnapshot.data().isEliminated);
      } else {
        console.error("Document does not exist!");
        setIsEliminated(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const gameDocRef = doc(db, "MissionDMGames", "gameStats");
  
    const unsubscribe = onSnapshot(gameDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setGameActive(docSnapshot.data().gameActive);
      } else {
        console.error("gameStats document not found in Firestore.");
      }
    });
  
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function checkWinner() {
      const selfRef = doc(db, "MissionDMPlayers", auth.currentUser.uid);
      const updatedSelfDoc = await getDoc(selfRef);
      if (updatedSelfDoc.exists()) {
        const updatedSelfData = updatedSelfDoc.data();
        if (updatedSelfData.id === updatedSelfData.targetId) {
          setIsWinner(true);
        }
      }
    }
    checkWinner();
  }, []);

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

      await updateDoc(selfRef, {
        targetId: eliminatedTargetId.toString(),
        eliminations: arrayUnion(targetName),
        roundElims: increment(1),
      });

      setEliminationsCount(getPlayerEliminations());

      await updateDoc(eliminatedDoc.ref, {
        isEliminated: true,
        targetId: null,
        //id: null,
      });

      const updatedSelfDoc = await getDoc(selfRef);
      const updatedSelfData = updatedSelfDoc.data();

      console.log("Updated Self ID:", updatedSelfData.id);
      console.log("Updated Target ID:", updatedSelfData.targetId);

      // Win condition: Compare self's ID to their targetId
      if (updatedSelfData.id === updatedSelfData.targetId) {
        setIsWinner(true);
        console.log("setIsWinner to True");
      }

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

      getTargetUserInfo();
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
    let firstStart = null;
    let lastEnd = null;

    snap.forEach((doc) => {
      const docData = doc.data();
      console.log("Raw Firestore Data:", docData);

      if (docData.round !== 0) {
        let start, end;

        if (docData.start && docData.start.seconds) {
          start = new Date(docData.start.seconds * 1000);
        }

        if (docData.end && docData.end.seconds) {
          end = new Date(docData.end.seconds * 1000);
        }

        rounds.push({
          round: docData.round,
          start: start ? start.getTime() : null,
          end: end ? end.getTime() : null,
        });

        if (docData.round === 1 && start) {
          firstStart = start.getTime(); // Convert to milliseconds
        }

        if (docData.round === 4 && end) {
          lastEnd = end.getTime();
        }
      }
    });

    rounds.sort((a, b) => a.round - b.round);

    if (firstStart && lastEnd) {
      // Convert to local time
      const localFirstRoundStart = new Date(firstStart).toLocaleString(
        "en-US",
        { timeZone: "America/New_York" }
      );
      setFirstRoundStart(firstStart); // Store UTC time for correct comparisons
      setLastRoundEnd(lastEnd);

      console.log(
        "First Round Start (UTC):",
        new Date(firstStart).toISOString()
      );
      console.log("First Round Start (Local Time):", localFirstRoundStart);
    } else {
      console.error("Could not retrieve first round start time.");
    }

    setRounds(rounds);
  };

  useEffect(() => {
    getRoundInfo();
  }, []);

  useEffect(() => {
    const fetchGameStats = async () => {
      const gameDocRef = doc(db, "MissionDMGames", "gameStats");
      const gameDoc = await getDoc(gameDocRef);
  
      if (gameDoc.exists()) {
        const gameData = gameDoc.data();
        console.log("Firestore currentRound:", gameData.currentRound);
  
        setCurrentRound(gameData.currentRound);
  
        // Now find the round info based on Firestore currentRound
        const currentRoundData = rounds.find((round) => round.round === gameData.currentRound);
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
      } else {
        console.error("gameStats document not found in Firestore.");
      }
    };
  
    if (rounds.length > 0) {
      fetchGameStats();
    }
  }, [rounds]);

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

      await setDoc(
        doc(db, "MissionDMPlayers", currentUID),
        {
          name: userInfo.displayName,
          isEliminated: false,
          code: generateRandomCode(),
          eliminations: [],
          roundElims: 0,
          id: userid,
          targetId: "0",
          imageURL: userInfo.avatarImageURL,
          role: role,
          team: userInfo.teamName,
        },
        { merge: true }
      );

      setInGame(true);

      const docRef = doc(db, "Users", currentUID);
      await updateDoc(docRef, {
        inGame: true,
      });

      await updateUserData();
      Alert.alert("Success", "You have been enrolled in the game!");
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

      setInGame(false);

      const docRef = doc(db, "Users", currentUID);
      await updateDoc(docRef, {
        inGame: false,
      });

      await updateUserData();

      Alert.alert("Success", "You have been unenrolled from the game!");
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
    if (!firstRoundStart) {
      console.log("⏳ Waiting for firstRoundStart to be set...");
      return;
    }
  
    console.log("🔥 firstRoundStart detected:", new Date(firstRoundStart).toISOString());
  
    const timer = setInterval(async () => {
      const now = Date.now();
      console.log("Checking round start time:", now, "vs", firstRoundStart);
      console.log("Current Round:", currentRound);
  
      const { active, timeLeft } = calculateTimeLeft();
      setInRound(active);
  
      if (timeLeft > 0) {
        setTimeLeft({
          days: Math.floor(timeLeft / (1000 * 60 * 60 * 24)),
          hours: Math.floor((timeLeft / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((timeLeft / (1000 * 60)) % 60),
          seconds: Math.floor((timeLeft / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
  
      // ✅ Only start round when time is up and it's still round 0
      if (currentRound === 0 && now >= firstRoundStart) {
        console.log("Round 1 should now start! Running roundOver().");
        await roundOver();
        clearInterval(timer);
      }
    }, 1000);
  
    return () => clearInterval(timer);
  }, [firstRoundStart, currentRound, startDate, endDate]);   

  const countActivePlayers = async () => {
    try {
      const q = query(
        collection(db, "MissionDMPlayers"),
        where("isEliminated", "==", false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return 0;
    }
  };

  const resetRoundElims = async () => {
    try {
      const playersRef = collection(db, "MissionDMPlayers");
      const querySnapshot = await getDocs(playersRef);

      const batch = querySnapshot.docs.map(async (playerDoc) => {
        return updateDoc(doc(db, "MissionDMPlayers", playerDoc.id), {
          roundElims: 0,
        });
      });

      await Promise.all(batch);
      console.log("Reset round eliminations for all players.");
    } catch (error) {
      console.error("Error resetting round eliminations:", error);
    }
  };

  const eliminateZeroElimsPlayers = async () => {
    try {
      const playersRef = collection(db, "MissionDMPlayers");
      const querySnapshot = await getDocs(playersRef);

      const batch = querySnapshot.docs.map(async (playerDoc) => {
        const playerData = playerDoc.data();
        if (playerData.roundElims === 0) {
          return updateDoc(doc(db, "MissionDMPlayers", playerDoc.id), {
            isEliminated: true,
          });
        }
      });

      await Promise.all(batch);
      console.log("Eliminated those losers.");
    } catch (error) {
      console.error("Error eliminating players with 0 eliminations:", error);
    }
  };

  const getPlayerEliminations = async () => {
    try {
      const currentUID = auth.currentUser.uid;
      const userDocRef = doc(db, "MissionDMPlayers", currentUID);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const eliminations = userDoc.data().eliminations || [];
        console.log("Eliminations: ", eliminations.length);
        return eliminations.length;
      } else {
        console.error("User document does not exist.");
        return 0;
      }
    } catch (error) {
      console.error("Error fetching player eliminations:", error);
      return 0;
    }
  };

  const fetchData = async () => {
    try {
      const fetchedItems = [];

      const q = query(
        collection(db, "Users"),
        where("inMissionDM", "==", true)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        fetchedItems.push(docData.notificationToken);
      });

      return fetchedItems;
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  async function sendBatch(batch) {
    if (batch.length === 0) {
      console.warn("Skipping empty batch.");
      return;
    }

    try {
      console.log(`Sending batch of ${batch.length} notifications...`);

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      });

      const json = await response.json();
      console.log("Expo response:", JSON.stringify(json, null, 2));

      if (json.data) {
        json.data.forEach((result, index) => {
          if (result.status === "error") {
            console.error(
              `Error sending to ${batch[index].to}:`,
              result.message
            );
          }
        });
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  }

  async function sendPushNotificationToAlivePlayers(
    expoPushTokens,
    notification
  ) {
    console.log("Sending notifications...");

    const batchSize = 50;
    let messages = [];

    for (const token of expoPushTokens) {
      if (!token || token.trim() === "") {
        console.warn("Skipping empty or invalid token:", token);
        continue;
      }

      messages.push({
        to: token,
        sound: "default",
        title: notification.title,
        body: notification.message,
      });

      console.log(`Added token: ${token}`);

      if (messages.length >= batchSize) {
        await sendBatch(messages);
        messages = [];
      }
    }

    if (messages.length > 0) {
      await sendBatch(messages);
    }
  }

  const roundOver = async () => {
    try {
      const gameDocRef = doc(db, "MissionDMGames", "gameStats");
      // const gameDocRef = doc(db, "MissionDMTestRounds", "gameStats");
      const gameDoc = await getDoc(gameDocRef);

      if (!gameDoc.exists()) {
        console.error("Game document does not exist.");
        return;
      }

      const currentRound = gameDoc.data().currentRound;
      const previousPlayers = gameDoc.data().playersRemaining;
      const activePlayers = await countActivePlayers();
      const eliminations = previousPlayers - activePlayers;
      const fieldToUpdate = `round${currentRound}Eliminations`;

      if (currentRound === 0 && Date.now() >= firstRoundStart) {
        await updateDoc(gameDocRef, {
          currentRound: 1,
          gameActive: true,
        });
        setCurrentRound(1);
        setGameActive(true);
        setInRound(true);
        return;
      }

      await eliminateZeroElimsPlayers();
      await resetRoundElims();

      await updateDoc(gameDocRef, {
        currentRound: currentRound + 1,
        playersRemaining: activePlayers,
        [fieldToUpdate]: eliminations,
      });

      //fetchItems = await fetchData();

      // await sendPushNotificationToAlivePlayers(fetchItems, {
      //   message: `Round ${currentRound} is over. ${eliminations} players were eliminated and ${activePlayers} remain.`,
      //   title: `MissionDM - Round ${currentRound} Over`,
      // })
      //   .then(() => {
      //     console.log("All notifications sent!");
      //   })
      //   .catch((error) => {
      //     console.error("Error sending notifications:", error);
      //   });

      //await shuffleTargets();

      setInRound(true);

      console.log(
        `Round successfully incremented to: ${currentRound + 1}, targets shuffled, notifications sent.`
      );
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

  // return (
  //   <View
  //     style={{
  //       flex: 1,
  //       alignItems: "center",
  //       backgroundColor: "#1F1F1F",
  //     }}
  //   >
  //     <View style={{ position: "absolute", top: 10, left: 10, backgroundColor: "#000", padding: 5 }}>
  //   <Text style={{ color: "#fff", fontSize: 10 }}>inGame: {String(inGame)}</Text>
  //   <Text style={{ color: "#fff", fontSize: 10 }}>gameActive: {String(gameActive)}</Text>
  //   <Text style={{ color: "#fff", fontSize: 10 }}>isEliminated: {String(isEliminated)}</Text>
  //   <Text style={{ color: "#fff", fontSize: 10 }}>isWinner: {String(isWinner)}</Text>
  //   <Text style={{ color: "#fff", fontSize: 10 }}>inRound: {String(inRound)}</Text>

  // </View>
  //     </View>
  // )

  // Player has clicked the enroll button. Their profile is created
  if (inGame) {
    // The game has started and has not ended yet
    if (gameActive) {
      // Player is still alive and has not won
      if (inRound && !isEliminated && !isWinner) {
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              backgroundColor: "#1F1F1F",
            }}
          >
            <Image
              source={require("./images/MissionDMAppLogo.png")}
              style={styles.MissionDMLogo}
            />
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
                    <Image
                      source={{ uri: targetImageURL }}
                      style={styles.avatar}
                    />
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
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  color="#f18221"
                  size={18}
                />
                <Text style={styles.tileTitleText}>MY INFO</Text>
              </View>
              <View style={styles.eliminationContainer}>
                <FontAwesomeIcon
                  icon={faCrosshairs}
                  color="#FFFFFF"
                  size={25}
                />
                <Text style={styles.eliminationHeader}>
                  {Number(eliminationsCount)}{" "}
                  {Number(eliminationsCount) === 1
                    ? "Elimination"
                    : "Eliminations"}
                </Text>
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
      }
      // Player eliminated
      else if (isEliminated) {
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              backgroundColor: "#1F1F1F",
            }}
          >
            <Image
              source={require("./images/MissionDMAppLogo.png")}
              style={[styles.MissionDMLogo, { marginBottom: 20 }]}
            />
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                flexGrow: 0.8,
              }}
            >
              <Image
                maxWidth="200"
                maxHeight="200"
                style={{ marginBottom: 20 }}
                source={require("./images/eliminated-icon.png")}
              />
              <Text style={{ color: "red", fontSize: 28, fontWeight: "bold" }}>
                You have been eliminated.
              </Text>
              <Text
                style={{
                  color: "red",
                  fontSize: 18,
                  fontStyle: "italic",
                  marginTop: 5,
                  marginBottom: 20,
                }}
              >
                Thanks for playing!
              </Text>
              {currentRound <= 1 && (
                <View style={styles.buttonBox}>
                  <TouchableOpacity style={styles.orangeButton}>
                    <Text style={styles.orangeButtonText}>Buy Back In!</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        );
      }
      // Player has won
      else if (isWinner) {
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              backgroundColor: "#1F1F1F",
              paddingHorizontal: 20,
            }}
          >
            <Image
              source={require("./images/MissionDMAppLogo.png")}
              style={[styles.MissionDMLogo, { marginBottom: 20 }]}
            />
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                flexGrow: 0.8,
              }}
            >
              <Image
                style={{
                  marginBottom: 20,
                  width: 250,
                  height: 250,
                  resizeMode: "contain",
                }}
                source={require("./images/trophy-icon.png")}
              />
              <Text
                style={{
                  color: "#FFC300",
                  fontSize: 28,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Congratulations you won!
              </Text>
              <Text
                style={{
                  color: "#FFC300",
                  fontSize: 18,
                  fontStyle: "italic",
                  marginTop: 5,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                Thanks for playing!
              </Text>
            </View>
          </View>
        );
      } else if (!inRound) {
        return (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              backgroundColor: "#1F1F1F",
            }}
          >
            <Image
              source={require("./images/MissionDMAppLogo.png")}
              style={[styles.MissionDMLogo, { marginBottom: 20 }]}
            />
            <View style={styles.roundBox}>
              <Text style={styles.header}>Congratulations!</Text>
              <Text style={styles.subheader}>
                You completed round {currentRound - 1} of the Mission.
              </Text>
            </View>
            <View style={styles.congratsRoundBox}>
              <Text style={[styles.header, { marginBottom: 0 }]}>
                ROUND {currentRound}
              </Text>
              <Text
                style={[styles.subheader, { marginBottom: 0, marginTop: 0 }]}
              >
                starts in
              </Text>
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

            <View style={styles.userBox}>
              <View style={styles.tileHeader}>
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  color="#f18221"
                  size={18}
                />
                <Text style={styles.tileTitleText}>ROUND SUMMARY</Text>
              </View>
              <View style={styles.eliminationContainer}>
                <FontAwesomeIcon
                  icon={faCrosshairs}
                  color="#FFFFFF"
                  size={25}
                />
                <Text style={[styles.eliminationHeader, { fontSize: 20 }]}>
                  12 Players were eliminated
                </Text>
              </View>
              <View style={[styles.eliminationContainer, { marginBottom: 20 }]}>
                <FontAwesomeIcon icon={faUsers} color="#FFFFFF" size={25} />
                <Text style={[styles.eliminationHeader, { fontSize: 20 }]}>
                  41 players remain
                </Text>
              </View>
            </View>
          </View>
        );
      }
    }
    // The game has not started yet
    else {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            backgroundColor: "#1f1f1f",
          }}
        >
          <Image
            source={require("./images/MissionDMAppLogo.png")}
            style={[styles.MissionDMLogo, { marginBottom: 20 }]}
          />
          <Text style={styles.header}>Thank you for Enrolling!</Text>
          <View style={[styles.targetBox, { padding: 10 }]}>
            <Text style={[styles.header, { marginBottom: 5 }]}>
              The game starts in:
            </Text>
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
        </View>
      );
    }
  }

  // Player has not enrolled in the game yet
  else {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          backgroundColor: "#1f1f1f",
        }}
      >
        <Image
          source={require("./images/MissionDMAppLogo.png")}
          style={[styles.MissionDMLogo, { marginBottom: 20 }]}
        />
        <View style={[styles.targetBox, { alignItems: "center" }]}>
          <Text style={styles.header}>Please Enroll:</Text>
          <TouchableOpacity style={styles.enrollButton} onPress={enrollUser}>
            <Text style={styles.enrollButtonText}>Create My Account!</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.targetBox, { padding: 10 }]}>
          <Text style={[styles.header, { marginBottom: 5 }]}>
            The game starts in:
          </Text>
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
      </View>
    );
  }

  // Fallback render if none of the conditions match
  if (!inGame && !gameActive && !isEliminated && !isWinner) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1F1F1F",
        }}
      >
        <Text style={{ color: "white", fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }
};

export default MissionDM;

const styles = StyleSheet.create({
  MissionDMLogo: {
    width: 250,
    height: 50,
    marginTop: 70,
    marginBottom: 0,
    resizeMode: "contain",
  },
  header: {
    fontSize: 32,
    fontWeight: 800,
    marginBottom: 5,
    marginTop: 10,
    color: "white",
    textAlign: "center",
  },
  subheader: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 10,
    marginTop: 0,
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
    borderRadius: 5,
    marginBottom: 20,
    marginTop: 10,
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
    marginTop: 20,
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
  congratsRoundBox: {
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
