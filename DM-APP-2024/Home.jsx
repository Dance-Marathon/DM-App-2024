// Page1.js (similar structure for other pages)
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
} from "react-native";
import fetch from "node-fetch";
import { UpComingEventsScreen } from "./UpcomingEvents";
import UpcomingEventsScreen from "./UpcomingEvents";
const INITIAL_DATE = new Date();

const Home = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#233563",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ width: "95%", alignSelf: "center" }}
      >
        <Text style={styles.header}>MAIN EVENT FLOOR PLAN</Text>
        <View style={styles.eventItem}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image
              source={require("./images/rotateplan.png")}
              style={{
                width: eventItemWidth,
                height: 100,
                alignSelf: "center",
                resizeMode: "stretch",
              }}
            />
          </TouchableOpacity>
        </View>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <TouchableOpacity onPress={() => setModalVisible(!modalVisible)}>
                <Image
                  source={require("./images/floorplan.png")}
                  style={{ width: 300, height: 500, resizeMode: "contain" }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <UpcomingEventsScreen />
      </ScrollView>
    </View>
  );
};

export default Home;

const eventItemWidth = Dimensions.get("window").width * 0.9;

const styles = StyleSheet.create({
  eventItem: {
    width: eventItemWidth,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignSelf: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 20,
    color: "white",
    textAlign: "center",
  },
});