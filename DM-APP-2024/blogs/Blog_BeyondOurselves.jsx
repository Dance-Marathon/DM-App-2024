import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Platform,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Button,
  TextInput,
  FlatList,
  Alert,
  Linking,
} from "react-native";
import { auth, db } from '../Firebase/AuthManager';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Icon } from 'react-native-elements';

const Blog1 = () => {

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#233563",
      }}
    >
    <ScrollView style={styles.blogView}>
      <Text style={styles.blogTitle}>Beyond Ourselves</Text>
      <View style={styles.horizontalLine} />
      <View style={styles.column}>
        <View>
        <Text style={styles.mainText}>
        The founding members of Dance Marathon at The University of Florida came together thirty-one years ago with a common purpose of fighting pediatric illness. Each of these students shared the same passion that our students share today. For thirty-one years, we have been looking #BeyondOurselves. We encouraged others to look beyond themselves, and we've broken barriers to continue this fight to end pediatric illness for over three decades.
        </Text>
        </View>
        <View style={styles.image1Container}>
          <Image source={require('../images/Gemme_Madilyn_ME_9239.jpg')} style={{width: 150, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
        </View>
      </View>
      <Text style={styles.mainText}>
        There are countless reasons why we choose to make a difference; why we stand for 26.2 hours, why thousands of people receive texts, emails, and phone calls from us. We have many things in common with one another, with the most important reason being our purpose. Every student at Dance Marathon at UF joined this organization to experience these moments that support something #BeyondOurselves.        
      </Text>
      <View style={styles.imageContainer}>
        <Image source={require('../images/SydneyC_Closing-7.jpg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
      </View>
      <Text style={styles.mainText}>
      Our team is wholeheartedly fueled by passion for our cause. Fighting beyond ourselves doesn’t just mean learning a 7 minute line dance or posting graphics on social media. Fighting beyond ourselves means more birthdays, more graduations, and more moments for children battling pediatric illness.
      </Text>
      <Text style={styles.mainText}>
        We encouraged you to live #BeyondThisMoment during the summer. We now encourage you to reminisce for a second. Chances are, most of these moments involve your closest friends, your family, or other loved ones. The truth is that none of these moments would be possible without thinking #BeyondOurselves. We look beyond ourselves so more children have moments like the ones you recalled just now, the ones that you hold so close to your heart. 
      </Text>
      <View style={styles.imageContainer}>
        <Image source={require('../images/AD_Buchholz-106.jpg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
      </View>
      <Text style={styles.mainText}>
        This summer, we invite you to imagine the future generations. We urge you to think of someone you fight for. We welcome you to search beyond yourself, and join the family at Dance Marathon at the University of Florida. We look #BeyondOurselves, will you?      </Text>
      <Text style={styles.signature}>
        Rylie Pryor
      </Text>
      <Text style={styles.title}>
        Dance Marathon at The University of Florida
      </Text>
      <Text style={styles.otherBottomText}>
        Public Relations,
      </Text>
      <Text style={styles.otherBottomText}>
        Assistant Director of External Communication
      </Text>

    </ScrollView>
    </View>
  );
};

export default Blog1;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  blogView: {
    margin: 20,
    backgroundColor: "#233563",
    width: '95%',
  },
  blogTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  blogName: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
  mainText: {
    fontSize: 14,
    color: "white",
    textAlign: "left",
    margin: 5,
  },
  horizontalLine: {
    borderBottomColor: 'white',
    borderBottomWidth: 2,
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#233563",
  },
  image1Container: {
    flex: 1,
    justifyContent: "right",
    alignItems: "right",
    backgroundColor: "#233563",
    flexDirection: 'column',
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
  },
  topText: {
    fontSize: 14,
    color: "white",
    textAlign: "left",
    margin: 5,
    flexWrap: 'wrap',
  },
  signature: { 
    fontStyle: 'oblique',
    fontSize: 20,
    color: "white",
    textAlign: "left",
    marginTop: 5,
    marginLeft: 5,
  },
  title: { 
    fontSize: 14,
    color: "white",
    textAlign: "left",
    fontWeight: 'bold',
    marginTop: 3,
    marginLeft: 5,
  },
  otherBottomText: {
    fontSize: 12,
    color: "white",
    textAlign: "left",
    marginTop: 3,
    marginLeft: 5,
  }
});
