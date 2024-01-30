# DM-App-2024
built with react native

# Before Starting
Install node.js

Restart your computer to complete the install

In a command line run npm install -g npm

cd DM-APP-2024

npm install -g expo-cli
npm install
npm audit fix --force

npx expo install react-native-web@~0.19.6 react-dom@18.2.0
npx expo install @expo/webpack-config@^19.0.0

npm install @react-navigation/native
npm install react-native-screens react-native-safe-area-context
npm install @react-navigation/bottom-tabs

# Run
To run your project, navigate to the directory and run one of the following npm commands.

- cd DM-APP-2024
 them directly with the commands below.
- npm run android
- npm run ios # requires an iOS device or macOS for access to an iOS simulator       
- npm run web

# How Nat got it to run on her phone
- Download the Expo Go app from the appstore
- Run npm run web from the DM-APP-2024 directory
- Scan the QR code on phone and it will take you to expo

# If that doesn't work
- npm install
- npx expo install
- run "expo upgrade"
- Run "npx expo start --tunnel" from DM-APP-2024 directory
- Scan the QR code on phone and it will take you to Expo Go app

# install
- npm install @react-navigation/bottom-tabs
- npm install --save react-native-calendars
- npm install react-native-elements

# DonorDrive API Links
- Where most of the API came from
- Based on another CMN initiative so same content from fetches
https://github.com/ammuench/extra-life-api/tree/master

- More specific to DonorDrive
https://github.com/DonorDrive/PublicAPI/tree/master