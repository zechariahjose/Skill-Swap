import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { updateDemoProfile } from './auth';
import { Skill, SwapRequest, SwapStatus, User, UserConnection } from '../types';

let demoSkills: Skill[] = [];
let demoSwapRequests: SwapRequest[] = [];
const demoSkillListeners = new Set<(skills: Skill[]) => void>();

function convertTimestamps<T extends Record<string, any>>(data: T): T {
  const result = { ...data } as Record<string, any>;
  Object.keys(result).forEach((key) => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate();
    }
  });
  return result as T;
}

function emitDemoSkills() {
  const sorted = [...demoSkills].sort(
    (a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
  );
  demoSkillListeners.forEach((cb) => cb(sorted));
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function updateUserProfile(uid: string, data: Partial<User>) {
  if (!isFirebaseConfigured || !db) {
    const nextName = data.name;
    const nextInitials =
      data.initials ??
      (nextName
        ? nextName
            .split(' ')
            .map((word) => word[0] ?? '')
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : undefined);
    updateDemoProfile(uid, {
      name: nextName,
      bio: data.bio,
      location: data.location,
      initials: nextInitials,
      avatar: data.avatar ?? null,
      portfolioItems: data.portfolioItems,
      portfolioLinks: data.portfolioLinks,
    });
    demoSkills = demoSkills.map((s) =>
      s.userId === uid
        ? {
            ...s,
            userName: nextName ?? s.userName,
            userInitials: nextInitials ?? s.userInitials,
          }
        : s
    );
    demoSwapRequests = demoSwapRequests.map((r) => ({
      ...r,
      ...(r.fromUserId === uid
        ? {
            fromUserName: nextName ?? r.fromUserName,
            fromUserInitials: nextInitials ?? r.fromUserInitials,
          }
        : {}),
      ...(r.toUserId === uid
        ? {
            toUserName: nextName ?? r.toUserName,
            toUserInitials: nextInitials ?? r.toUserInitials,
          }
        : {}),
    }));
    emitDemoSkills();
    return;
  }

  await updateDoc(doc(db, 'users', uid), data);
}

export async function getUserById(uid: string): Promise<User | null> {
  if (!isFirebaseConfigured || !db) {
    const seed = demoSkills.find((skill) => skill.userId === uid);
    if (!seed) return null;
    return {
      uid,
      name: seed.userName,
      initials: seed.userInitials,
      bio: '',
      createdAt: new Date(),
    };
  }

  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? convertTimestamps({ uid: snap.id, ...snap.data() } as User) : null;
}

/**
 * Submit a rating for a user after a completed swap.
 * Calculates a rolling average from ratingCount + rating fields.
 */
export async function rateUser(
  raterUserId: string,
  ratedUserId: string,
  swapRequestId: string,
  stars: number
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  // Guard: check if this user already rated this swap
  const swapRef = doc(db, 'swap_requests', swapRequestId);
  const swapSnap = await getDoc(swapRef);
  if (swapSnap.exists() && swapSnap.data()[`ratedBy_${raterUserId}`] === true) {
    return; // already rated, do nothing
  }

  const userRef = doc(db, 'users', ratedUserId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const data = userSnap.data() as User & { ratingCount?: number };
  const prevRating = data.rating ?? 0;
  const prevCount = data.ratingCount ?? 0;
  const newCount = prevCount + 1;
  const newRating = (prevRating * prevCount + stars) / newCount;

  await updateDoc(userRef, {
    rating: Math.round(newRating * 10) / 10,
    ratingCount: newCount,
    totalSwaps: (data.totalSwaps ?? 0) + 1,
  });

  // Mark the swap as rated by the rater (not the person being rated)
  await updateDoc(swapRef, {
    [`ratedBy_${raterUserId}`]: true,
  });
}

// ─── SKILLS ───────────────────────────────────────────────────────────────────

export async function addSkill(skill: Omit<Skill, 'id' | 'createdAt'>) {
  if (!isFirebaseConfigured || !db) {
    const newSkill: Skill = {
      ...skill,
      id: `demo_skill_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
    };
    demoSkills = [newSkill, ...demoSkills];
    emitDemoSkills();
    return newSkill.id;
  }

  const ref = await addDoc(collection(db, 'skills'), {
    ...skill,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSkill(id: string, data: Partial<Skill>) {
  if (!isFirebaseConfigured || !db) {
    demoSkills = demoSkills.map((skill) => (skill.id === id ? { ...skill, ...data } : skill));
    emitDemoSkills();
    return;
  }

  await updateDoc(doc(db, 'skills', id), data);
}

export async function deleteSkill(id: string) {
  if (!isFirebaseConfigured || !db) {
    demoSkills = demoSkills.filter((skill) => skill.id !== id);
    emitDemoSkills();
    return;
  }

  await deleteDoc(doc(db, 'skills', id));
}

export async function getAllSkills(): Promise<Skill[]> {
  if (!isFirebaseConfigured || !db) {
    return [...demoSkills].sort(
      (a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
    );
  }

  const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => convertTimestamps({ id: d.id, ...d.data() } as Skill));
}

export async function getSkillsByUser(userId: string): Promise<Skill[]> {
  if (!isFirebaseConfigured || !db) {
    return demoSkills
      .filter((skill) => skill.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
  }

  const q = query(
    collection(db, 'skills'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => convertTimestamps({ id: d.id, ...d.data() } as Skill));
}

export function subscribeToSkills(callback: (skills: Skill[]) => void) {
  if (!isFirebaseConfigured || !db) {
    demoSkillListeners.add(callback);
    callback(
      [...demoSkills].sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0))
    );
    return () => {
      demoSkillListeners.delete(callback);
    };
  }

  const q = query(collection(db, 'skills'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const skills = snap.docs.map((d) => convertTimestamps({ id: d.id, ...d.data() } as Skill));
      callback(skills);
    },
    (error) => {
      console.warn('subscribeToSkills snapshot error:', error);
      callback([]);
    }
  );
}

// ─── SWAP REQUESTS ────────────────────────────────────────────────────────────

export async function createSwapRequest(
  request: Omit<SwapRequest, 'id' | 'createdAt'>
) {
  if (!isFirebaseConfigured || !db) {
    const newRequest: SwapRequest = {
      ...request,
      id: `demo_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
    };
    demoSwapRequests = [newRequest, ...demoSwapRequests];
    return newRequest.id;
  }

  const ref = await addDoc(collection(db, 'swap_requests'), {
    ...request,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateSwapStatus(id: string, status: SwapStatus) {
  if (!isFirebaseConfigured || !db) {
    demoSwapRequests = demoSwapRequests.map((request) =>
      request.id === id ? { ...request, status, updatedAt: new Date() } : request
    );
    return;
  }

  await updateDoc(doc(db, 'swap_requests', id), { status, updatedAt: serverTimestamp() });
}

export function subscribeToSwapRequests(
  userId: string,
  callback: (incoming: SwapRequest[], outgoing: SwapRequest[]) => void
) {
  if (!isFirebaseConfigured || !db) {
    const emit = () => {
      const incoming = demoSwapRequests
        .filter((request) => request.toUserId === userId)
        .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
      const outgoing = demoSwapRequests
        .filter((request) => request.fromUserId === userId)
        .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
      callback(incoming, outgoing);
    };
    emit();
    const interval = setInterval(emit, 500);
    return () => clearInterval(interval);
  }

  const inQ = query(
    collection(db, 'swap_requests'),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const outQ = query(
    collection(db, 'swap_requests'),
    where('fromUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  let incoming: SwapRequest[] = [];
  let outgoing: SwapRequest[] = [];

  const unsubIn = onSnapshot(
    inQ,
    (snap) => {
      incoming = snap.docs.map((d) => convertTimestamps({ id: d.id, ...d.data() } as SwapRequest));
      callback(incoming, outgoing);
    },
    (error) => {
      console.warn('subscribeToSwapRequests incoming snapshot error:', error);
      incoming = [];
      callback(incoming, outgoing);
    }
  );

  const unsubOut = onSnapshot(
    outQ,
    (snap) => {
      outgoing = snap.docs.map((d) => convertTimestamps({ id: d.id, ...d.data() } as SwapRequest));
      callback(incoming, outgoing);
    },
    (error) => {
      console.warn('subscribeToSwapRequests outgoing snapshot error:', error);
      outgoing = [];
      callback(incoming, outgoing);
    }
  );

  return () => {
    unsubIn();
    unsubOut();
  };
}

// ─── USER CONNECTIONS ─────────────────────────────────────────────────────────

export async function createConnection(fromUserId: string, toUserId: string) {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  const ref = await addDoc(collection(db, 'connections'), {
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateConnectionStatus(connectionId: string, status: 'accepted' | 'declined') {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  await updateDoc(doc(db, 'connections', connectionId), { status, updatedAt: serverTimestamp() });
}

export async function getUserConnections(
  userId: string
): Promise<{ connections: UserConnection[]; pendingRequests: UserConnection[] }> {
  if (!isFirebaseConfigured || !db) {
    return { connections: [], pendingRequests: [] };
  }

  const sentQ = query(
    collection(db, 'connections'),
    where('fromUserId', '==', userId),
    where('status', '==', 'accepted')
  );
  const receivedQ = query(
    collection(db, 'connections'),
    where('toUserId', '==', userId),
    where('status', '==', 'accepted')
  );
  const pendingSentQ = query(
    collection(db, 'connections'),
    where('fromUserId', '==', userId),
    where('status', '==', 'pending')
  );
  const pendingReceivedQ = query(
    collection(db, 'connections'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  );

  const [sentSnap, receivedSnap, pendingSentSnap, pendingReceivedSnap] = await Promise.all([
    getDocs(sentQ),
    getDocs(receivedQ),
    getDocs(pendingSentQ),
    getDocs(pendingReceivedQ),
  ]);

  const connections: UserConnection[] = [
    ...sentSnap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as UserConnection)),
    ...receivedSnap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as UserConnection)),
  ];

  const pendingRequests: UserConnection[] = [
    ...pendingSentSnap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as UserConnection)),
    ...pendingReceivedSnap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) } as UserConnection)),
  ];

  return { connections, pendingRequests };
}

export async function getConnectionBetweenUsers(
  userId1: string,
  userId2: string
): Promise<UserConnection | null> {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  const q1 = query(
    collection(db, 'connections'),
    where('fromUserId', '==', userId1),
    where('toUserId', '==', userId2)
  );
  const q2 = query(
    collection(db, 'connections'),
    where('fromUserId', '==', userId2),
    where('toUserId', '==', userId1)
  );

  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const connection = snap1.docs[0] || snap2.docs[0];
  return connection ? ({ id: connection.id, ...convertTimestamps(connection.data()) } as UserConnection) : null;
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getNotificationsForUser(userId: string) {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const clearedSnap = await getDoc(doc(db, 'notification_state', userId));
  const clearedAt = clearedSnap.exists() ? convertTimestamps(clearedSnap.data() as any).clearedAt : null;
  const clearedAtMs = clearedAt ? new Date(clearedAt).getTime() : 0;

  const incomingSwapQ = query(collection(db, 'swap_requests'), where('toUserId', '==', userId));
  const outgoingSwapQ = query(collection(db, 'swap_requests'), where('fromUserId', '==', userId));
  const incomingConnectionQ = query(collection(db, 'connections'), where('toUserId', '==', userId));
  const outgoingConnectionQ = query(collection(db, 'connections'), where('fromUserId', '==', userId));

  const [incomingSwapSnap, outgoingSwapSnap, incomingConnSnap, outgoingConnSnap] = await Promise.all([
    getDocs(incomingSwapQ),
    getDocs(outgoingSwapQ),
    getDocs(incomingConnectionQ),
    getDocs(outgoingConnectionQ),
  ]);

  const notificationsById = new Map<string, any>();

  const addNotification = (notification: any) => {
    const createdAtMs = notification.createdAt ? new Date(notification.createdAt).getTime() : 0;
    if (createdAtMs >= clearedAtMs) {
      notificationsById.set(notification.id, notification);
    }
  };

  incomingSwapSnap.docs.forEach((swapDoc) => {
    const swap = convertTimestamps(swapDoc.data() as SwapRequest);
    const createdAt = swap.updatedAt || swap.createdAt;

    if (swap.status === 'pending') {
      addNotification({
        id: `swap_${swapDoc.id}`,
        type: 'swap_request',
        title: `${swap.fromUserName} wants to swap skills`,
        message: `${swap.fromUserName} wants your ${swap.requestedSkillTitle} skill in exchange for their ${swap.offeredSkillTitle}`,
        fromUserId: swap.fromUserId,
        fromUserName: swap.fromUserName,
        fromUserInitials: swap.fromUserInitials,
        swapRequestId: swapDoc.id,
        createdAt,
        read: false,
      });
      return;
    }
    if (swap.status === 'accepted') {
      addNotification({
        id: `swap_${swapDoc.id}`,
        type: 'swap_accepted',
        title: `You accepted ${swap.fromUserName}'s swap request`,
        message: `You accepted the swap: ${swap.offeredSkillTitle} ↔ ${swap.requestedSkillTitle}`,
        fromUserId: swap.fromUserId,
        fromUserName: swap.fromUserName,
        fromUserInitials: swap.fromUserInitials,
        swapRequestId: swapDoc.id,
        createdAt,
        read: false,
      });
      return;
    }
    if (swap.status === 'rejected') {
      addNotification({
        id: `swap_${swapDoc.id}`,
        type: 'swap_declined',
        title: `You declined ${swap.fromUserName}'s swap request`,
        message: `You declined the swap: ${swap.offeredSkillTitle} ↔ ${swap.requestedSkillTitle}`,
        fromUserId: swap.fromUserId,
        fromUserName: swap.fromUserName,
        fromUserInitials: swap.fromUserInitials,
        swapRequestId: swapDoc.id,
        createdAt,
        read: false,
      });
      return;
    }
    if (swap.status === 'completed') {
      addNotification({
        id: `swap_${swapDoc.id}`,
        type: 'swap_completed',
        title: `Swap completed with ${swap.fromUserName}`,
        message: `Great work! You completed the swap: ${swap.offeredSkillTitle} ↔ ${swap.requestedSkillTitle}`,
        fromUserId: swap.fromUserId,
        fromUserName: swap.fromUserName,
        fromUserInitials: swap.fromUserInitials,
        swapRequestId: swapDoc.id,
        createdAt,
        read: false,
      });
    }
  });

  outgoingSwapSnap.docs.forEach((swapDoc) => {
    const swap = convertTimestamps(swapDoc.data() as SwapRequest);
    if (swap.status === 'pending') return;
    const createdAt = swap.updatedAt || swap.createdAt;

    if (swap.status === 'accepted') {
      addNotification({
        id: `swap_out_${swapDoc.id}`,
        type: 'swap_accepted',
        title: `${swap.toUserName} accepted your swap request`,
        message: `${swap.toUserName} accepted: ${swap.offeredSkillTitle} ↔ ${swap.requestedSkillTitle}`,
        fromUserId: swap.toUserId,
        fromUserName: swap.toUserName,
        fromUserInitials: swap.toUserInitials,
        swapRequestId: swapDoc.id,
        createdAt,
        read: false,
      });
      return;
    }
    if (swap.status === 'rejected') {
      addNotification({
        id: `swap_out_${swapDoc.id}`,
        type: 'swap_declined',
        title: `${swap.toUserName} declined your swap request`,
        message: `${swap.toUserName} declined: ${swap.offeredSkillTitle} ↔ ${swap.requestedSkillTitle}`,
        fromUserId: swap.toUserId,
        fromUserName: swap.toUserName,
        fromUserInitials: swap.toUserInitials,
        swapRequestId: swapDoc.id,
        createdAt,
        read: false,
      });
      return;
    }
    if (swap.status === 'completed') {
      addNotification({
        id: `swap_out_${swapDoc.id}`,
        type: 'swap_completed',
        title: `Swap completed with ${swap.toUserName}`,
        message: `Your swap is marked completed: ${swap.offeredSkillTitle} ↔ ${swap.requestedSkillTitle}`,
        fromUserId: swap.toUserId,
        fromUserName: swap.toUserName,
        fromUserInitials: swap.toUserInitials,
        swapRequestId: swapDoc.id,
        createdAt,
        read: false,
      });
    }
  });

  for (const connDoc of incomingConnSnap.docs) {
    const conn = convertTimestamps(connDoc.data() as any);
    const senderUser = await getUserById(conn.fromUserId);
    const senderName = senderUser?.name || 'A user';
    const senderInitials = senderUser?.initials || 'U';
    const createdAt = conn.updatedAt || conn.createdAt;

    if (conn.status === 'pending') {
      addNotification({
        id: `conn_${connDoc.id}`,
        type: 'connection_request',
        title: `${senderName} sent you a connection request`,
        message: 'Connect to expand your network and unlock full profile access',
        fromUserId: conn.fromUserId,
        fromUserName: senderName,
        fromUserInitials: senderInitials,
        connectionId: connDoc.id,
        createdAt,
        read: false,
      });
      continue;
    }
    if (conn.status === 'accepted') {
      addNotification({
        id: `conn_${connDoc.id}`,
        type: 'connection_accepted',
        title: `You accepted ${senderName}'s connection request`,
        message: `You're now connected with ${senderName}`,
        fromUserId: conn.fromUserId,
        fromUserName: senderName,
        fromUserInitials: senderInitials,
        connectionId: connDoc.id,
        createdAt,
        read: false,
      });
      continue;
    }
    if (conn.status === 'declined') {
      addNotification({
        id: `conn_${connDoc.id}`,
        type: 'connection_declined',
        title: `You declined ${senderName}'s connection request`,
        message: `You declined the request from ${senderName}`,
        fromUserId: conn.fromUserId,
        fromUserName: senderName,
        fromUserInitials: senderInitials,
        connectionId: connDoc.id,
        createdAt,
        read: false,
      });
    }
  }

  for (const connDoc of outgoingConnSnap.docs) {
    const conn = convertTimestamps(connDoc.data() as any);
    if (conn.status === 'pending') continue;
    const targetUser = await getUserById(conn.toUserId);
    const targetName = targetUser?.name || 'A user';
    const targetInitials = targetUser?.initials || 'U';
    const createdAt = conn.updatedAt || conn.createdAt;

    if (conn.status === 'accepted') {
      addNotification({
        id: `conn_out_${connDoc.id}`,
        type: 'connection_accepted',
        title: `${targetName} accepted your connection request`,
        message: `You're now connected with ${targetName}`,
        fromUserId: conn.toUserId,
        fromUserName: targetName,
        fromUserInitials: targetInitials,
        connectionId: connDoc.id,
        createdAt,
        read: false,
      });
      continue;
    }
    if (conn.status === 'declined') {
      addNotification({
        id: `conn_out_${connDoc.id}`,
        type: 'connection_declined',
        title: `${targetName} declined your connection request`,
        message: `${targetName} declined your connection request`,
        fromUserId: conn.toUserId,
        fromUserName: targetName,
        fromUserInitials: targetInitials,
        connectionId: connDoc.id,
        createdAt,
        read: false,
      });
    }
  }

  return Array.from(notificationsById.values()).sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}

export async function clearNotificationsForUser(userId: string) {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  await setDoc(doc(db, 'notification_state', userId), { clearedAt: serverTimestamp() }, { merge: true });
}

// ─── ADMIN FUNCTIONS ──────────────────────────────────────────────────────────

export async function getAllUsers(): Promise<User[]> {
  if (!isFirebaseConfigured || !db) {
    const userMap = new Map<string, User>();
    demoSkills.forEach(skill => {
      if (!userMap.has(skill.userId)) {
        userMap.set(skill.userId, {
          uid: skill.userId,
          name: skill.userName,
          initials: skill.userInitials,
          bio: '',
          createdAt: new Date(),
        });
      }
    });
    return Array.from(userMap.values());
  }

  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => convertTimestamps({ uid: d.id, ...d.data() } as User));
}

export async function getAllSwapRequests(): Promise<SwapRequest[]> {
  if (!isFirebaseConfigured || !db) {
    return [...demoSwapRequests].sort(
      (a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0)
    );
  }

  const q = query(collection(db, 'swap_requests'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => convertTimestamps({ id: d.id, ...d.data() } as SwapRequest));
}

export async function deleteUser(uid: string) {
  if (!isFirebaseConfigured || !db) {
    demoSkills = demoSkills.filter(s => s.userId !== uid);
    demoSwapRequests = demoSwapRequests.filter(r => r.fromUserId !== uid && r.toUserId !== uid);
    emitDemoSkills();
    return;
  }

  await deleteDoc(doc(db, 'users', uid));
}

export async function deleteSwapRequest(id: string) {
  if (!isFirebaseConfigured || !db) {
    demoSwapRequests = demoSwapRequests.filter(r => r.id !== id);
    return;
  }

  await deleteDoc(doc(db, 'swap_requests', id));
}

export async function getAllConnections(): Promise<UserConnection[]> {
  if (!isFirebaseConfigured || !db) return [];
  const q = query(collection(db, 'connections'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => convertTimestamps({ id: d.id, ...d.data() } as UserConnection));
}

export async function deleteConnection(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, 'connections', id));
}

/**
 * Check if a user has admin privileges.
 * Admins are stored in the `admins` Firestore collection as documents
 * with the user's UID as the document ID.
 * To grant admin: create doc `admins/{uid}` with field `{ granted: true }`.
 */
export async function isAdminUser(uid: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists() && snap.data()?.granted === true;
}
