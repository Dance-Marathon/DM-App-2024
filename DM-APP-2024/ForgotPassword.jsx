// ForgotPassword.js (React Native)

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const auth = getAuth();

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error) {
      console.error('Error sending password reset email:', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      {!resetSent ? (
        <>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
          <View style={styles.box}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => setEmail(text)}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword}>
              <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
        <View style={styles.secondPage}>
          <Text style={styles.successMessage}>Password reset instructions sent to your email.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
          </View>
        </>
      )}
    </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#233563',
  },
  title: {
    fontSize: 32,
    marginBottom: 20,
    color: 'white',
  },
  subtitle: {
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
    width: '80%',
  },
  input: {
    height: 40,
    borderColor: 'white',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
    color: 'black',
  },
  resetButton: {
    backgroundColor: '#E2883C',
    padding: 15,
    borderRadius: 5,
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  successMessage: {
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#E2883C',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    width: 150,
  },
  box: {
    width: '80%',
    backgroundColor: '#F2EFEE',
    borderRadius: 10,
    padding: 20,
  },
  secondPage: {
    alignItems: 'center',
  },
});

export default ForgotPassword;
