import {db} from "./firestore.js"
import { collection, addDoc, getDocs } from "firebase/firestore"; 
import {auth} from "./AuthManager.js"

let addUser = async (userData, uid) => {
    try {
        const docRef = await addDoc(collection(db, "Users"), {
            donorID: userData.donorID, email: userData.email, role: userData.role, team: userData.team, uid: uid, points: 0
        })
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
}
export {addUser}