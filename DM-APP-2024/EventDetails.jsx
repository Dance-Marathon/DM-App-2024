import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const EventDetails = ({ route }) => {
  const { event } = route.params;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <View style={styles.eventContainer}>
        {event.imageUrl && (
          <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
        )}
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{event.title}</Text>
        </View>
      </View>
      <View style={styles.detailsBox}>
        <Text style={styles.dateTime}>
          When: {event.formattedDate} at {event.time}
        </Text>
        <Text style={styles.location}>Where: {event.location}</Text>
        <Text style={styles.description}>{event.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  detailsBox: {
    top: 160,
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
  eventContainer: {
    backgroundColor: "#EB9F68",
    alignItems: "center",
    height: 100,
    width: "80%",
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
    top: 45,
  },
  eventImage: {
    width: "100%",
    height: 60,
    resizeMode: "cover",
  },
  eventDetails: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  eventTitle: {
    color: "white",
    fontSize: 16,
    textAlign: "left",
    flex: 1,
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
});

export default EventDetails;
