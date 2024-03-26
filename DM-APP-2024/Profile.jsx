import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { handleSignOut } from './Firebase/AuthManager';
import { handleSignUp } from './Firebase/AuthManager';
import { addSpirtPoints } from './Firebase/SpirtPointManager';
import { addCalanderEntry } from './Firebase/CalanderManager';

const Profile = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => handleSignOut()}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => handleSignUp({
        email: "maxmartin54321@gmail.com",
        password: "test123",
        donorID: "123",
        role: "Captain",
        team: "Digital Marketing"
      })}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => addSpirtPoints({
        email: "maxmartin54321@gmail.com",
        password: "test123",
        donorID: "123",
        role: "Captain",
        team: "Digital Marketing"
      })}>
        <Text style={styles.buttonText}>Get Spirit Points</Text>
      </TouchableOpacity>
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
  button: {
    backgroundColor: '#61A0DA',
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default Profile;
