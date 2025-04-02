import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const AllEvents = ({ route }) => {
  const { items, imageUrls } = route.params;


  const handleEventClick = (item) => {
    setSelectedEvent(item);
    setEventModalVisible(true);
  };

  const navigation = useNavigation();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: "#1F1F1F",
      }}
    >
      <ScrollView style={{ width: "100%" }}>
        <View style={{ alignItems: "center" }}>
          {Array.isArray(items) && items.length > 0 ? (
            items.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() =>
                  navigation.navigate("EventDetails", {
                    event: {
                      ...item,
                      formattedDate: item.datetime.toDateString(),
                      imageUrl: imageUrls[item.picture],
                    },
                  })
                }
                style={styles.eventContainer}
              >
                  {item.picture ? (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: imageUrls[item.picture] }}
                        style={styles.eventImage}
                      />
                    </View>
                  ) : (
                    <View></View>
                  )}
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{item.title}</Text>

                    <Text style={styles.learnMore}>Learn More</Text>

                  </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noEvents}>No upcoming events</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dateTime: {
    color: "white",
    fontSize: 14,
    marginBottom: 10,
  },
  eventsList: {
    paddingTop: 10,
  },
  imageContainer: {
    flex: 7,
    width: "100%",
  },
  eventTitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    flex: 1,
    left: 10,
  },
  learnMore: {
    color: "white",
    fontSize: 14,
    textDecorationLine: "underline",
    alignSelf: "flex-end",
    right: 10,
  },
  eventImage: {
    width: "100%",
    height: 60,
    resizeMode: "cover",
  },
  eventDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  eventContainer: {
    backgroundColor: "#EB9F68",
    alignItems: "center",
    height: 100,
    width: "94%",
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
    marginTop: 10,
  },
});

export default AllEvents;
