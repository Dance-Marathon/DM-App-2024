import React from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { colors, card } from "./theme";

const EventDetails = ({ route }) => {
  const { event } = route.params;
  const imageSource =
    typeof event.imageUrl === "string" ? { uri: event.imageUrl } : event.imageUrl;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[card, styles.eventCard]}>
          {imageSource ? (
            <Image source={imageSource} style={styles.eventImage} />
          ) : (
            <View style={styles.eventPlaceholder} />
          )}

          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{event.title}</Text>

            <Text style={styles.dateTime}>
              <Text style={styles.boldText}>When: </Text>
              {event.formattedDate}
              {event.time ? ` at ${event.time}` : ""}
            </Text>

            {!!event.location && (
              <Text style={styles.location}>
                <Text style={styles.boldText}>Where: </Text>
                {event.location}
              </Text>
            )}

            {!!event.description && (
              <Text style={styles.description}>{event.description}</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default EventDetails;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  eventCard: {
    overflow: "hidden",
  },
  eventImage: {
    width: "100%",
    aspectRatio: 2 / 1,
    backgroundColor: colors.lightBlue,
  },
  eventPlaceholder: {
    width: "100%",
    aspectRatio: 2 / 1,
    backgroundColor: colors.orange,
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  boldText: {
    fontWeight: "700",
    color: colors.text,
  },
  dateTime: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 6,
  },
  location: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 12,
  },
  description: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
});
