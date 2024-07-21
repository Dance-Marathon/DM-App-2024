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
      fetchDataAndFillDates();
    }, 120000); // Refresh every two minutes

    fetchDataAndFillDates(); // Also fetch immediately on component mount

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  const fetchDataAndFillDates = async () => {
    setIsFetching(true); // Assuming you have a loading state
  
    try {
      const eventsCollectionRef = collection(db, "Calendar2024");
      const querySnapshot = await getDocs(eventsCollectionRef);
      const fetchedItems = {};
  
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        Object.keys(docData).forEach((date) => {
          fetchedItems[date] = docData[date].events.map((event) => ({
            time: event.time,
            title: event.title,
            description: event.description,
          }));
        });
      });
  
      // Now, fill in the empty dates
      const twoMonthAgo = new Date();
      twoMonthAgo.setMonth(twoMonthAgo.getMonth() - 2);
      const twoMonthFromNow = new Date();
      twoMonthFromNow.setMonth(twoMonthFromNow.getMonth() + 2);
  
      let currentDate = new Date(twoMonthAgo);
      while (currentDate <= twoMonthFromNow) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!fetchedItems[dateStr]) {
          fetchedItems[dateStr] = []; // Set dates without events to an empty array
        }
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }
  
      setItems(fetchedItems); // Update your state with the new items
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  
    setIsFetching(false); // Update the loading state
  };

  const renderItem = (item) => {
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.title}>{item.title}</Text>
        {item.time ? (
          <Text style={styles.time}>{item.time}</Text>  
        ) : (
          <Text style={styles.itemTime}>All Day</Text>
        )}
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  if (isFetching) {
    return <Text>Loading...</Text>;
  }

  const renderEmptyDate = () => {
    console.log("renderEmptyDate called");
    return (
      <View style={styles.emptyDateContainer}>
        <Text style={styles.emptyDateText}>Nothing</Text>
      </View>
    );
  }

  return (
    <Agenda
      items={items}
      renderItem={renderItem}
      pastScrollRange={1}
      futureScrollRange={1}
      onRefresh={() => console.log('refreshing...')}
      refreshing={false}
      refreshControl={null}
      renderEmptyDate={renderEmptyDate}
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
