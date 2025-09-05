import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';

export function observeTeamsOrderedByName(callback) {
  const q = query(collection(db, 'teams'), orderBy('name'));
  return onSnapshot(q, (snap) => {
    const teams = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(teams);
  });
}

export async function createTeamIfNotExists(name) {
  const nameTrim = String(name || '').trim();
  if (!nameTrim) throw new Error('Name is required');
  const q = query(collection(db, 'teams'), where('name', '==', nameTrim));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const err = new Error('Team already exists');
    err.code = 'already-exists';
    throw err;
  }
  await addDoc(collection(db, 'teams'), { name: nameTrim, pingas: 0 });
}

export async function deleteTeam(teamId) {
  await deleteDoc(doc(db, 'teams', teamId));
}
