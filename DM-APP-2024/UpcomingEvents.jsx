import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
} from "react-native";
import eventsData from "./api/events.js";

const parseEventDate = (eventDateString) => {
  if (typeof eventDateString !== "string") {
    console.error("Invalid or undefined eventDateString:", eventDateString);
    return { startDateTime: new Date(), endDateTime: new Date() }; // Return a default or handle as needed
  }

  const [datePart, times] = eventDateString.split(" ");
  const [startTime, endTime] = eventDateString.split("-");
  const [month, day] = datePart.split("/");
  const [startHour, startMinute] = startTime.split(":");
  const endParts = endTime.split("PM").join("").split("AM").join("").split(":");

  // Assuming your events are in 2023 and the timezone matches your system's
  const year = new Date().getFullYear(); // You might need to adjust this based on your event data
  const startDateTime = new Date(
    year,
    parseInt(month) - 1,
    parseInt(day),
    parseInt(startHour),
    parseInt(startMinute)
  );
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(
    parseInt(endParts[0]) + ((endParts[0] != 12) && endTime.includes("PM") ? 12 : 0),
    parseInt(endParts[1])
  );
  return { startDateTime, endDateTime };
};

const EventItem = ({ event, onPress }) => {
  return (
    <View style={styles.eventItem}>
      <Image source={event.image} style={styles.eventImage} />
      <Text style={styles.eventName}>{event.name}</Text>
      <Text style={styles.eventDate}>{event.date}</Text>
      <TouchableOpacity onPress={onPress} style={styles.learnMoreButton}>
        <Text style={styles.learnMoreButtonText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
};

const EventModal = ({ visible, onClose, event }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalCenteredView}>
        <View style={styles.modalView}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", }}
          >
            <Text style={styles.modalText}>{event.details}</Text>
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const UpcomingEventsScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    // Get the current date and time
    const now = new Date();
    // Filter events based on the end time
    const filteredEvents = eventsData.filter((event) => {
      const { endDateTime } = parseEventDate(event.date);
      return endDateTime > now;
    });
    setUpcomingEvents(filteredEvents);
  }, []);

  const handleLearnMorePress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>UPCOMING EVENTS</Text>
      <FlatList
        data={upcomingEvents}
        renderItem={({ item }) => (
          <EventItem event={item} onPress={() => handleLearnMorePress(item)} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          width: "95%",
          alignSelf: "center",
          borderRadius: 10,
        }}
      />
      {/* {upcomingEvents.map((event) => (
        <EventItem
          key={event.id}
          event={event}
          onPress={() => handleLearnMorePress(event)}
        />
      ))} */}
      {selectedEvent && (
        <EventModal
          visible={modalVisible}
          onClose={closeModal}
          event={selectedEvent}
        />
      )}
    </View>
  );
};

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;
const eventItemWidth = screenWidth * 0.9;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 20,
    backgroundColor: "#233563",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "white",
    borderRadius: 10,
    marginTop: 20,
  },
  eventItem: {
    borderRadius: 10,
    width: eventItemWidth,
    backgroundColor: "white",
    padding: 20,
    marginBottom: 16,
    alignSelf: "center",
    overflow: "hidden",
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    borderRadius: 10,
  },
  eventDate: {
    fontSize: 16,
    color: "gray",
    borderRadius: 10,
  },
  eventImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  learnMoreButton: {
    marginTop: 16,
    backgroundColor: "#E2883C",
    padding: 10,
    borderRadius: 5,
  },
  learnMoreButtonText: {
    color: "white",
    textAlign: "center",
    borderRadius: 10,
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    marginTop: 22,
    borderRadius: 10,
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
    width: screenWidth * 0.8,
    height: screenHeight * 0.33,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    borderRadius: 10,
    marginVertical: 30,
  },
  closeButton: {
    backgroundColor: "grey",
    borderRadius: 5,
    padding: 10,
    marginTop: 12,
    marginBottom: 1,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
    borderRadius: 10,
  },
});

export default UpcomingEventsScreen;