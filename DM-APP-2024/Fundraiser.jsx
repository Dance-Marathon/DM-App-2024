// Page1.js (similar structure for other pages)
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Button, Linking, TextInput } from 'react-native';
import { getUserInfo } from './api/index';

const defaultUserID = 1066318;

const Fundraiser = () => {
  const [userIDState, setUserIDState] = useState('');
  const [tempID, setTempID] = useState('');
  const [userInfo, setUserInfo] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    getUserInfo(userIDState)
      .then((data) => {
        setUserInfo(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });
  }, [userIDState]);

  const handleUserIDUpdate = () => {
    setUserIDState(tempID);
  };

  return (
    <View style={styles.container}>
      <Text>Fundraiser Page</Text>
      {userInfo && userInfo.displayName ? (
        <View>
          <Text>Display Name: {userInfo.displayName}</Text>
          <Text>Team: {userInfo.teamName}</Text>
          <View style={styles.imageContainer}>
            <Image source={{ uri: userInfo.avatarImageURL }} style={styles.avatar} />
          </View>
          <Text>Progress: ${userInfo.sumDonations} of ${userInfo.fundraisingGoal}</Text>
          <Button
            onPress={() => Linking.openURL(userInfo.donateURL)}
            title="DonorDrive Page"
            color="#841584"
          />
        </View>
      ) : (
        <View>
          <Text>Enter DonorDrive ID:</Text>
          <TextInput onChangeText={setTempID} value={tempID} style={styles.textInput}/>
          <Button title='Enter' onPress={handleUserIDUpdate}>
          </Button>
        </View>
      )}
      {error ? <Text message={error.message} /> : null}
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
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  textInput: {
    width: 150,
    height: 40,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  }
});

export default Fundraiser;

