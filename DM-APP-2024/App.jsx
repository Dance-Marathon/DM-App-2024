import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./Firebase/AuthManager";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faSparkles } from "@fortawesome/free-solid-svg-icons";
import { faUserSecret } from "@fortawesome/free-solid-svg-icons";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { getDownloadURL, ref, getStorage } from "firebase/storage";
import { Icon } from "react-native-elements";
import { Text, View, Button, Platform, StyleSheet } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Image } from "react-native";
import Home from "./Home";
import HomeME from "./HomeME";
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
import AllEvents from "./AllEvents";
import FAQ from "./FAQpage";
import MissionDM from "./MissionDM";
import Svg, { Path } from "react-native-svg";

import { addUserExpoPushToken } from "./Firebase/AuthManager";

import { getUserInfo, getUserActivity } from "./api/index";

import { UserProvider } from "./api/calls";
import { app } from "./Firebase/firebase";
import MissionDMAdmin from "./MissionDMAdmin";

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
  const [enrolled, setEnrolled] = useState(false);
  const [appDisabled, setAppDisabled] = useState(false);
  const [image, setImage] = useState(null);
  const [mainEvent, setMainEvent] = useState(false);

  useEffect(() => {
    const docRef = doc(db, "Permissions", "tempData");

    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        if (docSnapshot.data().kill) {
          setAppDisabled(true);
        } else {
          setAppDisabled(false);
        }
        if (docSnapshot.data().mainevent) {
          setMainEvent(true);
        } else {
          setMainEvent(false);
        }
      } else {
        console.error("Document does not exist!");
        setAppDisabled(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (appDisabled) {
      const storage = getStorage();
      const imageRef = ref(storage, "kill.jpg");
      getDownloadURL(imageRef)
        .then((url) => {
          setImage(url);
        })
        .catch((error) => {
          console.error("Error fetching kill image:", error);
          setImage(null);
        });
    }
  }, [appDisabled]);

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
        setEnrolled(data.inMissionDM);
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

  // useEffect(() => {
  //   handleToken();
  // }, [expoPushToken]);

  useEffect(() => {
    if (expoPushToken && auth.currentUser) {
      handleToken();
    }
  }, [expoPushToken, auth.currentUser]);

  if (loading) {
    return null;
  }

  const HomeStack = createStackNavigator();

  const HomeStackScreen = (props) => (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name={mainEvent ? "HomeME" : "Home"}
        component={mainEvent ? HomeME : Home}
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
      <HomeStack.Screen
        name="AllEvents"
        component={AllEvents}
        options={{
          title: "Events",
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
      <AboutStack.Screen
        name="MissionDM Admin"
        component={MissionDMAdmin}
        initialParams={{ expoPushToken: expoPushToken }}
        options={{
          title: "MissionDM Admin",
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

  if (appDisabled) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: "bold" }}>
          The app has been disabled.
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          - Tech
        </Text>
        {image && (
          <Image
            source={{ uri: image }}
            style={{ width: 500, height: 500 }}
            resizeMode="contain"
          />
        )}
      </View>
    );
  }

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
              {enrolled && (
                <Tab.Screen
                  name="MissionDM"
                  component={MissionDM}
                  options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                      // <Image
                      //   source={require("./images/MissionDMIcon.png")}
                      //   style={{ width: size, height: size, resizeMode:"contain", tintColor: color }}
                      // />
                      <Svg
                        width={"24"}
                        height={"26"}
                        viewBox="0 0 24 28"
                        fill="none"
                      >
                        <Path
                          d="M12 0.8125C11.6411 0.8125 11.4214 0.670312 11.1696 0.502734C10.8161 0.274219 10.3929 0 9.42857 0C7.79464 0 6.64286 2.21914 5.89286 4.53984C3.35893 4.98164 1.71429 5.69766 1.71429 6.5C1.71429 7.22617 3.05357 7.87617 5.175 8.32305C5.15357 8.52617 5.14286 8.7293 5.14286 8.9375C5.14286 9.80078 5.31964 10.6234 5.64107 11.375H2.43214C2.03571 11.375 1.71429 11.6797 1.71429 12.0555C1.71429 12.1418 1.73036 12.2281 1.76786 12.3094L3.84643 18.2457C1.51071 19.8961 0 21.5211 0 24.4918C0 25.3246 0.7125 26 1.59107 26H22.4089C23.2875 26 24 25.3246 24 24.4918C24 21.5211 22.4893 19.9012 20.1589 18.2457L22.2321 12.3094C22.2643 12.2281 22.2857 12.1418 22.2857 12.0555C22.2857 11.6797 21.9643 11.375 21.5679 11.375H18.3589C18.6804 10.6234 18.8571 9.80078 18.8571 8.9375C18.8571 8.7293 18.8464 8.52617 18.825 8.32305C20.9464 7.87617 22.2857 7.22617 22.2857 6.5C22.2857 5.69766 20.6411 4.98164 18.1071 4.53984C17.3571 2.21914 16.2054 0 14.5714 0C13.6071 0 13.1839 0.274219 12.8304 0.502734C12.5732 0.670312 12.3589 0.8125 12 0.8125ZM15 11.375H14.3357C13.4518 11.375 12.6696 10.8367 12.3911 10.0445C12.2679 9.68906 11.7375 9.68906 11.6143 10.0445C11.3357 10.8367 10.5482 11.375 9.66964 11.375H9C7.81607 11.375 6.85714 10.466 6.85714 9.34375V8.6125C8.36786 8.8207 10.125 8.9375 12 8.9375C13.875 8.9375 15.6321 8.8207 17.1429 8.6125V9.34375C17.1429 10.466 16.1839 11.375 15 11.375ZM10.2857 16.25L11.1429 17.875L8.35714 24.375L5.78571 14.625L10.2857 16.25ZM18.2143 14.625L15.6429 24.375L12.8571 17.875L13.7143 16.25L18.2143 14.625Z"
                          fill={color} // Dynamically set the color here
                        />
                      </Svg>
                    ),
                  }}
                />
              )}
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
