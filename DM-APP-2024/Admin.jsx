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

import { addUserExpoPushToken } from "./Firebase/AuthManager";

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

  const updatePermissions = async () => {
    const docRef = doc(db, "Permissions", "ScannerAccess");
    await updateDoc(docRef, {
      allowedRoles,
      teamBasedPermissions,
    });
    Alert.alert("Success", "Permissions updated successfully!");
  };

  const addTeamPermission = () => {
    if (newTeamRole && newTeam) {
      setTeamBasedPermissions((prev) => ({
        ...prev,
        [newTeamRole]: [...(prev[newTeamRole] || []), newTeam],
      }));
      setNewTeamRole("");
      setNewTeam("");
    }
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

  let handleClick = async () => {
    fetchItems = await fetchData();
    sendPushNotificationsToAll(fetchItems, {
      date: getCurrentDate(),
      message: message,
      time: getCurrentTime(),
      title: title,
    })
      .then(() => {
        console.log("All notifications sent!");
      })
      .catch((error) => {
        console.error("Error sending notifications:", error);
      });
    // sendPushNotification("ExponentPushToken[QYYQuGIxjfZXo1OpP86uhe]", {
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
    setTitle("");
    setMessage("");
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
      { cancelable: false }
    );
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <View style={styles.notificationsBox}>
        <View style={styles.header}>
          <View style={styles.smallCircle} />
          <Text style={styles.headerText}>NOTIFICATIONS</Text>
        </View>
        <View>
          <Text style={[styles.sectionTitle, { marginTop: 5 }]}>Title</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setTitle(text)}
            placeholder="Enter title here..."
            autoCapitalize="none"
            value={title}
            placeholderTextColor="white"
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
            placeholderTextColor="white"
          />
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

      <View style={styles.permsBox}>
        <View style={styles.header}>
          <View style={styles.smallCircle} />
          <Text style={styles.headerText}>SCANNER PERMISSIONS</Text>
        </View>
        <View style={styles.currentPermissions}>
          <Text style={[styles.subHeader, { marginTop: -5 }]}>
            Currently Selected Roles:
          </Text>
          <FlatList
            data={allowedRoles}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item }) => (
              <Text style={styles.textItem}>- {item}</Text>
            )}
          />
          <Text style={[styles.subHeader, { marginTop: 10 }]}>
            Team-Based Permissions:
          </Text>
          {Object.entries(teamBasedPermissions).map(([role, teams]) => (
            <View key={role} style={styles.teamSection}>
              <Text style={styles.textItem}>{role}:</Text>
              {teams.map((team, index) => (
                <Text key={`${role}-${team}-${index}`} style={styles.textItem}>
                  - {team}
                </Text>
              ))}
            </View>
          ))}
        </View>
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
            <Text style={styles.sectionTitle}>Allowed Roles</Text>
            <FlatList
              data={allowedRoles}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <Text style={styles.textItem}>{item}</Text>
                  <Button
                    title="Remove"
                    onPress={() =>
                      setAllowedRoles((prev) =>
                        prev.filter((role) => role !== item)
                      )
                    }
                  />
                </View>
              )}
            />
            <TextInput
              style={styles.input}
              value={newRole}
              onChangeText={setNewRole}
              placeholder="Add Role"
            />
            <Button
              title="Add Role"
              onPress={() => {
                if (newRole) setAllowedRoles([...allowedRoles, newRole]);
                setNewRole("");
              }}
            />

            <Text style={styles.sectionTitle}>Team-Based Permissions</Text>
            {Object.keys(teamBasedPermissions).map((role) => (
              <View key={role} style={styles.teamSection}>
                <Text style={styles.subHeader}>{role}</Text>
                {teamBasedPermissions[role].map((team, index) => (
                  <View
                    key={`${role}-${team}-${index}`}
                    style={styles.listItem}
                  >
                    <Text style={styles.textItem}>{team}</Text>
                    <Button
                      title="Remove"
                      onPress={() => removeTeamPermission(role, team)}
                    />
                  </View>
                ))}
              </View>
            ))}
            <TextInput
              style={styles.input}
              value={newTeamRole}
              onChangeText={setNewTeamRole}
              placeholder="Role (e.g., Assistant Director)"
            />
            <TextInput
              style={styles.input}
              value={newTeam}
              onChangeText={setNewTeam}
              placeholder="Team (e.g., Recruitment)"
            />
            <Button title="Add Team Permission" onPress={addTeamPermission} />

            <Button title="Save Changes" onPress={updatePermissions} />
            <Button
              title="Close"
              onPress={() => setModalVisible(false)}
              color="#FF6347"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default Admin;

const eventItemWidth = Dimensions.get("window").width * 0.9;

const styles = StyleSheet.create({
  input: {
    minHeight: 40,
    borderColor: "white",
    borderWidth: 1,
    marginBottom: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#1F1F1F",
    width: "95%",
    left: 10,
    color: "white",
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
    width: "100%",
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
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
    color: "white",
  },
  teamSection: {
    marginVertical: 10,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginTop: 5,
  },
  currentPermissions: {
    padding: 10,
    marginBottom: 20,
    width: "100%",
  },
  textItem: {
    fontSize: 14,
    color: "white",
  },
  notificationsBox: {
    top: 30,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: 340,
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
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
  smallCircle: {
    width: 15,
    height: 15,
    borderRadius: 50,
    backgroundColor: "#EB9F68",
  },
  sectionTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    left: 10,
    // marginTop: 10,
    // marginBottom: 5,
  },
  sendButton: {
    borderRadius: 10,
    backgroundColor: "#f18221",
    width: 80,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendMessage: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: "#fff",
    position: "absolute",
  },
  permsBox: {
    top: 260,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: 340,
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
  accessButton: {
    borderRadius: 10,
    backgroundColor: "#f18221",
    width: 160,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  accessMessage: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    fontWeight: "700",
    color: "#fff",
    position: "absolute",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "#233D72",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
  },
});
