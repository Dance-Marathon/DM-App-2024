import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
} from "react";
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
import {
  getUserDonations,
  getDonorDriveStaleCount,
  invalidateDonorDriveCache,
} from "./api/index";
import RefreshBar, { useCooldown, getRateLimitNotice } from "./RefreshBar";
import { colors, card } from "./theme";
import { getTeamOptionsFor, PSEUDO_TEAM_ROLE_VALUE } from "./constants";
import { useColorTeams } from "./ColorTeamsContext";
import { UserContext } from "./api/calls";

const currency = (n) =>
  `$${(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const cleanDonationName = (value, fallback = "Anonymous") => {
  if (!value) return fallback;
  return value.replace("Dance Marathon at UF", "").trim() || fallback;
};

// DonorDrive's bot protection is far more likely to trigger on a burst of
// simultaneous requests (one per team member, all at once) than on a single
// isolated request — fetching a few members at a time instead avoids that.
const mapWithThrottle = async (items, mapper, batchSize = 2, delayMs = 500) => {
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

// ELP's roster can optionally be split further by a "unit" field set
// directly on each ELP DM27 user's Firestore doc (not app-assignable) —
// this sentinel is the unfiltered/default selection in that dropdown.
const ALL_UNITS_OPTION = "All Units";

const FundraiserTeam = ({ role, captainTeam }) => {
  const insets = useSafeAreaInsets();
  const { organization: myOrganization } = useContext(UserContext);
  const { colorTeamsEnabled, getTeamForOrg } = useColorTeams();
  const myTeam = colorTeamsEnabled ? getTeamForOrg(myOrganization) : null;
  const teamOptions = getTeamOptionsFor(role, captainTeam);
  const isSelectable = teamOptions.length > 1;

  const [selectedTeam, setSelectedTeam] = useState(teamOptions[0]);
  const [isFocus, setIsFocus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [donations, setDonations] = useState([]);
  const [notice, setNotice] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cooldown, startCooldown] = useCooldown();
  const [unitOptions, setUnitOptions] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(ALL_UNITS_OPTION);
  const [isUnitFocus, setIsUnitFocus] = useState(false);

  // Switching teams resets any unit filter left over from a previous ELP view.
  useEffect(() => {
    setSelectedUnit(ALL_UNITS_OPTION);
  }, [selectedTeam]);

  // Only the most recent load may write to state (team switched / newer load
  // started / screen closed).
  const loadIdRef = useRef(0);

  const dropdownData = useMemo(
    () => (teamOptions || []).map((t) => ({ label: t, value: t })),
    [teamOptions]
  );

  const loadTeam = useCallback(
    async ({ isRefresh = false } = {}) => {
      const loadId = ++loadIdRef.current;
      const isCurrent = () => loadId === loadIdRef.current;
      const staleBefore = getDonorDriveStaleCount();

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setNotice(null);
        setRefreshing(false);
        setLoading(true);
      }

      try {
        const usersRef = collection(db, "Users");
        const pseudoRoleValue = PSEUDO_TEAM_ROLE_VALUE[selectedTeam];
        const q = pseudoRoleValue
          ? query(usersRef, where("role", "==", pseudoRoleValue))
          : query(usersRef, where("captainTeam", "==", selectedTeam));
        const snapshot = await getDocs(q);

        if (!isCurrent()) return;

        // ELP is the only pseudo-team that can be split by a "unit" field
        // set directly on each ELP DM27 doc (not app-assignable) — the
        // dropdown's options come from whatever units actually show up, not
        // a hardcoded list, so it stays correct as units get assigned or
        // renamed in Firestore without needing an app update.
        const isElpView = selectedTeam === "ELP";
        const units = isElpView
          ? Array.from(
              new Set(
                snapshot.docs.map((docSnap) => docSnap.data().unit).filter(Boolean)
              )
            ).sort()
          : [];
        setUnitOptions(units);

        const docs =
          isElpView && selectedUnit !== ALL_UNITS_OPTION
            ? snapshot.docs.filter(
                (docSnap) => (docSnap.data().unit || "") === selectedUnit
              )
            : snapshot.docs;

        // Names and totals come straight from Firestore, not a live
        // DonorDrive call — every member's own Personal tab visits (and the
        // admin's periodic refresh) keep sumDonations/displayName in sync
        // there. This used to call getUserInfo() for every member on every
        // visit to this screen, which is what kept tripping DonorDrive's
        // rate limit for the whole team at once. Opening this screen now
        // makes zero DonorDrive requests for the member list, so it can't
        // fail that way.
        const memberInfos = docs
          .map((docSnap) => {
            const data = docSnap.data();
            return {
              displayName: data.displayName || data.email || "Member",
              sumDonations: Number(data.sumDonations) || 0,
              organization: data.organization || "",
            };
          })
          .sort((a, b) => b.sumDonations - a.sumDonations);

        setMembers(memberInfos);
        setLoading(false);
        setLastUpdated(new Date());

        // Recent donations aren't stored in Firestore, so that part still
        // needs a live, throttled, best-effort DonorDrive call per member —
        // but a failure here only thins out the donations feed below; it no
        // longer drags the member list/totals down with it.
        const membersWithDonorID = docs.filter(
          (docSnap) => docSnap.data().donorID
        );
        let failures = 0;

        const donationLists = await mapWithThrottle(
          membersWithDonorID,
          async (docSnap) => {
            const data = docSnap.data();
            const memberName = data.displayName || data.email || "Member";
            try {
              const donationData = await getUserDonations(
                data.donorID,
                20,
                1
              );
              return (donationData.donations || []).map((donation) => ({
                ...donation,
                memberName,
              }));
            } catch (err) {
              console.error("Error fetching member donations:", err);
              failures++;
              return [];
            }
          }
        );

        if (!isCurrent()) return;

        const allDonations = donationLists
          .flat()
          .sort(
            (a, b) =>
              new Date(b.createdDateUTC || 0) - new Date(a.createdDateUTC || 0)
          )
          .slice(0, 20);
        setDonations(allDonations);

        // Some donations may have come from an earlier update (saved on the
        // phone) instead of DonorDrive; that doesn't count as a failure above
        // but shouldn't be presented as current either.
        const servedStale = getDonorDriveStaleCount() > staleBefore;

        if (
          membersWithDonorID.length > 0 &&
          failures === membersWithDonorID.length
        ) {
          setNotice(
            getRateLimitNotice() ||
              "Couldn't load recent donations right now."
          );
        } else if (servedStale) {
          setNotice(
            getRateLimitNotice() ||
              "Some recent donations may be out of date — couldn't reach DonorDrive."
          );
        } else {
          setNotice(null);
        }
      } catch (error) {
        console.error("Error loading team members:", error);
        if (!isCurrent()) return;
        if (isRefresh) {
          setNotice("Couldn't refresh right now. Showing the last loaded numbers.");
        } else {
          setMembers([]);
          setDonations([]);
        }
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [selectedTeam, selectedUnit]
  );

  useEffect(() => {
    if (selectedTeam) {
      loadTeam();
    } else {
      loadIdRef.current++;
      setMembers([]);
      setDonations([]);
      setNotice(null);
      setRefreshing(false);
      setLoading(false);
    }
  }, [selectedTeam, loadTeam]);

  // Ignore any load still running when the screen closes.
  useEffect(
    () => () => {
      loadIdRef.current++;
    },
    []
  );

  const handleRefresh = () => {
    // Unlike before, this always does something useful even when DonorDrive
    // is blocked: the member list/totals re-read from Firestore regardless,
    // and only the recent-donations portion depends on DonorDrive (and fails
    // fast + shows a notice on its own if blocked).
    invalidateDonorDriveCache();
    startCooldown();
    loadTeam({ isRefresh: true });
  };

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

      {selectedTeam === "ELP" && unitOptions.length > 0 && (
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          containerStyle={styles.dropdownContainer}
          data={[
            { label: ALL_UNITS_OPTION, value: ALL_UNITS_OPTION },
            ...unitOptions.map((u) => ({ label: u, value: u })),
          ]}
          maxHeight={300}
          mode="default"
          dropdownPosition="bottom"
          labelField="label"
          valueField="value"
          placeholder={!isUnitFocus ? "Select a unit" : "..."}
          value={selectedUnit}
          onFocus={() => setIsUnitFocus(true)}
          onBlur={() => setIsUnitFocus(false)}
          onChange={(item) => {
            setSelectedUnit(item.value);
            setIsUnitFocus(false);
          }}
        />
      )}

      <RefreshBar
        onPress={handleRefresh}
        refreshing={refreshing}
        disabled={loading || cooldown || !selectedTeam}
        lastUpdated={lastUpdated}
        notice={notice}
      />

      <View
        style={[
          card,
          styles.heroCard,
          myTeam && { backgroundColor: myTeam.color },
        ]}
      >
        <Text
          style={[styles.teamName, myTeam && { color: myTeam.textColor }]}
        >
          {selectedTeam === "ELP" && selectedUnit !== ALL_UNITS_OPTION
            ? `ELP – ${selectedUnit}`
            : selectedTeam || "No team"}
        </Text>
        <Text
          style={[styles.teamTotal, myTeam && { color: myTeam.textColor }]}
        >
          {currency(teamTotal)}
        </Text>
        <Text
          style={[
            styles.teamTotalLabel,
            myTeam && { color: myTeam.textColor, opacity: 0.85 },
          ]}
        >
          total raised
        </Text>
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
            {members.map((item, index) => {
              const memberTeam = colorTeamsEnabled
                ? getTeamForOrg(item.organization)
                : null;
              return (
              <View key={`${item.displayName}-${index}`} style={styles.memberRow}>
                {memberTeam && (
                  <View
                    style={[styles.memberColorDot, { backgroundColor: memberTeam.color }]}
                  />
                )}
                <Text style={styles.memberName} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <Text style={styles.memberAmount}>
                  {currency(item.sumDonations)}
                </Text>
              </View>
              );
            })}
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
  memberColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
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
