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
import UpcomingEventsScreen from "./UpcomingEvents";
const INITIAL_DATE = new Date();
import { auth, db } from "./Firebase/AuthManager";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Icon } from "react-native-elements";
import { Agenda } from "react-native-calendars";
import { storage } from "./Firebase/firebase";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import { addUserExpoPushToken } from "./Firebase/AuthManager";
import { getUserData } from "./Firebase/UserManager";

const Home = ({ route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [role, setRole] = useState("");
  const [userIDState, setUserIDState] = useState("");
  const [allNotifications, setAllNotifications] = useState({});
  const [items, setItems] = useState([]);

  const { expoPushToken } = route.params;

  const fetchAllNotifications = async () => {
    try {
      console.log("Starting to fetch notifications...");
      const notificationsRef = collection(db, "Notifications");
      const querySnapshot = await getDocs(notificationsRef);
      const fetchedNotifs = [];

      querySnapshot.forEach((docSnapshot) => {
        const docData = docSnapshot.data();
        const eventsArray = docData.events; // This is an array based on your Firestore structure

        if (Array.isArray(eventsArray)) {
          eventsArray.forEach((event) => {
            fetchedNotifs.push({
              ...event, // Spread operator to get all properties of the event
              id: `${docSnapshot.id}_${event.time}`, // Construct a unique id for the keyExtractor later
            });
          });
        }
      });

      setAllNotifications(fetchedNotifs.reverse()); // Assuming setAllNotifications is a state setter
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchDates = async () => {
    try {
      const eventsCollectionRef = collection(db, "Calendar2024");
      const querySnapshot = await getDocs(eventsCollectionRef);
      const fetchedItems = [];

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        Object.keys(docData).forEach((date) => {
          const events = docData[date].events;
          events.forEach((event) => {
            let timeString = event.time || "12:00 AM"; // Default to 12:00 AM if no time is provided
            const [time, period] = timeString.split(" ");
            let [hours, minutes] = time.split(":").map(Number);

            if (period === "PM" && hours !== 12) {
              hours += 12;
            } else if (period === "AM" && hours === 12) {
              hours = 0;
            }

            const [year, month, day] = date.split("-").map(Number);

            // Create a valid Date object
            if (year && month && day && !isNaN(hours) && !isNaN(minutes)) {
              const eventDate = new Date(year, month - 1, day, hours, minutes);
              if (!isNaN(eventDate)) {
                fetchedItems.push({
                  formattedDate: new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }).format(eventDate),
                  date,
                  time: event.time || "", // Preserve original time or empty string if not provided
                  title: event.title,
                  description: event.description,
                  datetime: eventDate,
                  picture: event.picture,
                });
              }
            }
          });
        });
      });

      const currentDate = new Date(INITIAL_DATE).getTime();

      let filteredItems = [];

      if (fetchedItems.length === 0) {
        setItems([]);
        return;
      } else {
        filteredItems = fetchedItems.filter(
          (item) => item.datetime.getTime() >= currentDate
        );
      }

      // Sort events by datetime
      filteredItems.sort((a, b) => a.datetime - b.datetime);

      // Set the next three events
      setItems(filteredItems.slice(0, 3));

      filteredItems.forEach((item) => {
        if (item.picture) {
          fetchImageUrl(item.picture);
        }
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      setItems([]);
    }
  };

  useEffect(() => {
    getUserData()
      .then((data) => {
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
          }
        }
      } else {
        console.log("auth.currentUser is null, waiting for authentication.");
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
        <Text style={styles.notificationTitle}>
          {item.title} - {item.date} at {item.time}
        </Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
    );
  };

  const openWebsite = (url) => {
    Linking.openURL(url);
  };

  useEffect(() => {
    fetchDates();
  }, []);

  const [imageUrls, setImageUrls] = useState({});

  const fetchImageUrl = async (imageName) => {
    try {
      const storage = getStorage();
      const storageRef = ref(storage, imageName);
      const url = await getDownloadURL(storageRef);
      setImageUrls((prevUrls) => ({
        ...prevUrls,
        [imageName]: url,
      }));
    } catch (error) {
      console.error("Error getting image URL: ", error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#233563",
      }}
    >
      <TouchableOpacity
        style={styles.bellIconContainer}
        onPress={() => setNotificationModalVisible(true)}
      >
        <Icon name="bell" type="font-awesome" color="white" size={24} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.applicationButton}
        onPress={() => openWebsite("https://linktr.ee/dmatuf")}
      >
        <Text style={styles.applicationButtonText}>Resources</Text>
      </TouchableOpacity>
      <Text style={styles.applicationTitle}>Upcoming Events</Text>
      <ScrollView style={{ width: "93%" }}>
        {Array.isArray(items) && items.length > 0 ? (
          items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              {item.picture && imageUrls[item.picture] ? (
                <Image
                  source={{ uri: imageUrls[item.picture] }}
                  style={styles.miniImage}
                />
              ) : null}
              {item.picture && imageUrls[item.picture] ? (
                <Text style={styles.itemTitle}>{item.title}</Text>
              ) : (
                <Text style={styles.itemTitleNoPicture}>{item.title}</Text>
              )}
              {item.time ? (
                <Text style={styles.itemTime}>
                  {item.formattedDate} at {item.time}
                </Text>
              ) : (
                <Text style={styles.itemTime}>{item.formattedDate}</Text>
              )}
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text>No upcoming events</Text>
        )}
      </ScrollView>
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
              keyExtractor={(item) => item.id} // Unique key for each notification
            />
            <Button
              style={[styles.button, styles.buttonClose]}
              onPress={() => setNotificationModalVisible(!notificationModalVisible)}
              title="Hide Notifications"
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
    backgroundColor: "#233D72",
    margin: 2,
    justifyContent: "flex-start",
    paddingLeft: 15,
    borderRadius: 5,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderColor: "#2B457A",
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
    color: "white",
    fontSize: 12,
    textAlign: "center",
    margin: 10,
  },
  notificationContainer: {
    backgroundColor: "white",
    padding: 20,
    marginRight: 10,
    marginTop: 17,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  showNotificationButton: {
    backgroundColor: "#E2883C",
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
    width: 200,
    marginBottom: 20,
  },
  bellIconContainer: {
    position: "absolute",
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
    marginTop: 20,
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
    width: "45%",
    borderRadius: 5,
    marginBottom: 10,
    marginTop: 85,
  },
  applicationButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  itemContainer: {
    backgroundColor: "white",
    padding: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemTime: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  itemTitleNoPicture: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 0,
  },
  miniImage: {
    width: 325,
    borderRadius: 5,
    height: 325,
  },
});
