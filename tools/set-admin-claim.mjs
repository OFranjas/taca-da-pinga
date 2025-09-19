// tools/set-admin-claim.mjs
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

/**
 * Usage:
 *   node tools/set-admin-claim.mjs <UID>
 *   node tools/set-admin-claim.mjs --email someone@example.com
 *   node tools/set-admin-claim.mjs <UID> --unset
 *   node tools/set-admin-claim.mjs --email someone@example.com --unset
 *
 * Notes:
 * - Put serviceAccountKey.json next to this script (tools/). NEVER commit it.
 */

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const keyPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(keyPath)) {
  console.error(
    "❌ Missing tools/serviceAccountKey.json. Download it from Firebase Console → Project settings → Service accounts."
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const args = process.argv.slice(2);
const emailFlagIndex = args.indexOf("--email");
const unset = args.includes("--unset");

let uid = null;
let email = null;

if (emailFlagIndex >= 0) {
  email = args[emailFlagIndex + 1];
  if (!email) {
    console.error("Usage: --email <address>");
    process.exit(1);
  }
} else {
  const positional = args.filter(a => !a.startsWith("--"));
  uid = positional[0];
}

if (!uid && !email) {
  console.error(
    "Usage: node tools/set-admin-claim.mjs <UID> [--unset]\n   or: node tools/set-admin-claim.mjs --email <EMAIL> [--unset]"
  );
  process.exit(1);
}

async function resolveUid() {
  const auth = admin.auth();
  if (uid) return uid;
  try {
    const user = await auth.getUserByEmail(email);
    return user.uid;
  } catch (e) {
    if (e?.errorInfo?.code === "auth/user-not-found") {
      console.error(
        `❌ No user found with email=${email}. Make sure the user exists in THIS Firebase project.`
      );
      console.error(
        "   Tip: The project is determined by serviceAccountKey.json (project_id)."
      );
    }
    throw e;
  }
}

async function main() {
  const auth = admin.auth();
  const resolvedUid = await resolveUid();

  let user;
  try {
    user = await auth.getUser(resolvedUid);
  } catch (e) {
    if (e?.errorInfo?.code === "auth/user-not-found") {
      console.error(
        `❌ No user found with uid=${resolvedUid}. Check that the UID is correct and belongs to this project.`
      );
      console.error(
        "   Tip: Confirm serviceAccountKey.json → project_id matches the project where the user exists."
      );
    }
    throw e;
  }

  const before = user.customClaims || {};
  const after = { ...before, admin: !unset };

  await auth.setCustomUserClaims(resolvedUid, after);
  const refreshed = await auth.getUser(resolvedUid);

  console.log("✅ Updated custom claims for:", resolvedUid);
  console.log("   Before:", before);
  console.log("   After :", refreshed.customClaims || {});
  console.log(
    "ℹ️ Have the user sign out/in or call getIdToken(true) once to refresh the token."
  );
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});
