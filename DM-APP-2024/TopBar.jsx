import React from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "react-native-elements";
import { colors } from "./theme";

const TopBar = ({ rightIcon, onRightPress, showBadge }) => {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={openDrawer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.hamburgerLineLong} />
          <View style={styles.hamburgerLineShort} />
          <View style={styles.hamburgerLineLong} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
            source={require("./images/TopBarLogoWhite.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.rightSlot}>
          {rightIcon === "bell" && (
            <TouchableOpacity
              onPress={onRightPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View>
                <Icon name="bell" type="font-awesome" color="white" size={22} />
                {showBadge && <View style={styles.badgeDot} />}
              </View>
            </TouchableOpacity>
          )}
          {rightIcon === "qr" && (
            <TouchableOpacity
              onPress={onRightPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="qrcode" type="font-awesome" color="white" size={22} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.navy,
  },
  container: {
    height: 56,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  hamburgerButton: {
    width: 24,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  hamburgerLineLong: {
    width: 22,
    height: 2,
    backgroundColor: "white",
    borderRadius: 1,
    marginVertical: 2.5,
  },
  hamburgerLineShort: {
    width: 14,
    height: 2,
    backgroundColor: "white",
    borderRadius: 1,
    marginVertical: 2.5,
  },
  logoContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    height: 24,
    aspectRatio: 2821 / 357,
  },
  rightSlot: {
    width: 24,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  badgeDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.orange,
    borderWidth: 1,
    borderColor: colors.navy,
  },
});

export default TopBar;
