// Page1.js (similar structure for other pages)
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

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
        console.log(data);
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
            <div className="card" style={{ width: '200px', float: 'left', margin: '20px' }}>
              <img src={`${userInfo.avatarImageURL}`} img/>
              <div className="card-text">
                <div className="progress">
                  <div
                    className="progress-bar"
                    role="progressbar"
                    aria-valuenow="0"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style={{ width: `100%` }}
                  ></div>
                </div>
                <p>Progress: ${userInfo.sumDonations} of ${userInfo.fundraisingGoal}</p>
              </div>
            </div>
        </View>
      ) : (
        <Text>Loading user info...</Text>
      )}
      {error && <Text>Error: Failed</Text>}

    </View>
  );
}

export default Fundraiser;
