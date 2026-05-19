import { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { getNotificationsForUser } from '../firebase/firestore';

/**
 * Returns the count of unread notifications for the current user.
 * Refreshes whenever the user's uid changes or when `refresh()` is called.
 */
export function useNotificationCount() {
  const { userProfile } = useAuthContext();
  const [count, setCount] = useState(0);

  const load = async () => {
    if (!userProfile?.uid) return;
    try {
      const notifs = await getNotificationsForUser(userProfile.uid);
      setCount(notifs.filter(n => !n.read).length);
    } catch {
      // silently fail — badge is non-critical
    }
  };

  useEffect(() => {
    load();
    // Poll every 30s so the badge stays reasonably fresh
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [userProfile?.uid]);

  return { count, refresh: load };
}
