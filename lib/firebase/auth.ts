import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseApp } from './config';

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    await auth.signOut();
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
}; 