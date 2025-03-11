import React, { useState, useEffect } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, Alert } from "react-native";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc 
} from "firebase/firestore";

const db = getFirestore();

const MissionDMAdmin = () => {
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);

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

  // Function to eliminate a player by their Firebase document ID
  const adminEliminate = async (playerDocId) => {
    if (!playerDocId) {
      throw new Error("Missing required player ID.");
    }
    try {
      const playerRef = doc(db, "MissionDMPlayers", playerDocId);
      const playerDoc = await getDoc(playerRef);
      if (!playerDoc.exists()) {
        throw new Error("Player does not exist.");
      }
      await updateDoc(playerRef, {
        isEliminated: true,
        targetId: null, // Optionally clear their target assignment
      });
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
        id: doc.data().id,        // In-game player ID
        uid: doc.id,              // Firebase UID
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
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Admin Panel</Text>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View 
            style={{ 
              padding: 10, 
              backgroundColor: item.isEliminated ? "#F44336" : "#4CAF50", 
              marginBottom: 5 
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
                <Text style={{ color: "#FFC107", fontWeight: "bold" }}>Eliminate</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      <Button title="Shuffle Players" onPress={shuffleTargets} color="#007BFF" />
      </View>
  );
};

export default MissionDMAdmin;