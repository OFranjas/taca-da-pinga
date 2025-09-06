import fs from 'node:fs';
import path from 'node:path';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, setLogLevel, connectFirestoreEmulator } from 'firebase/firestore';
// Reduce Firestore internal console.warn noise during deny cases
setLogLevel('error');

const PROJECT_ID = process.env.FB_PROJECT_ID || 'taca-da-pinga';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const [EMULATOR_HOST, EMULATOR_PORT] = FIRESTORE_EMULATOR_HOST.split(':');

let testEnv;

beforeAll(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
  const rulesPath = path.resolve(process.cwd(), '..', 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function makeDb(mockUserToken) {
  const app = initializeApp({ projectId: PROJECT_ID }, `rt-${Math.random()}`);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, EMULATOR_HOST, Number(EMULATOR_PORT),
    mockUserToken ? { mockUserToken } : undefined);
  return { app, db };
}

describe('Firestore security rules', () => {
  test('public reads allowed for teams and events', async () => {
    const { db: ownerDb } = makeDb('owner');
    await setDoc(doc(ownerDb, 'teams/t1'), { name: 'Team 1', pingas: 0 });
    await setDoc(doc(ownerDb, 'events/e1'), { type: 'bootstrap' });

    const { db: anonDb } = makeDb(undefined);
    await assertSucceeds(getDoc(doc(anonDb, 'teams/t1')));
    await assertSucceeds(getDoc(doc(anonDb, 'events/e1')));
  });

  test('non-admin writes denied everywhere (teams, events, app_config)', async () => {
    const { db: ownerDb } = makeDb('owner');
    await setDoc(doc(ownerDb, 'teams/t1'), { name: 'Team 1', pingas: 0 });

    const { db: anonDb } = makeDb(undefined);
    await assertFails(setDoc(doc(anonDb, 'teams/x'), { name: 'X', pingas: 0 }));
    await assertFails(setDoc(doc(anonDb, 'events/e2'), { type: 'x' }));
    await assertFails(setDoc(doc(anonDb, 'app_config/app'), { feature: true }));

    const { db: userDb } = makeDb({ sub: 'user1', user_id: 'user1', admin: false });
    await assertFails(setDoc(doc(userDb, 'teams/y'), { name: 'Y', pingas: 0 }));
    await assertFails(updateDoc(doc(userDb, 'teams/t1'), { pingas: 1 }));
    await assertFails(deleteDoc(doc(userDb, 'teams/t1')));
    await assertFails(setDoc(doc(userDb, 'events/e3'), { type: 'y' }));
    await assertFails(setDoc(doc(userDb, 'app_config/app'), { feature: false }));
  });

  test('admin writes allowed; invariants enforced for pingas increments', async () => {
    const { db: adminDb } = makeDb({ sub: 'admin1', user_id: 'admin1', admin: true });

    // Create team with non-negative total
    await assertSucceeds(setDoc(doc(adminDb, 'teams/a1'), { name: 'A', pingas: 0 }));

    // Name update without pingas change allowed
    await assertSucceeds(updateDoc(doc(adminDb, 'teams/a1'), { name: 'Alpha' }));

    // Allowed increments 1..5
    await assertSucceeds(updateDoc(doc(adminDb, 'teams/a1'), { pingas: 1 })); // 0 -> 1
    await assertSucceeds(updateDoc(doc(adminDb, 'teams/a1'), { pingas: 3 })); // 1 -> 3 (+2)
    await assertSucceeds(updateDoc(doc(adminDb, 'teams/a1'), { pingas: 8 })); // 3 -> 8 (+5)

    // Out-of-range increments denied (>5)
    const { db: ownerDb } = makeDb('owner');
    await setDoc(doc(ownerDb, 'teams/b1'), { name: 'B', pingas: 0 });
    await assertFails(updateDoc(doc(adminDb, 'teams/b1'), { pingas: 6 })); // 0 -> 6 (+6)

    // Negative increments denied; totals never negative
    await setDoc(doc(ownerDb, 'teams/c1'), { name: 'C', pingas: 2 });
    await assertFails(updateDoc(doc(adminDb, 'teams/c1'), { pingas: 1 })); // 2 -> 1 (-1)
    await assertFails(updateDoc(doc(adminDb, 'teams/c1'), { pingas: -1 })); // negative total

    // Admin delete allowed
    await assertSucceeds(deleteDoc(doc(adminDb, 'teams/a1')));

    // Events/app_config: admin can write
    await assertSucceeds(setDoc(doc(adminDb, 'events/e1'), { type: 'ok' }));
    await assertSucceeds(setDoc(doc(adminDb, 'app_config/main'), { maintenance: false }));
  });

  test('app_config reads are not public', async () => {
    {
      const { db: ownerDb2 } = makeDb('owner');
      await setDoc(doc(ownerDb2, 'app_config/main'), { feature: 'x' });
    }

    const { db: anonDb2 } = makeDb(undefined);
    await assertFails(getDoc(doc(anonDb2, 'app_config/main')));
  });
});
