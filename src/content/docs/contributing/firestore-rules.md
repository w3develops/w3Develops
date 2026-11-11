---
title: Firestore rules
description: Changing who can read and write data.
---
Members' browsers read and write Firestore directly, so `firestore.rules` decides what's allowed. A write the rules refuse fails for real members even if the code looks right.

- Change the rules together with the code that writes the data.
- Add or update tests in `tests/rules`, and run them with `npm run test:rules` (Java 21 and the Firebase CLI).
- Lists in the rules that are repeated in code, like blocked words, reserved usernames and limits, must be kept the same in both places.
- Rules are deployed separately from the site: `firebase deploy --only firestore:rules`.
