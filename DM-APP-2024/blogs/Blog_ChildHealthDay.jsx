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
      <Text style={styles.blogTitle}>#TheFirstChapters of Childhood</Text>
      <View style={styles.horizontalLine} />
      <Text style={styles.mainText}>
      Each day, students at the University of Florida wake up, attend classes, and go about their day. Members of Dance Marathon at UF choose to find time in their day to end pediatric illness. We choose to fundraise year-round. We choose to pack the O’Dome for 26.2 hours.        
      </Text>
      <View style={styles.column}>
        <View>
        <Text style={styles.mainText}>
        This is something that makes this organization so special. Each of our students makes an intentional choice to participate in Dance Marathon. This is a choice to immerse ourselves in a community of passion and hope. Today, we urge you to think about the choice that each of our students makes everyday. National Child Health Day is a time to look forward to the day that every child is able to continue to write their story.
        </Text>
        </View>
        <View style={styles.image1Container}>
          <Image source={require('../images/USE 1.jpeg')} style={{width: 150, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
        </View>
      </View>
      <Text style={styles.mainText}>
        National Child Health Day is on the first Monday of October. This is a day of unity for all children and families affected by pediatric illness. It serves as a day to promote organizations that are dedicated to this cause.
      </Text>
      <Text style={styles.mainText}>
        At Dance Marathon at the University of Florida, we are committed to assisting UF Health Shands Children’s Hospital in their efforts to provide the best care to children in need. In honor of Child Health Day, we are launching a new campaign, #TheFirstChapters. We can look back on our first few chapters and acknowledge how they’ve shaped who we have become. Our goal is to make a difference in every patient’s story, helping them write a new chapter full of endless possibilities.
      </Text>
      <View style={styles.imageContainer}>
        <Image source={require('../images/USE 2.jpeg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
      </View>
      <Text style={styles.mainText}>
        Every child deserves to live a life full of joyful chapters. Together, we can work to make sure they are able to do so. On this year’s National Child Health Day, we help to #WriteTheStory of children everywhere facing pediatric illness.      
      </Text>
      <Text style={styles.mainText}>
      With our help, children will be able to turn the page and begin a new chapter. One where they feel empowered to look towards the future. One where they finally close their first chapter by celebrating their last treatment, and begin their next chapter by celebrating at their next birthday party.
      </Text>
      <Text style={styles.signature}>
        Sarah Abisror
      </Text>
      <Text style={styles.title}>
        Dance Marathon at The University of Florida
      </Text>
      <Text style={styles.otherBottomText}>
        Public Relations,
      </Text>
      <Text style={styles.otherBottomText}>
        Captain
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
    marginTop: 15,
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
