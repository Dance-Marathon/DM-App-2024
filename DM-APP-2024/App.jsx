import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './Firebase/AuthManager';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Icon } from 'react-native-elements';
import { Text, View, Button, Platform, StyleSheet } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import Home from './Home';
import CalendarPage from './CalendarPage';
import Spirit from './Spirit';
import Fundraiser from './Fundraiser';
import About from './About';
import Login from './Login';
import Profile from './Profile';
import ForgotPassword from './ForgotPassword';
import Admin from './Admin';
import Blog from './Blog';

import { addUserExpoPushToken } from "./Firebase/AuthManager";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    console.log('Token from register function:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token.data;
}

const App = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [role, setRole] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const displayDocumentData = async () => {
    try {
      const currentUID = auth.currentUser.uid;
      console.log("Current UID:", currentUID);
      const docRef = doc(db, "Users", currentUID);
      console.log("Doc Ref:", docRef);
      const docSnap = await getDoc(docRef);
      console.log("Doc Snap:", docSnap);
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Document Data:", data);
        console.log("User Role:", data.role);
          setRole(data.role);
      } else {
        console.log("Document does not exist");
      }
    } catch (error) {
      console.error("Error fetching document data:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      if (user) {
        await displayDocumentData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function handleToken() {
    const currentUID = auth.currentUser.uid;
    const docRef = doc(db, "Users", currentUID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.notificationToken) {
        await addUserExpoPushToken(auth.currentUser.uid, expoPushToken);
    } else {
      console.log("Token exists");
    }}
  };

  useEffect(() => {
    handleToken();
  }, [expoPushToken]);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (loading) {
    return null;
  }

  console.log("Role:", role);

  return (
    <><NavigationContainer>
      {user ? (
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: { backgroundColor: '#233563' },
            headerStyle: { backgroundColor: '#233563' },
            tabBarActiveTintColor: 'orange',
            tabBarInactiveTintColor: 'white',
            headerTintColor: 'white',
          }}
        >
          {role === "Admin" ? (
            <Tab.Screen
              name="Admin"
              component={Admin}
              initialParams={{ expoPushToken: expoPushToken }}
              options={{
                tabBarIcon: ({ color, size }) => (
                  <Icon
                    name="user-secret"
                    type="font-awesome"
                    color={color}
                  />
                ),
              }}
            />
          ) : (<></>)}
          <Tab.Screen
            name="Home"
            component={Home}
            initialParams={{ expoPushToken: expoPushToken }}
            options={{
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name="home"
                  type="font-awesome"
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarPage}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name="calendar"
                  type="font-awesome"
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Fundraiser"
            component={Fundraiser}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name="money"
                  type="font-awesome"
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Blog"
            component={Blog}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name="book"
                  type="font-awesome"
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="About"
            component={About}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name="address-card"
                  type="font-awesome"
                  color={color}
                />
              ),
            }}
          />
        </Tab.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
            initialParams={{ expoPushToken: expoPushToken }} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPassword}
            options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer></>
  );
};

export default App;
