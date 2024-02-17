import {app} from "./firebase.js"
import { getFirestore } from "firebase/firestore";

const db = getFirestore(app);

export {db}
