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
      <Text style={styles.blogTitle}>What It Means To Be A Miracle Maker</Text>
      <View style={styles.horizontalLine} />
      <Text style={styles.mainText}>
        With the help of the Miracle Makers here at The University of Florida, we are embarking on our 31st year of making miracles by supporting UF Health Shands Children's Hospital. Miracle Makers play a vital role in helping our organization #WriteTheStory. Our Miracle Makers help in fundraising, supporting, and raising awareness in our fight to end childhood illness.      </Text>
      <View style={styles.column}>
        <View>
        <Text style={styles.mainText}>
            As someone who started their journey in DM at UF as a Miracle Maker, I can certainly say that this role changed my life and helped me find my passion for this organization on a more personal level. At my first Main Event my freshman year, I was greeted by the most amazing and wonderful members who made me feel like I was a part of something much bigger than I could have ever imagined.        </Text>
        </View>
        <View style={styles.image1Container}>
          <Image source={require('../images/miraclemakerblog1.jpeg')} style={{width: 150, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
        </View>
      </View>
      <Text style={styles.mainText}>
      I was able to be a Miracle Maker with one of my close friends, who made a huge impact on my experience during the year. She helped me discover my deeper connection with this organization. I continuously fight to end childhood illness in honor of those who have had to go through themselves and with their loved ones.       </Text>
      <View style={styles.imageContainer}>
        <Image source={require('../images/miraclemaker.jpeg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
      </View>
      <Text style={styles.mainText}>
        Being a Miracle Maker gave me the chance to hear first-hand stories from our Miracle Families who were directly impacted by the funds we raised throughout our 31 years of DM at UF. The experiences I had throughout the year prior to the Main Event through fundraising, weekly check-ins, and social events paved the way for a life-changing Main Event experience. </Text>
      <Text style={styles.mainText}>
        Your love and passion for DM at UF might be found in your first moments with this organization, or maybe it will grow over time. Each story is different, which is what makes our organization so special. . The name says it all – this position allows you to constantly  make miracles and impact the lives of families and children right down the street at UF Health Shands Children’s Hospital. From sharing our cause to impacting the individuals you encounter throughout your time, you are a storyteller, a trailblazer, and, most importantly, a Miracle Maker.       </Text>
      <Text style={styles.signature}>
        Sofia Amoroso
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
    fontSize: 27,
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
