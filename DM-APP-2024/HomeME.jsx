import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
} from "react-native";
import { Icon } from "react-native-elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "./Firebase/AuthManager";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import axios from "axios";
import { sheetsAPIKey } from "./api/apiKeys";

import { addUserExpoPushToken } from "./Firebase/AuthManager";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import TopBar from "./TopBar";
import { colors, card } from "./theme";

import odomeMap from "./images/ODomeMap2026.jpg";

const SPREADSHEET_ID = "15kkihl7I0p4A_jyT-a-ozXQA9kvi_as-ry_6J0PfPis";
const EVENTS_RANGE = "MainEvent!A2:F100";

const formatEventDate = (d) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);

const sortByDate = (list) => [...list].sort((a, b) => a.datetime - b.datetime);

const HomeME = ({ route }) => {
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [imageUrls, setImageUrls] = useState({});

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { expoPushToken } = route.params;

  const fetchAllNotifications = async () => {
    try {
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
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${EVENTS_RANGE}?key=${sheetsAPIKey}`
      );

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        setItems([]);
        setAllItems([]);
        return;
      }

      const fetchedItems = rows.map((row) => {
        const [title, date, time, location, description, pictureName] = row;

        if (!date || !time) return null;

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
        if (isNaN(eventDate.getTime())) return null;

        return {
          formattedDate: formatEventDate(eventDate),
          date,
          time,
          title,
          description,
          location,
          datetime: eventDate,
          picture: pictureName,
        };
      });

      const currentDate = new Date().getTime();
      const filteredItems = sortByDate(
        fetchedItems
          .filter((item) => item !== null)
          .filter((item) => item.datetime.getTime() >= currentDate)
      );

      filteredItems.forEach((item) => {
        if (item.picture) fetchImageUrl(item.picture);
      });

      setItems(filteredItems.slice(0, 3));
      setAllItems(filteredItems);
    } catch (error) {
      console.error("Error fetching events:", error);
      setItems([]);
      setAllItems([]);
    }
  };

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

  useEffect(() => {
    const getUserRole = async () => {
      if (auth.currentUser) {
        const currentUID = auth.currentUser.uid;
        const docRef = doc(db, "Users", currentUID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!data.notificationToken) {
            await addUserExpoPushToken(auth.currentUser.uid, expoPushToken);
          }
        }
      }
    };
    getUserRole();
  }, [auth.currentUser]);

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDates();
    }, [])
  );

  const openEvent = (item) => {
    navigation.navigate("EventDetails", {
      event: {
        title: item.title,
        formattedDate: item.formattedDate,
        time: item.time,
        location: item.location,
        description: item.description,
        imageUrl: imageUrls[item.picture],
      },
    });
  };

  return (
    <View style={styles.screen}>
      <TopBar />

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: 40 + insets.bottom },
        ]}
      >
        <View style={styles.tileRow}>
          <TouchableOpacity
            style={styles.tile}
            onPress={() => setMapModalVisible(true)}
          >
            <Icon name="map" type="font-awesome" size={26} color="white" />
            <Text style={styles.tileText}>O'Dome Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tile}
            onPress={() =>
              Linking.openURL(
                "https://events.dancemarathon.com/participant/songrequests"
              )
            }
          >
            <Icon name="music" type="font-awesome" size={26} color="white" />
            <Text style={styles.tileText}>Music Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tile}
            onPress={() =>
              Linking.openURL(
                "https://drive.google.com/drive/folders/1Pd-JIqk49PMpz2cn6V-P1WlRrs9cmQ4S"
              )
            }
          >
            <Icon name="dollar" type="font-awesome" size={26} color="white" />
            <Text style={styles.tileText}>Resources</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tile}
            onPress={() =>
              navigation.navigate("AllNotifications", {
                notifications: allNotifications,
              })
            }
          >
            <Icon name="bell" type="font-awesome" size={26} color="white" />
            <Text style={styles.tileText}>Notifications</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={mapModalVisible}
          onRequestClose={() => setMapModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMapModalVisible(false)}>
            <View style={styles.mapModalOverlay}>
              <Image
                source={odomeMap}
                style={styles.mapModalImage}
                resizeMode="contain"
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Text style={styles.sectionTitle}>UPCOMING EVENTS</Text>
        <View style={[card, styles.eventsBox]}>
          {items.length > 0 ? (
            items.map((item, index) => {
              const imageSource =
                item.picture && imageUrls[item.picture]
                  ? { uri: imageUrls[item.picture] }
                  : null;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.eventCard}
                  onPress={() => openEvent(item)}
                  activeOpacity={0.85}
                >
                  <View style={styles.eventCardImageBox}>
                    <Image
                      source={imageSource || require("./images/DefaultEventBanner.png")}
                      style={styles.eventCardImageFill}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.eventCardBanner}>
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.eventMeta} numberOfLines={1}>
                      {item.formattedDate ? `${item.formattedDate}` : ""}
                      {item.time ? ` · ${item.time}` : ""}
                      {item.location ? ` · ${item.location}` : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noEvents}>No upcoming events</Text>
          )}

          {allItems.length > items.length && (
            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() =>
                navigation.navigate("AllEvents", { items: allItems, imageUrls })
              }
            >
              <Text style={styles.seeMoreText}>See more events</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeME;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  tileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tileText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  mapModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapModalImage: {
    width: "90%",
    height: "90%",
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  eventsBox: {
    padding: 12,
    marginBottom: 20,
  },
  eventCard: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
  },
  eventCardImageBox: {
    width: "100%",
    aspectRatio: 3.5 / 1,
    overflow: "hidden",
    backgroundColor: colors.lightBlue,
  },
  eventCardImageFill: {
    width: "100%",
    height: "100%",
  },
  eventCardBanner: {
    backgroundColor: colors.navy,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  eventTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  eventMeta: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 2,
  },
  noEvents: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
  seeMoreButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  seeMoreText: {
    color: colors.navy,
    fontWeight: "700",
    fontSize: 14,
  },
});
