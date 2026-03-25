import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Button,
} from "react-native";
import { handleLogin, handleSignUp } from "./Firebase/AuthManager.js";
import { useNavigation } from "@react-navigation/native";
import { Dropdown } from "react-native-element-dropdown";
import { Icon } from "react-native-elements";

const Login = ({ route }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [donorDriveLink, setDonorDriveLink] = useState("");
  const [create, setCreate] = useState(true);
  const [role, setRole] = useState("");
  const [loginFailed, setLoginFailed] = useState(false);
  const [signUpField, setSignUpField] = useState(false);
  const navigation = useNavigation();
  const [isFocus, setIsFocus] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [ddModalVisable, setDDModalVisable] = useState(false);

  const { expoPushToken } = route.params;

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
      expoPushToken
    );

    if (signUpResult === "success") {
      setSignUpField(false);
    } else {
      setSignUpField(true);
    }
  };

  const roles = [
    { label: "Miracle Maker", value: "Miracle Maker" },
    { label: "ELP", value: "ELP" },
    { label: "Ambassador", value: "Ambassador" },
    { label: "Captain", value: "Captain" },
    { label: "Assistant Director", value: "Assistant Director" },
    { label: "Overall", value: "Overall" },
    { label: "Manager", value: "Manager" },
  ];

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
      >
        <View style={styles.container}>
          {create && (
            <Image
              style={styles.logoBig}
              source={require("./images/dmlogo_white.png")}
            />
          )}

          {!create && (
            <Image
              style={styles.logoSmall}
              source={require("./images/dmlogo_white.png")}
            />
          )}

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

          <View style={styles.loginbox}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputTop}
                value={email}
                onChangeText={(text) => setEmail(text)}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.inputMiddle}
                  value={password}
                  onChangeText={(text) => setPassword(text)}
                  placeholder="Password"
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.iconContainer}
                >
                  <Icon
                    name={passwordVisible ? "visibility-off" : "visibility"}
                    type="material" // specify the icon set, 'material' is the default
                    size={24}
                    color="grey"
                  />
                </TouchableOpacity>
              </View>

              {!create && (
                <TextInput
                  style={styles.inputBottom}
                  value={donorDriveLink}
                  onChangeText={setDonorDriveLink}
                  placeholder="Enter Your Donor Drive Link"
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
                    setIsFocus(false); // This ensures the dropdown loses focus after selection
                  }}
                />
              )}
            </View>

            {!create && (
              <>
                <TouchableOpacity
                  style={styles.createAccountButton}
                  onPress={async () => {
                    await handleSignUpPress();
                  }}
                >
                  <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
              </>
            )}

            {create && (
              <>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLoginPress}
                >
                  <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
              </>
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
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#233563",
    width: "100%",
  },
  logoContainer: {
    marginBottom: 30,
  },
  loginbox: {
    width: "80%",
    backgroundColor: "#F2EFEE",
    borderRadius: 10,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputTop: {
    height: 40,
    color: '#adadad',
    borderColor: "black",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "span",
    position: "relative",
  },
  inputMiddle: {
    height: 40,
    color: '#adadad',
    borderColor: "black",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
    width: "100%",
  },
  iconContainer: {
    position: "absolute",
    right: "5%",
  },
  inputBottom: {
    height: 40,
    color: '#adadad',
    borderColor: "black",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
    marginTop: 15,
  },
  bottomSection: {
     marginTop: 12,
     alignItems: 'center',
  },
  loginButton: {
    backgroundColor: "#E2883C",
    padding: 15,
    borderRadius: 5,
    alignSelf: "stretch",
    marginBottom: 10,
  },
  createAccountButton: {
    backgroundColor: "#E2883C",
    padding: 15,
    borderRadius: 5,
    alignSelf: "stretch",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  divider: {
    borderBottomColor: "black",
    borderBottomWidth: 1,
    alignSelf: "stretch",
    marginVertical: 12,
  },
  forgotPassword: {
    color: "#61A0DA",
    textAlign: "center",
  },
  DDlink: {
    color: "#61A0DA",
    textAlign: "center",
    marginBottom: 1,
  },
  signUp: {
    color: "black",
    textAlign: "center",
    marginTop: 1,
  },
  logoBig: {
    width: 350,
    height: 225,
    marginBottom: 50,
  },
  logoSmall: {
    width: 350,
    height: 225,
    marginBottom: 50,
    marginTop: 50,
  },
  errorMessage: {
    color: "white",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 15,
  },
  dropdown: {
    marginTop: 15,
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    color: '#adadad',
    fontSize: 14,
  },
  selectedTextStyle: {
    color: '#adadad',
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
    backgroundColor: "#233563",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 1,
  },
  closeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalHeader: {
    color: "#D9D9D9",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalText: {
    color: "#D9D9D9",
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
    color: "black",
    textAlign: "center",
  },
  signUpLink: {
    color: "#61A0DA",
    textAlign: "center",
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // keeps it centered horizontally
    marginTop: 13,
  },
});

export default Login;
