import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import { updateDemoProfile } from './auth';
import { Skill, SwapRequest, SwapStatus, User } from '../types';

let demoSkills: Skill[] = [];
let demoSwapRequests: SwapRequest[] = [];
const demoSkillListeners = new Set<(skills: Skill[]) => void>();

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
    updateDemoProfile(uid, { name: nextName, bio: data.bio, initials: nextInitials });
    // Demo mode stores profile data on each skill/request snapshot only.
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
  return snap.exists() ? (snap.data() as User) : null;
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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Skill));
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
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Skill));
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
  return onSnapshot(q, (snap) => {
    const skills = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Skill));
    callback(skills);
  });
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

  // Subscribe to incoming
  const inQ = query(
    collection(db, 'swap_requests'),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  // Subscribe to outgoing
  const outQ = query(
    collection(db, 'swap_requests'),
    where('fromUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  let incoming: SwapRequest[] = [];
  let outgoing: SwapRequest[] = [];

  const unsubIn = onSnapshot(inQ, (snap) => {
    incoming = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SwapRequest));
    callback(incoming, outgoing);
  });

  const unsubOut = onSnapshot(outQ, (snap) => {
    outgoing = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SwapRequest));
    callback(incoming, outgoing);
  });

  return () => {
    unsubIn();
    unsubOut();
  };
}