import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Import necessary components from React Navigation
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

// Create a bottom tab navigator
const Tab = createBottomTabNavigator();

// Import your page components
import Home from './Home';
import Calendar from './Calendar';
import Spirit from './Spirit';
import Fundraiser from './Fundraiser';
import About from './About';

// Function to render the taskbar and pages
function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={Home} />
        <Tab.Screen name="Calendar" component={Calendar} />
        <Tab.Screen name="Spirit" component={Spirit} />
        <Tab.Screen name="Fundraiser" component={Fundraiser} />
        <Tab.Screen name="About" component={About} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default App;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
