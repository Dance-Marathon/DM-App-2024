import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Correct import
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './Firebase/firebase';

import Home from './Home';
import CalendarPage from './CalendarPage';
import Spirit from './Spirit';
import Fundraiser from './Fundraiser';
import About from './About';
import Login from './Login';
import Profile from './Profile';
import ForgotPassword from './ForgotPassword';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const App = () => {
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
          }}
        >
          <Tab.Screen name="Home" component={Home} />
          <Tab.Screen name="Calendar" component={CalendarPage} />
          <Tab.Screen name="Spirit" component={Spirit} />
          <Tab.Screen name="Fundraiser" component={Fundraiser} />
          <Tab.Screen name="About" component={About} />
          <Tab.Screen name="Profile" component={Profile} />
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
