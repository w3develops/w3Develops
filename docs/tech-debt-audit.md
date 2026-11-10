# w3Develops tech debt audit

Started November 2, 2026. Updated November 10, 2026.

## Done

- **Member emails were public.** All 90 profiles had their email readable by anyone. Emails now live only in Firebase Auth, were removed from every profile, and the rules reject any profile containing one. `firestore.rules` is back in sync with the live rules, which had been deployed without being committed.
- **Warrant canary renewed** (next update due February 1, 2027), and the fake PGP placeholder removed.
- **Account deletion and data export** are now on the Security page.
- **The unused `studio` App Hosting backend is deleted.** Only `w3develops-backend-id` (w3develops.org) builds now.
- **News brief:** a failed Jev refresh keeps the last good brief instead of caching keyword sorting for a day.
- **Dead RSS feeds** removed, and Tom's Hardware's moved feed fixed.
- **Env precedence** is documented in `apphosting.yaml`.
- **Duplicate code:** the three join buttons are now `JoinButton`, and the mentorship and tutor pages share `MatchingProgram` (about 1,000 lines removed).
- **13 static pages** are now server components.
- **`initialize-server-app.ts`** renamed to `initialize-app.ts`.
- **Unused packages** (`zod`, `baseline-browser-mapping`) removed, and `npm run lint` works again with no errors.
- **Firebase Studio leftovers** removed, README refreshed, BSD 3-Clause `LICENSE` added.
- **One shared version of groups.** Study groups, group projects and book clubs now use the components in `src/components/groups/` and the settings in `src/lib/groups.ts`, replacing three copies of each page, pop-up and rule set. Creators can edit and delete their group, and members can leave.
- **Real timezones.** Profiles, groups and meetups store a timezone like `America/New_York` (`src/lib/timezones.ts`), and times show in each viewer's own timezone. The old offset math counted the offset twice, so times were wrong for anyone outside the creator's timezone.
- **Group bugs fixed:** the "Join a group" search needed a Firestore index that never existed, anyone could rewrite someone else's check-in, members could add other people to a group, and the 25th member couldn't join.
- **Membership lives on the group.** Profiles no longer keep their own copy of which groups they're in; the dashboard, My Tasks and the activity feed read each group's member list. My Tasks and the activity feed also had broken links and field names.
- **Verified email required** for joining, creating and posting. Google and GitHub sign-ins count as verified.
- **Fake, spam and test accounts deleted**, along with their test groups and competitions. Backups are in `~/Documents/w3develops-admin/`.
- **The account page is split up.** `account/page.tsx` went from 835 lines to about 100; its sections live in `src/components/account/`, and it uses the shared mentorship and pairing components instead of its own copies of the accept logic.
- **Pair programming shares `MatchingProgram` too**, configured in `src/lib/matching-programs.ts` like mentorship and tutoring. The pairing, mentorship and tutorship detail pages share `ConnectionSpace`.
- **Next.js 16.** The site runs on Next 16.4.5.
- **`any` types** are down to the two default type parameters on `useDoc` and `useCollection`.
- **Home page hydration error fixed** by updating `@radix-ui/react-slot` to 1.5, which handles server-rendered links inside `Button asChild`.
- **Both GitHub repos stay in sync.** Every push goes to `JonDevOps/w3Develops` first and then straight to `w3develops/w3Develops`, and `main` is the same commit on both. The org repo's `.github/` files and README are now in both.

- **Google Analytics stays.** It's disclosed on `/cookies`, and the live site sends page views to `G-4X3H3B54J2`.
- **Contact emails** work ([w3develops/w3Develops#519](https://github.com/w3develops/w3Develops/issues/519)).
- **Podcast page works again.** The playlist ID was right; YouTube's RSS feed returns 404 for every channel and playlist. When the feed can't be read, `/podcast` now shows YouTube's embedded playlist player and a link to the playlist, instead of an error. The news feeds no longer use YouTube.
- **Profiles no longer keep copies of connections.** Mentorships, tutorships, pairings and joined meetups are read from their own docs (`memberIds`, `attendeeIds`) through `useConnections`, accepting a request no longer writes either profile, and the rule that let the accepter edit the requester's profile is gone. See `docs/profile-id-arrays-plan.md`.

## Still to do

- **`npm audit` warnings (12).** They come from `@grpc/grpc-js` 1.9 (via Firebase) and `minimatch` 10 (via typescript-eslint). Neither affects the site: the gRPC issues are for running gRPC servers, and minimatch only runs in the lint tools. They'll clear when Firebase and typescript-eslint update those dependencies. Don't run `npm audit fix --force`, which would downgrade Firebase and the Next lint config.
