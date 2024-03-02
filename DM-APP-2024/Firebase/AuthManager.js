import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from './firebase'; // Import the firebase instance


const auth = getAuth(app);

const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in successfully!');
    } catch (error) {
      console.error('Error logging in:', error.message);
    }
  };

const handleSignOut = async () => {
    signOut(auth).then(() => {
        console.log('Signed Out successfully!');
      }).catch((error) => {
        console.error('Error signing out:', error.message);
      });
}


export {handleLogin, handleSignOut}