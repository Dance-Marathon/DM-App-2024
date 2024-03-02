import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './Firebase/firebase';

import Home from './Home';
import CalendarPage from './CalendarPage';
import Spirit from './Spirit';
import Fundraiser from './Fundraiser';
import About from './About';
import Login from './Login';



const Tab = createBottomTabNavigator();

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
    return null; // or return a loading component if you have one
  }

  return (
    <NavigationContainer>
      {user ? (
        <Tab.Navigator>
          <Tab.Screen name="Home" component={Home} />
          <Tab.Screen name="Calendar" component={CalendarPage} />
          <Tab.Screen name="Spirit" component={Spirit} />
          <Tab.Screen name="Fundraiser" component={Fundraiser} />
          <Tab.Screen name="About" component={About} />
        </Tab.Navigator>
      ) : (
        <Login />
      )}
    </NavigationContainer>
  );
};

export default App;
