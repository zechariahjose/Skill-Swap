import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

type DemoUser = {
  uid: string;
  email: string;
  password: string;
  profile: {
    uid: string;
    name: string;
    initials: string;
    bio: string;
    avatar: null;
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

export function updateDemoProfile(uid: string, data: { name?: string; bio?: string; initials?: string }) {
  for (const [email, user] of demoUsersByEmail.entries()) {
    if (user.uid === uid) {
      demoUsersByEmail.set(email, {
        ...user,
        profile: {
          ...user.profile,
          ...(data.name ? { name: data.name } : {}),
          ...(data.bio !== undefined ? { bio: data.bio } : {}),
          ...(data.initials ? { initials: data.initials } : {}),
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
    avatar:    null,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

/** Sign in existing user */
export async function login(email: string, password: string): Promise<FirebaseUser> {
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
  if (!isFirebaseConfigured || !auth) {
    demoCurrentUser = null;
    emitDemoAuth();
    return;
  }

  await firebaseSignOut(auth);
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
  if (!isFirebaseConfigured || !auth) {
    demoListeners.add(callback);
    callback(demoCurrentUser);
    return () => {
      demoListeners.delete(callback);
    };
  }

  return onAuthStateChanged(auth, callback);
}