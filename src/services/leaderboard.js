import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  doc,
  increment,
  limit as fsLimit,
  serverTimestamp,
  writeBatch,
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

export async function addPinga(teamId, delta, _actorUid) {
  // Enforce service-level guardrails; rules will enforce too.
  const n = Number(delta);
  if (!Number.isInteger(n) || n < 1 || n > 50) {
    throw new Error('Delta must be an integer between 1 and 50');
  }
  const ref = doc(db, 'teams', teamId);
  const eventRef = doc(collection(db, 'events'));
  const batch = writeBatch(db);
  batch.update(ref, { pingas: increment(n) });
  batch.set(eventRef, {
    ts: serverTimestamp(),
    actorUid: _actorUid ?? null,
    type: 'add-pinga',
    delta: n,
    teamId,
  });
  await batch.commit();
}

export async function listEvents(limit = 20) {
  const q = query(collection(db, 'events'), orderBy('ts', 'desc'), fsLimit(limit));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
