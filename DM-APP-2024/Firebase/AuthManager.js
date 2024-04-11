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

const handleSignUp = async (email, password, role, donorDriveLink) => {
  try {
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
          donorID: donorDriveLink.slice(-7),
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

export { handleLogin, handleSignOut, handleSignUp, deleteUserAccount, auth, db };
