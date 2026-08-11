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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTeamDonations, getTeamRoster, getUserInfo } from "./api";
import { apiPaths } from "./api/api-paths";
import { colors, card } from "./theme";

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

const TeamFundraiserView = ({ teamId }) => {
  const insets = useSafeAreaInsets();
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

  if (!teamId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>
          Link your DonorDrive account in the Personal tab to see your
          organization's fundraising here.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.navy} />
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.screenContent,
        { paddingBottom: 40 + insets.bottom },
      ]}
    >
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
            <FontAwesome name="circle" size={10} color={colors.orange} />
            <Text style={styles.tag}>
              {teamMembers.length} Member{teamMembers.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
      </View>

      <View style={[card, styles.heroCard]}>
        <View style={styles.textContainer}>
          <Text style={styles.amountText}>${teamInfo.sumDonations} raised</Text>
          <Text style={styles.amountText}>Goal ${teamInfo.fundraisingGoal}</Text>
        </View>

        <Progress.Bar
          progress={progress}
          width={null}
          color={colors.orange}
          unfilledColor={colors.lightBlue}
          borderWidth={0}
          height={10}
          style={styles.progressBar}
        />

        <TouchableOpacity
          style={styles.showDonordrivePageButton}
          onPress={openTeamPage}
        >
          <Text style={styles.buttonText}>Team DonorDrive</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>TEAM MEMBERS</Text>
      <View style={[card, styles.rectangleView]}>
        <ScrollView
          style={styles.memberList}
          contentContainerStyle={styles.memberListContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
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

      <View style={styles.donationsHeaderRow}>
        <Text style={styles.sectionTitle}>TEAM DONATIONS</Text>
        <TouchableOpacity
          onPress={() => loadTeamData({ isRefresh: true })}
          disabled={isRefreshing}
        >
          <FontAwesome
            name="refresh"
            size={16}
            color={isRefreshing ? colors.textMuted : colors.navy}
          />
        </TouchableOpacity>
      </View>
      <View style={[card, styles.rectangleView]}>
        <ScrollView
          style={styles.memberList}
          contentContainerStyle={styles.memberListContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
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
              <Text style={styles.emptyText}>
                No team donations to display.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  screenContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pageBackground,
    padding: 24,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileText: {
    flex: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 14,
  },
  displayName: {
    fontWeight: "700",
    fontSize: 20,
    color: colors.text,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  tag: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 5,
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderWidth: 0,
    padding: 18,
    marginBottom: 20,
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  amountText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  progressBar: {
    width: "100%",
    marginBottom: 14,
  },
  showDonordrivePageButton: {
    backgroundColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
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
  donationsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rectangleView: {
    padding: 10,
    height: 220,
    marginBottom: 20,
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
    backgroundColor: colors.pageBackground,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  donationCard: {
    backgroundColor: colors.pageBackground,
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
    color: colors.orange,
    fontSize: 16,
    fontWeight: "700",
  },
  donationDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  donationLine: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  donationMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: "italic",
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.cardBackground,
  },
  fallbackAvatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.navy,
  },
  fallbackInitial: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  memberTotal: {
    color: colors.text,
    fontSize: 13,
  },
  memberGoal: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
});

export default TeamFundraiserView;
