#!/usr/bin/env node
// Gives a member the `moderator` custom claim, or takes it away, so they can
// use /moderation (see isModerator() in firestore.rules). Other claims on the
// account are kept.
//
// Against the emulators (used for testing):
//   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node scripts/set-moderator.mjs <uid> --project studio-5652324508-ae238
//
// Against the live project, with Google credentials for it
// (`gcloud auth application-default login`), only once the team agrees:
//   node scripts/set-moderator.mjs <uid> --project studio-5652324508-ae238 --live
//
// Add --remove to take the claim away. The member sees the change once their
// sign-in refreshes (within an hour, or straight away if they sign out and in).
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const args = process.argv.slice(2);
const uid = args.find(arg => !arg.startsWith('--') && args[args.indexOf(arg) - 1] !== '--project');
const projectId = args[args.indexOf('--project') + 1];
const remove = args.includes('--remove');
const live = args.includes('--live');
const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!uid || !args.includes('--project') || !projectId) {
  console.error('Usage: node scripts/set-moderator.mjs <uid> --project <projectId> [--remove] [--live]');
  process.exit(1);
}
if (!emulator && !live) {
  console.error('FIREBASE_AUTH_EMULATOR_HOST is not set. To change the live project, add --live.');
  process.exit(1);
}

initializeApp({ projectId });
const auth = getAuth();
const user = await auth.getUser(uid);
const claims = { ...(user.customClaims ?? {}) };
if (remove) delete claims.moderator;
else claims.moderator = true;
await auth.setCustomUserClaims(uid, claims);
console.log(`${remove ? 'Removed' : 'Gave'} the moderator claim ${remove ? 'from' : 'to'} ${uid} (${emulator ? `emulator at ${emulator}` : projectId}).`);
