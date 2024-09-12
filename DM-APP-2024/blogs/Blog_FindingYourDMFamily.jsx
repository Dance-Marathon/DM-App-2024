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

const Blog5 = () => {

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
      <Text style={styles.blogTitle}>Finding Your DM Family</Text>
      <View style={styles.horizontalLine} />
      <View style={styles.column}>
        <View>
        <Text style={styles.mainText}>
            Each individual who gets involved in Dance Marathon at UF has their own skills, their own inspiration, and their own story. As DM recruitment week begins, we encourage you to explore what is important to you. Whether this is your first time hearing about our cause, or you first got involved as a Miracle Maker, Captain, Emerging Leader, or Ambassador, you have found a home in Dance Marathon.        </Text>
        </View>
        <View style={styles.image1Container}>
          <Image source={require('../images/IMG_4400.jpg')} style={{width: 150, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
        </View>
      </View>
      <Text style={styles.mainText}>
        This organization isn't just a philanthropy, but a family. One of our 2025 Assistant Directors, Maya Vaidya, shared her experience with her Dance Marathon family. Coming from out of state, Maya was unsure of what she wanted to get involved in, but she wanted to “be a part of something bigger” than herself. She first heard about DM through a conversation with a friend and eventually found the Emerging Leaders Program before becoming a Captain. Maya remembered, “Everyone was talking about DM and how it's changed their life,” and she had to be a part of it. “I heard about it, I applied, I interviewed, and then I fell in love,” she explained.      </Text>
      <Text style={styles.mainText}>
        She quickly realized that the Emerging Leader Program combined leadership with undertones of philanthropy - two of her passions. The program allowed her to be in a cohort with around 20 other people and four Captains guiding her through the process. She recalled, “A month in, I had 20 new best friends. I felt like I had met my platonic soulmates.”      </Text>
      <Text style={styles.mainText}>
        A year later, Maya returned to DM as a Leadership Development Captain. She explained, “I wanted my ELP's to fall in love with DM as much as I did.” She wanted to be the role model that her Leadership Development Captains were to her, and was successful at that. “The way that the ELP Captains are able to orchestrate this community between 20 strangers is just so cool,” Maya said.      </Text>
      <View style={styles.imageContainer}>
        <Image source={require('../images/IMG_4402.jpg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
      </View>
      <Text style={styles.mainText}>
      Going from a Freshman that had no idea what DM was or how much it would impact her life, Maya found her family in the Emerging Leader Program. She said, “You come out of it knowing you had a hand in doing something special. It's so special to have that connection and see everyone blossom.” This experience is something formative for so many future Captains, and our community is excited to see the next generation of ELP's this year. </Text>
      <Text style={styles.mainText}>
      We encourage you, whether you're unsure about DM or the plethora of organizations that UF has to offer, to take a step back and consider the Emerging Leader Program. A group of 20 strangers may soon become your best friends, your family, future captains, and change makers.      </Text>
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

export default Blog5;

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
