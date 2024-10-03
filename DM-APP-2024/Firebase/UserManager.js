import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firestore.js'; 
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore'; 
import { auth } from './AuthManager.js';

const USER_DATA_KEY = '@user_data';

const getUserData = async () => {
  try {
    const currentUID = auth.currentUser.uid;
    
    // Check if user data exists in AsyncStorage first
    const cachedData = await AsyncStorage.getItem(`${USER_DATA_KEY}_${currentUID}`);
    
    if (cachedData) {
      // If cached data is found, return it
      console.log("Returning cached data");
      return JSON.parse(cachedData);
    }

    // If no cached data is found, fetch from Firestore
    const docRef = doc(db, 'Users', currentUID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Save the fetched data to AsyncStorage for future use
      await AsyncStorage.setItem(`${USER_DATA_KEY}_${currentUID}`, JSON.stringify(data));

      return data;
    } else {
      console.log('Document does not exist');
      return null;
    }
  } catch (error) {
    console.error('Error fetching document data:', error);
    throw error;
  }
};

const clearUserDataCache = async () => {
  try {
    const currentUID = auth.currentUser.uid;
    await AsyncStorage.removeItem(`${USER_DATA_KEY}_${currentUID}`);
    console.log("Cached user data cleared");
  } catch (error) {
    console.error("Error clearing cached user data:", error);
  }
};

const updateUserData = async () => {
  try {
    const currentUID = auth.currentUser.uid;
    
    // Fetch the latest user data from Firestore
    const docRef = doc(db, 'Users', currentUID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const updatedData = docSnap.data();

      // Update the AsyncStorage cache with the latest data
      await AsyncStorage.setItem(`${USER_DATA_KEY}_${currentUID}`, JSON.stringify(updatedData));
      console.log("User data cache updated with latest data");

      return updatedData;
    } else {
      console.log('Document does not exist');
      return null;
    }
  } catch (error) {
    console.error('Error updating user data cache:', error);
    throw error;
  }
};

export { getUserData, clearUserDataCache, updateUserData };
