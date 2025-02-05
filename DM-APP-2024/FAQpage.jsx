import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Linking,
  ScrollView,
  TouchableOpacity,
} from "react-native";

const faqData = [
  {
    question: "What are Spirit Points and how can I earn them?",
    answer:
      "Spirit Points are used to keep track of an organization's or individual's participation in events throughout the year. There is a friendly competition between teams to be the most engaged yearlong. The winner is announced at the Closing Ceremonies of The Main Event.\n\nSpirit Points can be earned by engaging in various Dance Marathon activities and attending various events.",
  },
  {
    question: "When/where is Dance Marathon Tabling?",
    answer:
      "Tabling takes place in Turlington Plaza every Wednesday from 10am-2pm.\n\nNote: DM merchandise can be purchased every other week.",
  },
  {
    question: "How can I see my DonorDrive info in the app?",
    answer:
      "Click on the Fundraiser tab in the bottom taskbar to locate your personal Dance Marathon fundraiser, DonorDrive page, DonorDrive URL link, and more.",
  },
  {
    question: "How do I register to be a Miracle Maker?",
    answer: "Click here to register to become a Miracle Maker!",
    link: "https://events.dancemarathon.com/index.cfm?fuseaction=register.start&eventID=6292",
  },
  {
    question: "How do I register to fundraise?",
    answer: "Click here to register to fundraise!",
    link: "https://events.dancemarathon.com/index.cfm?fuseaction=donorDrive.event&eventID=6292",
  },
];

const FAQ = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {faqData.map((faq, index) => (
        <View key={index} style={styles.faqItem}>
          <View style={styles.questionSection}>
            <Text style={styles.text}>{faq.question}</Text>
          </View>
          <View style={styles.answerSection}>
            <Text
              style={[styles.text, faq.link && styles.link]}
              onPress={() => faq.link && Linking.openURL(faq.link)}
            >
              {faq.answer}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    paddingVertical: 20,
  },
  faqItem: {
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: 340,
  },
  questionSection: {
    backgroundColor: "#F18221",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 10,
  },
  answerSection: {
    backgroundColor: "#233D72",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 10,
  },
  text: {
    color: "white",
    fontSize: 16,
    textAlign: "left",
  },
  link: {
    textDecorationLine: "underline",
  },
});

export default FAQ;
