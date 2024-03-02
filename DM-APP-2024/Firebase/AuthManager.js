import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from './firebase';
import { addUser } from './UserManager';

const auth = getAuth(app);

const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in successfully!');
    } catch (error) {
      console.error('Error logging in:', error.message);
    }
  };

const handleSignUp = async( userData ) => {
  try {
    createUserWithEmailAndPassword(auth, userData.email, userData.password).then((data) => {
      console.log(data.user.uid)
      
      addUser(userData, data.user.uid)
    })

    console.log('Signed Up successfully!');
  } catch (error) {
    console.error('Error logging in:', error.message);
  }
}
const handleSignOut = async () => {
    signOut(auth).then(() => {
        console.log('Signed Out successfully!');
      }).catch((error) => {
        console.error('Error signing out:', error.message);
      });
}


export {handleLogin, handleSignOut, handleSignUp, auth}