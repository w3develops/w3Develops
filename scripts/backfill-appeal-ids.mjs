#!/usr/bin/env node
// Fills in warnLogId and suspendLogId on members' standings
// (memberStandings/{uid}) that were saved before those fields existed, so
// the feed can show an Appeal button for older warnings and suspensions
// instead of the support email. Each is set to the member's latest warn or
// suspend entry in moderationLog. Standings that already have them are left
// alone, so running it twice is harmless.
//
// Against the emulators (used for testing):
//   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/backfill-appeal-ids.mjs --project studio-5652324508-ae238
//
// Against the live project. It needs Google credentials on this computer;
// run `gcloud auth application-default login` once first. Without --write it
// only prints what it would change:
//   node scripts/backfill-appeal-ids.mjs --project studio-5652324508-ae238 --live
//   node scripts/backfill-appeal-ids.mjs --project studio-5652324508-ae238 --live --write
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const projectId = args[args.indexOf('--project') + 1];
const live = args.includes('--live');
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const write = args.includes('--write') || !!emulator;

if (!args.includes('--project') || !projectId) {
  console.error('Usage: node scripts/backfill-appeal-ids.mjs --project <projectId> [--live [--write]]');
  process.exit(1);
}
if (!emulator && !live) {
  console.error('FIRESTORE_EMULATOR_HOST is not set. To change the live project, add --live.');
  process.exit(1);
}

initializeApp({ projectId });
const db = getFirestore();

const standings = await db.collection('memberStandings').get();
let changed = 0;
for (const standing of standings.docs) {
  const data = standing.data();
  if (data.warnLogId && data.suspendLogId) continue;
  const log = await db.collection('moderationLog').where('targetUserId', '==', standing.id).get();
  const latest = action => log.docs
    .filter(entry => entry.get('action') === action)
    .sort((a, b) => (b.get('createdAt')?.toMillis?.() ?? 0) - (a.get('createdAt')?.toMillis?.() ?? 0))[0]?.id;
  const update = {};
  if (!data.warnLogId && latest('warn')) update.warnLogId = latest('warn');
  if (!data.suspendLogId && latest('suspend')) update.suspendLogId = latest('suspend');
  if (Object.keys(update).length === 0) continue;
  changed++;
  console.log(`${standing.id}: ${JSON.stringify(update)}`);
  if (write) await standing.ref.update(update);
}
console.log(`${standings.size} standings checked, ${changed} ${write ? 'updated' : 'would be updated (add --write)'}.`);
