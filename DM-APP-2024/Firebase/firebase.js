// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from "firebase/storage";
import { getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCCw3kaOJRGbMTPLlcpf46JWUQM8qVSp88",
  authDomain: "dm-app-2024.firebaseapp.com",
  databaseURL: "https://dm-app-2024-default-rtdb.firebaseio.com",
  projectId: "dm-app-2024",
  storageBucket: "dm-app-2024.appspot.com",
  messagingSenderId: "194311892456",
  appId: "1:194311892456:web:c7a06069012101a386885d",
  measurementId: "G-NY8F94XC68"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { app, auth };