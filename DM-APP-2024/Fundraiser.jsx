import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Button, Linking, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { getUserInfo, getUserMilestones, getUserDonations, getUserBadges } from './api/index';
import * as Clipboard from 'expo-clipboard';
// import { auth, db } from './Firebase/AuthManager';
// import { doc, getDoc } from 'firebase/firestore';
import * as Progress from 'react-native-progress';

import { getUserData } from './Firebase/UserManager';

const Fundraiser = () => {
  const [userIDState, setUserIDState] = useState('');
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
  const [badgeInfo, setBadgeInfo] = useState({ badges: [] });
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [progress, setProgress] = useState(0);

  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const isAllDataLoaded = !isLoadingUserInfo && !isLoadingMilestones && !isLoadingDonations;

  useEffect(() => {
    getUserData().then((data) => {
      console.log("Fetched User Data:", data);
      setUserIDState(data.donorID);
      setRole(data.role);
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
        setIsLoadingUserInfo(false); // Mark as loaded
      })
      .catch((err) => {
        console.error("Error fetching user info:", err);
        setIsLoadingUserInfo(false); // Also mark as loaded on error
      });
  }, [userIDState]);
  
  useEffect(() => {
    getUserMilestones(userIDState)
      .then((data) => {
        setMilestoneInfo(data);
        setIsLoadingMilestones(false);
      })
      .catch((err) => {
        console.error("Error fetching milestones:", err);
        setIsLoadingMilestones(false);
      });
  }, [userIDState]);
  
  useEffect(() => {
    getUserDonations(userIDState)
      .then((data) => {
        setDonationInfo(data);
        setIsLoadingDonations(false);
      })
      .catch((err) => {
        console.error("Error fetching donations:", err);
        setIsLoadingDonations(false);
      });
  }, [userIDState]);

  useEffect(() => {
    getUserBadges(userIDState)
      .then((data) => {
        setBadgeInfo(data);
        console.log("Fetched Badges:", data);
      })
      .catch((err) => {
        console.error("Error fetching badges:", err);
      });
  }, [userIDState]);
  
  useEffect(() => {
    if (userIDState && userInfo.numMilestones) {
      for (let i = 0; i < userInfo.numMilestones; i++) {
        const milestone = milestoneInfo.milestones[i];
        if (userInfo.sumDonations < milestone.amount) {
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
    }
  }, [userIDState, userInfo, milestoneInfo]);  

  useEffect(() => {
    if (userIDState && donationInfo?.donations) {
      const allDonations = [];
      for (let i = 0; i < userInfo.numDonations; i++) {
        const donation = donationInfo.donations[i];
        if (donation?.amount != null) { 
          allDonations.push(donation);
        }
      }
      setAllDonations(allDonations);
    }
  }, [userIDState, userInfo, donationInfo]);   

  useEffect(() => {
    console.log("Donations before sorting:", sortedDonations);
    const sorted = sortedDonations.sort((a, b) => {
      const dateA = new Date(a.createdDateUTC);
      const dateB = new Date(b.createdDateUTC);
      return dateB - dateA;
    });
    setSortedDonations(sorted);
    console.log("Donations after sorting:", sorted);
  }, []);

  const copyToClipboard = () => {
    const text = userInfo.donateURL;
    console.log("Copying URL to clipboard:", text);
    Clipboard.setStringAsync(text)
    .then(() => alert("Text copied to clipboard!"))
    .catch((err) => console.error("Error copying to clipboard:", err));
  };

  //const isProgressDataValid = typeof userInfo.sumDonations === "number" && typeof userInfo.fundraisingGoal === "number" && userInfo.fundraisingGoal > 0;

  const openBadgeModal = (badge) => {
    setSelectedBadge(badge);
    setBadgeModalVisible(true);
  };

  const closeBadgeModal = () => {
    setBadgeModalVisible(false);
    setSelectedBadge(null);
  };

  useEffect(() => {
    if (userInfo && userInfo.sumDonations && userInfo.fundraisingGoal) {
      setProgress(userInfo.sumDonations / userInfo.fundraisingGoal);
    }
    console.log("Progress:", progress);
  }, [userInfo]);

  return (
    <View style={styles.container}>
      {!isAllDataLoaded ? (
        // Display a loading message while waiting for all data to load
        <Text style={{ color: "white", fontSize: 18, marginTop: 20 }}>Loading...</Text>
      ) : (
        // Main content rendering after all data is loaded
        <>
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
                  {Array.isArray(allMilestones) && userInfo.numMilestones > 0 ? (
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
  
          {userInfo && (
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
                progress={progress}
                width={250}
                borderColor="white"
                color="white"
                height={20}
                borderRadius={10}
              />

              <ScrollView horizontal style={{ marginTop: 10, marginBottom: 10, maxHeight: 70, maxWidth: "90%", padding: 10 }}>
                {badgeInfo.badges && badgeInfo.badges.length > 0 ? (
                  badgeInfo.badges.map((badge, index) => (
                    <TouchableOpacity key={index} onPress={() => openBadgeModal(badge)}>
                      <Image source={{ uri: badge.badgeImageURL }} style={styles.image} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ color: 'white' }}>No badges to display</Text>
                )}
              </ScrollView>

              {selectedBadge && (
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={badgeModalVisible}
                  onRequestClose={closeBadgeModal}
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
                      <Text style={styles.modalDescription}>
                        {selectedBadge.description}
                      </Text>
                      <Image
                        source={{ uri: selectedBadge.badgeImageURL }}
                        style={styles.modalImage}
                      />
                      <TouchableOpacity onPress={closeBadgeModal} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              )}
  
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
                        donatorName = donation.displayName
                          ? donation.displayName
                          : "Anonymous";
                          donatorName = donatorName
                          .replace("Dance Marathon at UF", "")
                          .trim();
                        return (
                          <Text
                            style={{ fontSize: 16, color: "white" }}
                            key={index}
                          >
                            • {donatorName} - ${donation.amount}
                          </Text>
                        );
                      })
                    ) : (
                      <Text>No donations to display. Keep Fundraising!</Text>
                    )}
                  </ScrollView>
                </View>
              </View>
  
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.showDonordrivePageButton}
                  onPress={() => Linking.openURL(userInfo.donateURL)}
                >
                  <Text style={styles.buttonText}>DonorDrive Page</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.showMilestoneButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.buttonText}>Show Milestones</Text>
                </TouchableOpacity>
              </View>
  
              <View>
                <Button title="Copy DonorDrive URL" onPress={copyToClipboard} />
              </View>
            </View>
          )}
        </>
      )}
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
    borderRadius: 40,
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
    },
    image: {
      width: 50,
      height: 50,
      marginRight: 10,
      borderRadius: 10,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
      width: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    modalDescription: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 10,
    },
    modalImage: {
      width: 150,
      height: 150,
      marginVertical: 10,
    },
    closeButton: {
      marginTop: 10,
      backgroundColor: '#007AFF',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    closeButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    }
});

export default Fundraiser;