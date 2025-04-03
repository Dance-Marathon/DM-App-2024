import React, { useEffect, useState } from "react";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
const INITIAL_DATE = new Date();
import { auth, db } from "./Firebase/AuthManager";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import { addUserExpoPushToken } from "./Firebase/AuthManager";

import axios from "axios";
import { sheetsAPIKey } from "./api/apiKeys";

import { useNavigation } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import LogoStyles from "./LogoStyles";

const Home = ({ route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [allNotifications, setAllNotifications] = useState({});
  const [items, setItems] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState("");

  const navigation = useNavigation();

  const SPREADSHEET_ID = "15kkihl7I0p4A_jyT-a-ozXQA9kvi_as-ry_6J0PfPis";
  const range = "Sheet1!A5:F100";
  const apiKey = sheetsAPIKey;

  const { expoPushToken } = route.params;

  const fetchAllNotifications = async () => {
    try {
      console.log("Starting to fetch notifications...");
      const notificationsRef = collection(db, "Notifications");
      const querySnapshot = await getDocs(notificationsRef);
      const fetchedNotifs = [];

      querySnapshot.forEach((docSnapshot) => {
        const docData = docSnapshot.data();
        const eventsArray = docData.events;

        if (Array.isArray(eventsArray)) {
          eventsArray.forEach((event) => {
            fetchedNotifs.push({
              ...event,
              id: `${docSnapshot.id}_${event.time}`,
            });
          });
        }
      });

      setAllNotifications(fetchedNotifs.reverse());
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const fetchDates = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`
      );

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        console.log("No data found.");
        setItems([]);
        return;
      }

      const fetchedItems = rows.slice(0).map((row, index) => {
        const [title, date, time, location, description, pictureName] = row;

        if (!date || !time) {
          return null;
        }

        const [year, month, day] = date.split("-").map(Number);

        let hours = 0,
          minutes = 0;
        const timeMatch = time.match(/^(\d+):(\d+)\s?(AM|PM)$/i);
        if (timeMatch) {
          hours = parseInt(timeMatch[1], 10);
          minutes = parseInt(timeMatch[2], 10);
          const period = timeMatch[3].toUpperCase();

          if (period === "PM" && hours !== 12) {
            hours += 12;
          } else if (period === "AM" && hours === 12) {
            hours = 0;
          }
        } else {
          return null;
        }

        if (
          isNaN(year) ||
          isNaN(month) ||
          isNaN(day) ||
          isNaN(hours) ||
          isNaN(minutes)
        ) {
          return null;
        }

        const eventDate = new Date(year, month - 1, day, hours, minutes);
        if (isNaN(eventDate.getTime())) {
          return null;
        }

        return {
          formattedDate: new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }).format(eventDate),
          date,
          time: time,
          title: title,
          description: description,
          location: location,
          datetime: eventDate,
          picture: pictureName,
        };
      });

      const currentDate = new Date(INITIAL_DATE).getTime();

      const validItems = fetchedItems.filter((item) => item !== null);

      const filteredItems = validItems.filter(
        (item) => item.datetime.getTime() >= currentDate
      );

      filteredItems.sort((a, b) => a.datetime - b.datetime);

      filteredItems.forEach((item) => {
        if (item.picture) {
          fetchImageUrl(item.picture);
        }
      });

      setItems(filteredItems.slice(0, 3));
    } catch (error) {
      console.error("Error fetching events:", error);
      setItems([]);
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

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setNotificationModalVisible(true);
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <Image
        style={LogoStyles.logo}
        resizeMode="contain"
        source={require("./images/logo.png")}
      />
      <View style={styles.notificationsBox}>
        <View style={styles.header}>
          <FontAwesome name="bell-o" size={18} color="orange" />
          <Text style={styles.headerText}>NOTIFICATIONS</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("AllNotifications", {
                notifications: allNotifications,
              })
            }
          >
            <Text style={styles.showAll}>Show All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notifications}>
          {Array.isArray(allNotifications) &&
            allNotifications.slice(0, 3).map((notification, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleNotificationClick(notification)}
              >
                <Text style={styles.notificationText}>
                  {notification.title}
                </Text>
                {index < 2 && <View style={styles.divider} />}
              </TouchableOpacity>
            ))}
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={notificationModalVisible}
          onRequestClose={() => setNotificationModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setNotificationModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {selectedNotification && (
                <>
                  <View
                    style={[
                      styles.header,
                      { marginBottom: -5, marginTop: -15 },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.modalClose}
                      onPress={() => setNotificationModalVisible(false)}
                    >
                      <FontAwesomeIcon icon={faX} color="white" size={20} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalTitle}>
                    {selectedNotification.title}
                  </Text>
                  <Text style={styles.modalDateTime}>
                    {selectedNotification.date} at {selectedNotification.time}
                  </Text>
                  <Text style={styles.modalMessage}>
                    {selectedNotification.message}
                  </Text>
                </>
              )}
            </View>
            </TouchableWithoutFeedback>
          </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
      <View style={styles.eventsBox}>
        <View style={styles.header}>
          <FontAwesome name="calendar" size={18} color="orange" />
          <Text style={styles.headerText}>UPCOMING EVENTS</Text>
        </View>
        <View style={styles.eventsList}>
        {Array.isArray(items) && items.length > 0 ? (
  items.map((item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.eventContainer}
      onPress={() =>
        navigation.navigate("EventDetails", {
          event: {
            ...item,
            formattedDate: item.datetime.toDateString(),
            imageUrl: imageUrls[item.picture],
          },
        })
      }
    >
      {item.picture ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrls[item.picture] }}
            style={styles.eventImage}
          />
        </View>
      ) : (
        <View />
      )}
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        
      </View>
    </TouchableOpacity>
  ))
) : (
  <Text style={styles.noEvents}>No upcoming events</Text>
)}
        </View>
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  dmlogo: {
    top: -280,
    width: "90%",
    height: 75,
  },
  notificationsBox: {
    marginTop: 20,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: '85%',
    height: 180,
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
  },
  eventsBox: {
    marginTop: 30,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: '85%',
    height: 370,
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
  },
  smallCircle: {
    width: 15,
    height: 15,
    borderRadius: 50,
    backgroundColor: "#EB9F68",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    left: 10,
    top: 10,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
    left: 5,
  },
  showAll: {
    color: "white",
    fontSize: 14,
    right: 20,
    textDecorationLine: "underline",
  },
  notifications: {
    marginTop: 0,
  },
  notificationText: {
    color: "white",
    fontSize: 14,
    paddingVertical: 16,
    textAlign: "left",
    left: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#233D72",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalClose: {
    position: "absolute",
    right: -140,
    top: -7,
  },
  eventsList: {
    paddingTop: 10,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#1E2A47",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 15,
  },
  eventImage: {
    width: "100%",
    height: 60,
    resizeMode: "cover",
  },
  eventTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    flex: 1,
    left: 10,
  },
  learnMore: {
    color: "white",
    fontSize: 14,
    textDecorationLine: "underline",
    alignSelf: "flex-end",
    right: 10,
  },
  noEvents: {
    color: "white",
    fontSize: 14,
    left: 10,
    top: 5,
  },
  eventContainer: {
    backgroundColor: "#EB9F68",
    alignItems: "center",
    height: 100,
    width: "94%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
  },
  eventsList: {
    top: 10,
    left: 10,
  },
  imageContainer: {
    flex: 7,
    width: "100%",
  },
  eventDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 10,
  },
  modalDateTime: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
  },
  modalMessage: {
    color: "white",
    fontSize: 14,
    marginBottom: 10,
  },
});
