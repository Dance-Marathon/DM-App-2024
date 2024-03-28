// Page1.js (similar structure for other pages)
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {addCalanderEntry} from './Firebase/CalanderManager'
import { handleSignOut } from './Firebase/AuthManager';
import { Agenda } from 'react-native-calendars';
import firebase from './Firebase/firebase';
import { auth, db } from './Firebase/AuthManager';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
const INITIAL_DATE = new Date();

const Home = () => {
  const [isFetching, setIsFetching] = useState(false);
  const [items, setItems] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    fetchData(); // Also fetch immediately on component mount

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const eventsCollectionRef = collection(db, "testCalendar");
      const querySnapshot = await getDocs(eventsCollectionRef);
      const fetchedItems = {};

      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        Object.keys(docData).forEach((date) => {
          fetchedItems[date] = docData[date].events.map(event => ({
            time: event.time,
            title: event.title,
            description: event.description
          }));
        });
      });

      setItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching events:", error);
      // Handle errors as needed
    }
    setIsFetching(false);
  };

  const renderItem = (item) => {
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  if (isFetching) {
    return <Text>Loading...</Text>;
  }

  return (
    <Agenda
      items={items}
      renderItem={renderItem}
      pastScrollRange={6}
      futureScrollRange={6}
       // If provided, a standard RefreshControl will be added for "Pull to Refresh" functionality. Make sure to also set the refreshing prop correctly
      onRefresh={() => console.log('refreshing...')}
      // Set this true while waiting for new data from a refresh
      refreshing={false}
      // Add a custom RefreshControl component, used to provide pull-to-refresh functionality for the ScrollView
      refreshControl={null}
      renderEmptyDate={() => {
        return (
          <View style={styles.itemContainer}>
            <Text> Nothing</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginRight: 10,
    marginTop: 17,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemTime: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  emptyDateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey'
  },
  emptyDateText: {
    fontSize: 16,
    color: 'grey'
  }
});

export default Home;
