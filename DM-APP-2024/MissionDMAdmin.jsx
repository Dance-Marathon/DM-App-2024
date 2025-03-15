import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  count,
  query,
  where,
} from "firebase/firestore";

const db = getFirestore();

const MissionDMAdmin = () => {
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [purgeActive, setPurgeActive] = useState(false);

  async function sendPushNotificationsToAll(expoPushTokens, notification) {
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

  const handleTogglePurge = async () => {
    const gameRef = doc(db, "MissionDMGames", "gameStats");
    if (!purgeActive) {
      setPurgeActive(true);
      const countBefore = await countActivePlayers();
      await updateDoc(gameRef, {
        purge: true,
        countBefore: countBefore,
      });
      console.log("Purge activated");
      const fetchItems = await fetchData();
      try {
        await sendPushNotificationsToAll(fetchItems, {
          message: `A purge has been initiated. Any player can be eliminatead. Immuninity is not valid. Good luck.`,
          title: `MissionDM - PURGE ACTIVE`,
        });
        console.log("All notifications sent!");
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    } else {
      setPurgeActive(false);
      await updateDoc(gameRef, {
        purge: false,
      });
      const prePurgeCount = await getDoc(gameRef).data().countBefore;
      const countAfter = await countActivePlayers();
      console.log("Purge deactivated - shuffling targets now");
      let eliminatedDuringPurge = 0;
      if (prePurgeCount !== null) {
        eliminatedDuringPurge = prePurgeCount - countAfter;
        await updateDoc(gameRef, {
          playersRemaining: countAfter,
          countBefore: null,
        });
      }
      shuffleTargets();
      const fetchItems = await fetchData();
      try {
        await sendPushNotificationsToAll(fetchItems, {
          message: `The purge is over. ${eliminatedDuringPurge} targets were eliminated. ${countAfter} players remain. Immuninity is now valid unless otherwise noted.`,
          title: `MissionDM - PURGE OVER`,
        });
        console.log("All notifications sent!");
      } catch (error) {
        console.error("Error sending notifications:", error);
      }
    }
  };

  // Fetch all players from the MissionDMPlayers collection
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "MissionDMPlayers"));
        const playerList = querySnapshot.docs.map((doc) => ({
          id: doc.id, // Firebase document ID
          ...doc.data(),
        }));
        setPlayers(playerList);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    fetchPlayers();
  }, []);
   
  // Fetch the current game round from the MissionDMGames collection
  useEffect(() => {
    const fetchRoundInfo = async () => {
      try {
        const gameDocRef = doc(db, "MissionDMGames", "gameStats");
        const gameDoc = await getDoc(gameDocRef);
        if (gameDoc.exists()) {
          setCurrentRound(gameDoc.data().currentRound);
        }
      } catch (error) {
        console.error("Error fetching round info:", error);
      }
    };

    fetchRoundInfo();
  }, []);

  const adminEliminate = async (playerDocId) => {
    if (!playerDocId) {
      throw new Error("Missing required player ID.");
    }
  
    try {
      const playerQuery = query(collection(db, "MissionDMPlayers"), where("id", "==", playerDocId));
      const playerSnapshot = await getDocs(playerQuery);

      if (playerSnapshot.empty) {
        throw new Error("Player does not exist.");
      }

      const playerDoc = playerSnapshot.docs[0]; // First matching document
      const playerRef = playerDoc.ref;
  
      if (!playerDoc.exists()) {
        throw new Error("Player does not exist.");
      }
  
      const playerData = playerDoc.data();
      const eliminatedTargetId = playerData.targetId;
  
      // Mark player as eliminated
      await updateDoc(playerRef, {
        isEliminated: true,
        targetId: null,
      });
  
      // If the player had a target, find their eliminator and reassign the target
      const eliminatorQuery = query(
        collection(db, "MissionDMPlayers"),
        where("targetId", "==", playerDocId)
      );
      const eliminatorSnapshot = await getDocs(eliminatorQuery);
  
      if (!eliminatorSnapshot.empty) {
        const eliminatorDoc = eliminatorSnapshot.docs[0];
        const eliminatorRef = eliminatorDoc.ref;
  
        await updateDoc(eliminatorRef, {
          targetId: eliminatedTargetId || null, // Pass on target if exists
        });
      }
  
      return { message: "Player eliminated successfully." };
    } catch (error) {
      console.error("Error in adminEliminate function:", error);
      throw new Error("Elimination failed.");
    }
  };
  

  // Wrapper function to handle elimination from the UI
  const eliminatePlayer = async (playerDocId) => {
    try {
      console.log("Eliminating doc with ID:", playerDocId);
      const result = await adminEliminate(playerDocId);
      Alert.alert("Success", result.message);
      // Refresh the players list after elimination
      const querySnapshot = await getDocs(collection(db, "MissionDMPlayers"));
      const playerList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlayers(playerList);
    } catch (error) {
      Alert.alert("Error", "Failed to eliminate player.");
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
        id: doc.data().id, // In-game player ID
        uid: doc.id, // Firebase UID
        name: doc.data().name,
        isEliminated: doc.data().isEliminated,
      }));

      // Filter out eliminated players
      const activePlayers = players.filter((player) => !player.isEliminated);

      if (activePlayers.length < 2) {
        throw new Error("Not enough active players to shuffle.");
      }

      // Shuffle the active players using Fisher–Yates algorithm
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
      Alert.alert("Success", "Players shuffled successfully!");
    } catch (error) {
      console.error("Error in shuffleTargets function:", error);
      Alert.alert("Error", "Target shuffle failed.");
      throw new Error("Target shuffle failed.");
    }
  };

  // Change the current round manually
  // const changeRound = async (newRound) => {
  //   try {
  //     const gameDocRef = doc(db, "MissionDMGames", "gameStats");
  //     await updateDoc(gameDocRef, { currentRound: newRound });
  //     setCurrentRound(newRound);
  //     Alert.alert("Success", `Round updated to ${newRound}`);
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to update round.");
  //     console.error("Round update error:", error);
  //   }
  // };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Admin Panel
      </Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              backgroundColor: item.isEliminated ? "#F44336" : "#4CAF50",
              marginBottom: 5,
            }}
          >
            <Text style={{ color: "white", fontSize: 18 }}>
              {item.name} {item.isEliminated ? "(Eliminated)" : "(Alive)"}
            </Text>
            {!item.isEliminated && (
              <TouchableOpacity
                onPress={() => eliminatePlayer(item.id)} // Using Firebase document ID
                style={{ marginTop: 5 }}
              >
                <Text style={{ color: "#FFC107", fontWeight: "bold" }}>
                  Eliminate
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      <Text style={{ fontSize: 18, marginBottom: 10 }}>
        {purgeActive ? "Purge Active" : "Purge Inactive"}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: "#007AFF",
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
        }}
        onPress={handleTogglePurge}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>
          {purgeActive ? "End Purge" : "Start Purge"}
        </Text>
      </TouchableOpacity>
      <Button
        title="Shuffle Players"
        onPress={shuffleTargets}
        color="#007BFF"
      />
    </View>
  );
};

export default MissionDMAdmin;
