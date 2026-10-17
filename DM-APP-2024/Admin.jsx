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
import { addUserExpoPushToken, extractParticipantID } from "./Firebase/AuthManager";
import { getUserInfo, getDonorDriveBlockedUntil } from "./api/index";
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
// backfills a couple of fields for older accounts, and gives anyone who's
// never been scanned a spiritPoints field to start from. Safe to run
// repeatedly and never overwrites a field someone already has:
//   - donorID: only filled in when missing, by re-deriving it from the
//     user's saved donorLink. A donorID that's already set is left alone.
//   - captainTeam: only added (as "") when the field doesn't exist at all —
//     even an existing captainTeam of "" counts as "already has one".
//   - spiritPoints: only added (as 0) when the field doesn't exist, same as
//     before.
const refreshOrganizationsForAllUsers = async () => {
  const snapshot = await getDocs(collection(db, "Users"));

  let updated = 0;
  let skipped = 0;
  let donorIDsFilled = 0;
  let captainTeamsAdded = 0;
  let donorDriveSkippedCount = 0;
  // Logged once, the first time the loop notices DonorDrive is blocked —
  // without this, a 1300+ user run that trips the rate limit early used to
  // log one "Error refreshing DonorDrive info" line for every single
  // remaining user (reported as "1900 errors"), even though the circuit
  // breaker in api/index.js was already correctly skipping the network call
  // for every one of them.
  let loggedRateLimitSkip = false;

  await mapWithThrottle(snapshot.docs, async (docSnap) => {
    const data = docSnap.data();
    const updates = {};

    // Backfill donorID from donorLink for older accounts that only ever got
    // the link saved. Never touches a donorID that's already set.
    let donorID = data.donorID;
    if (!donorID && data.donorLink) {
      const derivedID = extractParticipantID(data.donorLink);
      if (derivedID) {
        updates.donorID = derivedID;
        donorID = derivedID;
        donorIDsFilled += 1;
      }
    }

    if (!("captainTeam" in data)) {
      updates.captainTeam = "";
      captainTeamsAdded += 1;
    }

    if (data.spiritPoints === undefined) updates.spiritPoints = 0;

    if (donorID) {
      if (getDonorDriveBlockedUntil()) {
        // Don't even attempt it — these local-field backfills above still
        // get saved below, just without the DonorDrive-sourced fields.
        donorDriveSkippedCount += 1;
        if (!loggedRateLimitSkip) {
          loggedRateLimitSkip = true;
          console.log(
            "DonorDrive is rate-limited — skipping its lookup for the rest of this run (local field backfills still proceed)."
          );
        }
      } else {
        try {
          const donorInfo = await getUserInfo(donorID);
          if (donorInfo?.teamName) updates.organization = donorInfo.teamName;
          if (donorInfo?.displayName) updates.displayName = donorInfo.displayName;
          // Same field the Team/Organization tabs now read instead of
          // calling DonorDrive live per member — this is also how existing
          // users get it backfilled immediately rather than waiting on
          // their next Personal tab visit.
          updates.sumDonations = donorInfo?.sumDonations || 0;
        } catch (error) {
          donorDriveSkippedCount += 1;
          console.error(`Error refreshing DonorDrive info for user ${docSnap.id}:`, error);
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      try {
        await updateDoc(doc(db, "Users", docSnap.id), updates);
        updated += 1;
      } catch (error) {
        console.error(`Error saving updates for user ${docSnap.id}:`, error);
        skipped += 1;
      }
    } else {
      skipped += 1;
    }
  });

  return {
    updated,
    skipped,
    total: snapshot.docs.length,
    donorIDsFilled,
    captainTeamsAdded,
    donorDriveSkippedCount,
  };
};

// Seed source only — the app's own runtime team-lookup (once built) reads
// from the colorTeams Firestore collection this writes to, never from this
// constant directly, so the mapping stays changeable without an app update.
// Comparison against orgs is case-insensitive and trimmed.
const COLOR_TEAM_SEED_DATA = [
  {
    id: "Red",
    color: "#E06666",
    textColor: "white",
    orgs: [
      "Pi Kappa Phi", "Kappa Alpha Order", "Pi Beta Phi", "Kappa Phi Epsilon",
      "AMSA", "Florida Eta Phi Delta Epsilon", "Chi Phi", "Gamma Phi Beta", "Kappa Delta",
      "Alpha Phi", "Zeta Beta Tau", "Kappa Kappa Gamma",
    ],
  },
  {
    id: "Yellow",
    color: "#F5E08A",
    textColor: "white",
    orgs: [
      "Pi Lambda Phi", "Delta Chi", "Alpha Delta Pi", "Theta Chi",
      "Delta Zeta", "Phi Mu", "Delta Tau Delta", "Delta Sigma Phi",
      "Chi Omega", "Gamma Eta", "Alpha Omicron Pi",
    ],
  },
  {
    id: "Blue",
    color: "#6FA8DC",
    textColor: "white",
    orgs: [
      "Tau Epsilon Phi", "Hispanic-Latine Student Association", "Team Hope", "Delta Delta Delta",
      "Alpha Epsilon Phi", "Pi Kappa Alpha", "Phi Kappa Tau", "Alpha Chi Omega",
    ],
  },
  {
    id: "Purple",
    color: "#8E7CC3",
    textColor: "white",
    orgs: [
      "Delta Nu Zeta", "Beta Theta Pi", "Alpha Tau Omega", "Phi Gamma Delta",
      "Sigma Kappa", "Sigma Phi Epsilon", "Kappa Alpha Theta", "UF Club Baseball",
      "Zeta Tau Alpha", "Alpha Epsilon Pi", "Delta Gamma", "Delta Phi Epsilon",
    ],
  },
];

const normalizeOrgName = (name) => (name || "").trim().toLowerCase();

// Read-only — makes no Firestore writes. Pulls every distinct, non-empty
// `organization` value actually in use (from the signed-in admin's own
// session, same as every other admin read in this file) and compares it
// against COLOR_TEAM_SEED_DATA's org lists, case-insensitive and trimmed.
const checkColorTeamOrgMatches = async () => {
  const snapshot = await getDocs(collection(db, "Users"));
  const liveOrgsByNormalized = new Map(); // normalized -> original casing seen
  snapshot.forEach((docSnap) => {
    const org = docSnap.data().organization;
    if (org && org.trim()) {
      liveOrgsByNormalized.set(normalizeOrgName(org), org.trim());
    }
  });

  const seedNormalizedToOriginal = new Map();
  COLOR_TEAM_SEED_DATA.forEach((team) => {
    team.orgs.forEach((org) => {
      seedNormalizedToOriginal.set(normalizeOrgName(org), org);
    });
  });

  // Seed names with no live user currently on that org — not necessarily
  // wrong (could just mean nobody from that org has linked DonorDrive yet),
  // but worth a human glance for typos.
  const seedWithNoLiveMatch = [...seedNormalizedToOriginal.entries()]
    .filter(([norm]) => !liveOrgsByNormalized.has(norm))
    .map(([, original]) => original);

  // Live org values that don't match ANY seed list — these users would
  // default to Blue Team. Worth reviewing for near-miss spelling especially.
  const liveWithNoSeedMatch = [...liveOrgsByNormalized.entries()]
    .filter(([norm]) => !seedNormalizedToOriginal.has(norm))
    .map(([, original]) => original)
    .sort();

  return { seedWithNoLiveMatch, liveWithNoSeedMatch };
};

// Overwrites all four colorTeams docs completely (setDoc, not merge) — safe
// to re-run any time the seed lists above change; never touches
// Permissions/tempData.colorTeamsEnabled, so re-running this can't
// accidentally turn the feature on.
const seedColorTeamsData = async () => {
  for (const team of COLOR_TEAM_SEED_DATA) {
    await setDoc(doc(db, "colorTeams", team.id), {
      color: team.color,
      textColor: team.textColor,
      orgs: team.orgs,
    });
  }
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

  // Tab names match the actual tabs in the Spirit Point Tracker sheet. These
  // used to be the spreadsheet's default "Sheet1"/"Sheet2"/"Sheet3" names;
  // the tabs were renamed at some point and this fell out of sync, so every
  // export was failing with "Unable to parse range: Sheet2!A1:Z2000" (the
  // write code was never wrong, just pointed at tabs that no longer exist).
  await clearAndWriteSheet(token, "Individual", individualRows);
  await clearAndWriteSheet(
    token,
    "Organization",
    buildGroupBreakdownRows("Organization", orgTotals, orgMembers)
  );
  await clearAndWriteSheet(
    token,
    "Captain Team",
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
      // Not shown in the push bubble — just lets a tap find its way back to
      // this exact notification. See openNotificationFromPush in App.jsx.
      data: { notificationId: notification.id },
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
  const [link, setLink] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [colorTeamsEnabled, setColorTeamsEnabledState] = useState(null); // null = not loaded yet
  const [isCheckingOrgMatches, setIsCheckingOrgMatches] = useState(false);
  const [isSeedingColorTeams, setIsSeedingColorTeams] = useState(false);
  const [isTogglingColorTeams, setIsTogglingColorTeams] = useState(false);
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
      const {
        updated,
        skipped,
        total,
        donorIDsFilled,
        captainTeamsAdded,
        donorDriveSkippedCount,
      } = await refreshOrganizationsForAllUsers();
      const rateLimitNote =
        donorDriveSkippedCount > 0
          ? `\n\nDonorDrive's rate limit was hit partway through — ${donorDriveSkippedCount} user${donorDriveSkippedCount === 1 ? "" : "s"} didn't get fresh organization/name/total data this run (local fields like captain team were still backfilled for everyone). Run this again later to pick up the rest.`
          : "";
      Alert.alert(
        "Spirit Points Refresh Complete",
        `Checked ${total} users.\nUpdated: ${updated}\nSkipped/unchanged: ${skipped}\nDonorDrive IDs filled in: ${donorIDsFilled}\nCaptain team fields added: ${captainTeamsAdded}${rateLimitNote}`
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

  // Same Permissions/tempData document missionDmEnabled/transformtoday/
  // mainevent/kill already live on — just reading its current value here to
  // display and toggle it, not a live subscription (App.jsx already has the
  // real one that actually gates app behavior).
  useEffect(() => {
    const fetchColorTeamsFlag = async () => {
      const docSnap = await getDoc(doc(db, "Permissions", "tempData"));
      setColorTeamsEnabledState(!!docSnap.data()?.colorTeamsEnabled);
    };
    fetchColorTeamsFlag();
  }, []);

  const handleCheckOrgMatches = async () => {
    setIsCheckingOrgMatches(true);
    try {
      const { seedWithNoLiveMatch, liveWithNoSeedMatch } =
        await checkColorTeamOrgMatches();
      console.log("Color team org check — seed names with no live match:", seedWithNoLiveMatch);
      console.log("Color team org check — live orgs matching no team (default to Blue):", liveWithNoSeedMatch);

      const lines = [];
      lines.push(
        seedWithNoLiveMatch.length === 0
          ? "Every org in your four lists matches at least one real user."
          : `${seedWithNoLiveMatch.length} org name${seedWithNoLiveMatch.length === 1 ? "" : "s"} in your lists have no matching user yet:\n${seedWithNoLiveMatch.join(", ")}`
      );
      lines.push("");
      lines.push(
        liveWithNoSeedMatch.length === 0
          ? "No real org names fall outside your four lists."
          : `${liveWithNoSeedMatch.length} real org${liveWithNoSeedMatch.length === 1 ? "" : "s"} match none of your four lists (will default to Blue Team):\n${liveWithNoSeedMatch.join(", ")}`
      );
      Alert.alert("Color Team Org Check", lines.join("\n"));
    } catch (error) {
      console.error("Error checking color team org matches:", error);
      Alert.alert("Error", "Failed to check org matches. Check console logs.");
    } finally {
      setIsCheckingOrgMatches(false);
    }
  };

  const handleSeedColorTeams = async () => {
    setIsSeedingColorTeams(true);
    try {
      await seedColorTeamsData();
      Alert.alert(
        "Saved",
        "Red, Yellow, Blue, and Purple team data has been written to Firestore's colorTeams collection."
      );
    } catch (error) {
      console.error("Error seeding color teams:", error);
      Alert.alert("Error", "Failed to save color team data. Check console logs.");
    } finally {
      setIsSeedingColorTeams(false);
    }
  };

  const handleToggleColorTeams = async () => {
    setIsTogglingColorTeams(true);
    try {
      const next = !colorTeamsEnabled;
      await updateDoc(doc(db, "Permissions", "tempData"), {
        colorTeamsEnabled: next,
      });
      setColorTeamsEnabledState(next);
    } catch (error) {
      console.error("Error toggling colorTeamsEnabled:", error);
      Alert.alert("Error", "Failed to update the toggle. Check console logs.");
    } finally {
      setIsTogglingColorTeams(false);
    }
  };

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

  let handleClick = async ({ testOnly = false } = {}) => {
    // Checked before React has even re-rendered the disabled buttons below,
    // so a rapid double-tap on either Send button can't start a second send
    // while the first is still in flight.
    if (isSending) return;
    setIsSending(true);
    try {
      let tokens;
      if (testOnly) {
        // Only the admin's own token — never touches anyone else's device,
        // and (below) never writes to the shared Notifications collection
        // either, so it can't show up in anyone else's in-app list.
        const currentUID = auth.currentUser?.uid;
        const docSnap = currentUID
          ? await getDoc(doc(db, "Users", currentUID))
          : null;
        const myToken = docSnap?.data()?.notificationToken;
        tokens = myToken ? [myToken] : [];
        if (tokens.length === 0) {
          Alert.alert(
            "No token found",
            "Couldn't find a push token on your own account to test with."
          );
          return;
        }
      } else {
        tokens = await fetchData();
      }

      if (!tokens || tokens.length === 0) {
        Alert.alert("Error", "No valid tokens found!");
        return;
      }

      console.log(`📬 Sending to ${tokens.length} user(s)${testOnly ? " (test)" : ""}...`);

      const trimmedLink = link.trim();
      // Light normalization only — if someone pastes "example.com" instead
      // of "https://example.com", Linking.openURL would otherwise treat it
      // as a relative path and fail. Doesn't attempt real URL validation.
      const normalizedLink = trimmedLink
        ? /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmedLink)
          ? trimmedLink
          : `https://${trimmedLink}`
        : "";

      const date = getCurrentDate();
      const time = getCurrentTime();
      // Same id shape Home.jsx already derives for existing notifications
      // (`${dateDocId}_${time}`) — built here too so the push payload can
      // carry it and a tap can find this exact notification later.
      const notification = {
        date,
        message,
        time,
        title,
        id: `${date}_${time}`,
        // Omitted entirely (not stored as "") when empty, so older/linkless
        // notifications and this one render identically.
        ...(normalizedLink ? { link: normalizedLink } : {}),
      };

      await sendPushNotificationsToAll(tokens, notification);
      // Test sends skip the shared Notifications write on purpose — that
      // collection isn't per-user, so writing to it would put "test" in
      // everyone's in-app notification list, not just yours. The trade-off:
      // tapping a test push won't find a matching notification to open
      // (tap-to-open only works for a real send), everything else is real.
      if (!testOnly) {
        await addNotification(notification);
      }

      console.log(testOnly ? "✅ Test notification sent!" : "✅ All notifications sent!");
      if (!testOnly) {
        setTitle("");
        setMessage("");
        setLink("");
      }
      Alert.alert(
        "Success",
        testOnly
          ? "Test notification sent to your own device."
          : "Notification sent successfully!"
      );
    } catch (error) {
      console.error("Error sending notifications:", error);
      Alert.alert("Error", "Failed to send notification. Check console logs.");
    } finally {
      setIsSending(false);
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
            <Text style={styles.sectionTitle}>Link (optional)</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setLink(text)}
              placeholder="Enter a link here"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              value={link}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.sendButtonRow}>
            <TouchableOpacity
              style={[styles.testSendButton, isSending && { opacity: 0.6 }]}
              onPress={() => handleClick({ testOnly: true })}
              disabled={isSending || (!title && !message)}
            >
              <Text style={styles.testSendMessage}>
                {isSending ? "Sending..." : "Send Test (to me)"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  marginRight: 10,
                  marginTop: 5,
                  marginBottom: 10,
                },
                isSending && { opacity: 0.6 },
              ]}
              onPress={confirmSend}
              disabled={isSending}
            >
              <Text style={styles.sendMessage}>
                {isSending ? "Sending..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[card, styles.spiritPointsBox]}>
          <View style={styles.header}>
            <View style={styles.smallCircle} />
            <Text style={styles.headerText}>SPIRIT POINTS</Text>
          </View>
          <Text style={styles.spiritPointsDescription}>
            Refreshes every linked user's organization and name from
            DonorDrive, backfills a missing DonorDrive ID from their saved
            link, gives anyone without a captain team an empty one, and
            starts anyone new at 0 points. Safe to run anytime — existing
            point totals, DonorDrive IDs, and captain teams are never
            overwritten.
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

        <View style={[card, styles.spiritPointsBox]}>
          <View style={styles.header}>
            <View style={styles.smallCircle} />
            <Text style={styles.headerText}>COLOR TEAMS</Text>
          </View>
          <Text style={styles.spiritPointsDescription}>
            Step 1 — check your four org lists against real org names
            currently in use. This only reads data, it changes nothing.
          </Text>
          <TouchableOpacity
            style={[
              styles.accessButton,
              { alignSelf: "flex-end", width: 220, opacity: isCheckingOrgMatches ? 0.6 : 1 },
            ]}
            onPress={handleCheckOrgMatches}
            disabled={isCheckingOrgMatches}
          >
            <Text style={styles.accessMessage}>
              {isCheckingOrgMatches ? "Checking..." : "Check Org Matches"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.spiritPointsDescription, { marginTop: 12 }]}>
            Step 2 — once the names look right, save the four teams (and
            their org lists/colors) to Firestore. Safe to re-run any time you
            change the lists in code — each run fully replaces all four.
          </Text>
          <TouchableOpacity
            style={[
              styles.accessButton,
              { alignSelf: "flex-end", width: 220, opacity: isSeedingColorTeams ? 0.6 : 1 },
            ]}
            onPress={handleSeedColorTeams}
            disabled={isSeedingColorTeams}
          >
            <Text style={styles.accessMessage}>
              {isSeedingColorTeams ? "Saving..." : "Save Color Teams Data"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.spiritPointsDescription, { marginTop: 12 }]}>
            Step 3 — turn the feature itself on or off. Leave this off until
            steps 1 and 2 are done and double-checked.
          </Text>
          <View style={styles.colorTeamsToggleRow}>
            <Text style={styles.colorTeamsStatusText}>
              {colorTeamsEnabled === null
                ? "Loading current status..."
                : colorTeamsEnabled
                ? "Currently ON — color teams are visible in the app."
                : "Currently OFF — app looks exactly as usual."}
            </Text>
            <TouchableOpacity
              style={[
                styles.accessButton,
                {
                  width: 110,
                  backgroundColor: colorTeamsEnabled ? colors.danger : colors.navy,
                  opacity: isTogglingColorTeams || colorTeamsEnabled === null ? 0.6 : 1,
                },
              ]}
              onPress={handleToggleColorTeams}
              disabled={isTogglingColorTeams || colorTeamsEnabled === null}
            >
              <Text style={styles.accessMessage}>
                {isTogglingColorTeams
                  ? "..."
                  : colorTeamsEnabled
                  ? "Turn Off"
                  : "Turn On"}
              </Text>
            </TouchableOpacity>
          </View>
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
  sendButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },
  sendButton: {
    borderRadius: 10,
    backgroundColor: colors.orange,
    width: 80,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  testSendButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 14,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 10,
  },
  testSendMessage: {
    color: colors.navy,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
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
  colorTeamsToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  colorTeamsStatusText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
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
