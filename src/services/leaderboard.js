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
import { DRINK_CATALOGUE } from '../config/drinks';

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

const SAFE_DRINK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateTeamId(teamId) {
  if (
    typeof teamId !== 'string' ||
    teamId.length === 0 ||
    teamId.trim() !== teamId ||
    teamId.includes('/')
  ) {
    throw new Error('Team ID must be a non-empty Firestore document ID');
  }
}

function getActiveDrink(drinkId) {
  const drink = DRINK_CATALOGUE.find((candidate) => candidate.id === drinkId);
  if (!drink || !drink.active) {
    throw new Error(`Unknown or inactive drink: ${drinkId}`);
  }
  if (
    !SAFE_DRINK_ID.test(drink.id) ||
    !Number.isInteger(drink.pingaValue) ||
    drink.pingaValue < 1
  ) {
    throw new Error(`Invalid configured drink: ${drinkId}`);
  }
  return drink;
}

export async function addDrinkPingas({ teamId, items, actorUid } = {}) {
  validateTeamId(teamId);
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one drink is required');
  }

  const consolidated = new Map();
  for (const item of items) {
    if (
      !item ||
      typeof item.drinkId !== 'string' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error('Drink quantities must be positive integers');
    }
    const drink = getActiveDrink(item.drinkId);
    const existing = consolidated.get(drink.id);
    consolidated.set(drink.id, {
      drink,
      quantity: (existing?.quantity ?? 0) + item.quantity,
    });
  }

  const lines = [...consolidated.values()].map(({ drink, quantity }) => ({
    drinkId: drink.id,
    drinkName: drink.name,
    pingaValue: drink.pingaValue,
    quantity,
    lineDelta: quantity * drink.pingaValue,
  }));
  const delta = lines.reduce((total, line) => total + line.lineDelta, 0);
  if (delta < 1 || delta > 50) {
    throw new Error('Drink total must be an integer between 1 and 50');
  }

  const teamRef = doc(db, 'teams', teamId);
  const eventRef = doc(collection(db, 'events'));
  const projection = { pingas: increment(delta) };
  for (const line of lines) {
    // Catalogue IDs are validated kebab-case, so these are safe, non-display-name paths.
    projection[`drinkTotals.${line.drinkId}.quantity`] = increment(line.quantity);
    projection[`drinkTotals.${line.drinkId}.pingas`] = increment(line.lineDelta);
  }

  const batch = writeBatch(db);
  batch.update(teamRef, projection);
  batch.set(eventRef, {
    ts: serverTimestamp(),
    actorUid: actorUid ?? null,
    type: 'add-pinga',
    delta,
    teamId,
    schemaVersion: 2,
    items: lines,
  });
  await batch.commit();
}

export async function listEvents(limit = 20) {
  const q = query(collection(db, 'events'), orderBy('ts', 'desc'), fsLimit(limit));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
