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
      <Text style={styles.blogTitle}>As Our Campuses Clash, {"\n"}Our Causes Unite</Text>
      <View style={styles.horizontalLine} />
      <View style={styles.column}>
        <View>
        <Text style={styles.mainText}>
          Our campus will soon be buzzing with students of the University of Florida and the University of Central Florida as the Gators and Knights face off on the football field. No matter the result, our fight doesn’t end when the final whistle blows.        </Text>
        </View>
        <View style={styles.image1Container}>
          <Image source={require('../images/CampusClashPic1.jpeg')} style={{width: 150, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
        </View>
      </View>
      <Text style={styles.mainText}>
        While this football game may cause a rivalry on the field, our Dance Marathon organizations are undoubtedly united. United under the stadium lights, united on one campus, united in purpose. As our campuses clash, our causes unite.      </Text>
      <Text style={styles.mainText}>
        It’s important to remember, even as our students banter over a sports game, that we all fight for more children to continue their stories. Rylie Manning, second-year Marathon Relations Committee Member at the University of Central Florida, knows what it’s like to fight for both of our hospitals.      </Text>
      <Text style={styles.mainText}>
        Dance Marathon is no new concept for Rylie. In high school, she participated in DM and fundraised for UF Health Shands Children’s Hospital. “It’s really full circle,” she said, “it was really awesome to fight for Shands.” Now, she has the opportunity to make an impact on Orlando Health Arnold Palmer Hospital for Children every day.       </Text>
      <Text style={styles.mainText}>
        Thanks to DM at UF and Knight-Thon, both UF Health Shands Children’s Hospital and Orlando Health Arnold Palmer Hospital for Children are undergoing life-saving renovations this year. More than we realize, our causes unite — just as our students do.      </Text>
      <View style={styles.imageContainer}>
        <Image source={require('../images/CampusClashPic2.jpeg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
      </View>
      <Text style={styles.mainText}>
        At DM at UF, we see this Campus Clash not as a rivalry, but a union of our causes. It serves as a reminder that each Children’s Miracle Network Hospital is working together for the next generation. “Getting to connect with other schools who fight for our same cause means so much,” Rylie explained, “it all goes back to the Miracle Kids we love.”      </Text>
      <Text style={styles.mainText}>
        This weekend at The Swamp, you will be surrounded by people working to help children continue to write their stories. We encourage you to think about the children watching this game behind hospital walls. Our fight doesn’t end when the last whistle blows in The Swamp. Our fight doesn’t end when the stadium lights turn off. Our fight doesn’t end until pediatric illness does.       </Text>
      <Text style={styles.mainText}>
        “When it comes to the future of children’s health, we’re all on the same team.”      </Text>
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
