const admin = require('firebase-admin');

const serviceAccount = require('/path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dm-app-2024-default-rtdb.firebaseio.com"
});

const message = {
  notification: {
    title: 'Test Notification',
    body: 'This is a test message from Firebase.',
  },
  token: 'Your_Expo_Push_Token'
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });
