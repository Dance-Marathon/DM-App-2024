// Page1.js (similar structure for other pages)
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
} from "react-native";
import { UpComingEventsScreen } from "./UpcomingEvents";
import UpcomingEventsScreen from "./UpcomingEvents";
const INITIAL_DATE = new Date();
import {addCalanderEntry} from './Firebase/CalanderManager'
import { handleSignOut } from './Firebase/AuthManager';
import { Agenda } from 'react-native-calendars';
import firebase from './Firebase/firebase';
import { auth, db } from './Firebase/AuthManager';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Input } from "react-native-elements";

const fetchData = async () => {
  try {
    const eventsCollectionRef = collection(db, "Users");
    const querySnapshot = await getDocs(eventsCollectionRef);
    const fetchedItems = [];

    querySnapshot.forEach((doc) => {
      const docData = doc.data();
        console.log(docData);
        fetchedItems.push(docData.notificationToken);

    });

    console.log('Item:',fetchedItems);
    return fetchedItems;
  } catch (error) {
    console.error("Error fetching events:", error);
    // Handle errors as needed
  }
};

const allTokens = [
  'ExponentPushToken[UVH4ZkJqvUH8iQJRWE2Z5o]',
  'ExponentPushToken[5LN8TcC3JIJTdI86DflIb-]',
];

async function sendPushNotificationsToAll(expoPushTokens, title, message) {
  console.log('Sending notifications...');
  messages = []
/*   const messages = expoPushTokens.map(token => ({
    to: token,
    sound: 'default',
    title: 'Original Title',
    body: 'And here is the body!',
    data: { someData: 'goes here' },
  })); */

  for (const token of expoPushTokens) {
    messages.push({
    to: token,
    sound: 'default',
    title: title,
    body: message,
    data: { someData: 'goes here' },
    })

    console.log(token)
  }
  for (const message of messages) {
    console.log(`Sending to token: ${message.to}`);
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }
}

const Home = () => {

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [role, setRole] = useState('');
  const [userIDState, setUserIDState] = useState('');

  const displayDocumentData = async () => {
    try {
      const currentUID = auth.currentUser.uid;
      console.log(currentUID);
      const docRef = doc(db, "Users", currentUID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(data);
        setUserIDState(data.donorID);
        setRole(data.role);
      } else {
        console.log("Document does not exist");
      }
    } catch (error) {
      console.error("Error fetching document data:", error);
    }
  };

  useEffect(() => {
    displayDocumentData();
  }, []);

  let handleClick = async () => {
    fetchItems = await fetchData();
    sendPushNotificationsToAll(fetchItems, title, message).then(() => {
      console.log('All notifications sent!');
    }).catch(error => {
      console.error('Error sending notifications:', error);
    });
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
        {role === "Admin" ? (
          <>
             <Button
          title="Notifications"
          onPress={() => handleClick()}
          buttonStyle={styles.button} 
          />
                 <TextInput
                style={styles.inputTop}
                onChangeText={(text) => setTitle(text)}
                placeholder="Title"
                autoCapitalize="none"
              />
                   <TextInput
                style={styles.inputTop}
                onChangeText={(text) => setMessage(text)}
                placeholder="Message"
                autoCapitalize="none"
              />
          </>
       

          ) : (
        <></>)}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: "95%", alignSelf: "center" }}
      >
        <Text style={styles.header}>MAIN EVENT FLOOR PLAN</Text>
        <View style={styles.eventItem}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image
              source={require("./images/rotatedfloor.png")}
              style={{
                width: eventItemWidth,
                height: 100,
                alignSelf: "center",
                resizeMode: "stretch",

              }}
            />
          </TouchableOpacity>
        </View>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TouchableOpacity onPress={() => setModalVisible(!modalVisible)}>
                <Image
                  source={require("./images/floor.png")}
                  style={{ width: 300, height: 500, resizeMode: "contain" }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <UpcomingEventsScreen />
      </ScrollView>
    </View>
  );
};

export default Home;

const eventItemWidth = Dimensions.get("window").width * 0.9;

const styles = StyleSheet.create({
  eventItem: {
    width: eventItemWidth,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignSelf: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: '#233D72',
    margin: 2,
    justifyContent: 'flex-start',
    paddingLeft: 15,
    borderRadius: 5,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderColor: '#2B457A',
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
});