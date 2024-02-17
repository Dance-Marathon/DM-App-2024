import {db} from "./firestore.js"
import { collection, addDoc, getDocs } from "firebase/firestore"; 


let addSpiritPointEntry = async () => {
    try {
        const docRef = await addDoc(collection(db, "Spirit Points"), {
            ['2024-01-10']: {
                periods: [
                  { key: 'Chipotle Hospitality Night', startingDay: true, endingDay: true, color: 'blue' },
                  { key: 'Test', startingDay: true, endingDay: true, color: 'black' },
                ]
              }
        });
        console.log("Document written with ID: ", docRef.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
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

export {addSpiritPointEntry, readSpiritPointEntries}
