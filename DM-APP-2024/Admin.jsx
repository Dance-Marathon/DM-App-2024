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
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faChildCombatant } from "@fortawesome/free-solid-svg-icons";
import { useNavigation } from "@react-navigation/native";

import { addUserExpoPushToken } from "./Firebase/AuthManager";
import TopBar from "./TopBar";
import { colors, card } from "./theme";

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

// async function sendPushNotificationsToAll(expoPushTokens, notification) {
//   console.log("Sending notifications...");
//   const messages = [];

//   for (const token of expoPushTokens) {
//     messages.push({
//       to: token,
//       sound: "default",
//       title: notification.title,
//       body: notification.message,
//       //data: { someData: 'goes here' },
//     });

//     console.log(token);
//   }
//   for (const message of messages) {
//     //console.log(`Sending to token: ${message.to}`);
//     await fetch("https://exp.host/--/api/v2/push/send", {
//       method: "POST",
//       headers: {
//         Accept: "application/json",
//         "Accept-encoding": "gzip, deflate",
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(message),
//     });
//   }
// }

async function sendPushNotificationsToAll(expoPushTokens, notification) {
  console.log("Sending notifications...");

  const batchSize = 50;
  let messages = [];

  for (const token of expoPushTokens) {
    if (!token || token.trim() === "") {
      console.warn("Skipping empty or invalid token:", token);
      continue;
    }

    messages.push({
      to: token,
      sound: "default",
      title: notification.title,
      body: notification.message,
    });

    console.log(`Added token: ${token}`);

    if (messages.length >= batchSize) {
      await sendBatch(messages);
      messages = [];
    }
  }

  if (messages.length > 0) {
    await sendBatch(messages);
  }
}

async function sendBatch(batch) {
  if (batch.length === 0) {
    console.warn("Skipping empty batch.");
    return;
  }

  try {
    console.log(`Sending batch of ${batch.length} notifications...`);

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
    });

    const json = await response.json();
    console.log("Expo response:", JSON.stringify(json, null, 2));

    if (json.data) {
      json.data.forEach((result, index) => {
        if (result.status === "error") {
          console.error(`Error sending to ${batch[index].to}:`, result.message);
        }
      });
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
}

async function sendPushNotification(expoPushToken, notification) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: notification.title,
    body: notification.message,
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Convert month to 2 digits
  const day = date.getDate().toString().padStart(2, "0"); // Convert day to 2 digits
  return `${year}-${month}-${day}`;
}

function getCurrentTime() {
  const date = new Date();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = hours.toString().padStart(2, "0"); // Convert hours to 2 digits
  return `${hours}:${minutes} ${ampm}`;
}

const Admin = ({ route }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [allowedRoles, setAllowedRoles] = useState([]);
  const [teamBasedPermissions, setTeamBasedPermissions] = useState({});
  const [newRole, setNewRole] = useState("");
  const [newTeamRole, setNewTeamRole] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const navigation = useNavigation();
  const { expoPushToken } = route.params;

  useEffect(() => {
    const fetchPermissions = async () => {
      const docRef = doc(db, "Permissions", "ScannerAccess");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAllowedRoles(data.allowedRoles || []);
        setTeamBasedPermissions(data.teamBasedPermissions || {});
      }
    };
    fetchPermissions();
  }, []);

  useEffect(() => {
    const fetchEnrolled = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, "Users", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEnrolled(!!docSnap.data().inMissionDM);
      }
    };
    fetchEnrolled();
  }, []);

  const updatePermissions = async () => {
    const docRef = doc(db, "Permissions", "ScannerAccess");
    await updateDoc(docRef, {
      allowedRoles,
      teamBasedPermissions,
    });
    Alert.alert("Success", "Permissions updated successfully!");
  };

  const addTeamPermission = () => {
    const role = newTeamRole.trim();
    const team = newTeam.trim();

    if (!role || !team) {
      Alert.alert(
        "Missing info",
        "Enter both a role and a team before adding.",
      );
      return;
    }

    setTeamBasedPermissions((prev) => ({
      ...prev,
      [role]: [...(prev[role] || []), team],
    }));
    setNewTeamRole("");
    setNewTeam("");
  };

  const removeTeamPermission = (role, team) => {
    setTeamBasedPermissions((prev) => ({
      ...prev,
      [role]: prev[role].filter((t) => t !== team),
    }));
  };

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

  // let handleClick = async () => {
  //   fetchItems = await fetchData();
  //   // sendPushNotificationsToAll(fetchItems, {
  //   //   date: getCurrentDate(),
  //   //   message: message,
  //   //   time: getCurrentTime(),
  //   //   title: title,
  //   // })
  //   //   .then(() => {
  //   //     console.log("All notifications sent!");
  //   //   })
  //   //   .catch((error) => {
  //   //     console.error("Error sending notifications:", error);
  //   //   });
  //   sendPushNotification("ExponentPushToken[nVKGsGBm_XBGtyK2UEZ30w]", {
  //     date: getCurrentDate(),
  //     message: message,
  //     time: getCurrentTime(),
  //     title: title,
  //   });
  //   await addNotification({
  //     date: getCurrentDate(),
  //     message: message,
  //     time: getCurrentTime(),
  //     title: title,
  //   });
  //   setTitle("");
  //   setMessage("");
  // };

  let handleClick = async () => {
    try {
      const tokens = await fetchData();

      if (!tokens || tokens.length === 0) {
        Alert.alert("Error", "No valid tokens found!");
        return;
      }

      console.log(`📬 Sending to ${tokens.length} users...`);

      await sendPushNotificationsToAll(tokens, {
        date: getCurrentDate(),
        message: message,
        time: getCurrentTime(),
        title: title,
      });

      // sendPushNotification("ExponentPushToken[nVKGsGBm_XBGtyK2UEZ30w]", {
      //   date: getCurrentDate(),
      //   message: message,
      //   time: getCurrentTime(),
      //   title: title,
      // });

      await addNotification({
        date: getCurrentDate(),
        message: message,
        time: getCurrentTime(),
        title: title,
      });

      console.log("✅ All notifications sent!");
      setTitle("");
      setMessage("");
      Alert.alert("Success", "Notification sent successfully!");
    } catch (error) {
      console.error("Error sending notifications:", error);
      Alert.alert("Error", "Failed to send notification. Check console logs.");
    }
  };

  const confirmSend = () => {
    Alert.alert(
      "Send Notification",
      "Are you sure you want to send this notification?",
      [
        // The "Yes" button
        { text: "Yes", onPress: () => handleClick() },
        // The "No" button
        { text: "No", style: "cancel" },
      ],
      { cancelable: false },
    );
  };

  return (
    <View style={styles.screen}>
      <TopBar />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[card, styles.notificationsBox]}>
          <View style={styles.header}>
            <View style={styles.smallCircle} />
            <Text style={styles.headerText}>NOTIFICATIONS</Text>
            {enrolled && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                }}
                onPress={() => navigation.navigate("MissionDM Admin")}
              >
                <FontAwesomeIcon
                  icon={faChildCombatant}
                  color={colors.navy}
                  size={20}
                />
              </TouchableOpacity>
            )}
          </View>
          <View>
            <Text style={[styles.sectionTitle, { marginTop: 5 }]}>Title</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setTitle(text)}
              placeholder="Enter title here..."
              autoCapitalize="none"
              value={title}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.sectionTitle}>Message</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setMessage(text)}
              placeholder="Enter message here..."
              autoCapitalize="none"
              value={message}
              multiline={true}
              // numberOfLines={4}
              placeholderTextColor={colors.textMuted}
              maxLength={160}
            />
            <Text style={styles.charCount}>
              {message.length}/160
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                alignSelf: "flex-end",
                marginRight: 10,
                marginTop: 5,
                marginBottom: 10,
              },
            ]}
            onPress={confirmSend}
          >
            <Text style={styles.sendMessage}>Send</Text>
          </TouchableOpacity>
        </View>

        <View style={[card, styles.permsBox]}>
          <View style={styles.header}>
            <View style={styles.smallCircle} />
            <Text style={styles.headerText}>SCANNER PERMISSIONS</Text>
          </View>
          <ScrollView
            style={[styles.currentPermissions, { maxHeight: 160 }]}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.subHeader, { marginTop: -5 }]}>
              Currently Selected Roles:
            </Text>
            {allowedRoles.map((item, index) => (
              <Text key={`${item}-${index}`} style={styles.textItem}>- {item}</Text>
            ))}
            <Text style={[styles.subHeader, { marginTop: 10 }]}>
              Team-Based Permissions:
            </Text>
            {Object.entries(teamBasedPermissions).map(([role, teams]) => (
              <View key={role} style={styles.teamSection}>
                <Text style={styles.textItem}>{role}:</Text>
                {teams.map((team, index) => (
                  <Text
                    key={`${role}-${team}-${index}`}
                    style={styles.textItem}
                  >
                    - {team}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[
              styles.accessButton,
              {
                alignSelf: "flex-end",
                marginRight: 10,
                marginTop: 5,
                marginBottom: 10,
              },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.accessMessage}>Manage Access</Text>
          </TouchableOpacity>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.smallCircle} />
                <Text style={styles.headerText}>MANAGE ACCESS</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <Text style={styles.subHeader}>Currently Selected Roles:</Text>
                {allowedRoles.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.modalRow}>
                    <Text style={styles.textItem}>- {item}</Text>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() =>
                        setAllowedRoles((prev) =>
                          prev.filter((role) => role !== item),
                        )
                      }
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.modalInputRow}>
                  <TextInput
                    style={styles.modalInput}
                    value={newRole}
                    onChangeText={setNewRole}
                    placeholder="New role..."
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.modalAddBtn}
                    onPress={() => {
                      if (newRole) setAllowedRoles([...allowedRoles, newRole]);
                      setNewRole("");
                    }}
                  >
                    <Text style={styles.modalBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalDivider} />

                <Text style={styles.subHeader}>Team-Based Permissions:</Text>
                {Object.keys(teamBasedPermissions).map((role) => (
                  <View key={role} style={styles.teamSection}>
                    <Text style={styles.textItem}>{role}:</Text>
                    {teamBasedPermissions[role].map((team, index) => (
                      <View
                        key={`${role}-${team}-${index}`}
                        style={styles.modalRow}
                      >
                        <Text style={styles.textItem}>- {team}</Text>
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeTeamPermission(role, team)}
                        >
                          <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}
                <TextInput
                  style={styles.modalInput}
                  value={newTeamRole}
                  onChangeText={setNewTeamRole}
                  placeholder="Role (e.g., Assistant Director)"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.modalInput, { marginTop: 8 }]}
                  value={newTeam}
                  onChangeText={setNewTeam}
                  placeholder="Team (e.g., Recruitment)"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  style={[styles.accessButton, { alignSelf: "flex-end", marginTop: 8 }]}
                  onPress={addTeamPermission}
                >
                  <Text style={styles.accessMessage}>Add Team</Text>
                </TouchableOpacity>

                <View style={styles.modalDivider} />

                <TouchableOpacity
                  style={[styles.accessButton, { alignSelf: "flex-end" }]}
                  onPress={updatePermissions}
                >
                  <Text style={styles.accessMessage}>Save Changes</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
};
export default Admin;

const eventItemWidth = Dimensions.get("window").width * 0.9;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  screenContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  input: {
    minHeight: 40,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    marginBottom: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
    width: "95%",
    left: 10,
    color: colors.text,
  },
  charCount: {
    color: colors.textMuted,
    textAlign: "right",
    marginRight: 15,
  },
  topText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
    margin: 10,
  },
  teamSection: {
    marginVertical: 10,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 5,
  },
  currentPermissions: {
    padding: 10,
    marginBottom: 20,
    width: "100%",
  },
  textItem: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationsBox: {
    width: 340,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: 15,
    flex: 1,
    marginLeft: 8,
  },
  smallCircle: {
    width: 12,
    height: 12,
    borderRadius: 50,
    backgroundColor: colors.orange,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "bold",
    left: 10,
  },
  sendButton: {
    borderRadius: 10,
    backgroundColor: colors.orange,
    width: 80,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendMessage: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  permsBox: {
    width: 340,
    marginTop: 16,
    padding: 16,
  },
  accessButton: {
    borderRadius: 10,
    backgroundColor: colors.orange,
    width: 160,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  accessMessage: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 340,
    maxHeight: "78%",
    backgroundColor: "white",
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    paddingTop: 12,
    paddingHorizontal: 14,
  },
  modalCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  modalCloseBtnText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "bold",
  },
  modalScrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  modalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  modalInput: {
    flex: 1,
    height: 40,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.pageBackground,
    color: colors.text,
    fontSize: 14,
  },
  modalAddBtn: {
    borderRadius: 10,
    backgroundColor: colors.orange,
    height: 40,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 12,
  },
  removeBtn: {
    backgroundColor: colors.danger,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  removeBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
