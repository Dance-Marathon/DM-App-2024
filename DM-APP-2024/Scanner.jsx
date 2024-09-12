import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import axios from 'axios';
import getAccessToken from './api/googleAuth';
import { getUserData } from './Firebase/UserManager';
import { getUserInfo } from './api/index';

const Scanner = () => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [userData, setUserData] = useState({ name: '', team: '' });
    const [modalVisible, setModalVisible] = useState(false);
    const apiKey = 'AIzaSyDvksLIbk2gll7Me9846sFHG46ZcKZjAX8';
    const range = `Sheet1!A$1:B100`;
    const range2 = `Sheet2!A$1:B500`;
    const SPREADSHEET_ID = '1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY';

    const [data, setData] = useState([]);
    const [individualData, setIndividualData] = useState([]);

    const [userIDState, setUserIDState] = useState('');
    const [userInfo, setUserInfo] = useState({});

    useEffect(() => {
        getUserData().then((data) => {
          setUserIDState(data.donorID);
        })
        .catch((err) => {
          console.error(err);
          setError(err);
        });
      }, []);
    
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

    const fetchData = async () => {
        try {
            const response = await axios.get(
                `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${apiKey}`
            );
            setData(response.data.values);
            return response.data.values;
        } catch (error) {
            console.error('Error fetching data from Google Sheets', error);
        }
    };

    const fetchIndividualData = async () => {
        try {
            const response = await axios.get(
                `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range2}?key=${apiKey}`
            );
            setIndividualData(response.data.values);
            return response.data.values;
        } catch (error) {
            console.error('Error fetching data from Google Sheets', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchIndividualData(); 
    }, []);

    const updateTeamScore = async (token, teamName) => {
        console.log('SCANNED TEAM:', teamName);
        const fetchedData = await fetchData();
        console.log('Original Data: ', data);
        const teamRowIndex = fetchedData.findIndex(row => row[0] === teamName);
        console.log('Team Row Index:', teamRowIndex);
        const newIndex = teamRowIndex + 1;
        console.log('Team Row Index NEW:', newIndex);

        if (teamRowIndex !== -1) {
            const currentScore = parseInt(fetchedData[teamRowIndex][1], 10) || 0;
            console.log('Current Score:', currentScore);
            const updatedScore = currentScore + 1;
            console.log('Updated Score:', updatedScore);
            const cellRange = `Sheet1!B${teamRowIndex + 1}`;

            // Post the updated score to Google Sheets
            try {
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${cellRange}?valueInputOption=RAW`;

                const updateData = {
                    values: [[updatedScore]],
                  };

                  const config = {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  };

                const putResponse = await axios.put(url, updateData, config);

                console.log(putResponse.status);

                console.log('Cell updated successfully:', putResponse.data);
            } catch (error) {
                console.error('Error incrementing cell value:', error.response ? error.response.data : error.message);
            }
        } else {
            console.log('Team not found in the sheet');
        }
    };

    const updateIndividualScore = async (token, personName) => {
        const individualRowData = await fetchIndividualData();  
        console.log('Original Individual Data:', individualData);
        const individualRowIndex = individualData.findIndex(row => row[0] === personName);
        console.log('Individual Row Index:', individualRowIndex);

        if (individualRowIndex !== -1) {
            const individualScore = parseInt(individualData[individualRowIndex][1], 10) || 0;
            console.log('Current Individual Score:', individualScore);
            const newScore = individualScore + 1;
            console.log('Updated Score:', newScore);
            const newRange = `Sheet2!B${individualRowIndex + 1}`;

            // Post the updated score to Google Sheets
            try {
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${newRange}?valueInputOption=RAW`;

                const updateData = {
                    values: [[newScore]],
                  };

                  const config = {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  };

                const putResponse = await axios.put(url, updateData, config);

                console.log(putResponse.status);

                console.log('Cell updated successfully:', putResponse.data);
            } catch (error) {
                console.error('Error incrementing cell value:', error.response ? error.response.data : error.message);
            }
        } else {
            console.log('Individua; not found in the sheet');
        }
    };

    const postRowToSheet = async (token, recipient, team, reason, date, time, giver) => {
        const SPREADSHEET_ID = '1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY';
        console.log("Posting to sheet");
    
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet3:append?valueInputOption=RAW`;
    
            const rowData = [recipient, team, reason, date, time, giver];
    
            const postData = {
                values: [rowData],
            };
    
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };
    
            const response = await axios.post(url, postData, config);
    
            console.log('Row added successfully:', response.data);
            console.log('Response data:', JSON.stringify(response.data, null, 2));
            console.log('Response status:', response.status);
        } catch (error) {
            console.error('Error adding row to sheet:', error.response ? error.response.data : error.message);
        }
    };

    const getCurrentDate = () => {
        const currentDate = new Date();
      
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(currentDate.getDate()).padStart(2, '0');
      
        return `${year}-${month}-${day}`;
      };
      
      const getCurrentTime = () => {
        const currentDate = new Date();
      
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const seconds = String(currentDate.getSeconds()).padStart(2, '0');
      
        return `${hours}:${minutes}:${seconds}`;
      };

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = async ({ type, data }) => {
        setScanned(true);
        const extractedData = parseQRCodeData(data);
        if (extractedData) {
            const ACCESS_TOKEN = await getAccessToken();
            setUserData(extractedData);
            await updateTeamScore(ACCESS_TOKEN, extractedData.team.toString());
            console.log('Team Score Updated');
            await updateIndividualScore(ACCESS_TOKEN, extractedData.name.toString());
            console.log('Individual Score Updated');

            const date = getCurrentDate();
            const time = getCurrentTime();

            postRowToSheet(ACCESS_TOKEN, extractedData.name.toString(), extractedData.team.toString(), 'Scanned QR Code', date, time, userInfo.displayName);
            console.log("Row Added to Sheet");
        } else {
            setUserData({ name: 'Invalid QR code', team: '' });
        }
        setModalVisible(false);
        setScanned(false);
    };

    // Function to parse the QR code data
    const parseQRCodeData = (data) => {
        try {
            const parts = data.split(', ');
            const namePart = parts[0].split('name: ')[1];
            const teamPart = parts[1].split('team: ')[1];
            if (namePart && teamPart) {
                return { name: namePart, team: teamPart };
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    return (
        <View style={styles.container}>
            <Button title="Open Scanner" onPress={() => setModalVisible(true)} />

            {/* Modal for Scanner */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)} // Close the modal if back button is pressed
            >
                <View style={styles.modalContainer}>
                    <BarCodeScanner
                        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.infoContainer}>
                        <Text style={styles.topText}>THE PROCCESS FINISHES WHEN THE CAMERA CLOSES AUTOMATICALLY</Text>
                    </View>
                    {scanned ? (
                        <View style={styles.scannedContainer}>
                            <Text style={styles.scannedText}>Scanned!</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close Camera</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Modal>

            {/* Displaying User Data */}
            <View style={styles.resultText}>
                <Text style={styles.infoText}>User Name: {userData.name}</Text>
                <Text style={styles.infoText}>User Team: {userData.team}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultText: {
        marginTop: 20,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 20,
        marginVertical: 5,
    },
    closeButton: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: '#ff5c5c',
        padding: 10,
        borderRadius: 5,
    },
    scanAgainButton: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: 'blue',
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    topText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'red',
        textAlign: 'center',
        backgroundColor: 'black',
        padding: 10,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 100,
    },
    scannedText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'green',
        textAlign: 'center',
        backgroundColor: 'black',
        padding: 10,
    },
    scannedContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 100,
    },
});

export default Scanner;
