import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Linking,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { handleSignOut, auth } from "./Firebase/AuthManager";
import {
  deleteUserAccount,
  updateDDLink,
  updateRole,
  updateCaptainTeam,
} from "./Firebase/AuthManager";
import { clearUserDataCache, updateUserData } from "./Firebase/UserManager";
import { UserContext } from "./api/calls";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TopBar from "./TopBar";
import { colors, card } from "./theme";
import { SELF_SERVICE_ROLES, CAPTAIN_TEAMS } from "./constants";

const SettingsScreen = () => {
  const [response, setResponse] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newCaptainTeam, setNewCaptainTeam] = useState("");
  const [accountModalVisable, setAccountModalVisable] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [isCaptainTeamFocus, setIsCaptainTeamFocus] = useState(false);
  const [linkError, setLinkError] = useState("");
  const { role, isAdmin, captainTeam, userInfo, refetchUserData } =
    useContext(UserContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isGuest = !auth.currentUser;

  useFocusEffect(
    React.useCallback(() => {
      if (!isGuest) {
        refetchUserData({ forceRefresh: true });
      }
    }, [refetchUserData])
  );

  useEffect(() => {
    if (response) {
      removeFunctions();
    }
  }, [response]);

  const removeFunctions = async () => {
    await clearUserDataCache();
    await deleteUserAccount();
    await handleSignOut();
  };

  const confirmDeletion = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Yes", onPress: () => setResponse(true) },
        { text: "No", style: "cancel" },
      ],
      { cancelable: false }
    );
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
      console.error("Link update failed:", error.message);
      setLinkError(error.message);
    }
  };

  const changeRole = async () => {
    const currentUID = auth.currentUser.uid;
    await updateRole(currentUID, newRole);
    await updateUserData();
    await refetchUserData({ forceRefresh: true });
    toggleAccountModel();
  };

  const changeCaptainTeam = async () => {
    const currentUID = auth.currentUser.uid;
    await updateCaptainTeam(currentUID, newCaptainTeam);
    await updateUserData();
    await refetchUserData({ forceRefresh: true });
    toggleAccountModel();
  };

  const toggleAccountModel = () => {
    setLinkError("");
    setNewLink("");
    setAccountModalVisable(!accountModalVisable);
  };

  if (isGuest) {
    return (
      <View style={styles.screen}>
        <TopBar />
        <View style={styles.guestBody}>
          <Text style={styles.title}>ACCOUNT</Text>
          <View style={card}>
            <View style={styles.guestButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { marginLeft: 10 }]}
                onPress={() =>
                  navigation.navigate("Login", { signUpMode: true })
                }
              >
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: 40 + insets.bottom },
        ]}
      >
        <Text style={styles.title}>ACCOUNT</Text>
        <View style={[card, styles.infoCard]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{auth.currentUser?.email}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{role || "—"}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organization</Text>
            <Text style={styles.infoValue}>{userInfo?.teamName || "—"}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Captain Team</Text>
            <Text style={styles.infoValue}>{captainTeam || "N/A"}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={toggleAccountModel}
        >
          <Text style={styles.editButtonText}>Edit Account Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => handleSignOut()}
        >
          <Text style={styles.outlineButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDeletion()}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

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
                  onChangeText={(text) => setNewLink(text)}
                />
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={changeLink}
                >
                  <Text style={styles.modalButtonText}>Update Link</Text>
                </TouchableOpacity>

                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  containerStyle={styles.dropdownContainer}
                  data={SELF_SERVICE_ROLES}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder={!isFocus ? "Select Your Role" : "..."}
                  searchPlaceholder="Search..."
                  value={newRole}
                  onFocus={() => setIsFocus(true)}
                  onBlur={() => setIsFocus(false)}
                  onChange={(item) => {
                    setNewRole(item.value);
                    setIsFocus(false);
                  }}
                />
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={changeRole}
                >
                  <Text style={styles.modalButtonText}>Update Role</Text>
                </TouchableOpacity>

                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  containerStyle={styles.dropdownContainer}
                  data={CAPTAIN_TEAMS}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder={
                    !isCaptainTeamFocus ? "Select Your Captain Team" : "..."
                  }
                  searchPlaceholder="Search..."
                  value={newCaptainTeam}
                  onFocus={() => setIsCaptainTeamFocus(true)}
                  onBlur={() => setIsCaptainTeamFocus(false)}
                  onChange={(item) => {
                    setNewCaptainTeam(item.value);
                    setIsCaptainTeamFocus(false);
                  }}
                />
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={changeCaptainTeam}
                >
                  <Text style={styles.modalButtonText}>
                    Update Captain Team
                  </Text>
                </TouchableOpacity>
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
    backgroundColor: colors.pageBackground,
  },
  guestBody: {
    padding: 16,
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  guestButtons: {
    flexDirection: "row",
    padding: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  editButton: {
    backgroundColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  editButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.orange,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  outlineButtonText: {
    color: colors.orange,
    fontWeight: "700",
    fontSize: 15,
  },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: colors.danger,
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
    paddingTop: 40,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 16,
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
  },
  dropdown: {
    marginTop: 15,
    height: 44,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
    width: "100%",
  },
  dropdownContainer: {
    borderRadius: 10,
    marginTop: 5,
  },
  placeholderStyle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  selectedTextStyle: {
    fontSize: 15,
    color: colors.text,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    fontSize: 15,
    backgroundColor: colors.pageBackground,
    borderRadius: 8,
    color: colors.text,
  },
  updateButton: {
    backgroundColor: colors.orange,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
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

export default SettingsScreen;
