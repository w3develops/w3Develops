# w3Develops tech debt audit

Started November 2, 2026. Updated November 3, 2026.

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

## Needs a decision from you

- **Google Analytics.** It's disclosed on `/cookies`. Remove `measurementId` from `src/firebase/config.ts` if you'd rather not use it.
- **YouTube feeds.** The channel ID in the news feeds and the podcast playlist (`src/app/api/podcast/route.ts`) both return 404. Replace them with the current channel and playlist IDs.
- **The old repo, `w3develops/w3Develops`.** It still gets issues and looks active. Archive it, or add a note pointing to `JonDevOps/w3Develops`.
- **Contact emails:** see [w3develops/w3Develops#519](https://github.com/w3develops/w3Develops/issues/519).

## Still to do

- **`pair-programming`, `pairings` and `tutorships`/`mentorships` detail pages** follow the same pattern as the matching pages and could share code too.
- **The users doc is a grab bag.** Group membership now comes from the groups, but meetups (`joinedMeetupIds`) and mentorships (`mentorIds`, `menteeIds`, …) still keep hand-synced ID arrays on profiles.
- **About 68 `any` types** remain.
- **Next.js 14 → 16.** Next 14 will stop receiving security fixes. Plan this as its own project.
