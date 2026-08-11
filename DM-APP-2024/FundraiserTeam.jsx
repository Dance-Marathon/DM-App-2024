import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "./Firebase/AuthManager";
import { getUserInfo, getUserDonations } from "./api/index";
import { colors, card } from "./theme";
import { MANAGER_TEAM_GROUPS } from "./constants";

const currency = (n) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const cleanDonationName = (value, fallback = "Anonymous") => {
  if (!value) return fallback;
  return value.replace("Dance Marathon at UF", "").trim() || fallback;
};

const formatDonationDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const FundraiserTeam = ({ role, captainTeam }) => {
  const insets = useSafeAreaInsets();
  const teamOptions = MANAGER_TEAM_GROUPS[role];
  const isSelectable = Array.isArray(teamOptions) && teamOptions.length > 0;

  const [selectedTeam, setSelectedTeam] = useState(
    isSelectable ? teamOptions[0] : captainTeam
  );
  const [isFocus, setIsFocus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [donations, setDonations] = useState([]);

  const dropdownData = useMemo(
    () => (teamOptions || []).map((t) => ({ label: t, value: t })),
    [teamOptions]
  );

  useEffect(() => {
    let cancelled = false;

    const loadTeam = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "Users");
        const q = query(usersRef, where("captainTeam", "==", selectedTeam));
        const snapshot = await getDocs(q);

        const memberResults = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            if (!data.donorID) {
              return {
                member: { displayName: data.email || "Member", sumDonations: 0 },
                donations: [],
              };
            }
            try {
              const [info, donationData] = await Promise.all([
                getUserInfo(data.donorID),
                getUserDonations(data.donorID, 20, 1).catch(() => null),
              ]);
              const memberName = info.displayName || data.email || "Member";
              return {
                member: {
                  displayName: memberName,
                  sumDonations: info.sumDonations || 0,
                },
                donations: (donationData?.donations || []).map((donation) => ({
                  ...donation,
                  memberName,
                })),
              };
            } catch (err) {
              console.error("Error fetching member DonorDrive info:", err);
              return {
                member: { displayName: data.email || "Member", sumDonations: 0 },
                donations: [],
              };
            }
          })
        );

        if (!cancelled) {
          const memberInfos = memberResults
            .map((result) => result.member)
            .sort((a, b) => b.sumDonations - a.sumDonations);

          const allDonations = memberResults
            .flatMap((result) => result.donations)
            .sort(
              (a, b) =>
                new Date(b.createdDateUTC || 0) - new Date(a.createdDateUTC || 0)
            )
            .slice(0, 20);

          setMembers(memberInfos);
          setDonations(allDonations);
        }
      } catch (error) {
        console.error("Error loading team members:", error);
        if (!cancelled) {
          setMembers([]);
          setDonations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (selectedTeam) {
      loadTeam();
    } else {
      setMembers([]);
      setDonations([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedTeam]);

  const teamTotal = members.reduce((sum, m) => sum + m.sumDonations, 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: 40 + insets.bottom },
      ]}
    >
      {isSelectable && (
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          containerStyle={styles.dropdownContainer}
          data={dropdownData}
          maxHeight={300}
          mode="default"
          dropdownPosition="bottom"
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? "Select a team" : "..."}
          value={selectedTeam}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={(item) => {
            setSelectedTeam(item.value);
            setIsFocus(false);
          }}
        />
      )}

      <View style={[card, styles.heroCard]}>
        <Text style={styles.teamName}>{selectedTeam || "No team"}</Text>
        <Text style={styles.teamTotal}>{currency(teamTotal)}</Text>
        <Text style={styles.teamTotalLabel}>total raised</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.navy}
          size="large"
          style={{ marginTop: 24 }}
        />
      ) : members.length === 0 ? (
        <View style={[card, styles.emptyCard]}>
          <Text style={styles.emptyText}>No members found for this team</Text>
        </View>
      ) : (
        <>
          <View style={[card, styles.membersCard]}>
            <Text style={styles.membersTitle}>MEMBERS</Text>
            {members.map((item, index) => (
              <View key={`${item.displayName}-${index}`} style={styles.memberRow}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <Text style={styles.memberAmount}>
                  {currency(item.sumDonations)}
                </Text>
              </View>
            ))}
          </View>

          <View style={[card, styles.donationsCard]}>
            <Text style={styles.membersTitle}>RECENT DONATIONS</Text>
            {donations.length > 0 ? (
              donations.map((donation, index) => (
                <View
                  key={`${donation.donationID || donation.createdDateUTC}-${index}`}
                  style={[
                    styles.donationRow,
                    index < donations.length - 1 && styles.donationRowDivider,
                  ]}
                >
                  <View style={styles.donationHeader}>
                    <Text style={styles.donationAmount}>
                      {currency(donation.amount)}
                    </Text>
                    <Text style={styles.donationDate}>
                      {formatDonationDate(donation.createdDateUTC)}
                    </Text>
                  </View>
                  <Text style={styles.donationLine}>
                    {cleanDonationName(donation.displayName)} donated to{" "}
                    {donation.memberName}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No donations yet</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  dropdown: {
    height: 44,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.cardBackground,
    marginBottom: 12,
  },
  dropdownContainer: {
    borderRadius: 10,
  },
  placeholderStyle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  selectedTextStyle: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },
  heroCard: {
    backgroundColor: colors.navy,
    borderWidth: 0,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  teamName: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  teamTotal: {
    color: colors.orange,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 8,
  },
  teamTotalLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  membersCard: {
    padding: 16,
  },
  membersTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  memberName: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  memberAmount: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: "700",
  },
  donationsCard: {
    padding: 16,
    marginTop: 16,
  },
  donationRow: {
    paddingVertical: 10,
  },
  donationRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  donationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  donationAmount: {
    color: colors.orange,
    fontSize: 15,
    fontWeight: "700",
  },
  donationDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  donationLine: {
    color: colors.text,
    fontSize: 13,
  },
});

export default FundraiserTeam;
