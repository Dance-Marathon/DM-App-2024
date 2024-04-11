// Page1.js (similar structure for other pages)
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Button, Linking, TextInput, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { getUserInfo, getUserMilestones, getUserDonations } from './api/index';
import * as Clipboard from 'expo-clipboard';
import { auth, db } from './Firebase/AuthManager';
import { doc, getDoc } from 'firebase/firestore';
import * as Progress from 'react-native-progress';

const defaultUserID = 1066318;

const Fundraiser = () => {
  const [userIDState, setUserIDState] = useState('');
  const [tempID, setTempID] = useState('');
  const [userInfo, setUserInfo] = useState({});
  const [error, setError] = useState('');
  const [milestoneInfo, setMilestoneInfo] = useState({});
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [allMilestones, setAllMilestones] = useState({});
  const [role, setRole] = useState('');
  const [donationInfo, setDonationInfo] = useState({});
  const [allDonations, setAllDonations] = useState({});
  const [sortedDonations, setSortedDonations] = useState([allDonations]);

  const displayDocumentData = async () => {
    try {
      const currentUID = auth.currentUser.uid;
      console.log(currentUID);
      const docRef = doc(db, "Users", currentUID);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log(data);
        setUserIDState(data.donorID);
        setRole(data.role);
      } else {
        console.log("Document does not exist");
      }
    } catch (error) {
      console.error("Error fetching document data:", error);
    }
  };

  useEffect(() => {
    displayDocumentData();
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

  useEffect(() => {
    getUserDonations(userIDState)
      .then((data) => {
        setDonationInfo(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });
  }, [userIDState]);

  useEffect(() => {
    getUserMilestones(userIDState)
      .then((data) => {
        setMilestoneInfo(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });
  }, [userIDState]);

  useEffect(() => {
    if (userIDState) {
      for (let i = 0; i < userInfo.numMilestones; i++) {
        const milestone = milestoneInfo.milestones[i];
        if (userInfo.sumDonations < milestone.amount) {
          console.log('Reached milestone:', milestone.description);
          break;
        }
        setMilestoneIndex(i-1);
      }
    }
  }, [userIDState, userInfo, milestoneInfo]);

  useEffect(() => {
    if (userIDState) {
      const allMilestones = [];
      for (let i = 0; i < userInfo.numMilestones; i++) {
        const milestone = milestoneInfo.milestones[i];
        allMilestones.push(milestone);
      }
      setAllMilestones(allMilestones);
      console.log(allMilestones)
    }
  }, [userIDState, userInfo, milestoneInfo]);  

  useEffect(() => {
    if (userIDState) {
      const allDonations = [];
      for (let i = 0; i < userInfo.numDonations; i++) {
        const donations = donationInfo.donations[i];
        allDonations.push(donations);
      }
      setAllDonations(allDonations);
      console.log(allDonations)
    }
  }, [userIDState, userInfo, milestoneInfo]);  

  // Method to sort the donations by their createdDateUTC in descending order
  useEffect(() => {
    const sorted = sortedDonations.sort((a, b) => {
      // Convert the createdDateUTC strings to Date objects for comparison
      const dateA = new Date(a.createdDateUTC);
      const dateB = new Date(b.createdDateUTC);
      return dateB - dateA; // Subtract to get the descending order
    });
    // Update the state with the sorted list of donations
    setSortedDonations(sorted);
    console.log('Sorted:',sortedDonations);
  }, []);

  const handleUserIDUpdate = () => {
    setUserIDState(tempID);
  };

  const copyToClipboard = () => {
    const text = userInfo.donateURL;
    Clipboard.setStringAsync(text);
    alert('Text copied to clipboard!');
  };

  const ProgressBar = () => {
    const progress = userInfo.sumDonations / userInfo.fundraisingGoal;
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text>Milestones</Text>
            <View>
              {Array.isArray(allMilestones) && allMilestones.length > 0 ? (
                allMilestones.map((milestone, index) => (
                  <Text
                    key={index}
                    style={{
                      textDecorationLine:
                        milestone.fundraisingGoal < userInfo.sumDonations
                          ? "line-through"
                          : "none",
                    }}
                  >
                    {milestone.description} - ${milestone.fundraisingGoal}
                  </Text>
                ))
              ) : (
                <Text>No milestones to display</Text>
              )}
            </View>
            <Button
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(!modalVisible)}
              title="Hide Milestones"
            />
          </View>
        </View>
      </Modal>
      {userInfo && userInfo.displayName && (
        <View style={styles.info}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: userInfo.avatarImageURL }}
              style={styles.avatar}
            />
            <View style={styles.profileSection}>
              <Text style={styles.displayName}>{userInfo.displayName}</Text>
              <Text style={styles.tag}>{userInfo.teamName}</Text>
              <Text style={styles.tag}>{role}</Text>
            </View>
          </View>
          <View style={styles.textContainer}>
            <Text style={{ color: "white", marginRight: 65, marginBottom: 5 }}>
              ${userInfo.sumDonations} RAISED
            </Text>
            <Text style={{ color: "white", marginBottom: 5 }}>
              GOAL ${userInfo.fundraisingGoal}
            </Text>
          </View>
          <Progress.Bar
            progress={userInfo.sumDonations / userInfo.fundraisingGoal}
            width={250}
            borderColor="white"
            color="white"
            height={20}
            borderRadius={10}
            marginBottom={5}
          />
          <Text style={{ marginBottom: 5, fontSize: 14, color: "white" }}>
            Next milestone:{" "}
            {milestoneInfo.milestones[milestoneIndex].description} - $
            {milestoneInfo.milestones[milestoneIndex].fundraisingGoal}
          </Text>
          <View style={styles.rectangleView}>
            <Text
              style={{
                color: "white",
                marginLeft: 10,
                marginTop: 5,
                fontSize: 24,
              }}
            >
              Donations - {userInfo.numDonations}
            </Text>
            <View style={{ marginTop: 5, marginLeft: 5, height: "85%" }}>
              <ScrollView>
                {Array.isArray(allDonations) && allDonations.length > 0 ? (
                  allDonations.map((donation, index) => {
                    displayName = donation.displayName
                      ? donation.displayName
                      : "Anonymous";
                    displayName = displayName
                      .replace("Dance Marathon at UF", "")
                      .trim();
                    return (
                      <Text
                        style={{ fontSize: 16, color: "white" }}
                        key={index}
                      >
                        • {displayName} - ${donation.amount}
                      </Text>
                    );
                  })
                ) : (
                  <Text>No donations to display. Keep Fundraising!</Text>
                )}
              </ScrollView>
            </View>
          </View>
          <View style={styles.buttonContainer} >
            <TouchableOpacity
              style={styles.showDonordrivePageButton}
              onPress={() => Linking.openURL(userInfo.donateURL)}>
                <Text style={styles.buttonText}>DonorDrive Page</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.showMilestoneButton}
              onPress={() => setModalVisible(true)}>
                <Text style={styles.buttonText}>Show Milestones</Text>
            </TouchableOpacity>
          </View>
          <View>
            <Button title="Copy DonorDrive URL" onPress={copyToClipboard} />
          </View>
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
    backgroundColor: '#233563',
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
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  info: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    width: 350,
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40, // Make sure it is half of height/width
    marginRight: 10,
  },
  textContainer: {
    flexDirection: 'row',
  },
  displayName: {
    fontWeight: 'bold',
    fontSize: 24,
    color: 'white',
  },
  tag: {
    fontSize: 14,
    color: 'white',
  },
  rectangleView: {
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    flex: 1,
    width: 350,
    height: 362,
    },
    showMilestoneButton: {
      backgroundColor: "#E2883C",
      padding: 8,
      borderRadius: 5,
      marginLeft: 10,
      marginBottom: 10, 
      marginTop: 10,
      flex: 1,
    },
    buttonText: {
      color: "white",
      textAlign: "center",
      fontWeight: "bold",
      fontSize:18,
    },
    showDonordrivePageButton: {
      marginTop: 10,
      backgroundColor: "#E2883C",
      padding: 8,
      borderRadius: 5,
      marginBottom: 10,
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 350,
    }
});

export default Fundraiser;

