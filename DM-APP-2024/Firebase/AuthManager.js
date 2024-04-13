import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword, 
  deleteUser,
} from "firebase/auth";
import { app } from "./firebase";
import { addUser } from "./UserManager";
import { getFirestore, setDoc, doc, deleteDoc } from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const deleteUserAccount = async () => {
  const user = auth.currentUser;
  console.log("Deleting user account...");
  console.log(user);
  try{
    const userDoc = doc(db, "Users", user.uid);
    await deleteDoc(userDoc);
    await user.delete()
    console.log("User account deleted!");
  }
  catch (error) {
    console.error("Error deleting user account:", error.message);
  }
};

const handleLogin = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in successfully!");
  } catch (error) {
    console.error("Error logging in:", error.message);
  }
};

function extractParticipantID(url) {
  const searchString = 'participantID=';
  const startIndex = url.indexOf(searchString) + searchString.length;
  if (startIndex > -1) {
    // Extract the next 7 characters after 'participantID='
    const participantID = url.substring(startIndex, startIndex + 7);
    return participantID;
  }
  return null; // or handle the case where 'participantID=' is not found
}

async function addUserExpoPushToken(userId, expoPushToken) {
  try {
    const currentUID = auth.currentUser.uid;
    const docRef = doc(db, "Users", currentUID);
    console.log('Data:',docRef);

    // Update the user's document with the ExpoPushToken
    await setDoc(docRef, {
      notificationToken: expoPushToken
    }, { merge: true });

    console.log(`ExpoPushToken ${expoPushToken} added to user ${userId}`);
  } catch (error) {
    console.error("Error adding ExpoPushToken to Firestore:", error);
  }
}

const handleSignUp = async (email, password, role, donorDriveLink, expopushtoken) => {
  try {
    if (!email || !password || !role || !donorDriveLink) {
      throw new Error('All fields are required');
    }
    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log(user);
        return setDoc(doc(db, "Users", user.uid), {
          email: email,
          password: password,
          role: role,
          uid: user.uid,
          donorLink: donorDriveLink,
          donorID: extractParticipantID(donorDriveLink),
          notificationToken: expopushtoken,
        });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  } catch (error) {
    console.error("Error creating user:", error.message);
  }
};

const handleSignOut = async () => {
  signOut(auth)
    .then(() => {
      console.log("Signed Out successfully!");
    })
    .catch((error) => {
      console.error("Error signing out:", error.message);
    });
};

export { handleLogin, handleSignOut, handleSignUp, deleteUserAccount, auth, db, addUserExpoPushToken };
