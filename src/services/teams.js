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

export const TEAM_NAME_MAX_LENGTH = 80;

function normalizeTeamName(name) {
  return String(name || '').trim();
}

function validateTeamName(name) {
  const nameTrim = normalizeTeamName(name);
  if (!nameTrim) {
    const err = new Error('Name is required');
    err.code = 'invalid-name';
    throw err;
  }

  if (nameTrim.length > TEAM_NAME_MAX_LENGTH) {
    const err = new Error(`Team name must be ${TEAM_NAME_MAX_LENGTH} characters or fewer`);
    err.code = 'name-too-long';
    throw err;
  }

  return nameTrim;
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
  const nameTrim = validateTeamName(name);

  await assertTeamNameAvailable(nameTrim);
  await addDoc(collection(db, 'teams'), { name: nameTrim, pingas: 0, drinkTotals: {} });
}

export async function updateTeamName(teamId, name) {
  const nameTrim = validateTeamName(name);

  await assertTeamNameAvailable(nameTrim, teamId);
  await updateDoc(doc(db, 'teams', teamId), { name: nameTrim });
}

export async function deleteTeam(teamId) {
  await deleteDoc(doc(db, 'teams', teamId));
}
