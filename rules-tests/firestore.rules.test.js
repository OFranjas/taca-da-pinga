import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';

// Reduce Firestore internal console.warn noise during deny cases
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
firebase.firestore.setLogLevel('error');

const PROJECT_ID = process.env.FB_PROJECT_ID || 'taca-da-pinga';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

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

describe('Firestore security rules', () => {
  test('public reads allowed for teams and events', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.doc('teams/t1').set({ name: 'Team 1', pingas: 0 });
      await db.doc('events/e1').set({ type: 'bootstrap' });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(anonDb.doc('teams/t1').get());
    await assertSucceeds(anonDb.doc('events/e1').get());
  });

  test('non-admin writes denied everywhere (teams, events, app_config)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await db.doc('teams/t1').set({ name: 'Team 1', pingas: 0 });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(anonDb.doc('teams/x').set({ name: 'X', pingas: 0 }));
    await assertFails(anonDb.doc('events/e2').set({ type: 'x' }));
    await assertFails(anonDb.doc('app_config/app').set({ feature: true }));

    const userDb = testEnv.authenticatedContext('user1', { admin: false }).firestore();
    await assertFails(userDb.doc('teams/y').set({ name: 'Y', pingas: 0 }));
    await assertFails(userDb.doc('teams/t1').update({ pingas: 1 }));
    await assertFails(userDb.doc('teams/t1').delete());
    await assertFails(userDb.doc('events/e3').set({ type: 'y' }));
    await assertFails(userDb.doc('app_config/app').set({ feature: false }));
  });

  test('admin writes allowed; invariants enforced for pingas increments', async () => {
    const adminDb = testEnv.authenticatedContext('admin1', { admin: true }).firestore();

    // Create team with non-negative total
    await assertSucceeds(adminDb.doc('teams/a1').set({ name: 'A', pingas: 0 }));

    // Name update without pingas change allowed
    await assertSucceeds(adminDb.doc('teams/a1').update({ name: 'Alpha' }));

    // Allowed increments 1..5
    await assertSucceeds(adminDb.doc('teams/a1').update({ pingas: 1 })); // 0 -> 1
    await assertSucceeds(adminDb.doc('teams/a1').update({ pingas: 3 })); // 1 -> 3 (+2)
    await assertSucceeds(adminDb.doc('teams/a1').update({ pingas: 8 })); // 3 -> 8 (+5)

    // Out-of-range increments denied (>5)
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('teams/b1').set({ name: 'B', pingas: 0 });
    });
    await assertFails(adminDb.doc('teams/b1').update({ pingas: 6 })); // 0 -> 6 (+6)

    // Negative increments denied; totals never negative
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('teams/c1').set({ name: 'C', pingas: 2 });
    });
    await assertFails(adminDb.doc('teams/c1').update({ pingas: 1 })); // 2 -> 1 (-1)
    await assertFails(adminDb.doc('teams/c1').update({ pingas: -1 })); // negative total

    // Admin delete allowed
    await assertSucceeds(adminDb.doc('teams/a1').delete());

    // Events/app_config: admin can write
    await assertSucceeds(adminDb.doc('events/e1').set({ type: 'ok' }));
    await assertSucceeds(adminDb.doc('app_config/main').set({ maintenance: false }));
  });

  test('app_config reads are not public', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().doc('app_config/main').set({ feature: 'x' });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(anonDb.doc('app_config/main').get());
  });
});
