// Page1.js (similar structure for other pages)
import React from 'react';
import { View, Text, Image, Linking, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {Button, Icon} from 'react-native-elements';
import { handleSignOut } from './Firebase/AuthManager';


const About = () => {
  const openWebsite = (url) => {
    Linking.openURL(url);
  }

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
            onPress={() => openWebsite('https://floridadm.org/uf-health')}
            buttonStyle={styles.button}  
          />
          <Button
            icon={<Icon name="question" type="font-awesome" color="white" />} 
            title="  Frequently Asked Questions"
            onPress={() => openWebsite('https://floridadm.org/faq')}
            buttonStyle={styles.button} 
          />
          <Button
            icon={<Icon name="heart" type="font-awesome" color="white" size={16} />} 
            title="  Meet the Kids"
            onPress={() => openWebsite('https://floridadm.org/meet-the-kids.php')}
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
            buttonStyle={styles.lastButton} 
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
        <TouchableOpacity style={styles.signOutButton} onPress={() => handleSignOut()}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
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
  },
  signOutButton: {
    backgroundColor: '#E2883C',
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
    width: 200,
    marginBottom: 20,
  },
});


export default About;
