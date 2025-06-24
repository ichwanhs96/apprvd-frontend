// Export Firebase configuration
export { firebaseApp } from './config';
export { default as firebaseConfig } from './config';

// Export Firebase authentication utilities
export {
  auth,
  googleProvider,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  onAuthStateChange,
} from './auth'; 