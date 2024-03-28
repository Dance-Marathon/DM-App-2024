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
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home Page</Text>
    </View>
  );
}


export default Home;
