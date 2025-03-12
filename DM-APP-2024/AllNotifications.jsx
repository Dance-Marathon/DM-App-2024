import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";

const AllNotifications = ({ route }) => {
  const { notifications } = route.params;

  const [selectedNotification, setSelectedNotification] = useState("");
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setNotificationModalVisible(true);
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <ScrollView style={{ width: "100%" }}>
        <View style={{ alignItems: "center", paddingBottom: 50}}>
          {notifications.map((notification, index) => (
            <TouchableOpacity
            key={index}
            onPress={() => handleNotificationClick(notification)}
            style={{ width: "100%", alignItems: "center" }}
          >
            <View key={index} style={styles.notificationContainer}>
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
            </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setNotificationModalVisible(false)}>
        <View style={[styles.modalContainer, {position: "relative"}]}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
                <Text style={[styles.notificationTitle, { marginTop: 0, fontSize: 20 }]}>
                  {selectedNotification.title}
                </Text>
                <Text style={styles.dateTime}>
                  {selectedNotification.date} at {selectedNotification.time}
                </Text>
                <Text style={styles.description}>
                  {selectedNotification.message}
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setNotificationModalVisible(false)}
            >
              <FontAwesomeIcon icon={faX} color="white" size={20} />
            </TouchableOpacity>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  detailsBox: {
    top: 180,
    borderRadius: 9,
    backgroundColor: "#233d72",
    width: 340,
    height: 460,
    position: "absolute",
    shadowOpacity: 1,
    elevation: 4,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowColor: "rgba(0, 0, 0, 0.25)",
    padding: 20,
  },
  modalClose: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  notificationContainer: {
    backgroundColor: "#233d72",
    alignItems: "center",
    height: 40,
    width: "90%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    top: 25,
  },
  notificationTitle: {
    color: "white",
    fontSize: 16,
    marginVertical: 10,
  },
  dateTime: {
    color: "white",
    fontSize: 14,
    marginBottom: 10,
  },
  location: {
    color: "white",
    fontSize: 14,
    marginBottom: 10,
  },
  description: {
    color: "white",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#233d72",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  eventsList: {
    paddingTop: 10,
  },
  closeButton: {
    backgroundColor: "#f18221",
    padding: 10,
    borderRadius: 10,
    width: 80,
    alignItems: "center",
  },
});

export default AllNotifications;
