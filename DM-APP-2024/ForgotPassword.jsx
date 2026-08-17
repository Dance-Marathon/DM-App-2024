// ForgotPassword.js (React Native)

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { Icon } from "react-native-elements";
import { colors, card } from "./theme";

const auth = getAuth();

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error) {
      console.error("Error sending password reset email:", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 10}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" type="font-awesome-5" color={colors.navy} size={20} />
        </TouchableOpacity>
        <Text style={styles.title}>Forgot Password</Text>
        {!resetSent ? (
          <>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset
              your password.
            </Text>
            <View style={[card, styles.box]}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => setEmail(text)}
                placeholder="Email Address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetPassword}
              >
                <Text style={styles.buttonText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.secondPage}>
              <Text style={styles.successMessage}>
                Password reset instructions were sent to your email. Please
                check your Spam folder if you cannot find it.
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.buttonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.pageBackground,
    width: "100%",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    padding: 10,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: "center",
    width: "80%",
  },
  input: {
    height: 44,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.pageBackground,
    color: colors.text,
  },
  resetButton: {
    backgroundColor: colors.orange,
    padding: 14,
    borderRadius: 10,
    alignSelf: "stretch",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 15,
  },
  successMessage: {
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: "center",
    maxWidth: "80%",
  },
  loginButton: {
    backgroundColor: colors.orange,
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    width: 170,
  },
  box: {
    width: "80%",
    padding: 20,
  },
  secondPage: {
    alignItems: "center",
  },
});

export default ForgotPassword;
