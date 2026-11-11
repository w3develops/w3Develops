# AGENTS.md

Notes for AI coding agents (and people) working on the w3Develops codebase.
For what the site is, see the [README](README.md); for coding style, see
[docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md).

## The project

w3Develops (https://w3develops.org) is a free developer community: study
groups, group projects, book clubs, mentorship, tutoring, pair programming,
meetups, competitions, a job board and tech news.

- **Next.js 16** (App Router) with **React 19** and TypeScript, styled with
  Tailwind and shadcn/ui components in `src/components/ui`.
- **Firebase**: Auth for sign-in, Firestore for data, and App Hosting for the
  site. The browser talks to Firestore directly, so
  [`firestore.rules`](firestore.rules) is the real security boundary.
- Every push to `main` deploys the site through App Hosting. Firestore rules
  are deployed separately with `firebase deploy --only firestore:rules`.

## Commands

```bash
npm install
npm run dev        # local dev server
npm run lint       # ESLint
npx tsc --noEmit   # type check
npm run build      # production build; run it before opening a pull request
```

The dev server uses the live Firebase project. To test changes to
`firestore.rules`, run them in the Firestore emulator (needs Java 21) and point
a test script at it with `connectFirestoreEmulator`:

```bash
firebase emulators:start --only firestore
npm run test:rules   # the rules tests in tests/rules, in a throwaway emulator
```

To click through signed-in pages without touching live data, run the auth and
Firestore emulators and start the site with `NEXT_PUBLIC_USE_EMULATORS=1 npx
next dev` (see `src/firebase/initialize-app.ts` for the port settings).

## Where things live

| Path | What it holds |
| --- | --- |
| `src/app` | Pages and API routes, one folder per URL |
| `src/components` | Shared components; `groups/` covers study groups, projects and book clubs |
| `src/firebase` | Firebase setup and the `useCollection` / `useDoc` hooks |
| `src/lib/site-pages.ts` | Title, description and section of every main page; feeds the sitemap, `llms.txt` and page metadata |
| `src/lib/public-items.ts` | Server-side reads of public items, for server rendering and the sitemap |
| `src/lib/rss-feeds.ts`, `news*.ts` | The news feeds, the 8-a-day edition schedule and the AI brief |
| `src/lib/types.ts` | Firestore document types |
| `firestore.rules` | Who can read and write what |
| `tests/rules` | Emulator tests for `firestore.rules` |
| `docs-site` | The public docs at docs.w3develops.org (Mintlify: `docs.json` and `.mdx` pages) |
| `src/lib/member-posts.ts` | Limits, blocked words and report reasons for the community feed (`/feed`) and `/moderation` |

## Rules to follow

- **Never store email addresses or other private details on `users`
  documents.** Profiles are public, like GitHub profiles. Firebase Auth already
  keeps each member's email privately.
- **Change `firestore.rules` together with the code that writes the data**, and
  test both against the emulator. A write the rules refuse fails for real
  members even if it works in your head.
- **Times are stored in UTC** and shown in the viewer's time zone. Server
  rendering doesn't know the viewer's zone, so use `ZonedText` (or `useNow`)
  for anything that depends on the time or zone, to avoid hydration errors.
- **Public pages render on the server** so search engines and AI crawlers can
  read them. List pages pass server data into `useCollection(query, initial)`,
  which shows it until the live data arrives.
- **New main pages** need an entry in `src/lib/site-pages.ts` and
  `pageMetadata(...)` in the page, so they get a title, description and a
  place in the sitemap.
- **Never commit secrets.** API keys live in the Firebase console and Secret
  Manager, not in the repo. (The Firebase web config in `src/firebase/config.ts`
  is public by design.)
- Reserved usernames are listed in both `src/lib/usernames.ts` and
  `firestore.rules`; keep the two lists the same. So are the feed's blocked
  words and post and reply limits (`src/lib/member-posts.ts`).
- **Feed counts and follows:** a post's `likeCount` changes in the same save
  as the like (the rules check it); `replyCount` is kept by
  `functions/src/replies.ts`. A private account (`users.privateAccount`) can
  only be followed through `followRequests`; accepting adds the follower,
  and `functions/src/follows.ts` fills in their `following`.
- Feed posts are public or followers-only (`audience`), and a private
  account's posts are always followers-only. Server reads skip the rules, so
  the server-rendered feed must filter `audience == 'public'`. Images live in
  Storage (`storage.rules`); `functions/src/post-checks.ts` runs the Natural
  Language and Vision safety checks and deletes images of removed posts.
- Moderators have a `moderator` custom claim. Admins (the `admin` claim) add
  and remove them on the Team tab of `/moderation`; `scripts/set-moderator.mjs`
  makes someone an admin. Every moderator change is saved with a
  `moderationLog` entry in the same write, which the rules require.

## Pull requests

- Keep each pull request to one change, with a short description of what
  changed and how you checked it.
- Make sure `npm run lint`, `npx tsc --noEmit` and `npm run build` pass.
- Contributors follow the [Code of Conduct](.github/CODE_OF_CONDUCT.md).
