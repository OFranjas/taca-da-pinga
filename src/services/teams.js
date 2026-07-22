import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

function normalizeTeamName(name) {
  return String(name || '').trim();
}

function getTeamNameKey(name) {
  return normalizeTeamName(name).toLocaleLowerCase('pt-PT');
}

async function assertTeamNameAvailable(name, excludedTeamId) {
  const teamsSnapshot = await getDocs(collection(db, 'teams'));
  const nameKey = getTeamNameKey(name);
  const hasDuplicate = teamsSnapshot.docs.some((team) => {
    if (team.id === excludedTeamId) {
      return false;
    }

    return getTeamNameKey(team.data().name) === nameKey;
  });

  if (hasDuplicate) {
    const err = new Error('Team already exists');
    err.code = 'already-exists';
    throw err;
  }
}

export function observeTeamsOrderedByName(callback) {
  const q = query(collection(db, 'teams'), orderBy('name'));
  return onSnapshot(q, (snap) => {
    const teams = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(teams);
  });
}

export async function createTeamIfNotExists(name) {
  const nameTrim = normalizeTeamName(name);
  if (!nameTrim) throw new Error('Name is required');

  await assertTeamNameAvailable(nameTrim);
  await addDoc(collection(db, 'teams'), { name: nameTrim, pingas: 0, drinkTotals: {} });
}

export async function updateTeamName(teamId, name) {
  const nameTrim = normalizeTeamName(name);
  if (!nameTrim) throw new Error('Name is required');

  await assertTeamNameAvailable(nameTrim, teamId);
  await updateDoc(doc(db, 'teams', teamId), { name: nameTrim });
}

export async function deleteTeam(teamId) {
  await deleteDoc(doc(db, 'teams', teamId));
}
