import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import * as Progress from "react-native-progress";
import LogoStyles from "./LogoStyles";
import { getTeamDonations, getTeamRoster, getUserInfo } from "./api";
import { apiPaths } from "./api/api-paths";

const DOMAIN_STUB = "https://events.dancemarathon.com";

const normalizeAvatarUrl = (url, fallbackDomain = DOMAIN_STUB) => {
  if (!url) {
    return "";
  }

  if (url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }

  if (url.startsWith("//")) {
    return `https:${url}`;
  }

  if (url.startsWith("/")) {
    return `${fallbackDomain}${url}`;
  }

  if (url.includes("/")) {
    return `${fallbackDomain}/${url.replace(/^\/+/, "")}`;
  }

  return url;
};

const buildAvatarCandidates = (url, fallbackDomain = DOMAIN_STUB) => {
  if (!url) {
    return [];
  }

  const trimmedUrl = url.trim();
  const candidates = [
    trimmedUrl,
    normalizeAvatarUrl(trimmedUrl, fallbackDomain),
  ];

  if (trimmedUrl.startsWith("//")) {
    candidates.push(`http:${trimmedUrl}`);
  }

  if (trimmedUrl.startsWith("/")) {
    candidates.push(`http://events.dancemarathon.com${trimmedUrl}`);
  }

  if (trimmedUrl.startsWith("http://")) {
    candidates.push(trimmedUrl.replace("http://", "https://"));
  }

  if (trimmedUrl.startsWith("https://")) {
    candidates.push(trimmedUrl.replace("https://", "http://"));
  }

  return [...new Set(candidates.filter(Boolean))];
};

const formatCurrency = (value) => {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "0";
  }

  return Number.isInteger(amount) ? `${amount}` : amount.toFixed(2);
};

const formatDonationDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const cleanDonationName = (value, fallback = "Anonymous") => {
  if (!value) {
    return fallback;
  }

  return value.replace("Dance Marathon at UF", "").trim() || fallback;
};

const TeamFundraiser = ({ route }) => {
  const { teamId } = route.params || {};
  const [teamInfo, setTeamInfo] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamDonations, setTeamDonations] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [teamAvatarIndex, setTeamAvatarIndex] = useState(0);

  const markImageError = (key) => {
    setImageErrors((current) => ({
      ...current,
      [key]: true,
    }));
  };

  const renderAvatar = (uri, style, fallbackKey, fallbackLabel) => {
    if (!uri || imageErrors[fallbackKey]) {
      return (
        <View style={[style, styles.fallbackAvatar]}>
          <Text style={styles.fallbackInitial}>
            {(fallbackLabel || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }

    return (
      <Image
        source={{ uri }}
        style={style}
        onError={() => markImageError(fallbackKey)}
      />
    );
  };

  const loadTeamData = async (options = {}) => {
    const { isRefresh = false } = options;

    if (!teamId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const teamProfileResponse = await fetch(apiPaths.teamProfileUrl(teamId));
      const teamProfile = await teamProfileResponse.json();
      const firstRosterPage = await getTeamRoster(teamId, 1);
      const firstDonationPage = await getTeamDonations(teamId, 100, 1);
      const totalPages = firstRosterPage?.countPages || 1;
      const totalDonationPages = firstDonationPage?.countPages || 1;

      let members = firstRosterPage?.members || [];
      let donations = firstDonationPage?.donations || [];

      if (totalPages > 1) {
        const rosterPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            getTeamRoster(teamId, index + 2),
          ),
        );

        members = members.concat(
          rosterPages.flatMap((page) => page?.members || []),
        );
      }

      if (totalDonationPages > 1) {
        const donationPages = await Promise.all(
          Array.from({ length: totalDonationPages - 1 }, (_, index) =>
            getTeamDonations(teamId, 100, index + 2),
          ),
        );

        donations = donations.concat(
          donationPages.flatMap((page) => page?.donations || []),
        );
      }

      const eligibleMembers = members.filter((member) => member?.participantID);

      const memberProfiles = await Promise.all(
        eligibleMembers.map((member) =>
          getUserInfo(member.participantID).catch(() => null),
        ),
      );

      const normalizedMembers = eligibleMembers
        .map((member, index) => {
          const profile = memberProfiles[index];

          return {
            ...member,
            avatarImageURL: normalizeAvatarUrl(
              profile?.avatarImageURL || member.avatarImageURL,
            ),
            displayName:
              profile?.displayName || member.displayName || "Anonymous",
            fundraisingGoal:
              profile?.fundraisingGoal || member.fundraisingGoal || 0,
            sumDonations: profile?.sumDonations || member.sumDonations || 0,
          };
        })
        .sort((a, b) => b.sumDonations - a.sumDonations);

      const normalizedDonations = donations
        .map((donation) => ({
          ...donation,
          displayName: cleanDonationName(donation.displayName),
          recipientName: cleanDonationName(donation.recipientName, "Team"),
          message: donation.message?.trim() || "",
          createdDateLabel: formatDonationDate(donation.createdDateUTC),
        }))
        .sort(
          (a, b) =>
            new Date(b.createdDateUTC || 0) - new Date(a.createdDateUTC || 0),
        );

      setTeamInfo({
        ...teamProfile,
        rawAvatarImageURL: teamProfile.avatarImageURL || "",
        avatarImageURL: normalizeAvatarUrl(
          teamProfile.avatarImageURL,
          DOMAIN_STUB,
        ),
      });
      setTeamMembers(normalizedMembers);
      setTeamDonations(normalizedDonations);
      setTeamAvatarIndex(0);
      setImageErrors({});
    } catch (error) {
      console.error("Error fetching team fundraiser data:", error);
      setTeamInfo(null);
      setTeamMembers([]);
      setTeamDonations([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const targetProgress = useMemo(() => {
    if (!teamInfo?.fundraisingGoal) {
      return 0;
    }

    return Math.min(teamInfo.sumDonations / teamInfo.fundraisingGoal, 1);
  }, [teamInfo]);

  useEffect(() => {
    setProgress(targetProgress);
  }, [targetProgress]);

  const openTeamPage = () => {
    if (!teamInfo?.links?.page) {
      return;
    }

    Linking.openURL(teamInfo.links.page);
  };

  const teamAvatarCandidates = useMemo(
    () => buildAvatarCandidates(teamInfo?.rawAvatarImageURL, DOMAIN_STUB),
    [teamInfo?.rawAvatarImageURL],
  );

  const currentTeamAvatar =
    teamAvatarCandidates[teamAvatarIndex] || teamInfo?.avatarImageURL || "";

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!teamInfo) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Unable to load team fundraiser.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Image
        style={[LogoStyles.logo, styles.logo]}
        resizeMode="contain"
        source={require("./images/PrimaryLogo.png")}
      />

      <View style={styles.profileContainer}>
        {currentTeamAvatar && !imageErrors[`team-${teamId}`] ? (
          <Image
            source={{ uri: currentTeamAvatar }}
            style={styles.avatar}
            onError={() => {
              if (teamAvatarIndex < teamAvatarCandidates.length - 1) {
                setTeamAvatarIndex((current) => current + 1);
                return;
              }

              markImageError(`team-${teamId}`);
            }}
          />
        ) : (
          renderAvatar("", styles.avatar, `team-${teamId}`, teamInfo.name)
        )}
        <View style={styles.profileText}>
          <Text style={styles.displayName}>{teamInfo.name}</Text>
          <View style={styles.section}>
            <FontAwesome name="circle" size={15} color="orange" />
            <Text style={styles.tag}>
              {teamMembers.length} Member{teamMembers.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.amountText}>${teamInfo.sumDonations} RAISED</Text>
        <Text style={styles.amountText}>GOAL ${teamInfo.fundraisingGoal}</Text>
      </View>

      <Progress.Bar
        progress={progress}
        width={340}
        borderColor="white"
        color="#233D72"
        height={40}
        borderRadius={25}
        backgroundColor="white"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.showDonordrivePageButton}
          onPress={openTeamPage}
        >
          <Text style={styles.buttonText}>Team DonorDrive</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rectangleView}>
        <View style={styles.header}>
          <FontAwesome name="users" size={18} color="orange" />
          <Text style={styles.headerText}>TEAM MEMBERS</Text>
        </View>
        <ScrollView
          style={styles.memberList}
          contentContainerStyle={styles.memberListContent}
          showsVerticalScrollIndicator={false}
        >
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <View key={member.participantID} style={styles.memberCard}>
                {renderAvatar(
                  member.avatarImageURL,
                  styles.memberAvatar,
                  `member-${member.participantID}`,
                  member.displayName,
                )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.displayName}</Text>
                  <Text style={styles.memberTotal}>
                    ${formatCurrency(member.sumDonations)} raised
                  </Text>
                  <Text style={styles.memberGoal}>
                    Goal ${formatCurrency(member.fundraisingGoal)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No team members to display.</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.rectangleView}>
        <View style={styles.header}>
          <FontAwesome name="dollar" size={18} color="orange" />
          <Text style={styles.headerText}>TEAM DONATIONS</Text>
          <TouchableOpacity
            style={styles.headerRefreshButton}
            onPress={() => loadTeamData({ isRefresh: true })}
            disabled={isRefreshing}
          >
            <FontAwesome
              name="refresh"
              size={18}
              color={isRefreshing ? "rgba(255,255,255,0.6)" : "white"}
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.memberList}
          contentContainerStyle={styles.memberListContent}
          showsVerticalScrollIndicator={false}
        >
          {teamDonations.length > 0 ? (
            teamDonations.map((donation, index) => (
              <View
                key={`${donation.donationID || donation.createdDateUTC}-${index}`}
                style={styles.donationCard}
              >
                <View style={styles.donationHeader}>
                  <Text style={styles.donationAmount}>
                    ${formatCurrency(donation.amount)}
                  </Text>
                  <Text style={styles.donationDate}>
                    {donation.createdDateLabel}
                  </Text>
                </View>
                <Text style={styles.donationLine}>
                  {donation.displayName} donated to {donation.recipientName}
                </Text>
                {donation.message ? (
                  <Text style={styles.donationMessage}>
                    "{donation.message}"
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No team donations to display.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#1F1F1F",
    alignItems: "center",
    paddingBottom: 20,
  },
  logo: {
    marginTop: 70,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F1F1F",
    padding: 24,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 350,
    marginTop: 20,
    marginBottom: 16,
  },
  profileText: {
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "white",
    marginLeft: 5,
  },
  displayName: {
    fontWeight: "bold",
    fontSize: 24,
    color: "white",
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  tag: {
    fontSize: 14,
    color: "white",
    marginLeft: 5,
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 340,
    marginTop: 12,
    marginBottom: 8,
  },
  amountText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  showDonordrivePageButton: {
    backgroundColor: "#E2883C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  rectangleView: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    width: 340,
    height: 200,
    marginTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 5,
    flex: 1,
  },
  headerRefreshButton: {
    padding: 4,
  },
  memberList: {
    flex: 1,
    width: "100%",
  },
  memberListContent: {
    paddingBottom: 6,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  donationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  donationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  donationAmount: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  donationDate: {
    color: "#D7E3FF",
    fontSize: 12,
  },
  donationLine: {
    color: "white",
    fontSize: 14,
    marginBottom: 4,
  },
  donationMessage: {
    color: "#D7E3FF",
    fontSize: 13,
    fontStyle: "italic",
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    backgroundColor: "#1F1F1F",
  },
  fallbackAvatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  fallbackInitial: {
    color: "white",
    fontWeight: "bold",
    fontSize: 20,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  memberTotal: {
    color: "white",
    fontSize: 14,
  },
  memberGoal: {
    color: "#D7E3FF",
    fontSize: 13,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});

export default TeamFundraiser;
