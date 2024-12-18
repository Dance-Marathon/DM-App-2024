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
  TouchableWithoutFeedback,
  Dimensions,
  ScrollView,
  Button,
  TextInput,
  FlatList,
  Alert,
  Keyboard,
} from "react-native";
import UpcomingEventsScreen from "./UpcomingEvents";
const INITIAL_DATE = new Date();
import { auth, db } from './Firebase/AuthManager';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

import { addUserExpoPushToken } from "./Firebase/AuthManager";
import { getUserData } from "./Firebase/UserManager";

const fetchData = async () => {
  try {
    const eventsCollectionRef = collection(db, "Users");
    const querySnapshot = await getDocs(eventsCollectionRef);
    const fetchedItems = [];

    querySnapshot.forEach((doc) => {
      const docData = doc.data();
        //console.log(docData);
        fetchedItems.push(docData.notificationToken);

    });

    //console.log('Item:',fetchedItems);
    return fetchedItems;
  } catch (error) {
    console.error("Error fetching events:", error);
    // Handle errors as needed
  }
};

async function sendPushNotificationsToAll(expoPushTokens, notification) {
  console.log('Sending notifications...');
  const messages = []

  for (const token of expoPushTokens) {
    messages.push({
    to: token,
    sound: 'default',
    title: notification.title,
    body: notification.message,
    //data: { someData: 'goes here' },
    })

    console.log(token)
  }
  for (const message of messages) {
    //console.log(`Sending to token: ${message.to}`);
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

async function sendPushNotification(expoPushToken, notification) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: notification.title,
    body: notification.message,
  };

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

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Convert month to 2 digits
  const day = date.getDate().toString().padStart(2, '0'); // Convert day to 2 digits
  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  const date = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = hours.toString().padStart(2, '0'); // Convert hours to 2 digits
  return `${hours}:${minutes} ${ampm}`;
}

const Home = ({route}) => {

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [role, setRole] = useState('');
  const [userIDState, setUserIDState] = useState('');
  const [allNotifications, setAllNotifications] = useState({});

  const {expoPushToken} = route.params;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
/* 
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllNotifications();
    }, 120000); // Refresh every two minutes

    fetchData(); // Also fetch immediately on component mount

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []); */

  const addNotification = async (notification) => {
    try {
      const notificationsRef = collection(db, "Notifications");
      const notificationDate = notification.date; // Ensure that 'notification' has a 'date' property
      const dateDocRef = doc(notificationsRef, notificationDate);
      const docSnapshot = await getDoc(dateDocRef);
  
      if (docSnapshot.exists()) {
        // If the document exists, append the new event to the 'events' array
        await updateDoc(dateDocRef, {
          events: arrayUnion(notification),
        });
      } else {
        // If the document does not exist, create it with the 'events' array containing the new event
        await setDoc(dateDocRef, {
          events: [notification],
        });
      }
      console.log("Notification added successfully");
    } catch (error) {
      console.error("Error adding notification:", error);
      throw error; // Rethrow the error to handle it in the calling function
    }
  };

  const fetchAllNotifications = async () => {
    try {
      console.log('Starting to fetch notifications...');
      const notificationsRef = collection(db, "Notifications");
      const querySnapshot = await getDocs(notificationsRef);
      const fetchedNotifs = [];
  
      querySnapshot.forEach((docSnapshot) => {
        const docData = docSnapshot.data();
        const eventsArray = docData.events; // This is an array based on your Firestore structure
  
        if (Array.isArray(eventsArray)) {
          eventsArray.forEach(event => {
            fetchedNotifs.push({
              ...event, // Spread operator to get all properties of the event
              id: `${docSnapshot.id}_${event.time}` // Construct a unique id for the keyExtractor later
            });
          });
        }
      });
  
      setAllNotifications(fetchedNotifs); // Assuming setAllNotifications is a state setter
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  
  useEffect(() => {
    getUserData().then((data) => {
      setUserIDState(data.donorID);
      setRole(data.role);
    })
    .catch((err) => {
      console.error(err);
      setError(err);
    });
  }, []);

  useEffect(() => {
    const getUserRole = async () => {
      if (auth.currentUser) {
        await displayDocumentData();
        const currentUID = auth.currentUser.uid;
        const docRef = doc(db, "Users", currentUID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!data.notificationToken) {
            await addUserExpoPushToken(auth.currentUser.uid, expoPushToken);
        } else {
          console.log("Token exists");
        }}
      } else {
        console.log('auth.currentUser is null, waiting for authentication.');
      }
    };
    getUserRole();
  }, [auth.currentUser]);

  let handleClick = async () => {
    fetchItems = await fetchData();
    sendPushNotificationsToAll(fetchItems, {
      date: getCurrentDate(),
      message: message,
      time: getCurrentTime(),
      title: title
    }).then(() => {
      console.log('All notifications sent!');
    }).catch(error => {
      console.error('Error sending notifications:', error);
    });
    /* sendPushNotification('ExponentPushToken[UVH4ZkJqvUH8iQJRWE2Z5o]',{
      date: getCurrentDate(),
      message: message,
      time: getCurrentTime(),
      title: title
    }); */
    addNotification({
      date: getCurrentDate(),
      message: message,
      time: getCurrentTime(),
      title: title
    });
    setTitle('');
    setMessage('');
    }

    useEffect(() => {
      fetchAllNotifications();
    }, []);

    const confirmSend = () => {
      Alert.alert(
        'Send Notification',
        'Are you sure you want to send this notification?',
        [
          // The "Yes" button
          { text: 'Yes', onPress: () => handleClick() },
          // The "No" button
          { text: 'No', style: 'cancel' },
        ],
        { cancelable: false }
      );
    };

return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setTitle(text)}
        placeholder="Title"
        autoCapitalize="none"
        value={title}
      />
      <TextInput
        style={[styles.input, { minHeight: 40 }]}
        onChangeText={(text) => setMessage(text)}
        placeholder="Message"
        autoCapitalize="none"
        value={message}
        multiline={true}
        numberOfLines={4} // Set the number of lines you want to show initially
        textAlignVertical="top" // Align text to the top
      />
      <Button
        title="Send Notification"
        onPress={confirmSend}
        buttonStyle={styles.button}
      />
    </View>
    </TouchableWithoutFeedback>
  );
};
export default Home;

const eventItemWidth = Dimensions.get("window").width * 0.9;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#233563',
        paddingHorizontal: 20,
      },
      input: {
        height: 40,
        borderColor: 'black',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: '#D9D9D9',
        width: '100%',
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
        width: '100%',
      },
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
  topText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    margin: 10,
  },
  notificationContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginRight: 10,
    marginTop: 17,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  showNotificationButton: {
    backgroundColor: '#E2883C',
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
    width: 200,
    marginBottom: 20,
  },
});