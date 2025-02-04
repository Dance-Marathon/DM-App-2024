import React, { useContext, useState, useEffect } from "react";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Linking,
  Modal,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Icon } from "react-native-elements";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faX } from '@fortawesome/free-solid-svg-icons';

const faqData = [
  {
    question: "What are Spirit Points and how can I earn them?",
    answer: "Spirit Points are points that Internal Dance Marathon teams can earn by checking in at tabling in Turlington. In order to receive the points, you must wear a DM shirt at check-in."
  },
  {
    question: "When/where is Dance Marathon Tabling?",
    answer: "Tabling takes place in Turlington Plaza every Wednesday from 10am-2pm.\nNote: DM merchandise can be purchased every other week."
  },
  {
    question: "How can I see my DonorDrive info in the app?",
    answer: "Click on the fundraiser tab in the bottom taskbar to locate your personal Dance Marathon fundraiser, DonorDrive page, DonorDrive URL link, and list of donations."
  },
  {
    question: "How do I register to be a Miracle Maker?",
    answer: "Miracle Makers can register by clicking here.",
    link: "https://events.dancemarathon.com/index.cfm?fuseaction=register.start&eventID=6292"
  },
  {
    question: "How do I register to fundraise?",
    answer: "You can register to fundraise by clicking here.",
    link: "https://events.dancemarathon.com/index.cfm?fuseaction=donorDrive.event&eventID=6292"
  }
];

const FAQ = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {faqData.map((faq, index) => (
        <View key={index} style={styles.faqItem}>
          <Text style={styles.question}>{faq.question}</Text>
          {faq.link ? (
            <Text
              style={[styles.answer, styles.link]}
              onPress={() => Linking.openURL(faq.link)}
            >
              {faq.answer}
            </Text>
          ) : (
            <Text style={styles.answer}>{faq.answer}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const FAQItem = ({ question, answer, link }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.faqItem}>
      <Text style={styles.question}>{question}</Text>
      {expanded && (
        link ? (
          <Text style={[styles.answer, styles.link]} onPress={() => Linking.openURL(link)}>
            {answer}
          </Text>
        ) : (
          <Text style={styles.answer}>{answer}</Text>
        )
      )}
    </TouchableOpacity>
  );
};

const FAQcontainer = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {faqData.map((faq, index) => (
        <FAQItem key={index} {...faq} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,                // Allow the ScrollView to grow with content
    justifyContent: "flex-start", // Align content to the top
    alignItems: "center",       // Keep boxes centered horizontally
    backgroundColor: "#2C2C2C", // main background
    paddingVertical: 20,        // Optional padding for spacing at the top
  },
  rectangleView: {
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#233d72",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 4,
    elevation: 4,
    shadowOpacity: 1,
    width: 340,
    height: 290,
    marginTop: 5,
  },
  logoText: {
    fontSize: 24, // Adjust the font size
    fontWeight: "bold", // Make it bold if needed
    textAlign: "center", // Center align
    color: "white", // Change the color if necessary
    marginVertical: 10, // Add spacing around the text
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallCircle: {
    width: 15,
    height: 15,
    borderRadius: 50,
    backgroundColor: "#EB9F68",
    marginRight: 5,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
    left: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  faqItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#233563", // box background
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    height: 150,  // Set a fixed height here
    width: 340,
    justifyContent: "center", // Center content vertically
  },
  question: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#EB9F68", // DM Orange for questions
    marginBottom: 5,
  },
  answer: {
    fontSize: 16,
    color: "#FFF",
  },
  link: {
    color: "white", // DM Orange for links
    textDecorationLine: "underline",
  },
});

export default FAQ;
