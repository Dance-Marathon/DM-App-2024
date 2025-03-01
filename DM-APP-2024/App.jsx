import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./Firebase/AuthManager";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faSparkles } from "@fortawesome/free-solid-svg-icons";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Icon } from "react-native-elements";
import { Text, View, Button, Platform, StyleSheet } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import Home from "./Home";
import CalendarPage from "./CalendarPage";
import Spirit from "./Spirit";
import Fundraiser from "./Fundraiser";
import About from "./About";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import Admin from "./Admin";
import Blog from "./Blog";
import Blog1 from "./blogs//Blog_BeyondThisMoment";
import Blog2 from "./blogs/Blog_BeyondOurselves";
import Blog3 from "./blogs/Blog_BeyondThisSummer";
import Blog4 from "./blogs/Blog_BeyondThisGeneration";
import Blog5 from "./blogs/Blog_FindingYourDMFamily";
import Blog6 from "./blogs/Blog_CampusClash";
import Blog7 from "./blogs/Blog_ChildHealthDay";
import Blog8 from "./blogs/Blog_MiracleMaker";
import Scanner from "./Scanner";
import TTHome from "./HomeTT";
import checkForUpdate from "./AppUpdateCheck";
import EventDetails from "./EventDetails";
import AllNotifications from "./AllNotifications";
import FAQ from "./FAQpage";

import { addUserExpoPushToken } from "./Firebase/AuthManager";

import { getUserInfo, getUserActivity } from "./api/index";

import { UserProvider } from "./api/calls";

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

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    console.log("Token from register function:", token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token.data;
}

// const BlogStack = () => {
//   const Stack = createStackNavigator();
//   return (
//     <Stack.Navigator initialRouteName="Blog">
//       <Stack.Screen name="Blog" component={Blog} options={{ headerShown: false }} />
//       <Stack.Screen name="Beyond" component={Blog1} options={{ headerShown: false }} />
//       <Stack.Screen name="Ourselves" component={Blog2} options={{ headerShown: false }} />
//       <Stack.Screen name="Summer" component={Blog3} options={{ headerShown: false }} />
//       <Stack.Screen name="Generation" component={Blog4} options={{ headerShown: false }} />
//       <Stack.Screen name="Family" component={Blog5} options={{ headerShown: false }} />
//       <Stack.Screen name="CampusClash" component={Blog6} options={{ headerShown: false }} />
//       <Stack.Screen name="ChildHealthDay" component={Blog7} options={{ headerShown: false }} />
//       <Stack.Screen name="MiracleMaker" component={Blog8} options={{ headerShown: false }} />
//     </Stack.Navigator>
//   );
// };

const App = () => {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [role, setRole] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userActivity, setUserActivity] = useState({});
  const [userIDState, setUserIDState] = useState("");
  const [userInfo, setUserInfo] = useState({});
  //const previousActivityRef = useRef(null);

  const [scannerPermissions, setScannerPermissions] = useState({
    allowedRoles: [],
    teamBasedPermissions: {},
  });
  const [scannerVisible, setScannerVisible] = useState(false);

  const displayDocumentData = async () => {
    try {
      const currentUID = auth.currentUser.uid;
      const docRef = doc(db, "Users", currentUID);
      const docSnap = await getDoc(docRef);
      //console.log("Doc Snap:", docSnap);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserIDState(data.donorID);
        setRole(data.role);
      } else {
        console.log("Document does not exist");
      }
    } catch (error) {
      console.error("Error fetching document data:", error);
    }
  };

  // useEffect(() => {
  //   let intervalId;

  //   const fetchUserActivity = async () => {
  //     try {
  //       const newActivityData = await getUserActivity(userIDState);
  //       console.log('Fetched Activity: ', newActivityData);

  //       //const hasChanged = JSON.stringify(newActivityData) !== JSON.stringify(previousActivityRef.current);

  //       // if (hasChanged) {
  //       //   console.log('Changed Activity: ', userActivity[0]);
  //       //   //Send notification if type is donation
  //       // } else {
  //       //   console.log('No changes detected');
  //       // }

  //       previousActivityRef.current = newActivityData;
  //       setUserActivity(newActivityData);

  //       console.log('Most Recent: ', userActivity[0]);
  //     } catch (err) {
  //       console.error('Error fetching user activity:', err);
  //     }
  //   };

  //   fetchUserActivity();
  //   intervalId = setInterval(fetchUserActivity, 5000);

  //   return () => clearInterval(intervalId);
  // }, [userIDState]);

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

  useEffect(() => {
    getUserInfo(userIDState)
      .then((data) => {
        setUserInfo(data);
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      });
  }, [userIDState]);

  // useEffect(() => {
  //   checkForUpdate();
  // }, []);

  async function handleToken() {
    const currentUID = auth.currentUser.uid;
    const docRef = doc(db, "Users", currentUID);
    const docSnap = await getDoc(docRef);
    console.log("Token: ", expoPushToken);
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(data.notificationToken);
      console.log(expoPushToken);
      if (data.notificationToken != expoPushToken) {
        await addUserExpoPushToken(auth.currentUser.uid, expoPushToken);
      } else {
        console.log("Token is already stored in database");
      }
    }
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    handleToken();
  }, [expoPushToken]);

  if (loading) {
    return null;
  }

  const HomeStack = createStackNavigator();

  const HomeStackScreen = (props) => (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={Home}
        options={{ headerShown: false }}
        initialParams={props.route.params}
      />
      <HomeStack.Screen
        name="EventDetails"
        component={EventDetails}
        options={{
          title: "Upcoming Events",
          headerStyle: {
            backgroundColor: "#1f1f1f",
            borderBottomWidth: 0,
          },
          headerTintColor: "white",
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
      <HomeStack.Screen
        name="AllNotifications"
        component={AllNotifications}
        options={{
          title: "Notifications",
          headerStyle: {
            backgroundColor: "#1f1f1f",
            borderBottomWidth: 0,
          },
          headerTintColor: "white",
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
    </HomeStack.Navigator>
  );

  const SpiritStack = createStackNavigator();

  const SpiritScreenStack = (props) => (
    <SpiritStack.Navigator>
      <SpiritStack.Screen
        name="Spirit"
        component={Spirit}
        options={{ headerShown: false }}
        initialParams={props.route.params}
      />
      <SpiritStack.Screen
        name="Scanner"
        component={Scanner}
        options={{
          title: "Scanner",
          headerStyle: {
            backgroundColor: "#1f1f1f",
            borderBottomWidth: 0,
          },
          headerTintColor: "white",
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
    </SpiritStack.Navigator>
  );

  const AboutStack = createStackNavigator();

  const AboutScreenStack = (props) => (
    <AboutStack.Navigator>
      <AboutStack.Screen
        name="About"
        component={About}
        options={{
          headerStyle: {
            backgroundColor: "#1f1f1f",
            borderBottomWidth: 0,
          },
          headerShadowVisible: false,
          headerTintColor: "white",
        }}
        initialParams={props.route.params}
      />
      <AboutStack.Screen
        name="FAQ"
        component={FAQ}
        options={{
          title: "FAQ",
          headerStyle: {
            backgroundColor: "#1f1f1f",
            borderBottomWidth: 0,
          },
          headerTintColor: "white",
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
      <AboutStack.Screen
        name="Admin"
        component={Admin}
        initialParams={{ expoPushToken: expoPushToken }}
        options={{
          title: "Admin",
          headerStyle: {
            backgroundColor: "#1f1f1f",
            borderBottomWidth: 0,
          },
          headerTintColor: "white",
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      />
    </AboutStack.Navigator>
  );

  return (
    <>
      <UserProvider>
        <NavigationContainer>
          {user ? (
            <Tab.Navigator
              screenOptions={{
                tabBarStyle: { backgroundColor: "#233563" },
                headerStyle: { backgroundColor: "#233563" },
                tabBarActiveTintColor: "orange",
                tabBarInactiveTintColor: "white",
                headerTintColor: "white",
              }}
            >
              {/* {role === "Admin" ? (
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
              ) : (
                <></>
              )} */}
              <Tab.Screen
                name="Home"
                component={HomeStackScreen}
                initialParams={{ expoPushToken: expoPushToken }}
                options={{
                  headerShown: false,
                  tabBarIcon: ({ color, size }) => (
                    <Icon name="home" type="font-awesome" color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Spirit"
                component={SpiritScreenStack}
                options={{
                  headerShown: false,
                  tabBarIcon: ({ color, size }) => (
                    <Icon name="star" type="font-awesome" color={color} />
                  ),
                }}
              />
              {/* {scannerVisible && (
                <Tab.Screen
                  name="Scanner"
                  component={Scanner}
                  options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                      <Icon name="check" type="font-awesome" color={color} />
                    ),
                  }}
                />
              )} */}
              <Tab.Screen
                name="Fundraiser"
                component={Fundraiser}
                options={{
                  headerShown: false,
                  tabBarIcon: ({ color, size }) => (
                    <Icon name="money" type="font-awesome" color={color} />
                  ),
                }}
              />
              {/* <Tab.Screen
            name="Blog"
            component={BlogStack}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Icon
                  name="book"
                  type="font-awesome"
                  color={color}
                />
              ),
            }}
          /> */}
              <Tab.Screen
                name="About"
                component={AboutScreenStack}
                options={{
                  headerShown: false,
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
                initialParams={{ expoPushToken: expoPushToken }}
              />
              <Stack.Screen
                name="ForgotPassword"
                component={ForgotPassword}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </UserProvider>
    </>
  );
};

export default App;
