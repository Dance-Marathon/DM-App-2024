import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, card } from "./theme";

const AllEvents = ({ route }) => {
  const { items, imageUrls } = route.params;
  const navigation = useNavigation();

  const openEvent = (item) => {
    navigation.navigate("EventDetails", {
      event: {
        title: item.title,
        formattedDate: item.formattedDate,
        time: item.time,
        location: item.location,
        description: item.description,
        imageUrl: imageUrls?.[item.picture],
      },
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.body}>
        {Array.isArray(items) && items.length > 0 ? (
          items.map((item, index) => {
            const imageSource =
              item.picture && imageUrls?.[item.picture]
                ? { uri: imageUrls[item.picture] }
                : null;

            return (
              <TouchableOpacity
                key={index}
                style={[card, styles.eventCard]}
                onPress={() => openEvent(item)}
                activeOpacity={0.85}
              >
                <View style={styles.eventCardImageBox}>
                  <Image
                    source={imageSource || require("./images/DefaultEventBanner.png")}
                    style={styles.eventCardImageFill}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.eventCardBanner}>
                  <Text style={styles.eventTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.eventMeta} numberOfLines={1}>
                    {item.formattedDate ? `${item.formattedDate}` : ""}
                    {item.time ? ` · ${item.time}` : ""}
                    {item.location ? ` · ${item.location}` : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noEvents}>No upcoming events</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default AllEvents;

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
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  eventCardImageBox: {
    width: "100%",
    aspectRatio: 3.5 / 1,
    overflow: "hidden",
    backgroundColor: colors.lightBlue,
  },
  eventCardImageFill: {
    width: "100%",
    height: "100%",
  },
  eventCardBanner: {
    backgroundColor: colors.navy,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  eventTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  eventMeta: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 2,
  },
  noEvents: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 12,
    textAlign: "center",
  },
});
