import {db} from "./firestore.js"
import { collection, addDoc, getDocs } from "firebase/firestore"; 


let addCalanderEntry = async () => {
    try {
        const docRef = await addDoc(collection(db, "Calendar"), {
            ['2024-01-10']: {
                periods: [
                  { key: 'Chipotle Hospitality Night', startingDay: true, endingDay: true, color: 'blue' },
                  { key: 'Test', startingDay: true, endingDay: true, color: 'black' },
                ]
              }
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
}

let readCalanderEntries = async () => {
    let calanderEntries = new Map();
    try {
        const querySnapshot = await getDocs(collection(db, "Calendar"));
        querySnapshot.forEach((doc) => {
            calanderEntries.set(doc.id, doc.data())
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    return calanderEntries
    
      
}

export {addCalanderEntry, readCalanderEntries}
