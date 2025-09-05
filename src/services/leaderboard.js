import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  limit as fsLimit,
} from 'firebase/firestore';

// Team: { id: string, name: string, pingas: number }

export async function getLeaderboard() {
  const q = query(collection(db, 'teams'), orderBy('pingas', 'desc'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function observeLeaderboard(callback) {
  const q = query(collection(db, 'teams'), orderBy('pingas', 'desc'), orderBy('name'));
  return onSnapshot(q, (snap) => {
    const teams = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(teams);
  });
}

export async function addPinga(teamId, delta, actorUid) {
  // Enforce service-level guardrails; rules will enforce too.
  const n = Number(delta);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error('Delta must be an integer between 1 and 5');
  }
  // Log the actor performing the action for audit purposes
  console.log(`[addPinga] actorUid=${actorUid} added ${n} pingas to teamId=${teamId}`);
  const ref = doc(db, 'teams', teamId);
  await updateDoc(ref, { pingas: increment(n) });
}

export async function listEvents(limit = 20) {
  const q = query(collection(db, 'events'), orderBy('ts', 'desc'), fsLimit(limit));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
