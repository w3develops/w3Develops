#!/usr/bin/env node
// Gives a member the `moderator` custom claim, or takes it away, so they can
// use /moderation (see isModerator() in firestore.rules). Other claims on the
// account are kept.
//
// Day to day, admins add and remove moderators on the Team tab of
// /moderation instead (functions/src/moderators.ts). This script is for
// making someone an admin (--admin), which can't be done from the site.
//
// Against the emulators (used for testing):
//   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node scripts/set-moderator.mjs <uid> --project studio-5652324508-ae238
//
// Against the live project, only once the team agrees. It needs Google
// credentials on this computer; run `gcloud auth application-default login`
// once first:
//   node scripts/set-moderator.mjs <uid> --project studio-5652324508-ae238 --live
//
// Add --admin to change the `admin` claim instead (admins can add and remove
// moderators on /moderation). Add --remove to take the claim away. The member
// sees the change once their sign-in refreshes (within an hour, or straight
// away if they sign out and in).
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const args = process.argv.slice(2);
const uid = args.find(arg => !arg.startsWith('--') && args[args.indexOf(arg) - 1] !== '--project');
const projectId = args[args.indexOf('--project') + 1];
const remove = args.includes('--remove');
const claim = args.includes('--admin') ? 'admin' : 'moderator';
const live = args.includes('--live');
const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;

if (!uid || !args.includes('--project') || !projectId) {
  console.error('Usage: node scripts/set-moderator.mjs <uid> --project <projectId> [--admin] [--remove] [--live]');
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
if (remove) delete claims[claim];
else claims[claim] = true;
await auth.setCustomUserClaims(uid, claims);
console.log(`${remove ? 'Removed' : 'Gave'} the ${claim} claim ${remove ? 'from' : 'to'} ${uid} (${emulator ? `emulator at ${emulator}` : projectId}).`);
