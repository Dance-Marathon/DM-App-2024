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

const Blog = () => {

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
      <Text style={styles.blogTitle}>Beyond This Moment</Text>
      {/* <Text style={styles.blogName}>By: Rylie Pryor</Text> */}
      <View style={styles.horizontalLine} />
      <View style={styles.column}>
        <View>
        <Text style={styles.mainText}>
          Do you remember the moment when you first learned how to ride a bike?
        </Text>
        <Text style={styles.mainText}>
          What about the moment when you met your best friend, got that job, got into college, or told someone that you loved them?
        </Text>
        </View>
        <View style={styles.image1Container}>
          <Image source={require('./images/DeBoerL_Closing-44.jpg')} style={{width: 125, height: 175, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
        </View>
      </View>
      <Text style={styles.mainText}>
          Maybe the moment when you first felt true inspiration and passion? The moment when you faced hardship and prevailed? The moment where you fell down and got back up?      
        </Text>
        <Text style={styles.mainText}>
        Now, think of the moment, not so long ago, when our total reveal numbers were raised high - demonstrating how hard we fought all year. In those moments, passion and hope coursed through our organization, our campus and our Miracle Families.
        </Text>
      <View style={styles.imageContainer}>
      <Image source={require('./images/GonzalezS-3.jpg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
      </View>
      <Text style={styles.mainText}>
        These are the moments that surround us every day. These are the moments that will stick with us forever and become parts of our stories. These are the moments that remind us why we fight. 
      </Text>
      <Text style={styles.mainText}>
        This summer, as many college students are living “in the moment,” we encourage you to live #BeyondThisMoment. 
      </Text>
      <Text style={styles.mainText}>
        Living beyond the moment has been a part of our story at Dance Marathon at the University of Florida for over thirty-one years, and we will not stop now. The growth that this organization has experienced over these years has allowed us to make millions of miracles for the children at UF Health Shands Children's Hospital, including a hospital renovation that just broke ground. This renovation means more moments of comfort and joy for children, some of whom we may never have the opportunity to meet. We fight for them so that they can have these moments that we hold so close to our hearts. 
      </Text>
      <View style={styles.imageContainer}>
        <Image source={require('./images/Gemme_Madilyn_ME_6011.jpg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
      </View>
      <Text style={styles.mainText}>
        We live beyond ourselves so that each child behind hospital walls has the opportunity to continue to grow #BeyondThisMoment. 
      </Text>
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

export default Blog;

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
