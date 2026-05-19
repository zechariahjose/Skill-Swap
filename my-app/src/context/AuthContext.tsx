import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToAuth, getUserProfile } from '../firebase/auth';
import { isAdminUser } from '../firebase/firestore';
import { User } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile:  User | null;
  isAdmin:      boolean;
  loading:      boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser:    null,
  userProfile:     null,
  isAdmin:         false,
  loading:         true,
  refreshProfile:  async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile,  setUserProfile]  = useState<User | null>(null);
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [loading,      setLoading]      = useState(true);

  const loadProfile = async (uid: string) => {
    const [profile, adminStatus] = await Promise.all([
      getUserProfile(uid),
      isAdminUser(uid),
    ]);
    setUserProfile(profile as User | null);
    setIsAdmin(adminStatus);
  };

  const refreshProfile = async () => {
    if (firebaseUser) await loadProfile(firebaseUser.uid);
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const timer = setTimeout(() => {
      unsub = subscribeToAuth(async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          await loadProfile(fbUser.uid);
        } else {
          setUserProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      if (unsub) unsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, isAdmin, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
