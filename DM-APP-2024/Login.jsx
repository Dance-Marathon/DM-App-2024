import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Image,
} from 'react-native';
import { handleLogin, handleSignUp } from './Firebase/AuthManager.js';
import { useNavigation } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [donorDriveLink, setDonorDriveLink] = useState('');
    const [create, setCreate] = useState(true);
    const [role, setRole] = useState('');
    const [loginFailed, setLoginFailed] = useState(false);
    const navigation = useNavigation();
    const [isFocus, setIsFocus] = useState(false);
  
    const dismissKeyboard = () => {
      Keyboard.dismiss();
    };
  
    const handleForgotPassword = () => {
      navigation.navigate('ForgotPassword');
    };
  
    const handleLoginPress = async () => {
      const loginResult = await handleLogin(email, password);
  
      if (loginResult === 'success') {
        setLoginFailed(false);
      } else {
        setLoginFailed(true);
      }
    };

    const roles = [
      { label: 'Dancer', value: 'Dancer' },
      { label: 'ELP', value: 'ELP' },
      { label: 'Ambassador', value: 'Ambassador' },
      { label: 'Captain', value: 'Captain' },
      { label: 'Assistant Director', value: 'Assistant Director' },
      { label: 'Overall', value: 'Overall' },
      { label: 'Manager', value: 'Manager' },
    ];
  
    return (
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <Image style={styles.logo} source={require('./images/year30_logo.png')} />
          
          {loginFailed && (
            <Text style={styles.errorMessage}>Incorrect email or password</Text>
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
  
              <TextInput
                style={styles.inputMiddle}
                value={password}
                onChangeText={(text) => setPassword(text)}
                placeholder="Password"
                secureTextEntry
              />
  
              {!create && (
                <TextInput
                  style={styles.inputBottom}
                  value={donorDriveLink}
                  onChangeText={setDonorDriveLink}
                  placeholder="Enter Your Donor Drive Link"
                  secureTextEntry
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
                valueField="role"
                placeholder={!isFocus ? 'Select item' : '...'}
                searchPlaceholder="Search..."
                value={role}
                onChange={item => {
                  setRole(role);
                  console.log(item.value);
                  setIsFocus(false);
                }}
              />
                )}
            </View>
  
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
  
            <Text style={{ marginLeft:10 }}> ________________________________</Text>
  
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>

            <Text style={styles.signUp}>
              New User?
              <TouchableOpacity style={{ marginBottom: -3 }} onPress={() => {
                  setCreate(false);
                  handleSignUp(email, password, role, donorDriveLink);
                }}>
                <Text style={{ color: '#61A0DA' }}> Sign Up!</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
  inputMiddle: {
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
  },
  inputBottom: {
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
  errorMessage: {
    color: 'white',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  dropdown: {
    marginTop: 10,
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
