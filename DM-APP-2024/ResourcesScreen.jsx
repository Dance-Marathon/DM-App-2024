import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "react-native-elements";
import TopBar from "./TopBar";
import { colors, card } from "./theme";

const ResourcesScreen = () => {
  const navigation = useNavigation();
  const openWebsite = (url) => Linking.openURL(url);

  return (
    <View style={styles.screen}>
      <TopBar />
      <View style={styles.body}>
        <View style={[card, styles.card]}>
          <Icon name="link" type="font-awesome" color={colors.navy} size={22} />
          <Text style={styles.cardTitle}>DM at UF Resources</Text>
          <Text style={styles.cardDescription}>
            Find guides, documents, and helpful links for Dance Marathon at UF.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => openWebsite("https://linktr.ee/dmatuf")}
          >
            <Text style={styles.primaryButtonText}>View resources</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[card, styles.secondaryCard]}
          onPress={() => navigation.navigate("FAQ")}
        >
          <Icon name="question-circle" type="font-awesome" color={colors.navy} size={18} />
          <Text style={styles.secondaryCardText}>Frequently Asked Questions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[card, styles.secondaryCard]}
          onPress={() => openWebsite("https://floridadm.org/miraclefamilies")}
        >
          <Icon name="heart" type="font-awesome" color={colors.navy} size={18} />
          <Text style={styles.secondaryCardText}>Meet the Kids</Text>
        </TouchableOpacity>
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
    marginBottom: 12,
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
  secondaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
  },
  secondaryCardText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 12,
  },
});

export default ResourcesScreen;
