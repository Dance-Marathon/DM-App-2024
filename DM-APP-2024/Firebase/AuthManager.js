import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  deleteUser,
} from "firebase/auth";
import { app } from "./firebase";
import { getFirestore, setDoc, doc, deleteDoc } from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

const deleteUserAccount = async () => {
  const user = auth.currentUser;
  console.log("Deleting user account...");

  try {
    const userDoc = doc(db, "Users", user.uid);
    await deleteDoc(userDoc);
    console.log("Doc deleted");
  } catch (error) {
    console.log("Error deleting doc:", error);
  }

  try {
    await user.delete();
    console.log("Auth deleted");
  } catch (error) {
    console.log("Error deleting auth:", error);
  }

  console.log("User account deletion process complete!");
};

const handleLogin = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in successfully!");
  } catch (error) {
    console.error("Error logging in:", error.message);
  }
};

// function extractParticipantID(url) {
//   // First, try to extract using the query parameter 'participantID='
//   const searchString = 'participantID=';
//   let startIndex = url.indexOf(searchString);
//   if (startIndex !== -1) {
//     return url.slice(startIndex + searchString.length, startIndex + searchString.length + 7);
//   }

//   // If not found, try to match the URL pattern ending in seven digits
//   const urlPattern = /\/(\d{7})$/; // Regex to match exactly seven digits at the end of the URL
//   const match = url.match(urlPattern);
//   if (match) {
//     return match[1]; // Return the matched group of digits
//   }

//   // Return null if no ID is found
//   return null;
// }

function extractParticipantID(url) {
  // 1. Try to extract using the query parameter 'participantID='
  const searchString = "participantID=";
  let startIndex = url.indexOf(searchString);
  if (startIndex !== -1) {
    // We assume the ID is exactly 7 digits for this parameter, as in the original logic
    return url.slice(
      startIndex + searchString.length,
      startIndex + searchString.length + 7
    );
  }

  // 2. Extract the segment following '/participants/'
  const participantPath = "/participants/";
  startIndex = url.indexOf(participantPath);

  if (startIndex !== -1) {
    // Start searching immediately after '/participants/'
    let idStart = startIndex + participantPath.length;
    let idEnd = url.length;

    // Find the end of the ID, which is either a '?' or the end of the string
    const queryIndex = url.indexOf("?", idStart);
    if (queryIndex !== -1) {
      idEnd = queryIndex;
    }

    // The extracted ID segment could be a numerical ID or a custom name ID
    const extractedId = url.slice(idStart, idEnd);

    // If the ID is 7 digits, return it (original logic)
    const sevenDigitPattern = /^\d{7}$/;
    if (sevenDigitPattern.test(extractedId)) {
      return extractedId;
    }

    // If the ID is a custom name (alphanumeric, hyphens, etc.), return it (new logic)
    if (extractedId) {
      return extractedId;
    }
  }

  // 3. Fallback for old 7-digit URLs without '/participants/' (Original logic remains, but simplified by Step 2)
  // NOTE: This fallback logic is redundant if all URLs contain '/participants/'

  // Return null if no ID is found
  return null;
}

/* function extractParticipantID(url) {
  const searchString = 'participantID=';
  const startIndex = url.indexOf(searchString) + searchString.length;
  if (startIndex > -1) {
    const participantID = url.substring(startIndex, startIndex + 7);
    return participantID;
  }
  return null;
} */

async function addUserExpoPushToken(userId, expoPushToken) {
  try {
    const currentUID = auth.currentUser.uid;
    const docRef = doc(db, "Users", currentUID);

    // Update the user's document with the ExpoPushToken
    await setDoc(
      docRef,
      {
        notificationToken: expoPushToken,
      },
      { merge: true }
    );

    console.log(`ExpoPushToken ${expoPushToken} added to user ${userId}`);
  } catch (error) {
    console.error("Error adding ExpoPushToken to Firestore:", error);
  }
}

async function updateDDLink(userId, newLink) {
  const participantID = extractParticipantID(newLink);
  if (!participantID) {
    throw new Error(
      "Invalid DonorDrive link. Please copy your link from the DonorDrive website."
    );
  }
  try {
    const currentUID = auth.currentUser.uid;
    const docRef = doc(db, "Users", currentUID);

    // Update the user's document with the ExpoPushToken
    await setDoc(
      docRef,
      {
        donorLink: newLink,
        donorID: extractParticipantID(newLink),
      },
      { merge: true }
    );

    console.log(`DonorDrive Link ${newLink} added to user ${userId}`);
  } catch (error) {
    console.error("Error adding Link to Firestore:", error);
  }
}

async function updateRole(userId, newRole) {
  try {
    const currentUID = auth.currentUser.uid;
    const docRef = doc(db, "Users", currentUID);

    // Update the user's document with the ExpoPushToken
    await setDoc(
      docRef,
      {
        role: newRole,
      },
      { merge: true }
    );

    console.log(`Role ${newRole} added to user ${userId}`);
  } catch (error) {
    console.error("Error adding Role to Firestore:", error);
  }
}

const handleSignUp = async (
  email,
  password,
  role,
  donorDriveLink,
  expopushtoken
) => {
  try {
    if (!email || !password || !role || !donorDriveLink) {
      throw new Error("All fields are required");
    }
    await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log("User signed up successfully!");
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

export {
  handleLogin,
  handleSignOut,
  handleSignUp,
  deleteUserAccount,
  auth,
  db,
  addUserExpoPushToken,
  updateDDLink,
  updateRole,
};
