import React, { useState, useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./Firebase/AuthManager";
import {
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { getDownloadURL, ref, getStorage } from "firebase/storage";
import { Text, View, Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Image } from "react-native";

import HomeME from "./HomeME";
import TTHome from "./HomeTT";
import Spirit from "./Spirit";
import Fundraiser from "./Fundraiser";
import TeamFundraiser from "./TeamFundraiser";
import SettingsScreen from "./SettingsScreen";
import ResourcesScreen from "./ResourcesScreen";
import ShootproofScreen from "./ShootproofScreen";
import Login from "./Login";
import ForgotPassword from "./ForgotPassword";
import Admin from "./Admin";
import Scanner from "./Scanner";
import EventDetails from "./EventDetails";
import AllNotifications from "./AllNotifications";
import AllEvents from "./AllEvents";
import FAQ from "./FAQpage";
import MissionDM from "./MissionDM";
import MissionDMAdmin from "./MissionDMAdmin";
import DrawerContent from "./DrawerContent";
import { colors } from "./theme";

import { addUserExpoPushToken } from "./Firebase/AuthManager";

import { getUserInfo, getUserActivity } from "./api/index";

import { UserProvider } from "./api/calls";

const Drawer = createDrawerNavigator();

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

const stackHeaderOptions = {
  headerStyle: {
    backgroundColor: colors.navy,
    borderBottomWidth: 0,
  },
  headerTintColor: "white",
  headerShadowVisible: false,
  headerBackButtonDisplayMode: "minimal",
};

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
  const [enrolled, setEnrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [appDisabled, setAppDisabled] = useState(false);
  const [image, setImage] = useState(null);
  const [mainEvent, setMainEvent] = useState(false);
  const [missionDmEnabled, setMissionDmEnabled] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

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
        setMissionDmEnabled(!!docSnapshot.data().missionDmEnabled);
      } else {
        console.error("Document does not exist!");
        setAppDisabled(false);
        setMainEvent(false);
        setMissionDmEnabled(false);
      }

      setPermissionsLoaded(true);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Live-updates role/isAdmin/etc. from the user's Firestore doc, so a role
  // change made elsewhere (e.g. the account/settings screen) is reflected
  // here immediately instead of only after a restart or re-login.
  useEffect(() => {
    if (!user) {
      setRole("");
      setUserIDState("");
      setEnrolled(false);
      setIsAdmin(false);
      return;
    }

    const docRef = doc(db, "Users", user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserIDState(data.donorID);
          setRole(data.role);
          setEnrolled(data.inMissionDM);
          setIsAdmin(data.isAdmin === true);
        } else {
          console.log("Document does not exist");
        }
      },
      (error) => {
        console.error("Error listening to user document:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    getUserInfo(userIDState)
      .then((data) => {
        setUserInfo(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [userIDState]);

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
      notificationListener.current?.remove?.();
      responseListener.current?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (expoPushToken && auth.currentUser) {
      handleToken();
    }
  }, [expoPushToken, auth.currentUser]);

  if (loading || !permissionsLoaded) {
    return null;
  }

  const HomeStack = createStackNavigator();

  const HomeStackScreen = (props) => (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name={mainEvent ? "HomeME" : "Home"}
        component={mainEvent ? HomeME : TTHome}
        options={{ headerShown: false }}
        initialParams={{ expoPushToken }}
      />
      <HomeStack.Screen
        name="EventDetails"
        component={EventDetails}
        options={{ title: "Upcoming Events", ...stackHeaderOptions }}
      />
      <HomeStack.Screen
        name="AllNotifications"
        component={AllNotifications}
        options={{ title: "Notifications", ...stackHeaderOptions }}
      />
      <HomeStack.Screen
        name="AllEvents"
        component={AllEvents}
        options={{ title: "Events", ...stackHeaderOptions }}
      />
    </HomeStack.Navigator>
  );

  const SpiritStack = createStackNavigator();

  const SpiritScreenStack = () => (
    <SpiritStack.Navigator>
      <SpiritStack.Screen
        name="Spirit"
        component={Spirit}
        options={{ headerShown: false }}
      />
      <SpiritStack.Screen
        name="Scanner"
        component={Scanner}
        options={{
          title: "Scanner",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: "white",
          headerShadowVisible: false,
        }}
      />
    </SpiritStack.Navigator>
  );

  const FundraiserStack = createStackNavigator();

  const FundraiserStackScreen = () => (
    <FundraiserStack.Navigator>
      <FundraiserStack.Screen
        name="FundraiserHome"
        component={Fundraiser}
        options={{ headerShown: false }}
      />
      <FundraiserStack.Screen
        name="TeamFundraiser"
        component={TeamFundraiser}
        options={({ route }) => ({
          title: route.params?.teamName || "",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: "white",
          headerShadowVisible: false,
        })}
      />
    </FundraiserStack.Navigator>
  );

  const AdminStack = createStackNavigator();

  const AdminStackScreen = () => (
    <AdminStack.Navigator>
      <AdminStack.Screen
        name="Admin"
        component={Admin}
        initialParams={{ expoPushToken }}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="MissionDM Admin"
        component={MissionDMAdmin}
        initialParams={{ expoPushToken }}
        options={{ title: "MissionDM Admin", ...stackHeaderOptions }}
      />
    </AdminStack.Navigator>
  );

  const SettingsStack = createStackNavigator();

  const SettingsStackScreen = () => (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="Login"
        component={Login}
        initialParams={{ expoPushToken }}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{ headerShown: false }}
      />
    </SettingsStack.Navigator>
  );

  const ResourcesStack = createStackNavigator();

  const ResourcesStackScreen = () => (
    <ResourcesStack.Navigator>
      <ResourcesStack.Screen
        name="ResourcesHome"
        component={ResourcesScreen}
        options={{ headerShown: false }}
      />
      <ResourcesStack.Screen
        name="FAQ"
        component={FAQ}
        options={{ title: "FAQ", ...stackHeaderOptions }}
      />
    </ResourcesStack.Navigator>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
      <StatusBar style="light" translucent={false} backgroundColor="#1B4F8C" />
      <UserProvider>
        <NavigationContainer>
          <Drawer.Navigator
            screenOptions={{
              headerShown: false,
              drawerType: "front",
              overlayColor: "rgba(0,0,0,0.4)",
            }}
            drawerContent={(props) => (
              <DrawerContent {...props} missionDmEnabled={missionDmEnabled} />
            )}
          >
            <Drawer.Screen name="Home" component={HomeStackScreen} />
            {user && (
              <Drawer.Screen name="Spirit" component={SpiritScreenStack} />
            )}
            {user && (
              <Drawer.Screen
                name="Fundraiser"
                component={FundraiserStackScreen}
                options={{ unmountOnBlur: true }}
              />
            )}
            {user && missionDmEnabled && (
              <Drawer.Screen name="MissionDM" component={MissionDM} />
            )}
            <Drawer.Screen name="Account" component={SettingsStackScreen} />
            <Drawer.Screen name="Resources" component={ResourcesStackScreen} />
            <Drawer.Screen name="Shootproof" component={ShootproofScreen} />
            {user && isAdmin && (
              <Drawer.Screen name="Admin" component={AdminStackScreen} />
            )}
          </Drawer.Navigator>
        </NavigationContainer>
      </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
