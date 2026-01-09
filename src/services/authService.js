import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

/**
 * Handles Google Sign-In using Firebase Auth.
 * Opens a popup window for the user to sign in with their Google account.
 * After successful sign-in, creates a user document in Firestore if it doesn't exist.
 * 
 * @returns {Promise<User>} The authenticated user object.
 * @throws {Error} If the sign-in process fails.
 */
export const handleGoogleSignIn = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        // The signed-in user info.
        const user = result.user;
        
        // Check if user document exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        // Create user document if it doesn't exist
        if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
                name: user.displayName || '',
                email: user.email || '',
                photoURL: user.photoURL || '',
                role: 'student',
                createdAt: serverTimestamp(),
            });
            console.log('User document created in Firestore');
        }
        
        return user;
    } catch (error) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`Google Sign-In Error (${errorCode}):`, errorMessage);
        throw error;
    }
};

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
export const logOut = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
};

/**
 * Subscribes to authentication state changes.
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
    return onAuthStateChanged(auth, callback);
};
