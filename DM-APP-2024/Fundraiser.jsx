import React, { useContext, useState, useEffect } from "react";
import Toast, { BaseToast } from "react-native-toast-message";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
  Share,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Progress from "react-native-progress";
import { Icon } from "react-native-elements";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserContext } from "./api/calls";

import { updateDDLink } from "./Firebase/AuthManager";
import { updateUserData } from "./Firebase/UserManager";
import { auth } from "./Firebase/AuthManager";
import TopBar from "./TopBar";
import { colors, card } from "./theme";
import { MANAGER_TEAM_GROUPS, TEAM_TAB_SINGLE_ROLES } from "./constants";
import FundraiserTeam from "./FundraiserTeam";
import TeamFundraiserView from "./TeamFundraiserView";

const currency = (n) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
  return initials.join("") || "?";
};

const Fundraiser = () => {
  const insets = useSafeAreaInsets();
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [allMilestones, setAllMilestones] = useState({});
  const [allDonations, setAllDonations] = useState({});
  const [sortedDonations, setSortedDonations] = useState([allDonations]);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [accountModalVisable, setAccountModalVisable] = useState(false);
  const [newLink, setNewLink] = useState("");

  const [linkError, setLinkError] = useState("");
  const [activeTab, setActiveTab] = useState("Personal");

  const {
    userID,
    role,
    captainTeam,
    userInfo,
    milestoneInfo,
    donationInfo,
    badgeInfo,
    isLoadingUserInfo,
    isLoadingMilestones,
    isLoadingDonations,
    refetchUserData,
  } = useContext(UserContext);

  const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: colors.orange }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          color: colors.text,
          fontSize: 16,
          fontWeight: "bold",
          textAlign: "center",
        }}
      />
    ),
  };

  const isMultiTeamManager = Boolean(MANAGER_TEAM_GROUPS[role]);
  const isSingleTeamRole = TEAM_TAB_SINGLE_ROLES.includes(role);
  const showTeamTab = isMultiTeamManager || isSingleTeamRole;

  const toggleAccountModel = () => {
    setLinkError("");
    setNewLink("");
    setAccountModalVisable(!accountModalVisable);
  };

  const changeLink = async () => {
    setLinkError("");

    if (!newLink) {
      setLinkError("Please enter a DonorDrive link.");
      return;
    }

    try {
      const currentUID = auth.currentUser.uid;
      await updateDDLink(currentUID, newLink);
      await updateUserData();
      await refetchUserData();
      setNewLink("");
      setLinkError("");
      toggleAccountModel();
    } catch (error) {
      setLinkError(error.message);
    }
  };

  useEffect(() => {
    refetchUserData();
  }, []);

  useEffect(() => {
    if (userID && userInfo?.numMilestones) {
      for (let i = 0; i < userInfo.numMilestones; i++) {
        const milestone = milestoneInfo?.milestones?.[i];
        if (!milestone) continue;

        if (userInfo.sumDonations < milestone.amount) {
          break;
        }
        setMilestoneIndex(i - 1);
      }
    }
  }, [userID, userInfo, milestoneInfo]);

  useEffect(() => {
    if (userID && userInfo?.numMilestones) {
      const allMilestones = [];
      for (let i = 0; i < userInfo.numMilestones; i++) {
        const milestone = milestoneInfo?.milestones?.[i];
        if (milestone) {
          allMilestones.push(milestone);
        }
      }
      setAllMilestones(allMilestones);
    }
  }, [userID, userInfo, milestoneInfo]);

  useEffect(() => {
    if (userID && donationInfo?.donations) {
      const allDonations = [];
      for (let i = 0; i < userInfo?.numDonations; i++) {
        const donation = donationInfo.donations[i];
        if (donation?.amount != null) {
          allDonations.push(donation);
        }
      }
      setAllDonations(allDonations);
    }
  }, [userID, userInfo, donationInfo]);

  useEffect(() => {
    const sorted = sortedDonations.sort((a, b) => {
      const dateA = new Date(a.createdDateUTC);
      const dateB = new Date(b.createdDateUTC);
      return dateB - dateA;
    });
    setSortedDonations(sorted);
  }, []);

  const copyToClipboard = () => {
    const text = userInfo.donateURL;
    Clipboard.setStringAsync(text)
      .then(() => {
        Toast.show({
          type: "success",
          text1: "DonorDrive Link Copied!",
          position: "bottom",
          visibilityTime: 3000,
          autoHide: true,
        });
      })
      .catch((err) => console.error("Error copying to clipboard:", err));
  };

  const shareFundraiser = () => {
    if (!userInfo?.donateURL) return;
    Share.share({
      message: userInfo.donateURL,
      url: userInfo.donateURL,
    }).catch((err) => console.error("Error sharing fundraiser:", err));
  };

  const openBadgeModal = (badge) => {
    setSelectedBadge(badge);
    setBadgeModalVisible(true);
  };

  const closeBadgeModal = () => {
    setBadgeModalVisible(false);
  };

  const refreshFundraiserData = async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      await refetchUserData();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (userInfo && userInfo.sumDonations && userInfo.fundraisingGoal) {
      setProgress(userInfo.sumDonations / userInfo.fundraisingGoal);
    }
  }, [userInfo]);

  const renderPersonalTab = () => {
    if (!userID) {
      return (
        <View style={styles.brokenLinkContainer}>
          <Text style={styles.brokenLinkText}>
            Your DonorDrive link is not working. Please update it below!
          </Text>
          <TouchableOpacity
            style={styles.updateLinkButton}
            onPress={toggleAccountModel}
          >
            <Text style={styles.updateLinkButtonText}>Update Link</Text>
          </TouchableOpacity>

          <Modal
            visible={accountModalVisable}
            transparent={true}
            animationType="fade"
          >
            <TouchableWithoutFeedback onPress={toggleAccountModel}>
              <View style={styles.modalBackground}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalView}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={toggleAccountModel}
                    >
                      <FontAwesomeIcon icon={faX} color={colors.text} size={18} />
                    </TouchableOpacity>
                    {linkError ? (
                      <Text style={styles.errorText}>{linkError}</Text>
                    ) : null}
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new DonorDrive link"
                      placeholderTextColor={colors.textMuted}
                      value={newLink}
                      onChangeText={(text) => {
                        setNewLink(text);
                        setLinkError("");
                      }}
                    />
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={changeLink}
                    >
                      <Text style={styles.modalButtonText}>Update Link</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      );
    }

    if (
      !userInfo &&
      (isLoadingUserInfo || isLoadingMilestones || isLoadingDonations)
    ) {
      return (
        <ActivityIndicator
          size="large"
          color={colors.navy}
          style={{ marginTop: 40 }}
        />
      );
    }

    if (!userInfo || !allMilestones) {
      return null;
    }

    return (
      <ScrollView
        contentContainerStyle={[
          styles.personalBody,
          { paddingBottom: 40 + insets.bottom },
        ]}
      >
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalBackground}>
              <TouchableWithoutFeedback>
                <View style={styles.modalView}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.milestonesTitle}>Milestones</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <FontAwesomeIcon icon={faX} size={18} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalMilestonesContainer}>
                    {Array.isArray(allMilestones) &&
                    userInfo.numMilestones > 0 ? (
                      allMilestones.map((milestone, index) => (
                        <View key={index} style={styles.milestoneRow}>
                          <Icon
                            name={
                              milestone.fundraisingGoal <= userInfo.sumDonations
                                ? "check-square"
                                : "square"
                            }
                            type="font-awesome-5"
                            size={20}
                            color={colors.navy}
                            style={{ marginRight: 10 }}
                          />
                          <Text style={styles.milestoneAmount}>
                            ${milestone.fundraisingGoal}
                          </Text>
                          <Text style={styles.milestoneDescription}>
                            {milestone.description}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noMilestonesText}>
                        No milestones to display
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={styles.profileRow}>
          {userInfo.avatarImageURL ? (
            <Image
              source={{ uri: userInfo.avatarImageURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>
                {getInitials(userInfo.displayName)}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.displayName} numberOfLines={1}>
              {userInfo.displayName}
            </Text>
            <Text style={styles.roleText}>{role}</Text>
            <View style={styles.tagsRow}>
              {captainTeam && captainTeam !== "N/A" && (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{captainTeam}</Text>
                </View>
              )}
              {userInfo.teamName ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{userInfo.teamName}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroRaised}>
            {currency(userInfo.sumDonations)} raised
          </Text>
          <View style={{ position: "relative" }}>
            <Progress.Bar
              progress={progress}
              width={null}
              height={10}
              borderWidth={0}
              unfilledColor="rgba(255,255,255,0.25)"
              color={colors.orange}
              style={styles.progressBar}
            />
          </View>
          <Text style={styles.heroSubtext}>
            {allDonations?.length || 0} donors · goal {currency(userInfo.fundraisingGoal)}
          </Text>
          <View style={styles.milestoneFooter}>
            <Text style={styles.milestoneFooterText}>
              {allMilestones?.[milestoneIndex + 1]?.fundraisingGoal
                ? `Next milestone: $${allMilestones[milestoneIndex + 1].fundraisingGoal}`
                : "All milestones complete!"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.showAll}>Show All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {badgeInfo?.badges && badgeInfo.badges.length > 0 && (
          <ScrollView horizontal style={styles.badgeScroll} showsHorizontalScrollIndicator={false}>
            {badgeInfo.badges.map((badge, index) => (
              <TouchableOpacity key={index} onPress={() => openBadgeModal(badge)}>
                <Image
                  source={{ uri: badge.badgeImageURL }}
                  style={styles.badgeImage}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedBadge && (
          <Modal
            animationType="fade"
            transparent={true}
            visible={badgeModalVisible}
            onRequestClose={closeBadgeModal}
          >
            <TouchableWithoutFeedback onPress={closeBadgeModal}>
              <View style={styles.modalBackground}>
                <TouchableWithoutFeedback>
                  <View style={styles.badgeView}>
                    <TouchableOpacity
                      style={styles.badgeModalClose}
                      onPress={closeBadgeModal}
                    >
                      <FontAwesomeIcon icon={faX} size={18} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.badgeModalTitle}>
                      {selectedBadge.title}
                    </Text>
                    <Text style={styles.badgeModalDescription}>
                      {selectedBadge.description}
                    </Text>
                    <Image
                      source={{ uri: selectedBadge.badgeImageURL }}
                      style={styles.badgeModalImage}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        <View style={[card, styles.donationsCard]}>
          <View style={styles.donationsHeader}>
            <Text style={styles.sectionTitle}>DONATIONS</Text>
            <TouchableOpacity onPress={refreshFundraiserData} disabled={isRefreshing}>
              <Icon
                name="refresh"
                type="font-awesome"
                size={16}
                color={isRefreshing ? colors.textMuted : colors.navy}
              />
            </TouchableOpacity>
          </View>
          {Array.isArray(allDonations) && allDonations.length > 0 ? (
            allDonations.map((donation, index) => {
              const donatorName = donation.displayName
                ? donation.displayName
                : "Anonymous";
              const cleanedDonatorName = donatorName
                .replace("Dance Marathon at UF", "")
                .trim();
              return (
                <View
                  key={index}
                  style={[
                    styles.donationRow,
                    index < allDonations.length - 1 && styles.donationRowDivider,
                  ]}
                >
                  <Text style={styles.donationName} numberOfLines={1}>
                    {cleanedDonatorName}
                  </Text>
                  <Text style={styles.donationAmount}>{currency(donation.amount)}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyDonations}>It's empty in here...</Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.donorDriveButton}
            onPress={() => Linking.openURL(userInfo.donateURL)}
          >
            <Text style={styles.donorDriveButtonText}>DonorDrive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
            <Icon name="link" type="font-awesome-5" color={colors.navy} size={16} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={shareFundraiser}>
          <Text style={styles.shareButtonText}>Share my fundraiser</Text>
        </TouchableOpacity>

        <Toast />
      </ScrollView>
    );
  };

  return (
    <View style={styles.screen}>
      <TopBar />

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Personal" && styles.tabButtonActive]}
          onPress={() => setActiveTab("Personal")}
        >
          <Text style={[styles.tabButtonText, activeTab === "Personal" && styles.tabButtonTextActive]}>
            Personal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Organization" && styles.tabButtonActive]}
          onPress={() => setActiveTab("Organization")}
        >
          <Text style={[styles.tabButtonText, activeTab === "Organization" && styles.tabButtonTextActive]}>
            Organization
          </Text>
        </TouchableOpacity>
        {showTeamTab && (
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "Team" && styles.tabButtonActive]}
            onPress={() => setActiveTab("Team")}
          >
            <Text style={[styles.tabButtonText, activeTab === "Team" && styles.tabButtonTextActive]}>
              Team
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {activeTab === "Personal" && renderPersonalTab()}
      {activeTab === "Organization" && (
        <TeamFundraiserView teamId={userInfo?.teamID} />
      )}
      {activeTab === "Team" && showTeamTab && (
        <FundraiserTeam role={role} captainTeam={captainTeam} />
      )}

      <Toast config={toastConfig} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    margin: 16,
    borderRadius: 10,
    padding: 4,
    borderWidth: 0.5,
    borderColor: colors.cardBorder,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.navy,
  },
  tabButtonText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  tabButtonTextActive: {
    color: "white",
  },
  personalBody: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  brokenLinkContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  brokenLinkText: {
    color: colors.text,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  updateLinkButton: {
    backgroundColor: colors.orange,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  updateLinkButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 14,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontWeight: "700",
    fontSize: 19,
    color: colors.text,
  },
  roleText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginTop: 4,
  },
  tagPillText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: "600",
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
  },
  heroRaised: {
    color: "white",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  progressBar: {
    width: "100%",
  },
  heroSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 8,
  },
  milestoneFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  milestoneFooterText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
  },
  showAll: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "700",
  },
  badgeScroll: {
    marginBottom: 16,
    maxHeight: 50,
  },
  badgeImage: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 10,
  },
  donationsCard: {
    padding: 16,
    marginBottom: 16,
  },
  donationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  donationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  donationRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  donationName: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  donationAmount: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyDonations: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  donorDriveButton: {
    backgroundColor: colors.orange,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginRight: 12,
  },
  donorDriveButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButton: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  shareButtonText: {
    color: colors.orange,
    fontWeight: "700",
    fontSize: 15,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  modalMilestonesContainer: {
    width: "100%",
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  milestoneAmount: {
    fontWeight: "700",
    color: colors.text,
    fontSize: 14,
    width: 70,
  },
  milestoneDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
  },
  noMilestonesText: {
    color: colors.textSecondary,
  },
  badgeView: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    width: 280,
  },
  badgeModalClose: {
    alignSelf: "flex-end",
    marginBottom: 6,
  },
  badgeModalTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.text,
  },
  badgeModalDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
    color: colors.textSecondary,
  },
  badgeModalImage: {
    width: 130,
    height: 130,
    marginVertical: 6,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 20,
  },
  input: {
    height: 44,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
    width: "100%",
    color: colors.text,
    fontSize: 15,
    marginTop: 20,
  },
  updateButton: {
    backgroundColor: colors.orange,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
  errorText: {
    color: colors.danger,
    marginBottom: 10,
    textAlign: "center",
    fontSize: 13,
  },
});

export default Fundraiser;
