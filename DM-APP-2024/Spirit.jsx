import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Icon } from "react-native-elements";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "./Firebase/AuthManager";
import { UserContext } from "./api/calls";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import TopBar from "./TopBar";
import { colors, card } from "./theme";
import { CAPTAIN_LEADERBOARD_ROLES } from "./constants";

const RankBadge = ({ rank }) => {
  if (rank === 0) {
    return (
      <View style={styles.rankBadgeFirst}>
        <Icon name="trophy" type="font-awesome" color="white" size={14} />
      </View>
    );
  }
  const ringColor = rank === 1 ? colors.silver : rank === 2 ? colors.bronze : null;
  return (
    <View
      style={[styles.rankBadge, ringColor && { borderWidth: 2, borderColor: ringColor }]}
    >
      <Text style={styles.rankBadgeText}>{rank + 1}</Text>
    </View>
  );
};

const LeaderboardSection = ({ title, data, maxScore, isYouName, emptyText }) => (
  <>
    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{title}</Text>
    <View style={[card, styles.leaderboardCard]}>
      {data.map((entry, index) => {
        const isYou = Boolean(isYouName) && entry[0] === isYouName;
        const progress = maxScore > 0 ? entry[1] / maxScore : 0;
        return (
          <View key={index} style={styles.leaderboardRow}>
            <RankBadge rank={index} />
            <View style={styles.leaderboardInfo}>
              <View style={styles.leaderboardNameRow}>
                <Text style={styles.leaderboardName} numberOfLines={1}>
                  {entry[0]}
                </Text>
                {isYou && (
                  <View style={styles.youPill}>
                    <Text style={styles.youPillText}>you</Text>
                  </View>
                )}
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(progress * 100, 4)}%`,
                      backgroundColor: isYou ? colors.orange : "white",
                    },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.leaderboardPoints}>{entry[1]}</Text>
          </View>
        );
      })}
      {data.length === 0 && (
        <Text style={styles.leaderboardEmptyText}>{emptyText}</Text>
      )}
    </View>
  </>
);

const GenerateQRCode = () => {
  const [qrVisible, setQrVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [individualLeaderboard, setIndividualLeaderboard] = useState([]);
  const [fullOrgLeaderboard, setFullOrgLeaderboard] = useState([]);
  const [fullCaptainTeamLeaderboard, setFullCaptainTeamLeaderboard] = useState(
    []
  );
  const [myStats, setMyStats] = useState({
    organization: "",
    spiritPoints: 0,
    displayName: "",
  });
  const [canGiveSpiritPoints, setCanGiveSpiritPoints] = useState(false);
  const [scannerPermissions, setScannerPermissions] = useState({
    allowedRoles: [],
    teamBasedPermissions: {},
  });

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const qrSize = Math.min(280, windowWidth * 0.65);
  const actionButtonGap = 10;
  const actionRowWidth = windowWidth - 32; // matches sheetContent's 16px side padding

  const { role, userInfo, captainTeam } = useContext(UserContext);

  const userTeamScore =
    fullOrgLeaderboard.find(([name]) => name === myStats.organization)?.[1] ||
    0;

  const hasCaptainTeam = Boolean(captainTeam) && captainTeam !== "N/A";

  const captainTeamScore =
    fullCaptainTeamLeaderboard.find(([name]) => name === captainTeam)?.[1] ||
    0;

  const individualScore = myStats.spiritPoints || 0;
  const myDisplayName = myStats.displayName || userInfo?.displayName || "";

  const canSeeCaptainLeaderboard =
    hasCaptainTeam || CAPTAIN_LEADERBOARD_ROLES.includes(role);
  const captainTeamLeaderboard = fullCaptainTeamLeaderboard.slice(0, 5);

  const fetchLeaderboards = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "Users"));

      const individualTotals = [];
      const orgTotals = {};
      const captainTeamTotals = {};
      let myData = null;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const points = Number(data.spiritPoints) || 0;

        if (docSnap.id === auth.currentUser?.uid) {
          myData = data;
        }

        if (data.displayName) {
          individualTotals.push([data.displayName, points]);
        }

        if (data.organization) {
          orgTotals[data.organization] =
            (orgTotals[data.organization] || 0) + points;
        }

        if (data.captainTeam && data.captainTeam !== "N/A") {
          captainTeamTotals[data.captainTeam] =
            (captainTeamTotals[data.captainTeam] || 0) + points;
        }
      });

      setMyStats({
        organization: myData?.organization || "",
        spiritPoints: Number(myData?.spiritPoints) || 0,
        displayName: myData?.displayName || "",
      });

      const sortedIndividuals = individualTotals
        .filter(([, points]) => points > 0)
        .sort((a, b) => b[1] - a[1]);
      setIndividualLeaderboard(sortedIndividuals.slice(0, 5));

      const sortedOrgs = Object.entries(orgTotals)
        .filter(([, points]) => points > 0)
        .sort((a, b) => b[1] - a[1]);
      setFullOrgLeaderboard(sortedOrgs);
      setLeaderboard(sortedOrgs.slice(0, 5));

      const sortedCaptainTeams = Object.entries(captainTeamTotals)
        .filter(([, points]) => points > 0)
        .sort((a, b) => b[1] - a[1]);
      setFullCaptainTeamLeaderboard(sortedCaptainTeams);
    } catch (error) {
      console.error(
        "Error fetching spirit point leaderboards from Firestore:",
        error
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboards();
    }, [fetchLeaderboards])
  );

  useEffect(() => {
    const fetchScannerPermissions = async () => {
      try {
        const docRef = doc(db, "Permissions", "ScannerAccess");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const permissions = docSnap.data();
          setScannerPermissions(permissions);

          const isAllowed =
            permissions.allowedRoles.includes(role) ||
            (permissions.teamBasedPermissions[role] &&
              permissions.teamBasedPermissions[role].includes(
                captainTeam
              ));

          setCanGiveSpiritPoints(isAllowed);
        } else {
          console.log("No permissions found for Scanner.");
        }
      } catch (error) {
        console.error("Error fetching scanner permissions:", error);
      }
    };

    fetchScannerPermissions();
  }, [userInfo, role, captainTeam]);

  const isUserInfoEmpty = Object.keys(userInfo || {}).length === 0;

  const qrData = isUserInfoEmpty
    ? ""
    : `name: ${userInfo.displayName}, team: ${userInfo.teamName}, captainTeam: ${captainTeam || "N/A"}, uid: ${auth.currentUser?.uid || ""}`;

  const actionButtonWidth = canGiveSpiritPoints
    ? (actionRowWidth - actionButtonGap) / 2
    : actionRowWidth * 0.7;

  const maxOrgScore = leaderboard.length > 0 ? leaderboard[0][1] : 0;
  const maxIndividualScore =
    individualLeaderboard.length > 0 ? individualLeaderboard[0][1] : 0;
  const maxCaptainTeamScore =
    captainTeamLeaderboard.length > 0 ? captainTeamLeaderboard[0][1] : 0;

  return (
    <View style={styles.screen}>
      <TopBar />

      <View style={styles.heroBand}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Personal</Text>
            <Text style={styles.statValuePersonal}>{individualScore}</Text>
            <Text style={styles.statSubtitle} numberOfLines={1}>
              {myDisplayName}
            </Text>
          </View>
          {hasCaptainTeam && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Captain Team</Text>
              <Text style={styles.statValue}>{captainTeamScore}</Text>
              <Text style={styles.statSubtitle} numberOfLines={1}>
                {captainTeam}
              </Text>
            </View>
          )}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Organization</Text>
            <Text style={styles.statValue}>{userTeamScore}</Text>
            <Text style={styles.statSubtitle} numberOfLines={1}>
              {myStats.organization}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: 40 + insets.bottom },
          ]}
        >
          {isUserInfoEmpty && (
            <View style={[card, styles.noticeCard]}>
              <Text style={styles.noticeText}>
                Please update your DonorDrive link in the DonorDrive tab to
                earn points.
              </Text>
            </View>
          )}

          <View
            style={[
              styles.actionRow,
              !canGiveSpiritPoints && styles.actionRowCentered,
            ]}
          >
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.receiveButton,
                { width: actionButtonWidth },
              ]}
              onPress={() => setQrVisible(true)}
            >
              <Icon name="qrcode" type="font-awesome" color="white" size={18} />
              <Text
                style={styles.actionButtonText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Receive Spirit Points
              </Text>
            </TouchableOpacity>
            {canGiveSpiritPoints && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.giveButton,
                  { width: actionButtonWidth },
                ]}
                onPress={() => navigation.navigate("Scanner")}
              >
                <Icon name="camera" type="font-awesome-5" color="white" size={18} />
                <Text
                  style={styles.actionButtonText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Give Spirit Points
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <LeaderboardSection
            title="ORGANIZATION LEADERBOARD"
            data={leaderboard}
            maxScore={maxOrgScore}
            isYouName={myStats.organization}
            emptyText="Leaderboard unavailable"
          />

          <LeaderboardSection
            title="INDIVIDUAL LEADERBOARD"
            data={individualLeaderboard}
            maxScore={maxIndividualScore}
            isYouName={myDisplayName}
            emptyText="Leaderboard unavailable"
          />

          {canSeeCaptainLeaderboard && (
            <LeaderboardSection
              title="CAPTAIN TEAM LEADERBOARD"
              data={captainTeamLeaderboard}
              maxScore={maxCaptainTeamScore}
              isYouName={captainTeam}
              emptyText="Leaderboard unavailable"
            />
          )}
        </ScrollView>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={qrVisible}
        onRequestClose={() => setQrVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setQrVisible(false)}>
          <View style={styles.modalBackground}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setQrVisible(false)}
                >
                  <FontAwesomeIcon icon={faX} size={18} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.qrWrapper}>
                  <QRCode value={qrData} size={qrSize} />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  heroBand: {
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statValue: {
    color: "white",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 6,
  },
  statValuePersonal: {
    color: colors.orange,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 6,
  },
  statSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sheetContent: {
    padding: 16,
    paddingBottom: 40,
  },
  noticeCard: {
    padding: 16,
    marginBottom: 16,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  actionRowCentered: {
    justifyContent: "center",
  },
  actionButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  receiveButton: {
    backgroundColor: colors.navy,
  },
  giveButton: {
    backgroundColor: colors.orange,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  leaderboardCard: {
    padding: 12,
    backgroundColor: colors.navy,
    borderWidth: 0,
  },
  leaderboardEmptyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankBadgeFirst: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankBadgeText: {
    color: colors.navy,
    fontWeight: "800",
    fontSize: 12,
  },
  leaderboardInfo: {
    flex: 1,
    marginRight: 10,
  },
  leaderboardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  leaderboardName: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  youPill: {
    backgroundColor: colors.orange,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  youPillText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  leaderboardPoints: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  qrWrapper: {
    backgroundColor: "white",
  },
});

export default GenerateQRCode;
