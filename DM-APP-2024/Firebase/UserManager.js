import {db} from "./firestore.js"
import { collection, addDoc, getDocs } from "firebase/firestore"; 


let addUser = async (userData, uid) => {
    try {
        const docRef = await addDoc(collection(db, "Users"), {
            donorID: userData.donorID, email: userData.email, role: userData.role, team: userData.team, uid: uid
        })
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
}
export {addUser}