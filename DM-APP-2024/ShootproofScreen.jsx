import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Icon } from "react-native-elements";
import TopBar from "./TopBar";
import { colors, card } from "./theme";

const ShootproofScreen = () => {
  const openWebsite = (url) => Linking.openURL(url);

  return (
    <View style={styles.screen}>
      <TopBar />
      <View style={styles.body}>
        <View style={[card, styles.card]}>
          <Icon name="camera" type="font-awesome" color={colors.navy} size={22} />
          <Text style={styles.cardTitle}>Event Photos</Text>
          <Text style={styles.cardDescription}>
            View and download photos from Dance Marathon at UF events on Shootproof.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => openWebsite("https://floridadm.shootproof.com/")}
          >
            <Text style={styles.primaryButtonText}>Open Shootproof</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  },
  card: {
    padding: 20,
    alignItems: "center",
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 10,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.orange,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
});

export default ShootproofScreen;
