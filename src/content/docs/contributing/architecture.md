---
title: Architecture
description: How w3develops.org is built.
---
- **Next.js 16** (App Router) with **React 19** and TypeScript, styled with Tailwind and shadcn/ui.
- **Firebase:** Auth for sign-in, Firestore for data, Storage for images, Cloud Functions for background jobs, and App Hosting for the site.
- The browser talks to Firestore directly, so `firestore.rules` is the security boundary.
- Public pages render on the server so search engines can read them, then switch to live data.

| Path | What it holds |
| --- | --- |
| `src/app` | Pages and API routes, one folder per URL |
| `src/components` | Shared components |
| `src/firebase` | Firebase setup and the `useCollection` / `useDoc` hooks |
| `src/lib` | Types, page metadata, limits and helpers |
| `functions/src` | Cloud Functions: notifications, moderation, scheduled posts |
| `firestore.rules`, `storage.rules` | Who can read and write what |
| `tests/rules` | Emulator tests for the rules |

Times are stored in UTC and shown in each viewer's time zone. Profiles are public, so they never hold email addresses.
