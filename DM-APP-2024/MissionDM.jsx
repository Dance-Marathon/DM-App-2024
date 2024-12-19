import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { auth, db } from "./Firebase/AuthManager";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { getUserInfo } from "./api/index";
import { getUserData, updateUserData } from "./Firebase/UserManager";

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
    });

    console.log("Rounds:", rounds);
    setRounds(rounds);
  };

  useEffect(() => {
    getRoundInfo();
  }, []);

  useEffect(() => {
    if (rounds.length > 0) {
      const tempDate = new Date(rounds[0].start).getTime();
      const tempEnd = new Date(rounds[0].end).getTime();
      setStartDate(tempDate);
      setEndDate(tempEnd);
    }
  }, [rounds]);

  const enrollUser = async () => {
    try {
      const currentUID = auth.currentUser.uid;

      setDoc(
        doc(db, "MissionDMPlayers", currentUID),
        {
          name: userInfo.displayName,
          isEliminated: false,
          code: generateRandomCode(),
          eliminations: {},
          id: "1",
          targetId: "2",
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
    const timer = setInterval(() => {
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
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate, endDate]);

  if (gameActive) {
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
              onPress={() => alert("Box 1 Pressed")}
            >
              <Text style={styles.orangeButtonText}>Target Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.orangeButton}
              onPress={() => alert("Box 2 Pressed")}
            >
              <Text style={styles.orangeButtonText}>Game Stats</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
    color: "white",
    textAlign: "center",
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
  timeValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00FF00",
  },
  timeLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 5,
  },
  interiorBox: {
    top: 180,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: 340,
    height: 560,
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
  missiondm: {
    top: 150,
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
    position: "absolute",
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
});
