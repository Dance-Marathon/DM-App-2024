import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Button,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { getUserData } from './Firebase/UserManager';
import { getUserInfo } from './api/index';
import axios from 'axios';

import { sheetsAPIKey } from './api/apiKeys';

const GenerateQRCode = () => {
  const [userIDState, setUserIDState] = useState('');
  const [userInfo, setUserInfo] = useState({});
  const [qrVisible, setQrVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [individualLeaderboard, setIndividualLeaderboard] = useState([]);
  const SPREADSHEET_ID = '1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY';
  const range = `Sheet1!A2:B100`;
  const individualRange = `Sheet2!A2:B600`;
  const apiKey = sheetsAPIKey;

  useEffect(() => {
    getUserData()
      .then((data) => {
        setUserIDState(data.donorID);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    if (userIDState) {
      getUserInfo(userIDState)
        .then((data) => {
          setUserInfo(data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [userIDState]);

  const userTeamScore = leaderboard.find(team => team[0] === userInfo.teamName)?.[1] || 0;

  const fetchLeaderboardData = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`
      );
      const sortedData = response.data.values
        .filter((row) => row[1])
        .map((row) => [row[0], parseInt(row[1], 10)])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      setLeaderboard(sortedData);
    } catch (error) {
      console.error('Error fetching leaderboard data', error);
    }
  };

  const fetchIndividualData = async () => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${individualRange}?key=${apiKey}`
      );
      const sortedData = response.data.values
        .filter((row) => row[1])
        .map((row) => [row[0], parseInt(row[1], 10)])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      setIndividualLeaderboard(sortedData);
    } catch (error) {
      console.error('Error fetching individual leaderboard data', error);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    fetchIndividualData();
  }, []);

  const qrData = `name: ${userInfo.displayName}, team: ${userInfo.teamName}`;

  return (
    <View style={styles.container}>
      <View style={styles.leaderboardContainer}>
        <Text style={styles.title}>Top 5 Teams</Text>
        {leaderboard.map((team, index) => (
          <View key={index} style={styles.leaderboardItem}>
            <Text style={styles.leaderboardText}>
              {index + 1}. {team[0]} - {team[1]} points
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.leaderboardContainer}>
        <Text style={styles.title}>Top 5 Individuals</Text>
        {individualLeaderboard.map((individual, index) => (
          <View key={index} style={styles.leaderboardItem}>
            <Text style={styles.leaderboardText}>
              {index + 1}. {individual[0]} - {individual[1]} points
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.teamScoreContainer}>
        <Text style={styles.teamScoreText}>
          {userInfo.teamName}'s Points: {userTeamScore}
        </Text>
      </View>

      <Button
        title={qrVisible ? 'Hide QR Code' : 'Show QR Code'}
        onPress={() => setQrVisible(!qrVisible)}
      />

      {/* Modal for QR Code */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={qrVisible}
        onRequestClose={() => {
          setQrVisible(!qrVisible);
        }}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <QRCode value={qrData} size={300} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setQrVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#233563',
    padding: 20,
    paddingTop: 80,
  },
  leaderboardContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  leaderboardItem: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  leaderboardText: {
    fontSize: 16,
    textAlign: 'center',
  },
  teamScoreContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  teamScoreText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  /* Styles for the modal */
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#233563',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default GenerateQRCode;
