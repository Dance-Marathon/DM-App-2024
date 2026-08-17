import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
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

import { addUserExpoPushToken } from "./Firebase/AuthManager";
import { getUserData } from "./Firebase/UserManager";
import { UserContext } from "./api/calls";
import { useNavigation } from "@react-navigation/native";
import TopBar from "./TopBar";
import { colors, card } from "./theme";

const LAST_SEEN_NOTIFICATION_KEY = "@last_seen_notification";

const currency = (n) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const HomeTT = ({ route }) => {
  const [role, setRole] = useState("");
  const [userIDState, setUserIDState] = useState("");
  const [allNotifications, setAllNotifications] = useState([]);
  const [items, setItems] = useState([]);
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
      const eventsCollectionRef = collection(db, "Calendar2024");
      const querySnapshot = await getDocs(eventsCollectionRef);
      const fetchedItems = [];

      querySnapshot.forEach((docSnap) => {
        const docData = docSnap.data();
        Object.keys(docData).forEach((date) => {
          const events = docData[date].events;
          events.forEach((event) => {
            let timeString = event.time || "12:00 AM";
            const [time, period] = timeString.split(" ");
            let [hours, minutes] = time.split(":").map(Number);

            if (period === "PM" && hours !== 12) {
              hours += 12;
            } else if (period === "AM" && hours === 12) {
              hours = 0;
            }

            const [year, month, day] = date.split("-").map(Number);

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
                  time: event.time || "",
                  title: event.title,
                  description: event.description,
                  location: event.location,
                  datetime: eventDate,
                  picture: event.picture,
                });
              }
            }
          });
        });
      });

      fetchedItems.sort((a, b) => a.datetime - b.datetime);
      setItems(fetchedItems.slice(0, 3));

      fetchedItems.slice(0, 3).forEach((item) => {
        if (item.picture) {
          fetchImageUrl(item.picture);
        }
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      setItems([]);
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
        <View style={[card, styles.eventsCard]}>
          {items.length > 0 ? (
            items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.eventRow,
                  index < items.length - 1 && styles.eventRowDivider,
                ]}
              >
                <View style={styles.dateBlock}>
                  <Text style={styles.dateDay}>
                    {item.datetime.getDate()}
                  </Text>
                  <Text style={styles.dateMonth}>
                    {item.datetime
                      .toLocaleString("en-US", { month: "short" })
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.eventMeta} numberOfLines={1}>
                    {item.time ? `${item.time}` : ""}
                    {item.location ? ` · ${item.location}` : ""}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noEvents}>No upcoming events</Text>
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

export default HomeTT;

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
  eventsCard: {
    padding: 12,
    marginBottom: 20,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  eventRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  dateBlock: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateDay: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "800",
  },
  dateMonth: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  eventMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  noEvents: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 12,
    textAlign: "center",
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
