import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Linking,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Button, Icon } from "react-native-elements";
import { handleSignOut } from "./Firebase/AuthManager";
import { auth } from "./Firebase/AuthManager";
import {
  deleteUserAccount,
  updateDDLink,
  updateRole,
} from "./Firebase/AuthManager";
import { Dropdown } from "react-native-element-dropdown";
import { clearUserDataCache, updateUserData } from "./Firebase/UserManager";
import { UserContext } from "./api/calls";
import { useNavigation } from "@react-navigation/native";

const About = () => {
  const [response, setResponse] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [newRole, setNewRole] = useState("");
  const [accountModalVisable, setAccountModalVisable] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const { role } = useContext(UserContext);
  const navigation = useNavigation();

  // Organization role options
  const roles = [
    { label: "Miracle Maker", value: "Miracle Maker" },
    { label: "ELP", value: "ELP" },
    { label: "Ambassador", value: "Ambassador" },
    { label: "Captain", value: "Captain" },
    { label: "Assistant Director", value: "Assistant Director" },
    { label: "Overall", value: "Overall" },
    { label: "Manager", value: "Manager" },
  ];

  // Open website in browser
  const openWebsite = (url) => {
    Linking.openURL(url);
  };

  // If given a response, use that response to determine to remove the user account
  useEffect(() => {
    if (response) {
      removeFunctions();
    }
  }, [response]);

  // Remove user account and sign out
  const removeFunctions = async () => {
    await clearUserDataCache();
    await deleteUserAccount();
    await handleSignOut();
  };

  // Confirm account deletion with user
  const confirmDeletion = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Yes", onPress: () => setResponse(true) },
        { text: "No", style: "cancel" },
      ],
      { cancelable: false }
    );
  };

  // Changes DonorDrive link
  const changeLink = async () => {
    const currentUID = auth.currentUser.uid;
    if (newLink !== "") {
      await updateDDLink(currentUID, newLink);
    }
    await updateUserData();
    toggleAccountModel();
  };

  // Changes user role
  const changeRole = async () => {
    const currentUID = auth.currentUser.uid;
    await updateRole(currentUID, newRole);
    await updateUserData();
    toggleAccountModel();
  };

  // Toggles account modal visibility
  const toggleAccountModel = () => {
    setAccountModalVisable(!accountModalVisable);
  };

  return (
    <ScrollView
    contentContainerStyle={{ flexGrow: 1, backgroundColor: "#1F1F1F" }}
    style={{ backgroundColor: "#1F1F1F" }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1F1F1F",
        }}
      >
        <Text style={styles.title}>ACCOUNT</Text>
        <View style={styles.accountBox}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.updateAccountButton}
              onPress={toggleAccountModel}
            >
              <Text style={styles.buttonText}>Update Account Info</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={() => handleSignOut()}
            >
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteAccountButton}
              onPress={() => confirmDeletion()}
            >
              <Text style={styles.buttonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.title}>FOLLOW US</Text>
        <View style={styles.boxes}>
          <Button
            icon={<Icon name="facebook" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="Facebook"
            onPress={() => openWebsite("https://www.facebook.com/floridaDM/")}
            buttonStyle={styles.button}
          />
          <Button
            icon={<Icon name="instagram" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="Instagram"
            onPress={() =>
              openWebsite("https://www.instagram.com/dmatuf/?hl=en")
            }
            buttonStyle={styles.button}
          />
          <Button
            icon={
              <Icon name="youtube-play" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>
            }
            title="Youtube"
            onPress={() =>
              openWebsite("https://www.youtube.com/@UFDanceMarathon")
            }
            buttonStyle={styles.button}
          />
          <Button
            icon={<Icon name="twitter" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="Twitter"
            onPress={() => openWebsite("https://twitter.com/floridadm?lang=en")}
            buttonStyle={styles.lastButton}
          />
        </View>
        <Text style={styles.title}>LEARN MORE</Text>
        <View style={styles.boxes}>
          <Button
            icon={<Icon name="info" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="CMN & UF Health"
            onPress={() => openWebsite("https://floridadm.org/about")}
            buttonStyle={styles.button}
          />
          <Button
            icon={<Icon name="question" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="Frequently Asked Questions"
            onPress={() => openWebsite("https://floridadm.org/events")} //Change this to FAQ
            buttonStyle={styles.button}
          />
          <Button
            icon={
              <Icon name="heart" type="font-awesome" color="white" size={16} style={{width: 30, marginRight: 10}}/>
            }
            title="Meet the Kids"
            onPress={() => openWebsite("https://floridadm.org/miraclefamilies")}
            buttonStyle={styles.button}
          />
          <Button
            icon={<Icon name="user" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="Meet the Overalls"
            onPress={() =>
              openWebsite("https://floridadm.org/contact")
            }
            buttonStyle={styles.lastButton}
          />
        </View>
        <Text style={styles.title}>CONTACT US</Text>
        <View style={styles.boxes}>
          <Button
            icon={<Icon name="globe" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="UF Health Office of Development"
            onPress={() =>
              openWebsite(
                "https://ufhealth.org/locations/uf-health-shands-childrens-hospital"
              )
            }
            buttonStyle={styles.button}
          />
          <Button
            icon={<Icon name="envelope" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="Email DM at UF"
            onPress={() => openWebsite("mailto:floridadm@floridadm.org")}
            buttonStyle={styles.lastButton}
          />
          {/* <Button
            icon={<Icon name="exclamation" type="font-awesome" color="white" style={{width: 24, marginRight: 10}}/>}
            title="Issues with the App?"
            onPress={() => openWebsite("https://forms.gle/8a3CQhh64xYtGu9K9")}
            buttonStyle={styles.exclamationButton}
          /> */}
        </View>
        <Text style={styles.title}>PHOTOS</Text>
        <View style={styles.boxes}>
          <Button
            icon={<Icon name="camera" type="font-awesome" color="white" style={{width: 30, marginRight: 10}}/>}
            title="Shootproof"
            onPress={() => openWebsite("https://floridadm.shootproof.com/")}
            buttonStyle={styles.lastButton}
          />
        </View>
        {role==="Admin" ? (
          <TouchableOpacity
            style={styles.adminButton}
            onPress={() => navigation.navigate("Admin")}
          >
            <Text style={styles.buttonText}>Admin Page</Text>
          </TouchableOpacity>
        ) : (
          <View style={{marginBottom: 20}}/>
        )}
      </View>
      <Modal
        visible={accountModalVisable}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            placeholder="Enter new DonorDrive link"
            value={newLink}
            onChangeText={(text) => setNewLink(text)}
          />
          <TouchableOpacity style={styles.updateButton} onPress={changeLink}>
            <Text style={styles.modalButtonText}>Update Link</Text>
          </TouchableOpacity>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={roles}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? "Select Your Role" : "..."}
            searchPlaceholder="Search..."
            value={newRole}
            onChange={(item) => {
              setNewRole(item.value);
              setIsFocus(false);
            }}
          />
          <TouchableOpacity style={styles.updateButton} onPress={changeRole}>
            <Text style={styles.modalButtonText}>Update Role</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={toggleAccountModel}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#233563",
  },
  boxes: {
    alignSelf: "stretch",
    padding: 5,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
  },
  title: {
    alignSelf: "stretch",
    paddingHorizontal: 20,
    color: "white",
    textAlign: "left",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginLeft: 10,
  },
  button: {
    backgroundColor: "#233D72",
    margin: 2,
    justifyContent: "flex-start",
    paddingLeft: 10,
    borderRadius: 5,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderColor: "#2B457A",
  },
  lastButton: {
    backgroundColor: "#233D72",
    margin: 2,
    justifyContent: "flex-start",
    paddingLeft: 10,
    borderRadius: 5,
    borderWidth: 0,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  updateAccountButton: {
    padding: 8,
    marginBottom: 5,
    marginTop: 5,
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#f18221",
  },
  signOutButton: {
    padding: 8,
    marginBottom: 5,
    marginTop: 5,
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#f18221",
  },
  deleteAccountButton: {
    padding: 8,
    marginLeft: 10,
    marginBottom: 5,
    marginTop: 5,
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#f18221",
  },
  exclamationButton: {
    backgroundColor: "#233D72",
    margin: 2,
    justifyContent: "flex-start",
    paddingLeft: 22,
    borderRadius: 5,
    borderWidth: 0,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalView: {
    marginTop: 250,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  dropdown: {
    marginTop: 15,
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
    width: 200,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#D9D9D9",
    width: "90%",
  },
  updateButton: {
    backgroundColor: "#E2883C",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "stretch",
  },
  closeButtonText: {
    color: "#233D72",
    textAlign: "center",
    fontWeight: "bold",
  },
  accountBox: {
    alignSelf: "stretch",
    padding: 10,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
  },
  adminButton: {
    padding: 8,
    marginBottom: 20,
    marginTop: 10,
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#f18221",
    width: "90%",
  },
});

export default About;
