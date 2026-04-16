import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { subscribeToAuth, getUserProfile } from '../firebase/auth';
import { User } from '../types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userProfile:  User | null;
  loading:      boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser:    null,
  userProfile:     null,
  loading:         true,
  refreshProfile:  async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile,  setUserProfile]  = useState<User | null>(null);
  const [loading,      setLoading]      = useState(true);

  const loadProfile = async (uid: string) => {
    const profile = await getUserProfile(uid);
    setUserProfile(profile as User | null);
  };

  const refreshProfile = async () => {
    if (firebaseUser) await loadProfile(firebaseUser.uid);
  };

  useEffect(() => {
    const unsub = subscribeToAuth(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadProfile(fbUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, userProfile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);