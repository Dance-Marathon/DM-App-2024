// Login.js (React Native)

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
  Picker,
} from "react-native";
import { handleLogin, handleSignUp } from "./Firebase/AuthManager.js"; // Import the handleLogin function

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [donorDriveLink, setDonorDriveLink] = useState("");
  const [create, setCreate] = useState(true);
  const [role, setRole] = useState("");

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={require("./images/year30_logo.png")} />
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

          <TextInput
            style={styles.inputButtom}
            value={password}
            onChangeText={(text) => setPassword(text)}
            placeholder="Password"
            secureTextEntry
          />

          {!create && (
            <TextInput
              style={styles.inputTop}
              value={donorDriveLink}
              onChangeText={setDonorDriveLink}
              placeholder="Enter Your Donor Drive Link"
              secureTextEntry
            />
          )}

          {!create && (
            <Picker
            style={styles.inputButtom}
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
            >
              <Picker.Item label="Dancer" value="Dancer" />
              <Picker.Item label="ELP" value="ELP" />
              <Picker.Item label="Ambassador" value="Ambassador" />
              <Picker.Item label="Captain" value="Captain" />
              <Picker.Item
                label="Assistant Director"
                value="Assistant Director"
              />
              <Picker.Item label="Overall" value="Overall" />
              <Picker.Item label="Manager" value="Manager" />
            </Picker>
          )}
        </View>
        {create && (
          <>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => handleLogin(email, password)}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
          </>
        )}
        {(
          <>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => {
                setCreate(false);
                handleSignUp(email, password, role, donorDriveLink);
              }}
            >
              <Text style={styles.buttonText}>New User?</Text>
            </TouchableOpacity>
          </>
        )}

        <Text> _______________________________</Text>

        <Text style={styles.forgotPassword}>Forgot password?</Text>
        <Text style={styles.signUp}>
          New User?<Text style={{ color: "#61A0DA" }}> Sign Up!</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#233563",
  },
  logoContainer: {
    marginBottom: 30,
  },
  loginbox: {
    width: "80%",
    backgroundColor: "#F2EFEE",
    borderRadius: 10,
    padding: 20,
    borderColor: "black",
    borderWidth: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputTop: {
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
  },
  inputButtom: {
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
  },
  loginButton: {
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
  forgotPassword: {
    color: "#61A0DA",
    textAlign: "center",
    marginTop: 15,
  },
  signUp: {
    color: "black",
    textAlign: "center",
    marginTop: 15,
  },
  logo: {
    width: 225,
    height: 225,
    marginBottom: 50,
  },
});

export default Login;
