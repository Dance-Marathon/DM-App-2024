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
import { auth, db } from './Firebase/AuthManager';
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
        <Text style={styles.blogTitle}>Beyond This Summer</Text>
        <View style={styles.horizontalLine} />
        <Text style={styles.mainText}>
            This summer, you may have graduated, studied abroad, worked a job or an internship, or relaxed and read a book. Summer is a time to reset. For Dance Marathon at the University of Florida, we view summer as a transition period. We have returning members reflecting on the past year and how they can take the best moments and make them even better. We have newly promoted members lending their skills and talents to the team, helping over the summer to plan for the year ahead. Incoming freshmen begin to think about what they want their UF experience to look like. Some have been involved in Dance Marathon at their high schools or heard of it through older siblings and friends. And many more will learn about Dance Marathon for the first time as they enter college.
        </Text>
        <View style={styles.column}>
            <View>
                <Text style={styles.mainText}>
                    As you take the time this season to reset, think about how you want your year to look #BeyondThisSummer. What are your goals? Learn a new skill? Make more friends? Help more people? 
                </Text>
            </View>
            <View style={styles.image1Container}>
                <Image source={require('./images/IMG_3478.jpg')} style={{width: 125, height: 175, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
            </View>
        </View>
        <Text style={styles.mainText}>
            By joining Dance Marathon, you become part of a community that can give you all of this and even more than you can imagine. It is a place where you can find your best friends and make memories that last a lifetime. Use or learn a new skill while working with friends to raise money to change children’s lives. Your efforts, no matter how small, contribute to our collective goal of helping as many families as possible. 
        </Text>
        <View style={styles.imageContainer}>
        <Image source={require('./images/MW1-11.jpg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
        </View>
        <Text style={styles.mainText}>
            Our Miracle Families continue their fight every single day. While we may take a break from school, pediatric illness doesn’t take vacations. We must think about them while we take our time off of school and know that in the Fall semester, our efforts go beyond, with big moments such as Transform Today. Our Miracle Families continue to inspire us as our ongoing efforts and triumphs make an impact #BeyondThisSummer. 
        </Text>
        <Text style={styles.signature}>
            Lainey Shapiro
        </Text>
        <Text style={styles.title}>
            Dance Marathon at The University of Florida
        </Text>
        <Text style={styles.otherBottomText}>
            Public Relations,
        </Text>
        <Text style={styles.otherBottomText}>
            Assistant Director of Social Media
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
