import {db} from "./firestore.js"
import { collection, addDoc, getDocs, where } from "firebase/firestore"; 
import {auth} from "./AuthManager.js"

let addSpirtPoints = async () => {
  console.log(auth._currentUser.uid)
  let calanderEntries = new Map();
  try {
      const querySnapshot = await getDocs(collection(db, "Users"));
      console.log(querySnapshot)
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  return calanderEntries

}

let readSpiritPointEntries = async () => {
    let calanderEntries = new Map();
    try {
        const querySnapshot = await getDocs(collection(db, "Spirit Points"));
        querySnapshot.forEach((doc) => {
            calanderEntries.set(doc.id, doc.data())
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    return calanderEntries
    
      
}

export {readSpiritPointEntries, addSpirtPoints}
