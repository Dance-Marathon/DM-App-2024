import React, { useContext, useState, useEffect } from "react";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Icon } from "react-native-elements";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';

const FAQ = () => {

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <Image
        style={styles.dmlogo}
        resizeMode="contain"
        source={require("./images/PrimaryLogo.png")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#233563",
  },
  rectangleView: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    width: 340,
    height: 290,
    marginTop: 5,
  },
  dmlogo: {
    top: 30,
    width: "90%",
    height: 75,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallCircle: {
    width: 15,
    height: 15,
    borderRadius: 50,
    backgroundColor: "#EB9F68",
    marginRight: 5,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
    left: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FAQ;
