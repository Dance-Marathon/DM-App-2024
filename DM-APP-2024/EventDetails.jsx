import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const EventDetails = ({ route }) => {
  const { event } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.eventContainer}>
        {event.imageUrl && (
          <Image source={{ uri: event.imageUrl }} style={styles.eventImage} />
        )}

        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View>
            <Text style={styles.dateTime}>
              <Text style={styles.boldText}>When:</Text> {event.formattedDate}{" "}
              at {event.time}
            </Text>

            <Text style={styles.location}>
              <Text style={styles.boldText}>Where:</Text> {event.location}
            </Text>
          </View>

          <Text style={styles.description}>{event.description}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1F1F",
    alignItems: "center",
    paddingTop: 40,
  },
  eventContainer: {
    backgroundColor: "#233d72",
    width: "85%",
    borderRadius: 10,
    overflow: "hidden",
    padding: 20,
    alignItems: "center",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    width: 340,
  },
  eventImage: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
    borderRadius: 10,
    marginBottom: 15,
  },
  eventContent: {
    width: "100%",
  },
  eventTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 10,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
    color: "white",
  },
  dateTime: {
    color: "white",
    fontSize: 16,
    marginBottom: 5,
    textAlign: "left",
  },
  location: {
    color: "white",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "left",
  },
  separator: {
    height: 1,
    backgroundColor: "white",
    marginVertical: 15,
    width: "100%",
  },
  description: {
    color: "white",
    fontSize: 16,
    textAlign: "left",
  },
});

export default EventDetails;
