import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Correct import
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './Firebase/firebase';
import {Icon} from 'react-native-elements';
import { StyleSheet, Text, View } from "react-native";

import Home from './Home';
import CalendarPage from './CalendarPage';
import Spirit from './Spirit';
import Fundraiser from './Fundraiser';
import About from './About';
import Login from './Login';
import Profile from './Profile';
import ForgotPassword from './ForgotPassword';

import {
  useFonts,
  Montserrat_100Thin,
  Montserrat_200ExtraLight,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from "@expo-google-fonts/montserrat";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const App = () => {
  let [fontsLoaded] = useFonts({
    Montserrat_100Thin,
    Montserrat_200ExtraLight,
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
  });
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {user ? (
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: { backgroundColor: '#233563' },
            headerStyle: { backgroundColor: '#233563' },
            tabBarActiveTintColor: 'white',
            tabBarInactiveTintColor: 'white',
            headerTintColor: 'white',
             tabBarLabelStyle: { fontFamily: 'Montserrat_400Regular' },
          }}
        >
          <Tab.Screen name="Home" component={Home} options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" type="font-awesome" color="white" />
            ),
          }}/>
          <Tab.Screen name="Calendar" component={CalendarPage} options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="calendar" type="font-awesome" color="white" />
            ),
          }}/>
          {/* <Tab.Screen name="Spirit" component={Spirit} options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="camera" type="font-awesome" color="white" />
            ),
          }}/> */}
          <Tab.Screen name="Fundraiser" component={Fundraiser} options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="money" type="font-awesome" color="white" />
            ),
          }}/>
          <Tab.Screen name="About" component={About} options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="address-card" type="font-awesome" color="white" />
            ),
          }}/>
        </Tab.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPassword}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default App;
