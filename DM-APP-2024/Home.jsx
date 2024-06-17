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
  FlatList,
  Alert,
  Linking,
} from "react-native";
import UpcomingEventsScreen from "./UpcomingEvents";
const INITIAL_DATE = new Date();
import { auth, db } from './Firebase/AuthManager';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Icon } from 'react-native-elements';

import { addUserExpoPushToken } from "./Firebase/AuthManager";

const Home = ({route}) => {

  const [modalVisible, setModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [role, setRole] = useState('');
  const [userIDState, setUserIDState] = useState('');
  const [allNotifications, setAllNotifications] = useState({});

  const {expoPushToken} = route.params;

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
  
      console.log('Fetched notifications:', fetchedNotifs);
      setAllNotifications(fetchedNotifs); // Assuming setAllNotifications is a state setter
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };
  
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

    useEffect(() => {
      fetchAllNotifications();
    }, []);

    const renderNotif = ({ item }) => {
      return (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationTitle}>{item.title} - {item.date} at {item.time}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
        </View>
      );
    };

    const openWebsite = (url) => {
      Linking.openURL(url);
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
      {/* {role === "Admin" ? (
          <>
          <TouchableOpacity
              style={styles.showNotificationButton}
              onPress={() => setModalVisible(true)}>
                <Text style={styles.buttonText}>Show Notification Center</Text>
            </TouchableOpacity>
          </>
          ) : (
        <></>)} */}
        <TouchableOpacity
        style={styles.bellIconContainer}
        onPress={() => setNotificationModalVisible(true)}
          >
          <Icon
            name="bell"
            type="font-awesome"
            color="white"
            size={24}
          />
      </TouchableOpacity>
      <Text style={styles.applicationTitle}>Ambassador Applications Are Now Open!</Text>
      <Image source={require('./images/ambassador_application.png')} style={styles.applicationImage}/>
      <Text style={styles.applicationText}>
        Applications can be found on the website under "Get Involved" or by pressing the button below.
        Interview sign ups will be sent to you after you submit your application.
      </Text>
      <TouchableOpacity style={styles.applicationButton} onPress={() => openWebsite('https://ufl.qualtrics.com/jfe/form/SV_eG7brijBCrJ8mk6')}>
        <Text style={styles.applicationButtonText}>Apply Here!</Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        {/* <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text>Notification Center</Text>
            <View style={styles.itemContainer}>
                  <TextInput
                  style={styles.inputTop}
                  onChangeText={(text) => setTitle(text)}
                  placeholder="Title"
                  autoCapitalize="none"
                  value={title}
                />
                    <TextInput
                  style={styles.inputTop}
                  onChangeText={(text) => setMessage(text)}
                  placeholder="Message"
                  autoCapitalize="none"
                  value={message}
                />
                <Button
                  title="Send Notification"
                  onPress={() => confirmSend()}
                  buttonStyle={styles.button} 
                />
            </View>
            <Button
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
              title="Hide Tool"
            />
          </View>
        </View> */}
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setNotificationModalVisible(!notificationModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text>Past Notifications</Text>
            <FlatList
              data={allNotifications}
              renderItem={renderNotif} // Your renderItem function to display the notification
              keyExtractor={item => item.id} // Unique key for each notification
            />
            <Button
              style={[styles.button, styles.buttonClose]}
              onPress={() => setNotificationModalVisible(!notificationModalVisible)}
              title="Hide Tool"
            />
          </View>
        </View>
      </Modal>
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
  bellIconContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1, // Ensure it's above other elements
  },
  applicationImage: {
    width: 350,
    height: 350,
    borderColor: "white",
    borderWidth: 5,
  },
  applicationTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 40,
    width: "92%",
    color: "white",
    textAlign: "center",
  },
  applicationText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
    width: "92%",
    color: "white",
    textAlign: "center",
  },
  applicationButton: {
    backgroundColor: "#E2883C",
    padding: 10,
    height: 45,
    width: '60%',
    borderRadius: 5,
    marginBottom: 10, 
  },
  applicationButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize:18,
  },
});