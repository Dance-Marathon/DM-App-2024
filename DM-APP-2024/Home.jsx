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

import axios from "axios";
import { sheetsAPIKey } from "./api/apiKeys";

const Home = ({ route }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [role, setRole] = useState("");
  const [userIDState, setUserIDState] = useState("");
  const [allNotifications, setAllNotifications] = useState({});
  const [items, setItems] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState("");

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
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationDate}>
          {item.date} at {item.time}
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

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setNotificationModalVisible(true);
  };

  return (
    // <View
    //   style={{
    //     flex: 1,
    //     justifyContent: "center",
    //     alignItems: "center",
    //     backgroundColor: "#233563",
    //   }}>
    //   <TouchableOpacity
    //   style={styles.bellIconContainer}
    //   onPress={() => setNotificationModalVisible(true)} >
    //     <Icon
    //       name="bell"
    //       type="font-awesome"
    //       color="white"
    //       size={24}
    //     />
    //   </TouchableOpacity>
    //   <TouchableOpacity
    //     style={styles.applicationButton} onPress={() => openWebsite('https://linktr.ee/dmatuf')} >
    //     <Text style={styles.applicationButtonText} >Resources</Text>
    //   </TouchableOpacity>
    //   <Text style={styles.applicationTitle}>Upcoming Events</Text>
    //     <ScrollView style={{width:'93%'}}>
    //     {Array.isArray(items) && items.length > 0 ? (
    //       items.map((item, index) => (
    //         <View key={index} style={styles.itemContainer}>
    //           {item.picture && imageUrls[item.picture] ? (
    //             <Image source={{ uri: imageUrls[item.picture] }} style={styles.miniImage} />
    //           ) : (
    //             null
    //           )}
    //           {item.picture && imageUrls[item.picture] ? (
    //             <Text style={styles.itemTitle}>{item.title}</Text>
    //           ) : (
    //             <Text style={styles.itemTitleNoPicture}>{item.title}</Text>
    //           )}
    //           {item.time ? (
    //             <Text style={styles.itemTime}>{item.formattedDate} at {item.time}</Text>
    //           ) : (
    //             <Text style={styles.itemTime}>{item.formattedDate}</Text>
    //           )}
    //           {item.location ? (
    //             <Text style={styles.itemTime}>{item.location}</Text>
    //           ) : (
    //             null
    //           )}
    //           {item.description ? (
    //             <Text style={styles.description}>{item.description}</Text>
    //           ) : (
    //             null
    //           )}
    //         </View>
    //       ))
    //     ) : (
    //       <Text>No upcoming events</Text>
    //     )}
    //     </ScrollView>
    //   <Modal
    //     animationType="slide"
    //     transparent={true}
    //     visible={notificationModalVisible}
    //     onRequestClose={() => {
    //       Alert.alert("Modal has been closed.");
    //       setNotificationModalVisible(!notificationModalVisible);
    //     }} >
    //     <View style={styles.centeredView}>
    //       <View style={styles.modalView}>
    //         <Text style={styles.notificationHeader}>Notifications</Text>
    //         <TouchableOpacity
    //           style={styles.button}
    //           onPress={() => setNotificationModalVisible(!notificationModalVisible)} >
    //             <Icon
    //               name="close"
    //               type="font-awesome"
    //               color="black"
    //               size={30}
    //             />
    //         </TouchableOpacity>
    //         <FlatList
    //           data={allNotifications}
    //           renderItem={renderNotif} // Your renderItem function to display the notification
    //           keyExtractor={item => item.id} // Unique key for each notification
    //           showsVerticalScrollIndicator={false} // Hide the vertical scrollbar
    //         />
    //       </View>
    //     </View>
    //   </Modal>
    // </View>
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
        source={require("./images/logo.png")}
      />
      <View style={styles.notificationsBox}>
        <View style={styles.header}>
          <View style={styles.smallCircle} />
          <Text style={styles.headerText}>NOTIFICATIONS</Text>
          <TouchableOpacity>
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
          animationType="slide"
          transparent={true}
          visible={notificationModalVisible}
          onRequestClose={() => setNotificationModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedNotification && (
                <>
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
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setNotificationModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
      <View style={styles.eventsBox}>
        <View style={styles.header}>
          <View style={styles.smallCircle} />
          <Text style={styles.headerText}>UPCOMING EVENTS</Text>
        </View>
        <View style={styles.eventsList}>
          {Array.isArray(items) && items.length > 0 ? (
            items.map((item, index) => (
              <View key={index} style={styles.eventContainer}>
                {item.picture ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: imageUrls[item.picture] }}
                      style={styles.eventImage}
                    />
                  </View>
                ) : (
                  <View></View>
                )}
                <View style={styles.eventDetails}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <TouchableOpacity>
                    <Text style={styles.learnMore}>Learn More</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  // eventItem: {
  //   width: eventItemWidth,
  //   backgroundColor: "white",
  //   padding: 20,
  //   borderRadius: 10,
  //   alignSelf: "center",
  // },
  // centeredView: {
  //   flex: 1,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   marginTop: 22,
  // },
  // modalView: {
  //   marginTop: 70,
  //   marginBottom: 70,
  //   margin: 20,
  //   position: "relative",
  //   backgroundColor: "white",
  //   borderRadius: 20,
  //   padding: 20,
  //   shadowColor: "#000",
  //   shadowOffset: {
  //     width: 0,
  //     height: 2,
  //   },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 4,
  //   elevation: 5,
  // },
  // flatListContainer: {
  //   overflow: "hidden",
  // },
  // notificationHeader: {
  //   fontSize: 24,
  //   fontWeight: "bold",
  //   color: "black",
  //   textAlign: "left",
  //   marginBottom: 20,
  // },
  // header: {
  //   fontSize: 24,
  //   fontWeight: "bold",
  //   marginBottom: 20,
  //   marginTop: 20,
  //   color: "white",
  //   textAlign: "center",
  // },
  // button: {
  //   margin: 2,
  //   position: "absolute",
  //   top: 10,
  //   right: 10,
  //   fontSize: 20,
  //   color: "black",
  // },
  // inputTop: {
  //   height: 40,
  //   borderColor: "black",
  //   borderWidth: 1,
  //   marginBottom: 15,
  //   paddingHorizontal: 10,
  //   borderRadius: 5,
  //   backgroundColor: "#D9D9D9",
  // },
  // topText: {
  //   color: "white",
  //   fontSize: 12,
  //   textAlign: "center",
  //   margin: 10,
  // },
  // notificationContainer: {
  //   backgroundColor: "white",
  //   padding: 10,
  //   // marginTop: 17,
  //   marginBottom: 10,
  //   borderRadius: 5,
  //   borderWidth: 3,
  //   borderColor: "#231F7C",
  //   // shadowColor: '#000',
  //   // shadowOffset: { width: 0, height: 2 },
  //   // shadowOpacity: 0.1,
  //   // shadowRadius: 4,
  // },
  // notificationTitle: {
  //   fontSize: 16,
  //   fontWeight: "bold",
  // },
  // notificationDate: {
  //   fontSize: 12,
  //   color: "gray",
  //   fontWeight: "bold",
  // },
  // notificationMessage: {
  //   fontSize: 14,
  //   marginTop: 5,
  // },
  // showNotificationButton: {
  //   backgroundColor: "#E2883C",
  //   padding: 15,
  //   borderRadius: 5,
  //   marginTop: 15,
  //   width: 200,
  //   marginBottom: 20,
  // },
  // bellIconContainer: {
  //   position: "absolute",
  //   top: 50,
  //   right: 20,
  //   zIndex: 1, // Ensure it's above other elements
  // },
  // applicationImage: {
  //   width: 350,
  //   height: 350,
  //   borderColor: "white",
  //   borderWidth: 5,
  // },
  // applicationTitle: {
  //   fontSize: 30,
  //   fontWeight: "bold",
  //   marginBottom: 10,
  //   marginTop: 20,
  //   width: "92%",
  //   color: "white",
  //   textAlign: "center",
  // },
  // applicationText: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   marginBottom: 20,
  //   marginTop: 10,
  //   width: "92%",
  //   color: "white",
  //   textAlign: "center",
  // },
  // applicationButton: {
  //   backgroundColor: "#E2883C",
  //   padding: 10,
  //   height: 45,
  //   width: "45%",
  //   borderRadius: 5,
  //   marginBottom: 10,
  //   marginTop: 85,
  // },
  // applicationButtonText: {
  //   color: "white",
  //   textAlign: "center",
  //   fontWeight: "bold",
  //   fontSize: 18,
  // },
  // itemContainer: {
  //   backgroundColor: "white",
  //   padding: 20,
  //   marginTop: 10,
  //   marginBottom: 10,
  //   borderRadius: 5,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },
  // itemTime: {
  //   fontSize: 16,
  //   fontWeight: "bold",
  // },
  // itemTitle: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   marginTop: 20,
  // },
  // itemTitleNoPicture: {
  //   fontSize: 18,
  //   fontWeight: "bold",
  //   marginTop: 0,
  // },
  // miniImage: {
  //   width: 325,
  //   borderRadius: 5,
  //   height: 325,
  // },
  dmlogo: {
    top: -280,
    width: "90%",
    height: 75,
  },
  notificationsBox: {
    top: 160,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: 340,
    height: 180,
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
  eventsBox: {
    top: 370,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: 340,
    height: 370,
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
    color: "#9DB6F3",
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
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    width: "80%",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
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
});
