import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { getDonorDriveBlockedUntil } from "./api";
import { colors, card } from "./theme";

// A refresh on the Team tab costs ~2 DonorDrive requests per member, and
// DonorDrive asks for roughly 240 requests/hour, so repeated taps can get the
// phone blocked for an hour. The button stays disabled for this long after a
// refresh to keep that from happening by accident.
export const REFRESH_COOLDOWN_MS = 60 * 1000;

const formatTime = (date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// Returns a user-facing message while DonorDrive's rate-limit block is active,
// otherwise null.
export const getRateLimitNotice = () => {
  const until = getDonorDriveBlockedUntil();
  if (!until) return null;
  return `DonorDrive is limiting requests until about ${formatTime(new Date(until))}. Showing the last loaded numbers.`;
};

// [active, start] — `active` is true for `ms` after start() is called.
export const useCooldown = (ms = REFRESH_COOLDOWN_MS) => {
  const [active, setActive] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = useCallback(() => {
    setActive(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), ms);
  }, [ms]);

  return [active, start];
};

const RefreshBar = ({ onPress, refreshing, disabled, lastUpdated, notice }) => {
  const isDisabled = disabled || refreshing;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.updatedText}>
          {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : ""}
        </Text>
        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={onPress}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityLabel="Refresh"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.navy} />
          ) : (
            <FontAwesome
              name="refresh"
              size={14}
              color={isDisabled ? colors.textMuted : colors.navy}
            />
          )}
          <Text style={[styles.buttonText, isDisabled && styles.buttonTextDisabled]}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </Text>
        </TouchableOpacity>
      </View>
      {notice ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updatedText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.navy,
    backgroundColor: colors.cardBackground,
  },
  buttonDisabled: {
    borderColor: colors.cardBorder,
  },
  buttonText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  noticeBox: {
    ...card,
    backgroundColor: colors.lightOrange,
    borderColor: colors.orange,
    padding: 10,
    marginTop: 10,
  },
  noticeText: {
    color: colors.text,
    fontSize: 12,
  },
});

export default RefreshBar;
