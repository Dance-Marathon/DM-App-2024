// Page1.js (similar structure for other pages)
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Button, Linking, TextInput, Modal } from 'react-native';
import { getUserInfo, getUserMilestones } from './api/index';
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
              Alert.alert('Modal has been closed.');
              setModalVisible(!modalVisible);
            }}>
            <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text>Milestones</Text>
              <View>
                {Array.isArray(allMilestones) && allMilestones.length > 0 ? (
                  allMilestones.map((milestone, index) => (
                    <Text
                      key={index}
                      style={{
                        textDecorationLine: milestone.fundraisingGoal < userInfo.sumDonations ? 'line-through' : 'none'
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
            <Image source={{ uri: userInfo.avatarImageURL }} style={styles.avatar} />
            <View style={styles.profileSection}>
              <Text style={styles.displayName}>{userInfo.displayName}</Text>
              <Text style={styles.tag}>{userInfo.teamName}</Text>
              <Text style={styles.tag}>{role}</Text>
            </View>
          </View>
          <View style={styles.textContainer}>
            <Text style={{color:'white', marginRight:65, marginBottom:5}}>${userInfo.sumDonations} RAISED</Text>
            <Text style={{color:'white', marginBottom:5}}>GOAL ${userInfo.fundraisingGoal}</Text>
          </View>
          <Progress.Bar progress={userInfo.sumDonations/userInfo.fundraisingGoal} width={250} borderColor='white' 
                          color='white' height={20} borderRadius={10} marginBottom={10}/>
          <Text style={styles.tag}>Next milestone: {milestoneInfo.milestones[milestoneIndex].description} - ${milestoneInfo.milestones[milestoneIndex].fundraisingGoal}</Text>
          <Text style={styles.tag}>Number of donations: {userInfo.numDonations}</Text>
          <Button
            style={[styles.button, styles.buttonOpen]}
            onPress={() => setModalVisible(true)}
            title="Show Milestones"
          />
          <Button
            onPress={() => Linking.openURL(userInfo.donateURL)}
            title="DonorDrive Page"
            color="#841584"
          />
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
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40, // Make sure it is half of hight/width
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
});

export default Fundraiser;

