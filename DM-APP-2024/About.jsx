import React, { useState, useEffect } from 'react';
import { View, Text, Image, Linking, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { handleSignOut } from './Firebase/AuthManager';
import { Agenda } from 'react-native-calendars';
import firebase from './Firebase/firebase';
import { auth, db } from './Firebase/AuthManager';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
const INITIAL_DATE = new Date();
import { deleteUserAccount, updateDDLink, updateRole } from './Firebase/AuthManager';
import { Dropdown } from "react-native-element-dropdown";

import { clearUserDataCache } from './Firebase/UserManager';

const About = () => {
  const [response, setResponse] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [newRole, setNewRole] = useState('');
  const [accountModalVisable, setAccountModalVisable] = useState(false);
  const [isFocus, setIsFocus] = useState(false);

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
  }

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
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Yes', onPress: () => setResponse(true) },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
    );
  };

  // Changes DonorDrive link
  const changeLink = async () => {
    const currentUID = auth.currentUser.uid;
    if (newLink !== '') {
      updateDDLink(currentUID, newLink);
    }
    toggleAccountModel();
  };

  // Changes user role  
  const changeRole = () => {
    const currentUID = auth.currentUser.uid;
    updateRole(currentUID, newRole);
    toggleAccountModel();
  };
  
  // Toggles account modal visibility
  const toggleAccountModel = () => {
    setAccountModalVisable(!accountModalVisable);
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title} >FOLLOW US</Text>
        <View style={styles.boxes}>
          <Button
            icon={<Icon name="facebook" type="font-awesome" color="white" />}
            title="  Facebook"
            onPress={() => openWebsite('https://www.facebook.com/floridaDM/')}
            buttonStyle={styles.button} 
          />
          <Button
            icon={<Icon name="instagram" type="font-awesome" color="white" />} 
            title="  Instagram"
            onPress={() => openWebsite('https://www.instagram.com/dmatuf/?hl=en')}
            buttonStyle={styles.button} 
          />
          <Button
            icon={<Icon name="youtube-play" type="font-awesome" color="white" />} 
            title="  Youtube"
            onPress={() => openWebsite('https://www.youtube.com/@UFDanceMarathon')}
            buttonStyle={styles.button} 
          />
          <Button
            icon={<Icon name="twitter" type="font-awesome" color="white" />} 
            title="  Twitter"
            onPress={() => openWebsite('https://twitter.com/floridadm?lang=en')}
            buttonStyle={styles.lastButton}  
          />
        </View>
        <Text style={styles.title} >{}LEARN MORE</Text>
        <View style={styles.boxes}>
          <Button
            icon={<Icon name="info" type="font-awesome" color="white" />}
            title="  CMN & UF Health"
            onPress={() => openWebsite('https://floridadm.org/about')}
            buttonStyle={styles.button}  
          />
          <Button
            icon={<Icon name="question" type="font-awesome" color="white" />} 
            title="  Frequently Asked Questions"
            onPress={() => openWebsite('https://floridadm.org/events')}
            buttonStyle={styles.button} 
          />
          <Button
            icon={<Icon name="heart" type="font-awesome" color="white" size={16} />} 
            title="  Meet the Kids"
            onPress={() => openWebsite('https://floridadm.org/about')}
            buttonStyle={styles.button} 
          />
          <Button
            icon={<Icon name="user" type="font-awesome" color="white" />} 
            title="  Meet the Overalls"
            onPress={() => openWebsite('https://floridadm.org/meet-the-overalls')}
            buttonStyle={styles.lastButton} 
          />
        </View>
        <Text style={styles.title} >CONTACT US</Text>
        <View style={styles.boxes}>
          <Button
            icon={<Icon name="globe" type="font-awesome" color="white" />}
            title="  UF Health Office of Development"
            onPress={() => openWebsite('https://ufhealth.org/locations/uf-health-shands-childrens-hospital')}
            buttonStyle={styles.button} 
          />
          <Button
            icon={<Icon name="envelope" type="font-awesome" color="white" />} 
            title="  Email DM at UF"
            onPress={() => openWebsite('mailto:floridadm@floridadm.org')}
            buttonStyle={styles.button} 
          />
          <Button
            icon={<Icon name="exclamation" type="font-awesome" color="white"/>} 
            title="  Issues with the app"
            onPress={() => openWebsite('https://forms.gle/x5oAfEKs4UZLHj3w9')}
            buttonStyle={styles.exclamationButton} 
          />
        </View>
        <Text style={styles.title} >PHOTOS</Text>
        <View style={styles.boxes}>
          <Button
            icon={<Icon name="camera" type="font-awesome" color="white" />} 
            title="  Shootproof"
            onPress={() => openWebsite('https://floridadm.shootproof.com/')}
            buttonStyle={styles.lastButton} 
          />
        </View>
        <View style={styles.buttonContainer} >
          <TouchableOpacity style={styles.signOutButton} onPress={toggleAccountModel}>
            <Text style={styles.buttonText}>Update Account Info</Text>
          </TouchableOpacity>
          </View>
        <View style={styles.buttonContainer} >
          <TouchableOpacity style={styles.signOutButton} onPress={() => handleSignOut()}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteAccountButton} onPress={() => confirmDeletion()}>
            <Text style={styles.buttonText}>Delete Account</Text>
          </TouchableOpacity>
          </View>
        </View>
        <Modal visible={accountModalVisable} transparent={true} animationType="slide">
        <View style={styles.modalView}>
          <TextInput
            style={styles.input}
            placeholder="Enter new DonorDrive link"
            value={newLink}
            onChangeText={text => setNewLink(text)}
          />
          <TouchableOpacity
            style={styles.updateButton}
            onPress={changeLink} >
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
          <TouchableOpacity
            style={styles.updateButton}
            onPress={changeRole} >
            <Text style={styles.modalButtonText}>Update Role</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={toggleAccountModel} >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#233563',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#233563',
  },
  boxes: {
    alignSelf: 'stretch',
    padding: 5,
    backgroundColor: '#233D72',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 5,
  },
  title: {
    alignSelf: 'stretch',
    paddingHorizontal: 20,
    color: 'white',
    textAlign: 'left',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#233563',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#233D72',
    margin: 2,
    justifyContent: 'flex-start',
    paddingLeft: 15,
    borderRadius: 5,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderColor: '#2B457A',
  },
  lastButton: {
    backgroundColor: '#233D72',
    margin: 2,
    justifyContent: 'flex-start',
    paddingLeft: 15,
    borderRadius: 5,
    borderWidth: 0,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize:18,
  },
  signOutButton: {
    backgroundColor: "#E2883C",
    padding: 8,
    borderRadius: 5,
    marginBottom: 10, 
    marginTop: 10,
    flex: 1,
  },
  deleteAccountButton: {
    backgroundColor: "#E2883C",
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
    marginBottom: 10, 
    marginTop: 10,
    flex: 1,
  },
  exclamationButton: {
    backgroundColor: '#233D72',
    margin: 2,
    justifyContent: 'flex-start',
    paddingLeft: 22,
    borderRadius: 5,
    borderWidth: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 350,
  },
  modalView: {
    marginTop: 250,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#233D72',
    textAlign: "center",
    fontWeight: "bold",
  },
});



export default About;