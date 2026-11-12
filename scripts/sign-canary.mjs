#!/usr/bin/env node
// Renews the warrant canary: writes the statement with today's date and the
// next update date, signs it with the canary's PGP key (in your local GnuPG
// keyring), and saves it as public/warrant-canary.txt, which
// /warrant-canary shows and anyone can verify against
// public/warrant-canary-key.asc.
//
// Only renew it while every statement in it is still true.
//
//   node scripts/sign-canary.mjs            # next update in 3 months
//   node scripts/sign-canary.mjs 2027-05-01 # or on a given date
//
// Then commit public/warrant-canary.txt and merge it.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const KEY = '03387035FF2C83D9A6B1BFF2E60565B7AFB010CA';
const format = date => date.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });

const today = new Date();
const next = process.argv[2] ? new Date(`${process.argv[2]}T00:00:00Z`) : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 3, today.getUTCDate()));

const statement = `w3Develops Warrant Canary

Last updated: ${format(today)}
Next update: ${format(next)}

As of ${format(today)}:

* w3Develops has never received a National Security Letter, a FISA court
  order, or any other secret legal process that we would be prohibited from
  disclosing.
* w3Develops has never received a warrant, subpoena or court order for
  information about our members.
* w3Develops has never been ordered to change our systems to allow access
  to, or monitoring of, our members' information.

The next update to this statement will be published on or before
${format(next)}.

This statement is signed with the w3Develops Warrant Canary key,
fingerprint ${KEY.replace(/(.{4})/g, '$1 ').trim()},
published at https://w3develops.org/warrant-canary-key.asc
`;

const signed = execFileSync('gpg', ['--clearsign', '--local-user', KEY, '--output', '-'], { input: statement });
writeFileSync(new URL('../public/warrant-canary.txt', import.meta.url), signed);
console.log(`Signed. Last updated ${format(today)}, next update by ${format(next)}.`);
