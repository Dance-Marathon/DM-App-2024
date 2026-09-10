import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Progress from "react-native-progress";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "./Firebase/AuthManager";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import axios from "axios";
import { sheetsAPIKey } from "./api/apiKeys";

import { addUserExpoPushToken } from "./Firebase/AuthManager";
import { getUserData } from "./Firebase/UserManager";
import { UserContext } from "./api/calls";
import { useNavigation } from "@react-navigation/native";
import TopBar from "./TopBar";
import { colors, card } from "./theme";

const LAST_SEEN_NOTIFICATION_KEY = "@last_seen_notification";

const SPREADSHEET_ID = "15kkihl7I0p4A_jyT-a-ozXQA9kvi_as-ry_6J0PfPis";
const EVENTS_RANGE = "Sheet1!A4:F100";

const formatEventDate = (d) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);

const sortByDate = (list) => [...list].sort((a, b) => a.datetime - b.datetime);

const currency = (n) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const Home = ({ route }) => {
  const [role, setRole] = useState("");
  const [userIDState, setUserIDState] = useState("");
  const [allNotifications, setAllNotifications] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [hasUnread, setHasUnread] = useState(false);

  const { expoPushToken } = route.params;
  const { userInfo } = useContext(UserContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isGuest = !auth.currentUser;

  const openWebsite = (url) => Linking.openURL(url);

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

      const reversed = fetchedNotifs.reverse();
      setAllNotifications(reversed);

      const newestId = reversed[0]?.id;
      if (newestId) {
        const lastSeenId = await AsyncStorage.getItem(
          LAST_SEEN_NOTIFICATION_KEY
        );
        setHasUnread(newestId !== lastSeenId);
      }
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
    getUserData()
      .then((data) => {
        if (data) {
          setUserIDState(data.donorID);
          setRole(data.role);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

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

  useEffect(() => {
    fetchDates();
  }, []);

  const handleBellPress = async () => {
    const newestId = allNotifications[0]?.id;
    if (newestId) {
      await AsyncStorage.setItem(LAST_SEEN_NOTIFICATION_KEY, newestId);
    }
    setHasUnread(false);
    navigation.navigate("AllNotifications", {
      notifications: allNotifications,
    });
  };

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

  const raised = userInfo?.sumDonations || 0;
  const goal = userInfo?.fundraisingGoal || 0;
  const progress = goal > 0 ? Math.min(raised / goal, 1) : 0;
  const donors = userInfo?.numDonations || 0;
  const toGoal = Math.max(goal - raised, 0);

  return (
    <View style={styles.screen}>
      <TopBar
        rightIcon="bell"
        showBadge={hasUnread}
        onRightPress={handleBellPress}
      />

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: 40 + insets.bottom },
        ]}
      >
        {isGuest ? (
          <View style={styles.heroCard}>
            <Text style={styles.heroName}>Welcome to DM at UF</Text>
            <Text style={styles.heroRole}>
              Sign in to track your fundraising and spirit points
            </Text>
            <View style={styles.guestButtonRow}>
              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => navigation.navigate("Account", { screen: "Login" })}
              >
                <Text style={styles.guestButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.guestButton, styles.guestButtonOutline]}
                onPress={() =>
                  navigation.navigate("Account", {
                    screen: "Login",
                    params: { signUpMode: true },
                  })
                }
              >
                <Text style={styles.guestButtonOutlineText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.heroCard}>
            <Text style={styles.heroName} numberOfLines={1}>
              {userInfo?.displayName || "Welcome"}
            </Text>
            {!!role && <Text style={styles.heroRole}>{role}</Text>}

            <Text style={styles.heroRaised}>{currency(raised)}</Text>

            <Progress.Bar
              progress={progress}
              width={null}
              height={8}
              borderWidth={0}
              unfilledColor="rgba(255,255,255,0.25)"
              color={colors.orange}
              style={styles.progressBar}
            />

            <Text style={styles.heroSubtext}>
              {donors} donors · {currency(toGoal)} to goal
            </Text>
          </View>
        )}

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
                  {imageSource ? (
                    <Image
                      source={imageSource}
                      style={styles.eventCardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.eventCardPlaceholder} />
                  )}
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

        {!isGuest && (
          <>
            <Text style={styles.sectionTitle}>RESOURCES</Text>
            <View style={styles.resourcesCard}>
              <Text style={styles.resourcesTitle}>Need something?</Text>
              <Text style={styles.resourcesDescription}>
                Find guides, documents, and helpful links for Dance Marathon at
                UF.
              </Text>
              <TouchableOpacity
                style={styles.resourcesButton}
                onPress={() => openWebsite("https://linktr.ee/dmatuf")}
              >
                <Text style={styles.resourcesButtonText}>View resources</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  heroName: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  heroRole: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 2,
  },
  heroRaised: {
    color: "white",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 14,
  },
  progressBar: {
    width: "100%",
    marginTop: 12,
  },
  heroSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 8,
  },
  guestButtonRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  guestButton: {
    flex: 1,
    backgroundColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  guestButtonOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "white",
    marginLeft: 10,
  },
  guestButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  guestButtonOutlineText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
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
  eventCardImage: {
    width: "100%",
    aspectRatio: 3.5 / 1,
    backgroundColor: colors.lightBlue,
  },
  eventCardPlaceholder: {
    width: "100%",
    aspectRatio: 3.5 / 1,
    backgroundColor: colors.orange,
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
  resourcesCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: 12,
    padding: 20,
  },
  resourcesTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  resourcesDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  resourcesButton: {
    backgroundColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  resourcesButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
