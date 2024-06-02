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
} from "react-native";
import { handleLogin, handleSignUp } from "./Firebase/AuthManager.js";
import { useNavigation } from "@react-navigation/native";
import { Dropdown } from "react-native-element-dropdown";
import { Icon } from "react-native-elements";

const Login = ({route}) => {
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

  const {expoPushToken} = route.params;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
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
    { label: "Dancer", value: "Dancer" },
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
                    await handleSignUpPress()
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
              <Text style={styles.signUp}>
                New User?
                <TouchableOpacity
                  style={{ marginBottom: -3 }}
                  onPress={() => {
                    setCreate(false);
                  }}
                >
                  <Text style={{ color: "#61A0DA" }}> Sign Up!</Text>
                </TouchableOpacity>
              </Text>
            )}
            {!create && (
              <Text style={styles.signUp}>
                Old User?
                <TouchableOpacity
                  style={{ marginBottom: -3 }}
                  onPress={() => {
                    setCreate(true);
                  }}
                >
                  <Text style={{ color: "#61A0DA" }}> Log In!</Text>
                </TouchableOpacity>
              </Text>
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
    borderColor: "black",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
    marginTop: 15,
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
  signUp: {
    color: "black",
    textAlign: "center",
    marginTop: 5,
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
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});

export default Login;
