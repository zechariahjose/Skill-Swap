import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateEmail,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthInstance, db, isFirebaseConfigured } from './config';

type DemoUser = {
  uid: string;
  email: string;
  password: string;
  profile: {
    uid: string;
    name: string;
    initials: string;
    bio: string;
    location?: string;
    avatar: string | null;
    portfolioItems?: any[];
    portfolioLinks?: any[];
    createdAt: Date;
  };
};

let demoCurrentUser: FirebaseUser | null = null;
const demoUsersByEmail = new Map<string, DemoUser>();
const demoListeners = new Set<(user: FirebaseUser | null) => void>();

function emitDemoAuth() {
  demoListeners.forEach((cb) => cb(demoCurrentUser));
}

function toFirebaseLikeUser(uid: string, email: string): FirebaseUser {
  return { uid, email } as FirebaseUser;
}

export function updateDemoProfile(
  uid: string,
  data: {
    name?: string;
    bio?: string;
    location?: string;
    initials?: string;
    avatar?: string | null;
    portfolioItems?: any[];
    portfolioLinks?: any[];
  }
) {
  for (const [email, user] of demoUsersByEmail.entries()) {
    if (user.uid === uid) {
      demoUsersByEmail.set(email, {
        ...user,
        profile: {
          ...user.profile,
          ...(data.name ? { name: data.name } : {}),
          ...(data.bio !== undefined ? { bio: data.bio } : {}),
          ...(data.location !== undefined ? { location: data.location } : {}),
          ...(data.initials ? { initials: data.initials } : {}),
          ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
          ...(data.portfolioItems !== undefined ? { portfolioItems: data.portfolioItems } : {}),
          ...(data.portfolioLinks !== undefined ? { portfolioLinks: data.portfolioLinks } : {}),
        },
      });
      break;
    }
  }
}

/** Register a new user and create Firestore profile */
export async function register(
  email: string,
  password: string,
  name: string
): Promise<FirebaseUser> {
  const auth = getAuthInstance();
  if (!isFirebaseConfigured || !auth || !db) {
    if (demoUsersByEmail.has(email)) {
      throw new Error('Email already exists in demo mode.');
    }
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const uid = `demo_${Date.now()}`;
    const demoUser: DemoUser = {
      uid,
      email,
      password,
      profile: {
        uid,
        name,
        initials,
        bio: '',
        location: '',
        avatar: null,
        createdAt: new Date(),
      },
    };
    demoUsersByEmail.set(email, demoUser);
    demoCurrentUser = toFirebaseLikeUser(uid, email);
    emitDemoAuth();
    return demoCurrentUser;
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  await setDoc(doc(db, 'users', cred.user.uid), {
    uid:       cred.user.uid,
    name,
    initials,
    bio:       '',
    location:  '',
    avatar:    null,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

/** Sign in existing user */
export async function login(email: string, password: string): Promise<FirebaseUser> {
  const auth = getAuthInstance();
  if (!isFirebaseConfigured || !auth) {
    const demoUser = demoUsersByEmail.get(email);
    if (!demoUser || demoUser.password !== password) {
      throw new Error('Invalid email or password in demo mode.');
    }
    demoCurrentUser = toFirebaseLikeUser(demoUser.uid, demoUser.email);
    emitDemoAuth();
    return demoCurrentUser;
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Sign out */
export async function signOut(): Promise<void> {
  const auth = getAuthInstance();
  if (!isFirebaseConfigured || !auth) {
    demoCurrentUser = null;
    emitDemoAuth();
    return;
  }

  await firebaseSignOut(auth);
}

export async function changeEmail(newEmail: string): Promise<void> {
  const auth = getAuthInstance();
  if (!isFirebaseConfigured || !auth || !auth.currentUser) {
    throw new Error('Change email is unavailable in demo mode.');
  }
  await updateEmail(auth.currentUser, newEmail);
}

export async function changePassword(newPassword: string): Promise<void> {
  const auth = getAuthInstance();
  if (!isFirebaseConfigured || !auth || !auth.currentUser) {
    throw new Error('Change password is unavailable in demo mode.');
  }
  await updatePassword(auth.currentUser, newPassword);
}

export async function deleteCurrentAccount(): Promise<void> {
  const auth = getAuthInstance();
  if (!isFirebaseConfigured || !auth || !auth.currentUser) {
    throw new Error('Delete account is unavailable in demo mode.');
  }
  await deleteUser(auth.currentUser);
}

/** Get Firestore user profile */
export async function getUserProfile(uid: string) {
  if (!isFirebaseConfigured || !db) {
    const match = Array.from(demoUsersByEmail.values()).find((user) => user.uid === uid);
    return match ? match.profile : null;
  }

  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

/** Subscribe to auth state */
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  const auth = getAuthInstance();
  if (!isFirebaseConfigured || !auth) {
    demoListeners.add(callback);
    callback(demoCurrentUser);
    return () => {
      demoListeners.delete(callback);
    };
  }

  return onAuthStateChanged(auth, callback);
}
