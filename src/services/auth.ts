import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { UserProfile } from '../types';

const STORAGE_KEY = 'moove_current_user';
const PENDING_ACTION_KEY = 'moove_pending_action';

// Pending action callback mechanism (e.g. user clicked "Add Spot", prompted to sign in, resumes action)
export interface PendingAction {
  type: 'add_spot' | 'add_review' | 'plan_journey' | 'save_journey';
  payload?: any;
}

export const setPendingAuthAction = (action: PendingAction | null) => {
  if (!action) {
    sessionStorage.removeItem(PENDING_ACTION_KEY);
  } else {
    sessionStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(action));
  }
};

export const getPendingAuthAction = (): PendingAction | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_ACTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPendingAuthAction = () => {
  sessionStorage.removeItem(PENDING_ACTION_KEY);
};

// Check if user is logged into local session storage
const getSavedUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let currentUserProfile: UserProfile | null = getSavedUser();
const authListeners = new Set<(user: UserProfile | null) => void>();

const notifyListeners = () => {
  authListeners.forEach(listener => listener(currentUserProfile));
};

// Helper: Check if user has an admin record in Firestore or admin email
async function verifyAdminRole(uid: string, email?: string | null): Promise<boolean> {
  if (email && (email.toLowerCase() === 'flowwithraees@gmail.com' || email.toLowerCase().includes('admin@moove.in'))) {
    return true;
  }
  if (!isFirebaseConfigured() || !db) return false;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

// Helper: Sync or create User profile document in Firestore
async function syncUserProfileDoc(firebaseUser: FirebaseUser, overrideDisplayName?: string): Promise<UserProfile> {
  const isAdmin = await verifyAdminRole(firebaseUser.uid, firebaseUser.email);
  let user: UserProfile = {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: overrideDisplayName || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Nomad Explorer'),
    photoURL: firebaseUser.photoURL || undefined,
    role: isAdmin ? 'admin' : 'user',
    travelKarma: isAdmin ? 500 : 50,
    badges: isAdmin ? ['Community Guardian', 'Admin'] : ['Verified Nomad', 'Route Pioneer'],
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured() && db) {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data();
        user = {
          ...user,
          displayName: data.displayName || user.displayName,
          photoURL: data.photoURL || user.photoURL,
          bio: data.bio,
          travelKarma: data.travelKarma || user.travelKarma,
          badges: data.badges || user.badges,
          role: isAdmin ? 'admin' : (data.role === 'admin' ? 'admin' : 'user')
        };
      } else {
        // Create initial public profile
        await setDoc(userDocRef, {
          displayName: user.displayName,
          photoURL: user.photoURL || '',
          bio: 'Exploring India on ultra-low budget.',
          role: user.role,
          travelKarma: user.travelKarma,
          badges: user.badges,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Create private info document (PII Isolation: email stored in subcollection)
        await setDoc(doc(db, 'users', firebaseUser.uid, 'private', 'info'), {
          userId: firebaseUser.uid,
          email: firebaseUser.email || '',
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Firestore profile sync note:', err);
    }
  }

  return user;
}

export const onAuthChange = (callback: (user: UserProfile | null) => void) => {
  authListeners.add(callback);
  callback(currentUserProfile);

  if (isFirebaseConfigured() && auth) {
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        currentUserProfile = await syncUserProfileDoc(firebaseUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUserProfile));
      } else {
        currentUserProfile = null;
        localStorage.removeItem(STORAGE_KEY);
      }
      notifyListeners();
    });

    return () => {
      authListeners.delete(callback);
      unsubscribe();
    };
  }

  return () => {
    authListeners.delete(callback);
  };
};

export const signInWithGoogle = async (): Promise<UserProfile> => {
  if (isFirebaseConfigured() && auth) {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = await syncUserProfileDoc(cred.user);
    currentUserProfile = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    notifyListeners();
    return user;
  }

  // Fallback profile when running in offline/local mode
  const fallbackUser: UserProfile = {
    id: 'user_' + Date.now().toString(36),
    email: 'traveller@moove.in',
    displayName: 'Moove Traveller',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bio: 'Backpacker & budget travel contributor across India.',
    role: 'user',
    travelKarma: 100,
    badges: ['Verified Backpacker', 'Community Nomad'],
    createdAt: new Date().toISOString()
  };
  currentUserProfile = fallbackUser;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUser));
  notifyListeners();
  return fallbackUser;
};

export const signInWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
  if (!email || !pass) {
    throw new Error('Please enter both email and password.');
  }

  if (isFirebaseConfigured() && auth) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = await syncUserProfileDoc(cred.user);
    currentUserProfile = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    notifyListeners();
    return user;
  }

  // Validate mock password length
  if (pass.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const name = email.split('@')[0] || 'Nomad';
  const isAdmin = email.toLowerCase().includes('admin') || email.toLowerCase() === 'flowwithraees@gmail.com';
  const user: UserProfile = {
    id: 'usr_' + Date.now().toString(36),
    email,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    role: isAdmin ? 'admin' : 'user',
    travelKarma: isAdmin ? 500 : 75,
    badges: isAdmin ? ['Community Guardian', 'Admin'] : ['Verified Nomad', 'Active Contributor'],
    createdAt: new Date().toISOString()
  };
  currentUserProfile = user;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  notifyListeners();
  return user;
};

export const signUpWithEmail = async (
  email: string, 
  pass: string, 
  displayName: string, 
  confirmPass: string
): Promise<UserProfile> => {
  if (!displayName || displayName.trim().length < 2) {
    throw new Error('Please enter your full name or traveller handle (at least 2 characters).');
  }
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (pass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  if (pass !== confirmPass) {
    throw new Error('Passwords do not match. Please re-enter.');
  }

  if (isFirebaseConfigured() && auth) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = await syncUserProfileDoc(cred.user, displayName.trim());
    currentUserProfile = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    notifyListeners();
    return user;
  }

  const isAdmin = email.toLowerCase().includes('admin') || email.toLowerCase() === 'flowwithraees@gmail.com';
  const user: UserProfile = {
    id: 'usr_' + Date.now().toString(36),
    email,
    displayName: displayName.trim(),
    role: isAdmin ? 'admin' : 'user',
    travelKarma: 30,
    badges: ['New Explorer', 'Moove Member'],
    createdAt: new Date().toISOString()
  };
  currentUserProfile = user;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  notifyListeners();
  return user;
};

export const resetPassword = async (email: string): Promise<string> => {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (isFirebaseConfigured() && auth) {
    await sendPasswordResetEmail(auth, email);
    return 'Password reset link sent to your email!';
  }
  return `Password reset instructions simulated for ${email}. Check your inbox!`;
};

export const signOut = async (): Promise<void> => {
  if (isFirebaseConfigured() && auth) {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout issue:', e);
    }
  }
  currentUserProfile = null;
  localStorage.removeItem(STORAGE_KEY);
  notifyListeners();
};



export const getCurrentUser = (): UserProfile | null => currentUserProfile;
