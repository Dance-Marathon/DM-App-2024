import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Platform,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Button,
  TextInput,
  FlatList,
  Alert,
  Linking,
  SafeAreaView,
} from "react-native";
const INITIAL_DATE = new Date();
import { auth, db } from './Firebase/AuthManager';
import { doc, setDoc } from 'firebase/firestore';
import { getUserInfo } from './api/index';
import { getUserData } from "./Firebase/UserManager";

const MissionDM = () => {
    const [inGame, setInGame] = useState(false);
    const [userIDState, setUserIDState] = useState('');
    const [userInfo, setUserInfo] = useState({});

    useEffect(() => {
        getUserData().then((data) => {
          console.log("Fetched User Data:", data);
          setUserIDState(data.donorID);
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

    const enrollUser = async () => {
        try {
            const currentUID = auth.currentUser.uid;

            setDoc(doc(db, "MissionDMPlayers", currentUID), {
                name: userInfo.displayName,
                isEliminated: false,
                gameId: "test",
                joinedTime: new Date().toISOString(),
                code: "test",
                eliminations: {},
                id: "1",
                targetId: "2",
              },
              { merge: true }
            );
    
          Alert.alert("Success", "You have been enrolled in the game!");
          setInGame(true);
        } catch (error) {
          console.error("Error enrolling user:", error);
          Alert.alert("Error", "Failed to enroll. Please try again.");
        }
    };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#233563",
      }}>
        {inGame ? (
        <Text style={{ fontSize: 18, color: "green" }}>You are enrolled! The game starts in:</Text>
      ) : (
        <TouchableOpacity style={styles.enrollButton} onPress={enrollUser} >
                <Text style={styles.enrollButtonText} >Enroll In MissionDM</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MissionDM;

const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22,
    },
    modalView: {
      marginTop: 70,
      marginBottom: 70,
      margin: 20,
      position: "relative",
      backgroundColor: "white",
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    flatListContainer: {
      overflow: 'hidden',
    },
    notificationHeader: {
      fontSize: 24,
      fontWeight: "bold",
      color: "black",
      textAlign: "left",
      marginBottom: 20,
    },
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
      position: 'absolute',
      top: 10,
      right: 10,
      fontSize: 20,
      color: 'black',
      },
    inputTop: {
      height: 40,
      borderColor: "black",
      borderWidth: 1,
      marginBottom: 15,
      paddingHorizontal: 10,
      borderRadius: 5,
      backgroundColor: "#D9D9D9",
    },
    topText: {
      color: 'white',
      fontSize: 12,
      textAlign: 'center',
      margin: 10,
    },
    enrollButton: {
      backgroundColor: "#E2883C",
      padding: 10,
      height: 45,
      width: '55%',
      borderRadius: 5,
      marginBottom: 10,
      marginTop: 85,
    },
    enrollButtonText: {
      color: 'white',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize:18,
    },
    itemContainer: {
      backgroundColor: 'white',
      padding: 20,
      marginTop: 10,
      marginBottom: 10,
      borderRadius: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    itemTime: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    itemTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
    },
    itemTitleNoPicture: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 0,
    },
    miniImage: {
      width: 325,
      borderRadius: 5,
      height: 325,
    },
  });
  