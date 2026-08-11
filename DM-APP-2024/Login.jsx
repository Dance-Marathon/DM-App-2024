import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { handleLogin, handleSignUp } from "./Firebase/AuthManager.js";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import { Icon } from "react-native-elements";
import { ROLES, CAPTAIN_TEAMS } from "./constants";
import { colors, card } from "./theme";

const Login = ({ route }) => {
  const expoPushToken = route.params?.expoPushToken || "";
  const signUpMode = route.params?.signUpMode || false;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [donorDriveLink, setDonorDriveLink] = useState("");
  const [create, setCreate] = useState(!signUpMode);
  const [role, setRole] = useState("");
  const [captainTeam, setCaptainTeam] = useState("");
  const [loginFailed, setLoginFailed] = useState(false);
  const [signUpField, setSignUpField] = useState(false);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isFocus, setIsFocus] = useState(false);
  const [isCaptainTeamFocus, setIsCaptainTeamFocus] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [ddModalVisable, setDDModalVisable] = useState(false);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const openDDModal = () => {
    setDDModalVisable(true);
  };

  const closeDDModal = () => {
    setDDModalVisable(false);
  };

  const handleLoginPress = async () => {
    const loginResult = await handleLogin(email, password);

    if (loginResult === "success") {
      setLoginFailed(false);
      navigation.navigate("Home");
    } else {
      setLoginFailed(true);
    }
  };

  const handleSignUpPress = async () => {
    const signUpResult = await handleSignUp(
      email,
      password,
      role,
      donorDriveLink,
      expoPushToken,
      captainTeam
    );

    if (signUpResult === "success") {
      setSignUpField(false);
      navigation.navigate("Home");
    } else {
      setSignUpField(true);
    }
  };

  const roles = ROLES;

  const captainTeams = CAPTAIN_TEAMS;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroBand}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 12 }]}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="arrow-left" type="font-awesome-5" color="white" size={18} />
              </TouchableOpacity>
            )}
            <Text style={styles.logoLineDM}>DM</Text>
            <Text style={styles.logoLineUF}>UF</Text>
          </View>

          <View style={styles.body}>
            {loginFailed && (
              <Text style={styles.errorMessage}>Incorrect email or password</Text>
            )}

            {signUpField && (
              <Text style={styles.errorMessage}>Error Signing Up</Text>
            )}

            <Modal
              animationType="slide"
              transparent={true}
              visible={ddModalVisable}
              onRequestClose={closeDDModal}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <TouchableOpacity style={styles.closeButton} onPress={closeDDModal}>
                    <Text style={styles.closeText}>×</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalHeader}>
                    How to Find Your DonorDrive Link
                  </Text>
                  <Text style={styles.modalText}>
                    1. Navigate to floridadm.org
                  </Text>
                  <Text style={styles.modalText}>2. Click 'Donate'</Text>
                  <Text style={styles.modalText}>
                    3. Enter your name in the search
                  </Text>
                  <Text style={styles.modalText}>
                    4. Under the resulting fundraisers, click on your name
                  </Text>
                  <Text style={styles.modalText}>
                    5. Copy the URL of the page you are currently on
                  </Text>
                  <Text style={styles.modalText}>
                    6. Paste that link in the app
                  </Text>
                </View>
              </View>
            </Modal>

            <View style={[card, styles.loginbox]}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.inputTop}
                  value={email}
                  onChangeText={(text) => setEmail(text)}
                  placeholder="Email Address"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.inputMiddle}
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!passwordVisible}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    style={styles.iconContainer}
                  >
                    <Icon
                      name={passwordVisible ? "visibility-off" : "visibility"}
                      type="material"
                      size={22}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                {!create && (
                  <TextInput
                    style={styles.inputBottom}
                    value={donorDriveLink}
                    onChangeText={setDonorDriveLink}
                    placeholder="Enter Your Donor Drive Link"
                    placeholderTextColor={colors.textMuted}
                  />
                )}

                {!create && (
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={roles}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isFocus ? "Select Your Role" : "..."}
                    searchPlaceholder="Search..."
                    value={role}
                    onChange={(item) => {
                      setRole(item.value);
                      setIsFocus(false);
                    }}
                  />
                )}

                {!create && (
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={captainTeams}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder={!isCaptainTeamFocus ? "Select Your Captain Team" : "..."}
                    searchPlaceholder="Search..."
                    value={captainTeam}
                    onChange={(item) => {
                      setCaptainTeam(item.value);
                      setIsCaptainTeamFocus(false);
                    }}
                  />
                )}
              </View>

              {!create && (
                <TouchableOpacity
                  style={styles.createAccountButton}
                  onPress={async () => {
                    await handleSignUpPress();
                  }}
                >
                  <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
              )}

              {create && (
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLoginPress}
                >
                  <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
              )}

              <View style={styles.divider} />

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPassword}>Forgot password?</Text>
              </TouchableOpacity>

              {create && (
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>New User?</Text>
                  <TouchableOpacity onPress={() => setCreate(false)}>
                    <Text style={styles.signUpLink}> Sign Up!</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!create && (
                <View style={styles.bottomSection}>
                  <TouchableOpacity onPress={openDDModal}>
                    <Text style={styles.DDlink}>
                      Where do I find my DonorDrive Link?
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.loginRow}>
                    <Text style={styles.signUp}>Already a user?</Text>
                    <TouchableOpacity onPress={() => setCreate(true)}>
                      <Text style={styles.signUpLink}> Log In!</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroBand: {
    backgroundColor: colors.navy,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLineDM: {
    color: "white",
    fontWeight: "800",
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  logoLineUF: {
    color: "white",
    fontWeight: "800",
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  body: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  loginbox: {
    width: "100%",
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputTop: {
    height: 44,
    color: colors.text,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  inputMiddle: {
    height: 44,
    color: colors.text,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
    width: "100%",
  },
  iconContainer: {
    position: "absolute",
    right: 12,
  },
  inputBottom: {
    height: 44,
    color: colors.text,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
    marginTop: 15,
  },
  bottomSection: {
    marginTop: 12,
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: colors.orange,
    padding: 14,
    borderRadius: 10,
    alignSelf: "stretch",
    marginBottom: 10,
  },
  createAccountButton: {
    backgroundColor: colors.orange,
    padding: 14,
    borderRadius: 10,
    alignSelf: "stretch",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  divider: {
    borderBottomColor: colors.cardBorder,
    borderBottomWidth: 1,
    alignSelf: "stretch",
    marginVertical: 12,
  },
  forgotPassword: {
    color: colors.navy,
    textAlign: "center",
    fontWeight: "600",
  },
  DDlink: {
    color: colors.navy,
    textAlign: "center",
    marginBottom: 1,
    fontWeight: "600",
  },
  signUp: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 1,
  },
  errorMessage: {
    color: colors.danger,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 15,
    fontWeight: "600",
  },
  dropdown: {
    marginTop: 15,
    height: 44,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  selectedTextStyle: {
    color: colors.text,
    fontSize: 14,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    width: "85%",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 15,
    zIndex: 1,
  },
  closeText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalHeader: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "left",
    alignSelf: "stretch",
    marginBottom: 5,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  signUpText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
  signUpLink: {
    color: colors.navy,
    textAlign: "center",
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },
});

export default Login;
