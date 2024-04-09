// Page1.js (similar structure for other pages)
import React, { useEffect } from "react";
import { View, Text, Platform } from "react-native";
import fetch from "node-fetch";
// import { pushNotifications } from './api/expo-notifications';

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
const INITIAL_DATE = new Date();

async function pushNotifications() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

async function sendPushNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Original Title",
    body: "And here is the body!",
    data: { someData: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

const Home = () => {
  useEffect(() => {
    // pushNotifications().then((token) => console.log(token));
    console.log("Ran in home");
    // sendPushNotification('ExponentPushToken[5LN8TcC3JIJTdI86DflIb-]');
    const getAndSendNotification = async () => {
      const token = await pushNotifications();
      console.log(token);
      if (token) {
        await sendPushNotification(token);
        console.log("Sent notification");
      }
    };
    getAndSendNotification();
  }, []);
  // pushNotifications().then(token => console.log(token));
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home Page</Text>
    </View>
  );
};

export default Home;
