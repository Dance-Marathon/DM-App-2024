// Page1.js (similar structure for other pages)
import React from 'react';
import { View, Text } from 'react-native';
import { handleSignOut } from './Firebase/AuthManager';
import { handleSignUp } from './Firebase/AuthManager';
import { addSpirtPoints } from './Firebase/SpirtPointManager';
import {addCalanderEntry} from './Firebase/CalanderManager'

const Profile = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Profile</Text>
      <button type="button" onClick={() => {
            handleSignOut()
          }} style={{ marginTop: '15px' }}>
            Sign Out
          </button>
      <button type="button" onClick={() => {
            let userData = {email: "maxmartin54321@gmail.com", password: "test123",  donorID: "123", role: "Captain", team: "Digital Marketing"}
            handleSignUp(userData)
          }} style={{ marginTop: '15px' }}>
            Sign Up
          </button>
          <button type="button" onClick={() => {
            let userData = {email: "maxmartin54321@gmail.com", password: "test123",  donorID: "123", role: "Captain", team: "Digital Marketing"}
            addSpirtPoints()
          }} style={{ marginTop: '15px' }}>
            Get Spirit Points
          </button>
    </View>
 
  );
}

export default Profile;
