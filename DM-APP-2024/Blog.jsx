import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Icon } from 'react-native-elements';

const Blog = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView style={{width:'93%'}}>
      <TouchableOpacity onPress={() => navigation.navigate('MiracleMaker')}>
        <View style={styles.itemContainer}>
        <View style={styles.column}>
            <Image source={require('./images/01HDC709VZ4B4VP1VXGMKV2PDH-low-res-branded-.jpeg')} style={{width: 100, height: 100, borderRadius: 10}}/>
          <View style={styles.textView}>
          <Text style={styles.campusPostTitle}>What It Means To Be</Text>
          <Text style={styles.titleBottomText}>A Miracle Maker</Text>
          <Text style={styles.postText}>Written by Sofia Amoroso</Text>
          <Text style={styles.postText}>Posted on October 16th, 2024</Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ChildHealthDay')}>
        <View style={styles.itemContainer}>
        <View style={styles.column}>
            <Image source={require('./images/09C69520-7583-433B-894D-5D86EC5453FB.jpeg')} style={{width: 100, height: 100, borderRadius: 10}}/>
          <View style={styles.textView}>
          <Text style={styles.campusPostTitle}>#TheFirstChapters</Text>
          <Text style={styles.titleBottomText}>of Childhood</Text>
          <Text style={styles.postText}>Written by Sarah Abisror</Text>
          <Text style={styles.postText}>Posted on October 11th, 2024</Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('CampusClash')}>
        <View style={styles.itemContainer}>
        <View style={styles.column}>
            <Image source={require('./images/CampusClashSmallPic.jpeg')} style={{width: 100, height: 100, borderRadius: 10}}/>
          <View style={styles.textView}>
          <Text style={styles.campusPostTitle}>As Our Campuses Clash,</Text>
          <Text style={styles.titleBottomText}>Our Causes Unite</Text>
          <Text style={styles.postText}>Written by Rylie Pryor</Text>
          <Text style={styles.postText}>Posted on October 4th, 2024</Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Family')}>
        <View style={styles.itemContainer}>
        <View style={styles.column}>
            <Image source={require('./images/IMG_4404.jpg')} style={{width: 100, height: 100, borderRadius: 10}}/>
          <View style={styles.textView}>
          <Text style={styles.generationPostTitle}>Finding Your DM Family</Text>
          <Text style={styles.postText}>Written by Rylie Pryor</Text>
          <Text style={styles.postText}>Posted on September 6th, 2024</Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Generation')}>
        <View style={styles.itemContainer}>
        <View style={styles.column}>
            <Image source={require('./images/Gemme_Madilyn_ME_0951.jpg')} style={{width: 100, height: 100, borderRadius: 10}}/>
          <View style={styles.textView}>
          <Text style={styles.generationPostTitle}>Beyond This Generation</Text>
          <Text style={styles.postText}>Written by Anabella Fernandez</Text>
          <Text style={styles.postText}>Posted on August 14th, 2024</Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Summer')}>
        <View style={styles.itemContainer}>
        <View style={styles.column}>
            <Image source={require('./images/MadilynGTTFB4-17.jpg')} style={{width: 100, height: 100, borderRadius: 10}}/>
          <View style={styles.textView}>
          <Text style={styles.postTitle}>Beyond This Summer</Text>
          <Text style={styles.postText}>Written by Lainey Shapiro</Text>
          <Text style={styles.postText}>Posted on July 22nd, 2024</Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Ourselves')}>
        <View style={styles.itemContainer}>
        <View style={styles.column}>
            <Image source={require('./images/Gemme_Madilyn_ME_9239.jpg')} style={{width: 100, height: 100, borderRadius: 10}}/>
          <View style={styles.textView}>
          <Text style={styles.postTitle}>Beyond Ourselves</Text>
          <Text style={styles.postText}>Written by Rylie Pryor</Text>
          <Text style={styles.postText}>Posted on July 16th, 2024</Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Beyond')}>
        <View style={styles.itemContainer}>
        <View style={styles.column}>
            <Image source={require('./images/DeBoerL_Closing-44.jpg')} style={{width: 100, height: 100, borderRadius: 10}}/>
          <View style={styles.textView}>
          <Text style={styles.postTitle}>Beyond This Moment</Text>
          <Text style={styles.postText}>Written by Rylie Pryor</Text>
          <Text style={styles.postText}>Posted on June 12th, 2024</Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Blog;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#233563",
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginTop: 17,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "black",
    textAlign: "left",
    marginTop: 8,
  },
  generationPostTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "black",
    textAlign: "left",
    marginTop: 8,
  },
  campusPostTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 0,
    color: "black",
    textAlign: "left",
    marginTop: 2,
  },
  titleBottomText: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 10,
    color: "black",
    textAlign: "left",
    marginTop: 0,
  },
  postText: {
    fontSize: 14,
    color: "black",
    textAlign: "left",
    marginBottom: 3,
  },
  arrowButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  image1Container: {
    flex: 1,
    flexDirection: 'column',
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textView: {
    flexDirection: 'column',
    height: 100,
    marginLeft: 15,
  },
});
