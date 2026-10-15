import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "react-native-elements";
import { colors, card } from "./theme";

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
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        {notifications.length > 0 ? (
          notifications.map((notification, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleNotificationClick(notification)}
              style={[card, styles.notificationCard]}
            >
              <View style={styles.bellIconWrap}>
                <Icon name="bell" type="font-awesome" color={colors.navy} size={16} />
              </View>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle} numberOfLines={1}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMeta} numberOfLines={1}>
                  {notification.date} at {notification.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No notifications yet</Text>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setNotificationModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setNotificationModalVisible(false)}
                >
                  <FontAwesomeIcon icon={faX} color={colors.text} size={18} />
                </TouchableOpacity>
                {selectedNotification && (
                  <>
                    <Text style={styles.modalTitle}>
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
  },
  bellIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  notificationMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: "85%",
  },
  modalClose: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 6,
  },
  dateTime: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AllNotifications;
