import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Icon } from "react-native-elements";
import Svg, { Path } from "react-native-svg";
import { auth } from "./Firebase/AuthManager";
import { UserContext } from "./api/calls";
import { colors } from "./theme";
import { SOCIAL_LINKS, TECH_SUPPORT_EMAIL_URL } from "./constants";

const MissionDMIcon = ({ color, size = 20 }) => (
  <Svg width={size} height={size * (28 / 24)} viewBox="0 0 24 28" fill="none">
    <Path
      d="M12 0.8125C11.6411 0.8125 11.4214 0.670312 11.1696 0.502734C10.8161 0.274219 10.3929 0 9.42857 0C7.79464 0 6.64286 2.21914 5.89286 4.53984C3.35893 4.98164 1.71429 5.69766 1.71429 6.5C1.71429 7.22617 3.05357 7.87617 5.175 8.32305C5.15357 8.52617 5.14286 8.7293 5.14286 8.9375C5.14286 9.80078 5.31964 10.6234 5.64107 11.375H2.43214C2.03571 11.375 1.71429 11.6797 1.71429 12.0555C1.71429 12.1418 1.73036 12.2281 1.76786 12.3094L3.84643 18.2457C1.51071 19.8961 0 21.5211 0 24.4918C0 25.3246 0.7125 26 1.59107 26H22.4089C23.2875 26 24 25.3246 24 24.4918C24 21.5211 22.4893 19.9012 20.1589 18.2457L22.2321 12.3094C22.2643 12.2281 22.2857 12.1418 22.2857 12.0555C22.2857 11.6797 21.9643 11.375 21.5679 11.375H18.3589C18.6804 10.6234 18.8571 9.80078 18.8571 8.9375C18.8571 8.7293 18.8464 8.52617 18.825 8.32305C20.9464 7.87617 22.2857 7.22617 22.2857 6.5C22.2857 5.69766 20.6411 4.98164 18.1071 4.53984C17.3571 2.21914 16.2054 0 14.5714 0C13.6071 0 13.1839 0.274219 12.8304 0.502734C12.5732 0.670312 12.3589 0.8125 12 0.8125ZM15 11.375H14.3357C13.4518 11.375 12.6696 10.8367 12.3911 10.0445C12.2679 9.68906 11.7375 9.68906 11.6143 10.0445C11.3357 10.8367 10.5482 11.375 9.66964 11.375H9C7.81607 11.375 6.85714 10.466 6.85714 9.34375V8.6125C8.36786 8.8207 10.125 8.9375 12 8.9375C13.875 8.9375 15.6321 8.8207 17.1429 8.6125V9.34375C17.1429 10.466 16.1839 11.375 15 11.375ZM10.2857 16.25L11.1429 17.875L8.35714 24.375L5.78571 14.625L10.2857 16.25ZM18.2143 14.625L15.6429 24.375L12.8571 17.875L13.7143 16.25L18.2143 14.625Z"
      fill={color}
    />
  </Svg>
);

const DrawerRow = ({ iconName, iconType = "font-awesome", customIcon, label, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.rowIcon}>
      {customIcon ? customIcon : <Icon name={iconName} type={iconType} color={colors.navy} size={18} />}
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
  </TouchableOpacity>
);

const DrawerContent = (props) => {
  const { navigation } = props;
  const { role, isAdmin, userInfo } = useContext(UserContext);
  const isGuest = !auth.currentUser;
  const missionDmEnabled = props.missionDmEnabled;

  const go = (name) => navigation.navigate(name);
  const openLink = (url) => Linking.openURL(url);

  const displayName = userInfo?.displayName || auth.currentUser?.email || "";

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("./images/DrawerLogo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.topSection}>
        <DrawerRow iconName="home" label="Home" onPress={() => go("Home")} />
        {!isGuest && (
          <DrawerRow iconName="star" label="Spirit Points" onPress={() => go("Spirit")} />
        )}
        {!isGuest && (
          <DrawerRow iconName="money" label="DonorDrive" onPress={() => go("Fundraiser")} />
        )}
        {!isGuest && missionDmEnabled && (
          <DrawerRow
            customIcon={<MissionDMIcon color={colors.navy} />}
            label="Mission DM"
            onPress={() => go("MissionDM")}
          />
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomSection}>
        <Text style={styles.moreLabel}>MORE</Text>
        <DrawerRow iconName="user" label="Account" onPress={() => go("Account")} />
        <DrawerRow iconName="book" label="Resources" onPress={() => go("Resources")} />
        <DrawerRow iconName="camera" label="Shootproof" onPress={() => go("Shootproof")} />
        <DrawerRow
          iconName="envelope"
          label="Email Tech Support"
          onPress={() => openLink(TECH_SUPPORT_EMAIL_URL)}
        />
        {!isGuest && isAdmin && (
          <DrawerRow iconName="user-secret" label="Admin" onPress={() => go("Admin")} />
        )}
      </View>

      <View style={styles.socialRow}>
        {SOCIAL_LINKS.map((social) => (
          <TouchableOpacity
            key={social.key}
            style={styles.socialIcon}
            onPress={() => openLink(social.url)}
          >
            <Icon name={social.icon} type="font-awesome" color={colors.navy} size={18} />
          </TouchableOpacity>
        ))}
      </View>

      {!isGuest && (
        <View style={styles.footer}>
          <Text style={styles.footerName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.footerRole}>{role}</Text>
        </View>
      )}
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.cardBackground,
  },
  logoContainer: {
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  topSection: {
    paddingHorizontal: 8,
  },
  bottomSection: {
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  moreLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginLeft: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  rowIcon: {
    width: 28,
    alignItems: "center",
  },
  rowLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 16,
  },
  socialIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  footerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  footerRole: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});

export default DrawerContent;
