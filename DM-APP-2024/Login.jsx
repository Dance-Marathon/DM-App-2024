// Login.js (React Native)

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, StyleSheet, Image } from 'react-native';
import { handleLogin } from './Firebase/AuthManager.js'; // Import the handleLogin function

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
      <View style={styles.container}>
        <Image
          style={styles.logo}
          source={require('./images/year30_logo.png')}
        />
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
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={() => handleLogin(email, password)}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <Text>    _______________________________</Text>

          <Text style={styles.forgotPassword}>Forgot password?</Text>
          <Text style={styles.signUp}>New User?<Text style={{color: '#61A0DA'}}> Sign Up!</Text></Text>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#233563',
  },
  logoContainer: {
    marginBottom: 30,
  },
  loginbox: {
    width: '80%',
    backgroundColor: '#F2EFEE',
    borderRadius: 10,
    padding: 20,
    borderColor: 'black',
    borderWidth: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputTop: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
  },
  inputButtom: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#D9D9D9',
  },
  loginButton: {
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
  forgotPassword: {
    color: '#61A0DA',
    textAlign: 'center',
    marginTop: 15,
  },
  signUp: {
    color: 'black',
    textAlign: 'center',
    marginTop: 15,
  },
  logo: {
    width: 225,
    height: 225,
    marginBottom: 50,
  },
});

export default Login;
