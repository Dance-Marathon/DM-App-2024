// Page1.js (similar structure for other pages)
import React, { useState, useEffect } from 'react';
import ReactDOM from "react-dom";
import { View, Text, Image, StyleSheet, Button, Linking, Pressable } from 'react-native';

import { getTeamInfo, getUserMilestones, getUserIncentives, getUserBadges, getUserDonations, getTeamDonations, getUserInfo, getTeamRoster } from './api/index';

const userID = 1066318;
const teamID = 65487;
const eventID = 5803;

const Fundraiser = () => {
  const [userInfo, setUserInfo] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    getUserInfo(userID)
      .then((data) => {
        setUserInfo(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });
  }, [userID]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Fundraiser Page</Text>
      {userInfo && userInfo.displayName ? (
        <View>
          <Text>Display Name: {userInfo.displayName}</Text>
          <Text>Team: {userInfo.teamName}</Text>         
              <Image source={{ uri: userInfo.avatarImageURL }} style={styles.avatar}/>
              <Text>Progress: ${userInfo.sumDonations} of ${userInfo.fundraisingGoal}</Text>
              <Button
                onPress={() => Linking.openURL(userInfo.donateURL)}
                title="DonorDrive Page"
                color="#841584"
              />    
        </View>
      ) : (
        <Text>Loading user info...</Text>
      )}
      {error && <Text>Error: Failed</Text>}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
  },
});

export default Fundraiser;
