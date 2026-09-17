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

import axios from "axios";
import { addUserExpoPushToken } from "./Firebase/AuthManager";
import { getUserInfo } from "./api/index";
import getAccessToken from "./api/googleAuth";
import TopBar from "./TopBar";
import { colors, card } from "./theme";

// DonorDrive's bot protection is far more likely to trigger on a burst of
// simultaneous requests than on a steady trickle — same reasoning as the
// team-member throttling in FundraiserTeam.jsx.
const mapWithThrottle = async (items, mapper, batchSize = 3, delayMs = 400) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(mapper))));
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return results;
};

// Refreshes every linked user's organization/displayName from DonorDrive,
// and gives anyone who's never been scanned a spiritPoints field to start
// from. Safe to run repeatedly — an existing spiritPoints value (meaning
// someone has real earned points) is never overwritten.
const refreshOrganizationsForAllUsers = async () => {
  const snapshot = await getDocs(collection(db, "Users"));
  const usersWithDonorID = snapshot.docs.filter((docSnap) => docSnap.data().donorID);

  let updated = 0;
  let skipped = 0;

  await mapWithThrottle(usersWithDonorID, async (docSnap) => {
    const data = docSnap.data();
    try {
      const donorInfo = await getUserInfo(data.donorID);
      const updates = {};

      if (donorInfo?.teamName) updates.organization = donorInfo.teamName;
      if (donorInfo?.displayName) updates.displayName = donorInfo.displayName;
      if (data.spiritPoints === undefined) updates.spiritPoints = 0;

      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "Users", docSnap.id), updates);
        updated += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      console.error(`Error refreshing organization for user ${docSnap.id}:`, error);
      skipped += 1;
    }
  });

  return { updated, skipped, total: usersWithDonorID.length };
};

const SPIRIT_TRACKER_SPREADSHEET_ID = "1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY";

const clearAndWriteSheet = async (token, tabName, rows) => {
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  await axios.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPIRIT_TRACKER_SPREADSHEET_ID}/values/${tabName}!A1:Z2000:clear`,
    {},
    { headers }
  );

  await axios.put(
    `https://sheets.googleapis.com/v4/spreadsheets/${SPIRIT_TRACKER_SPREADSHEET_ID}/values/${tabName}!A1?valueInputOption=RAW`,
    { values: rows },
    { headers }
  );
};

// Builds rows for a "group + member breakdown" tab: one summary row per
// group (name + total, columns A/B) followed by one row per contributing
// member (name + points, columns C/D), sorted by total descending.
const buildGroupBreakdownRows = (groupLabel, groupTotals, membersByGroup) => {
  const rows = [[groupLabel, `${groupLabel} Total`, "Member", "Member Points"]];

  Object.entries(groupTotals)
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, total]) => {
      rows.push([name, total, "", ""]);
      (membersByGroup[name] || [])
        .sort((a, b) => b[1] - a[1])
        .forEach(([memberName, points]) => {
          rows.push([name, "", memberName, points]);
        });
    });

  return rows;
};

const exportSpiritPointsToSheets = async () => {
  const snapshot = await getDocs(collection(db, "Users"));

  const orgTotals = {};
  const orgMembers = {};
  const captainTotals = {};
  const captainMembers = {};
  const individuals = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const points = Number(data.spiritPoints) || 0;
    const name = data.displayName;

    if (name && points > 0) {
      individuals.push([name, points]);
    }

    if (data.organization) {
      orgTotals[data.organization] = (orgTotals[data.organization] || 0) + points;
      if (name && points > 0) {
        orgMembers[data.organization] = orgMembers[data.organization] || [];
        orgMembers[data.organization].push([name, points]);
      }
    }

    if (data.captainTeam && data.captainTeam !== "N/A") {
      captainTotals[data.captainTeam] = (captainTotals[data.captainTeam] || 0) + points;
      if (name && points > 0) {
        captainMembers[data.captainTeam] = captainMembers[data.captainTeam] || [];
        captainMembers[data.captainTeam].push([name, points]);
      }
    }
  });

  const token = await getAccessToken();

  const individualRows = [
    ["Rank", "Name", "Points"],
    ...individuals
      .sort((a, b) => b[1] - a[1])
      .map(([name, points], index) => [index + 1, name, points]),
  ];

  await clearAndWriteSheet(token, "Sheet2", individualRows);
  await clearAndWriteSheet(
    token,
    "Sheet1",
    buildGroupBreakdownRows("Organization", orgTotals, orgMembers)
  );
  await clearAndWriteSheet(
    token,
    "Sheet3",
    buildGroupBreakdownRows("Captain Team", captainTotals, captainMembers)
  );
};

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
  const [isRefreshingOrgs, setIsRefreshingOrgs] = useState(false);
  const [isExportingSheets, setIsExportingSheets] = useState(false);

  const handleExportSpiritPoints = async () => {
    setIsExportingSheets(true);
    try {
      await exportSpiritPointsToSheets();
      Alert.alert(
        "Export Complete",
        "Spirit Points Tracker has been updated with the latest standings."
      );
    } catch (error) {
      console.error("Error exporting spirit points to Sheets:", error);
      Alert.alert("Error", "Failed to export to Sheets. Check console logs.");
    } finally {
      setIsExportingSheets(false);
    }
  };

  const handleRefreshOrganizations = async () => {
    setIsRefreshingOrgs(true);
    try {
      const { updated, skipped, total } = await refreshOrganizationsForAllUsers();
      Alert.alert(
        "Spirit Points Refresh Complete",
        `Checked ${total} linked users.\nUpdated: ${updated}\nSkipped/unchanged: ${skipped}`
      );
    } catch (error) {
      console.error("Error refreshing organizations:", error);
      Alert.alert("Error", "Failed to refresh organizations. Check console logs.");
    } finally {
      setIsRefreshingOrgs(false);
    }
  };

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

        <View style={[card, styles.spiritPointsBox]}>
          <View style={styles.header}>
            <View style={styles.smallCircle} />
            <Text style={styles.headerText}>SPIRIT POINTS</Text>
          </View>
          <Text style={styles.spiritPointsDescription}>
            Refreshes every linked user's organization and name from
            DonorDrive, and starts anyone new at 0 points. Safe to run
            anytime — existing point totals are never reset.
          </Text>
          <TouchableOpacity
            style={[
              styles.accessButton,
              {
                alignSelf: "flex-end",
                width: 220,
                opacity: isRefreshingOrgs ? 0.6 : 1,
              },
            ]}
            onPress={handleRefreshOrganizations}
            disabled={isRefreshingOrgs}
          >
            <Text style={styles.accessMessage}>
              {isRefreshingOrgs ? "Refreshing..." : "Refresh Organizations"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.spiritPointsDescription, { marginTop: 12 }]}>
            Exports the current standings (individuals, organizations, and
            captain teams, each with a member breakdown) to the Spirit Point
            Tracker spreadsheet. Overwrites whatever's currently in it.
          </Text>
          <TouchableOpacity
            style={[
              styles.accessButton,
              {
                alignSelf: "flex-end",
                width: 220,
                opacity: isExportingSheets ? 0.6 : 1,
              },
            ]}
            onPress={handleExportSpiritPoints}
            disabled={isExportingSheets}
          >
            <Text style={styles.accessMessage}>
              {isExportingSheets ? "Exporting..." : "Export to Sheets"}
            </Text>
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
  spiritPointsBox: {
    width: 340,
    marginTop: 16,
    padding: 16,
  },
  spiritPointsDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
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
