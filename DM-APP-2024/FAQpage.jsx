import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  ScrollView,
} from "react-native";
import { colors, card } from "./theme";

const faqData = [
  {
    question: "What are Spirit Points and how can I earn them?",
    answer:
      "Spirit Points are used to keep track of an organization's or individual's participation in events throughout the year. There is a friendly competition between teams to be the most engaged yearlong. The winner is announced at the Closing Ceremonies of The Main Event.\n\nSpirit Points can be earned by engaging in various Dance Marathon activities and attending various events.",
  },
  {
    question: "How can I see my DonorDrive info in the app?",
    answer:
      "Open the DonorDrive tab from the drawer menu to locate your personal Dance Marathon fundraiser, DonorDrive page, DonorDrive URL link, and more.",
  },
  {
    question: "How do I register to be a Miracle Maker?",
    answer: "Click here to register to become a Miracle Maker!",
    link: "https://events.dancemarathon.com/dmatuf27?REFERRER=meta_ig",
  },
];

const FAQ = () => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      {faqData.map((faq, index) => (
        <View key={index} style={[card, styles.faqItem]}>
          <Text style={styles.question}>{faq.question}</Text>
          <Text
            style={[styles.answer, faq.link && styles.link]}
            onPress={() => faq.link && Linking.openURL(faq.link)}
          >
            {faq.answer}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBackground,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  faqItem: {
    marginBottom: 16,
    padding: 16,
  },
  question: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  answer: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: colors.orange,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default FAQ;
