// Page1.js (similar structure for other pages)
import React from 'react';
import { View, Text, Image, Linking, StyleSheet } from 'react-native';
import {Button, Icon} from 'react-native-elements';


const About = () => {

  const openWebsite = (url) => {
    Linking.openURL(url);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title} >FOLLOW US</Text>
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
        buttonStyle={styles.button}  
      />
      <Text style={styles.title} >{}LEARN MORE</Text>
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
        buttonStyle={styles.button} 
      />
      <Text style={styles.title} >CONTACT US</Text>
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
      <Text style={styles.title} >PHOTOS</Text>
      <Button
      
        icon={<Icon name="camera" type="font-awesome" color="white" />} 
        title="  Shootproof"
        onPress={() => openWebsite('https://floridadm.shootproof.com/')}
        buttonStyle={styles.button} 
      />
    </View>
  );
    
  
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
    backgroundColor: '#blue',
  },
  title: {
    paddingVertical: 10,
    paddingHorizontal: 17,
    color: '#20232a',
    textAlign: 'left',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headline: {
    textAlign: 'center', 
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 0,
    width: 200,
    backgroundColor: 'yellow',
  },
  button: {
    backgroundColor: '#233563', 
    margin: 1, 
    justifyContent: 'flex-start', 
    paddingLeft: 14,
  },
});

export default About;
