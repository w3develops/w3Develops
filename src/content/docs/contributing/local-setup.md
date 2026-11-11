---
title: Local setup
description: Run w3Develops on your computer.
---
You need Node.js 22 and, to test Firestore rules, Java 21 and the Firebase CLI.

```bash
git clone https://github.com/<your-username>/w3Develops.git
cd w3Develops
npm install
npm run dev
```

The dev server uses the live Firebase project. To click through signed-in pages without touching live data, run the emulators and start the site against them:

```bash
firebase emulators:start --only auth,firestore
NEXT_PUBLIC_USE_EMULATORS=1 npx next dev
```

## Before opening a pull request

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:rules
```
