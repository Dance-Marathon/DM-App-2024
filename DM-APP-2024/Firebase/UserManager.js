import {db} from "./firestore.js"
import { collection, addDoc, getDocs, doc, getDoc } from "firebase/firestore"; 
import {auth} from "./AuthManager.js"

let addUser = async (userData, uid) => {
    try {
        const docRef = await addDoc(collection(db, "Users"), {
            donorID: userData.donorID, email: userData.email, role: userData.role, team: userData.team, uid: uid, points: 0
        })
      } catch (e) {
        console.error("Error adding document: ", e);
      }
}

const getUserData = async () => {
  try {
    const currentUID = auth.currentUser.uid;
    const docRef = doc(db, "Users", currentUID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data;
    } else {
      console.log("Document does not exist");
      return null;
    }
  } catch (error) {
    console.error("Error fetching document data:", error);
    throw error;
  }
};

export { addUser, getUserData }