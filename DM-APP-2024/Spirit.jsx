import React, { useState, useEffect, useContext } from "react";
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
import axios from "axios";
import { sheetsAPIKey } from "./api/apiKeys";
import { Icon } from "react-native-elements";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./Firebase/AuthManager";
import { UserContext } from "./api/calls";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import TopBar from "./TopBar";
import { colors, card } from "./theme";

const GenerateQRCode = () => {
  const [qrVisible, setQrVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [individualLeaderboard, setIndividualLeaderboard] = useState([]);
  const [fullTeamLeaderboard, setFullTeamLeaderboard] = useState([]);
  const [fullIndividualLeaderboard, setFullIndividualLeaderboard] = useState(
    []
  );
  const SPREADSHEET_ID = "1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY";
  const range = `Sheet1!A2:B100`;
  const individualRange = `Sheet2!A2:B600`;
  const apiKey = sheetsAPIKey;
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerPermissions, setScannerPermissions] = useState({
    allowedRoles: [],
    teamBasedPermissions: {},
  });

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const qrSize = Math.min(280, windowWidth * 0.65);

  const { role, userInfo, captainTeam } = useContext(UserContext);

  const userTeamScore =
    fullTeamLeaderboard && userInfo
      ? fullTeamLeaderboard.find(
          (team) => team[0] === userInfo.teamName
        )?.[1] || 0
      : 0;

  const captainTeamScore =
    fullTeamLeaderboard && captainTeam && captainTeam !== "N/A"
      ? fullTeamLeaderboard.find((team) => team[0] === captainTeam)?.[1] || 0
      : 0;

  const individualScore =
    fullIndividualLeaderboard && userInfo
      ? fullIndividualLeaderboard.find(
          (individual) => individual[0] === userInfo.displayName
        )?.[1] || 0
      : 0;

  const fetchLeaderboardData = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`
      );

      setFullTeamLeaderboard(response.data.values);

      const sortedData = response.data.values
        .filter((row) => row[1])
        .map((row) => [row[0], parseInt(row[1], 10)])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      setLeaderboard(sortedData);
    } catch (error) {
      console.error("Error fetching leaderboard data", error);
    }
  };

  const fetchIndividualData = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${individualRange}?key=${apiKey}`
      );

      setFullIndividualLeaderboard(response.data.values);

      const sortedData = response.data.values
        .filter((row) => row[1])
        .map((row) => [row[0], parseInt(row[1], 10)])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      setIndividualLeaderboard(sortedData);
    } catch (error) {
      console.error("Error fetching individual leaderboard data", error);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    fetchIndividualData();
  }, []);

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
                userInfo.teamName
              ));

          setScannerVisible(isAllowed);
        } else {
          console.log("No permissions found for Scanner.");
        }
      } catch (error) {
        console.error("Error fetching scanner permissions:", error);
      }
    };

    fetchScannerPermissions();
  }, [userInfo]);

  const isUserInfoEmpty = Object.keys(userInfo || {}).length === 0;

  const qrData = isUserInfoEmpty
    ? ""
    : `name: ${userInfo.displayName}, team: ${userInfo.teamName}`;

  const maxOrgScore = leaderboard.length > 0 ? leaderboard[0][1] : 0;
  const rankBadgeColors = [colors.gold, colors.silver, colors.bronze];

  return (
    <View style={styles.screen}>
      <TopBar
        rightIcon="qr"
        onRightPress={() => setQrVisible(true)}
      />

      <View style={styles.heroBand}>
        {scannerVisible && (
          <TouchableOpacity
            style={styles.scannerButton}
            onPress={() => navigation.navigate("Scanner")}
          >
            <Icon name="camera" type="font-awesome-5" color="white" size={18} />
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Personal</Text>
            <Text style={styles.statValuePersonal}>{individualScore}</Text>
            <Text style={styles.statSubtitle} numberOfLines={1}>
              {userInfo?.displayName || ""}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Captain Team</Text>
            <Text style={styles.statValue}>{captainTeamScore}</Text>
            <Text style={styles.statSubtitle} numberOfLines={1}>
              {captainTeam && captainTeam !== "N/A" ? captainTeam : "N/A"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Organization</Text>
            <Text style={styles.statValue}>{userTeamScore}</Text>
            <Text style={styles.statSubtitle} numberOfLines={1}>
              {userInfo?.teamName || ""}
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
                Please update your DonorDrive link in the Fundraiser tab to
                earn points.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>ORGANIZATION LEADERBOARD</Text>
          <View style={[card, styles.leaderboardCard]}>
            {leaderboard.map((team, index) => {
              const isYou = userInfo?.teamName && team[0] === userInfo.teamName;
              const progress = maxOrgScore > 0 ? team[1] / maxOrgScore : 0;
              return (
                <View
                  key={index}
                  style={[
                    styles.leaderboardRow,
                    index < leaderboard.length - 1 && styles.leaderboardRowDivider,
                  ]}
                >
                  <View
                    style={[
                      styles.rankBadge,
                      index < 3 && { backgroundColor: rankBadgeColors[index] },
                    ]}
                  >
                    <Text style={styles.rankBadgeText}>{index + 1}</Text>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <View style={styles.leaderboardNameRow}>
                      <Text style={styles.leaderboardName} numberOfLines={1}>
                        {team[0]}
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
                            backgroundColor: isYou ? colors.orange : colors.navy,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.leaderboardPoints}>{team[1]}</Text>
                </View>
              );
            })}
            {leaderboard.length === 0 && (
              <Text style={styles.noticeText}>Leaderboard unavailable</Text>
            )}
          </View>
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
  scannerButton: {
    alignSelf: "flex-end",
    marginBottom: 8,
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
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  leaderboardCard: {
    padding: 12,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  leaderboardRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
  youPill: {
    backgroundColor: colors.lightOrange,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  youPillText: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lightBlue,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  leaderboardPoints: {
    color: colors.orange,
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
