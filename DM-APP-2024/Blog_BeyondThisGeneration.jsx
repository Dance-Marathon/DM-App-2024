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
        <Text style={styles.blogTitle}>Beyond This Generation</Text>
        <View style={styles.horizontalLine} />
        <Text style={styles.mainText}>
            When reflecting on what makes Dance Marathon at the University of Florida unique, one word should instinctively come to mind — “Generational.” An organization that has been standing for over three decades and that will, without a doubt, continue to stand #BeyondThisGeneration.        
        </Text>
        <Text style={styles.mainText}> 
          As we begin Year 31, let's take a moment to look back at the generations that came before us. We will find ourselves appreciating the life-changing impacts that have been made by past members of DM at UF, who paved the way for us to be standing here right now fighting for this cause.        
        </Text>
        <View style={styles.imageContainer}>
            <Image source={require('./images/IMG_0291.jpg')} style={{width: 300, height: 200, margin: 20, borderWidth: 2, borderColor: 'white'}}/>
        </View>
        <Text style={styles.mainText}>
            The beauty of our organization ultimately lies in being able to use the sum of our efforts for the greater good — that is, a life free from pediatric illness, where no child is forced to face a battle they did not choose to fight.
        </Text>
        <View style={styles.column}>
            <View>
                <Text style={styles.columnText}>
                    Whether you are fulfilling your “Why DM” in high school, college, or as an alum, each of these generations remain connected to the profound nature of this cause as they have one thing in common: being the heartbeat of our organization.            
                </Text> 
            </View>
            <View style={styles.image1Container}>
                <Image source={require('./images/DinowA.Opening-115.jpg')} style={{width: 150, height: 200, marginTop: 10, marginBottom: 20, marginLeft: 20, marginRight: 20, borderWidth: 2, borderColor: 'white'}}/>
            </View>
        </View>
        <Text style={styles.mainText}>
            Past, present, and future DM at UF members, be proud of yourselves for having already made an immense difference in the lives of our pediatric patients by raising over 31 million dollars for UF Health Shands Children's Hospital. Your generational efforts have contributed to the saving of so many lives and will continue to do so #BeyondThisGeneration.
        </Text>
        <Text style={styles.signature}>
            Anabella Fernandez
        </Text>
        <Text style={styles.title}>
            Dance Marathon at The University of Florida
        </Text>
        <Text style={styles.otherBottomText}>
            Public Relations,
        </Text>
        <Text style={styles.otherBottomText}>
            Assistant Director of Internal Communications
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
  columnText: {
    fontSize: 14,
    color: "white",
    textAlign: "left",
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 5,
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
