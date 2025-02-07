import React, { useContext, useState, useEffect } from "react";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Toast, {BaseToast} from "react-native-toast-message";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
// import {
//   getUserInfo,
//   getUserMilestones,
//   getUserDonations,
//   getUserBadges,
// } from "./api/index";
import * as Clipboard from "expo-clipboard";
import * as Progress from "react-native-progress";
import { Icon } from "react-native-elements";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';
import LogoStyles from "./LogoStyles";


// import { getUserData } from "./Firebase/UserManager";

import { UserContext } from "./api/calls";

const Fundraiser = () => {
  //const [userID, setuserID] = useState("");
  //const [userInfo, setUserInfo] = useState({});
  //const [milestoneInfo, setMilestoneInfo] = useState({});
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [allMilestones, setAllMilestones] = useState({});
  //const [role, setRole] = useState("");
  //const [donationInfo, setDonationInfo] = useState({});
  const [allDonations, setAllDonations] = useState({});
  const [sortedDonations, setSortedDonations] = useState([allDonations]);
  //const [badgeInfo, setBadgeInfo] = useState({ badges: [] });
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [progress, setProgress] = useState(0);

  const {
    userID,
    role,
    userInfo,
    milestoneInfo,
    donationInfo,
    badgeInfo,
    isLoadingUserInfo,
    isLoadingMilestones,
    isLoadingDonations,
  } = useContext(UserContext);

  const variables = {
    userID,
    role,
    userInfo,
    milestoneInfo,
    donationInfo,
    badgeInfo,
    isLoadingUserInfo,
    isLoadingMilestones,
    isLoadingDonations,
  };

  const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: '#EB9F68',
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          color: "black", 
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
        }}
      />
    ),
    }

  Object.entries(variables).forEach(([key, value]) => {
    if (value === undefined) {
      console.log(`${key} is undefined`);
    }
  });

  //const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  //const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
  //const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const isAllDataLoaded =
    !isLoadingUserInfo && !isLoadingMilestones && !isLoadingDonations;

  // useEffect(() => {
  //   getUserData()
  //     .then((userData) => {
  //       setuserID(userData.donorID);
  //       setRole(userData.role);
  //       return getUserInfo(userData.donorID);
  //     })
  //     .then((userInfoData) => {
  //       setUserInfo(userInfoData);
  //       setIsLoadingUserInfo(false);
  //     })
  //     .catch((err) => {
  //       console.error("Error fetching user info:", err);
  //       setIsLoadingUserInfo(false);
  //     });
  // }, []);

  // useEffect(() => {
  //   if (userID) {
  //     getUserMilestones(userID)
  //       .then((milestonesData) => {
  //         setMilestoneInfo(milestonesData);
  //         setIsLoadingMilestones(false);
  //       })
  //       .catch((err) => {
  //         console.error("Error fetching milestones:", err);
  //         setIsLoadingMilestones(false);
  //       });
  //   }
  // }, [userID]);

  // useEffect(() => {
  //   if (userID) {
  //     getUserDonations(userID)
  //       .then((donationsData) => {
  //         setDonationInfo(donationsData);
  //         setIsLoadingDonations(false);
  //       })
  //       .catch((err) => {
  //         console.error("Error fetching donations:", err);
  //         setIsLoadingDonations(false);
  //       });
  //   }
  // }, [userID]);

  // useEffect(() => {
  //   getUserBadges(userID)
  //     .then((data) => {
  //       setBadgeInfo(data);
  //       console.log("Fetched Badges:", data);
  //     })
  //     .catch((err) => {
  //       console.error("Error fetching badges:", err);
  //     });
  // }, [userID]);

  useEffect(() => {
    if (userID && userInfo.numMilestones) {
      for (let i = 0; i < userInfo.numMilestones; i++) {
        const milestone = milestoneInfo.milestones[i];
        if (userInfo.sumDonations < milestone.amount) {
          break;
        }
        setMilestoneIndex(i - 1);
      }
    }
  }, [userID, userInfo, milestoneInfo]);

  useEffect(() => {
    if (userID) {
      const allMilestones = [];
      for (let i = 0; i < userInfo.numMilestones; i++) {
        const milestone = milestoneInfo.milestones[i];
        allMilestones.push(milestone);
      }
      setAllMilestones(allMilestones);
    }
  }, [userID, userInfo, milestoneInfo]);

  useEffect(() => {
    if (userID && donationInfo?.donations) {
      const allDonations = [];
      for (let i = 0; i < userInfo.numDonations; i++) {
        const donation = donationInfo.donations[i];
        if (donation?.amount != null) {
          allDonations.push(donation);
        }
      }
      setAllDonations(allDonations);
    }
  }, [userID, userInfo, donationInfo]);

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
  }, []);

  const copyToClipboard = () => {
    const text = userInfo.donateURL;
    Clipboard.setStringAsync(text)
    .then(() => {
      Toast.show({
        type: "success",
        text1: "DonorDrive Link Copied!",
        position: "bottom",
        visibilityTime: 3000, // Auto-hide in 3 seconds
        autoHide: true,
      });
    })
    .catch((err) => console.error("Error copying to clipboard:", err));
  };


  const openBadgeModal = (badge) => {
    setSelectedBadge(badge);
    setBadgeModalVisible(true);
  };

  const closeBadgeModal = () => {
    setBadgeModalVisible(false);
    // setSelectedBadge(null); <-- this was causing the modal to show a random badge when it was closed
  };

  useEffect(() => {
    if (userInfo && userInfo.sumDonations && userInfo.fundraisingGoal) {
      setProgress(userInfo.sumDonations / userInfo.fundraisingGoal);
    }
    console.log("Progress:", progress);
  }, [userInfo]);

  // if (!isAllDataLoaded) {
  //   return (
  //     <View style={styles.container}>
  //       <Text style={{ color: "white", fontSize: 18 }}>Loading...</Text>
  //     </View>
  //   );
  // }

  if (isLoadingUserInfo || isLoadingMilestones || isLoadingDonations) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalView}>
                <View style={styles.header}>
                  <Text style={styles.milestones}>Milestones</Text>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setModalVisible(false)}
                  >
                    <FontAwesomeIcon icon={faX} size={24} color="white" style={styles.closeButton}/>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalMilestonesContainer}>
                  {Array.isArray(allMilestones) && userInfo.numMilestones > 0 ? (
                    allMilestones.map((milestone, index) => (
                      <View key={index} style={styles.milestoneRow}>
                        <Icon
                          name={
                            milestone.fundraisingGoal <= userInfo.sumDonations
                              ? "check-square"
                              : "square"
                          }
                          type="font-awesome-5"
                          size={24}
                          color="white"
                          style={{ marginRight: 10 }}
                        />
                        <Text style={styles.milestoneAmount}>
                          ${milestone.fundraisingGoal}
                        </Text>
                        <Text style={styles.milestoneDescription}>
                          {milestone.description}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: "white" }}>No milestones to display</Text>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


      <Image
        style={LogoStyles.logo}
        resizeMode="contain"
        source={require("./images/PrimaryLogo.png")}
      />

      {userInfo && allMilestones && (
        <View style={styles.info}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: userInfo.avatarImageURL }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.displayName}>{userInfo.displayName}</Text>
              <View style={styles.tagsContainer}>
                <View style={styles.section}>
                  <FontAwesome name="circle" size={15} color="orange" />
                  <Text style={styles.tag}>{userInfo.teamName}</Text>
                </View>
                <View style={styles.section}>
                  <FontAwesome name="circle" size={15} color="orange" />
                  <Text style={styles.tag}>{role}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text
              style={{
                color: "white",
                marginBottom: 5,
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              ${userInfo.sumDonations} RAISED
            </Text>
            <Text
              style={{
                color: "white",
                marginBottom: 5,
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              GOAL ${userInfo.fundraisingGoal}
            </Text>
          </View>

          <View style={{ position: "relative", width: 340 }}>
            <Progress.Bar
              progress={progress}
              width={340}
              borderColor="white"
              color="#233D72"
              height={40}
              borderRadius={25}
              backgroundColor="white"
            />
            <View style={styles.milestonesContainer}>
              {userInfo.numMilestones > 0 &&
                milestoneInfo.milestones.map((milestone, index) => {
                  const milestonePosition = Math.min(
                    milestone.fundraisingGoal / userInfo.fundraisingGoal,
                    1
                  );
                  return (
                    <View
                      key={index}
                      style={[
                        styles.milestoneMarker,
                        {
                          left: `${milestonePosition * 100}%`,
                          transform: [{ translateX: -4 }, { translateY: -18 }],
                        },
                      ]}
                    >
                      <Text style={styles.milestoneText}>
                        {milestone.amount}
                      </Text>
                    </View>
                  );
                })}
            </View>
          </View>

          <View style={styles.textContainer}>
            {allMilestones?.[milestoneIndex + 1]?.fundraisingGoal ? (
              <Text
                style={{
                  color: "white",
                  marginBottom: 5,
                  fontSize: 12,
                }}
              >
                NEXT MILESTONE: $
                {allMilestones[milestoneIndex + 1].fundraisingGoal}
              </Text>
            ) : (
              <Text
                style={{
                  color: "white",
                  marginBottom: 5,
                  fontSize: 12,
                }}
              >
                All Milestones Complete!
              </Text>
            )}
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.showAll}>Show All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            style={{
              marginTop: 10,
              maxHeight: 50,
              maxWidth: 340,
            }}
          >
            {badgeInfo.badges && badgeInfo.badges.length > 0 ? (
              badgeInfo.badges.map((badge, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => openBadgeModal(badge)}
                >
                  <Image
                    source={{ uri: badge.badgeImageURL }}
                    style={styles.image}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View />
            )}
          </ScrollView>

          {selectedBadge && (
            <Modal
              animationType="fade"
              transparent={true}
              visible={badgeModalVisible}
              onRequestClose={closeBadgeModal}
            >
              <TouchableWithoutFeedback onPress={closeBadgeModal}>
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback>
                <View style={styles.badgeView}>
                  <View style={[styles.header, { marginBottom: -10 }]}>
                    <TouchableOpacity
                      style={[styles.modalClose, { marginLeft: 110 }]}
                      onPress={closeBadgeModal}
                    >
                      <FontAwesomeIcon icon={faX} size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
                  <Text style={styles.modalDescription}>
                    {selectedBadge.description}
                  </Text>
                  <Image
                    source={{ uri: selectedBadge.badgeImageURL }}
                    style={styles.modalImage}
                  />
                </View>
                </TouchableWithoutFeedback>
              </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}

          <View style={styles.rectangleView}>
            <View style={styles.header}>
              <FontAwesome name="dollar" size={18} color="orange" />
              <Text style={styles.headerText}>DONATIONS</Text>
            </View>
            <View style={{ marginTop: 5, marginLeft: 5, flex: 1 }}>
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
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      top: 100,
                    }}
                  >
                    <Text style={{ color: "white" }}>
                      It's empty in here...
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.showDonordrivePageButton}
              onPress={() => Linking.openURL(userInfo.donateURL)}
            >
              <Text style={styles.buttonText}>DonorDrive</Text>
            </TouchableOpacity>
            
          </View>
          <TouchableOpacity
              onPress={copyToClipboard}
              style={styles.copyToClipboard}
            >
              <Icon name="link" type="font-awesome-5" color="white" />
            </TouchableOpacity>
            <Toast />
        </View>
      )}
      <Toast config={toastConfig} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#233563",
  },
  avatar: {
    width: 100,
    height: 100,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  tagsContainer: {
    minWidth: "85%",
    maxWidth: "85%",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  textInput: {
    width: 150,
    height: 40,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    backgroundColor: "#233D72",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: 340,
    height: 300,
  },
  badgeView: {
    backgroundColor: "#233D72",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: 300,
    maxHeight: 400,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  info: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 60,
    top: 30,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 350,
    justifyContent: "left",
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "white",
    marginLeft: 5,
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "80%",
    marginTop: 5,
  },
  displayName: {
    fontWeight: "bold",
    fontSize: 24,
    color: "white",
  },
  tag: {
    fontSize: 14,
    color: "white",
    marginRight: 5,
    marginLeft: 5,
  },
  rectangleView: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    width: 340,
    height: 290,
    marginTop: 5,
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
    fontSize: 18,
  },
  image: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 10,
  },
  copyImage: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "white",
  },
  modalDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "white",
  },
  modalImage: {
    width: 150,
    height: 150,
    marginVertical: 10,
  },
  closeButton: {
    top: 0,
    right: -10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  dmlogo: {
    top: 30,
    width: "90%",
    height: 75,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    
  },
  smallCircle: {
    width: 15,
    height: 15,
    borderRadius: 50,
    backgroundColor: "#EB9F68",
    marginRight: 5,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  milestonesContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  milestoneMarker: {
    position: "absolute",
    top: "90%",
    width: 8,
    height: 8,
    borderRadius: 50,
    backgroundColor: "#B8B5B5",
  },
  milestoneText: {
    position: "absolute",
    top: -20,
    fontSize: 12,
    color: "white",
    textAlign: "center",
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
    left: 5,
  },
  showAll: {
    color: "white",
    fontSize: 12,
    textDecorationLine: "underline",
    marginTop: -5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    //width: "60%",
    marginTop: 10,
  },
  showDonordrivePageButton: {
    backgroundColor: "#E2883C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    //alignItems: "center",
    //justifyContent: "center",

  },
  copyToClipboard: {
    position: "absolute",
    right: "18%",
    bottom: 6,
  },
  touchable: {
    // width: 40,
    // height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeImage: {
    right: 6,
    resizeMode: "contain",
  },
  chainImage: {
    resizeMode: "contain",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  milestones: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    right: 80,
    top: -10,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  modalClose: {
    justifyContent: "right",
    alignItems: "center",
    left: 75,
    top: -10,
  },
  modalMilestonesContainer: {
    width: "100%",
    backgroundColor: "#233D72",
    padding: 20,
    borderRadius: 10,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  milestoneAmount: {
    fontWeight: "bold",
    color: "white",
    fontSize: 16,
    width: 80,
  },
  milestoneDescription: {
    color: "white",
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },
  milestoneSquare: {
    width: 16,
    height: 16,
    marginLeft: 10,
    borderRadius: 2,
  },
});

export default Fundraiser;
