// Page1.js (similar structure for other pages)
import React from 'react';
import { View, Text } from 'react-native';
import {addCalanderEntry} from './Firebase/CalanderManager'
import { handleSignOut } from './Firebase/AuthManager';
const Profile = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Profile</Text>
      <button type="button" onClick={() => {
            handleSignOut()
          }} style={{ marginTop: '15px' }}>
            Sign Out
          </button>
    </View>
 
  );
}

export default Profile;
