# Plan: stop keeping ID arrays on profiles

Written November 7, 2026. This is a plan only. Nothing in the code, the rules or
the data has changed yet.

## The problem

Profiles in `users/{uid}` keep copies of IDs that already live somewhere else,
and the app updates both by hand:

| Profile field    | What it holds                              | Already stored on                         |
| ---------------- | ------------------------------------------ | ----------------------------------------- |
| `joinedMeetupIds`| meetups the member joined                  | `meetups/{id}.attendeeIds`                |
| `mentorIds`      | people mentoring this member               | `mentorships/{id}.mentorId` + `memberIds` |
| `menteeIds`      | people this member mentors                 | `mentorships/{id}.menteeId` + `memberIds` |
| `mentorshipIds`  | the member's mentorships                   | `mentorships/{id}.memberIds`              |
| `tutorIds`       | people tutoring this member                | `tutorships/{id}.tutorId` + `memberIds`   |
| `studentIds`     | people this member tutors                  | `tutorships/{id}.studentId` + `memberIds` |
| `tutorshipIds`   | the member's tutorships                    | `tutorships/{id}.memberIds`               |
| `pairPartnerIds` | the member's pairing partners              | `pairings/{id}.memberIds`                 |
| `pairingIds`     | the member's pairings                      | `pairings/{id}.memberIds`                 |

Group membership was moved the same way on November 3 (commit `c1090682`).
Profiles stopped keeping group IDs, and pages query
`where('memberIds', 'array-contains', uid)` on the groups instead. This plan
does the same for meetups and connections.

Two things make it a little harder than groups were:

1. **Groups are public to read; connections aren't.** `mentorships`,
   `tutorships` and `pairings` can only be read by their two members, through a
   rule that reads the document by its ID. A query doesn't name one ID, so the
   rules need a small `list` rule first (see step 1).
2. **Accepting a request writes to the other person's profile.** That's the
   only reason the `users` rule lets someone other than the owner add to a
   profile (`isAcceptingMentorship`, `isAcceptingTutorship`,
   `isAcceptingPairing`, built on `isAddingConnection`). Once the arrays are
   gone, that exception can go too, so only the owner (and followers) can
   change a profile.

## Every read and write today

### Writes

| Where | What it writes |
| ----- | -------------- |
| `src/components/MatchingProgram.tsx:293-323` (`handleRequest`, accepting) | Both profiles get the connection ID (`connectionIdsField`), and each gets the other person in the right role list (`offerer.ids` / `seeker.ids` / `partner.ids`). Same batch as the request update and the connection doc. |
| `src/components/JoinMeetupButton.tsx:49` | `joinedMeetupIds: arrayUnion(meetup.id)`, in the same batch as adding the member to `attendeeIds`. |

Nothing ever removes from these arrays. There's no "leave meetup" or "end
mentorship" flow, and account deletion (`src/components/AccountDataControls.tsx`)
deletes the member's own profile but leaves their ID in other people's arrays
and in connection docs.

### Reads

| Where | What it reads | What for |
| ----- | ------------- | -------- |
| `src/components/MatchingProgram.tsx:354-355` (`MatchingDashboard`) | `offerer.ids` / `seeker.ids` / `partner.ids` | "Your Mentors / Mentees / Tutors / Students / Partners" lists, on the program pages and the account page. Loaded with `useDocsByIds`, so only the first 10 show. |
| `src/components/MatchingProgram.tsx:505` (`Finder`) | `connectionIdsField` | Whether to show a "Dashboard" button on someone you're already connected with. |
| `src/app/account/my-tasks/page.tsx:142-156` | `mentorshipIds`, `tutorshipIds`, `pairingIds` | The Mentorships, Tutorships and Pairings tabs. `CategoryTaskList` loads up to 30 with `documentId() in [...]`. |
| `src/components/account/MeetupsCard.tsx:13` | `joinedMeetupIds` | "Joined Meetups" tab on the account page (first 10). |
| `src/components/AccountDataControls.tsx:25` | the whole profile | The data download includes these arrays, which today is the only place it lists a member's connections. |

### Types and config

- `src/lib/types.ts:42, 52-54, 59-61, 64-65`: the nine optional fields on `UserProfile`.
- `src/components/MatchingProgram.tsx:29-31`: the `ProfileList` type names them.
- `src/components/MatchingProgram.tsx:39, 60`: `Side.ids` and `connectionIdsField`.
- `src/lib/matching-programs.ts:18-20, 35-37, 51-52`: the values for each program.

### Rules (`firestore.rules`)

- `isAddingConnection(otherId, peopleField, idsField)` (line 207) checks that
  only those two fields change and that each gains exactly the expected ID.
- `isAcceptingMentorship` (221), `isAcceptingTutorship` (230) and
  `isAcceptingPairing` (239) use it, plus `connectionAfter` (200) and
  `isAcceptingRequestFrom` (217).
- `isBeingAddedToList` (120) is only used by `isAddingConnection`.
- `match /users/{userId}` `allow update` (250-258) ORs in the three
  `isAccepting…` checks.
- `match /mentorships`, `/tutorships`, `/pairings` `allow read` (284, 320, 356)
  use `isMentorshipMember` / `isTutorshipMember` / `isPairingMember`, which
  `get()` the document by its ID.
- Nothing in the rules reads `joinedMeetupIds`.

No scripts, Cloud Functions or indexes touch these fields.
`firestore.indexes.json` is empty.

## What replaces each field

| Field | Replacement | Rules needed | Index needed |
| ----- | ----------- | ------------ | ------------ |
| `joinedMeetupIds` | `meetups` where `attendeeIds` `array-contains` uid, then drop meetups whose `creatorId` is the member (see note) | none, meetups are public | none (automatic single-field index) |
| `mentorshipIds` | `mentorships` where `memberIds` `array-contains` uid; the IDs are the doc IDs | new `allow list` on `mentorships` | none |
| `mentorIds` | same query; for each doc where `menteeId == uid`, the `mentorId` | same | none |
| `menteeIds` | same query; for each doc where `mentorId == uid`, the `menteeId` | same | none |
| `tutorshipIds` | `tutorships` where `memberIds` `array-contains` uid | new `allow list` on `tutorships` | none |
| `tutorIds` | same query; `tutorId` where `studentId == uid` | same | none |
| `studentIds` | same query; `studentId` where `tutorId == uid` | same | none |
| `pairingIds` | `pairings` where `memberIds` `array-contains` uid | new `allow list` on `pairings` | none |
| `pairPartnerIds` | same query; the other ID in `memberIds` | same | none |

**Meetup note.** Creating a meetup puts the creator in `attendeeIds`
(`src/app/meetups/create/page.tsx:98`) but not in `joinedMeetupIds`. So today
a member's own meetups only show under "Created", not "Joined". To keep that,
the Joined tab filters out meetups the member created.

**One query per program covers everything.** A single hook, something like
`useConnections(config, uid)`, would run the `memberIds` query for a program
and return the connection docs. The dashboard, Finder and My Tasks all derive
what they need from it:

- **Dashboard lists:** for role programs, sort each connection into a side by
  whether `{offerer}Id` or `{seeker}Id` is the member, then load the other
  person's profile. For pairing, the other person is the other `memberIds`
  entry.
- **Finder:** `isConnected` becomes "this pair's connection ID is in the
  hook's results".
- **My Tasks:** pass the hook's doc IDs, or the docs themselves, to
  `CategoryTaskList` instead of the profile arrays.

The connection docs have always been written in the same batch as the profile
arrays, with `memberIds` and the role fields (`mentorId`/`menteeId`,
`tutorId`/`studentId`) from the start (commits `4770f279`, `2968b59c` and
`12647ef0`, February 2026). So for almost all data, the new source and the old
arrays should agree. Step 0 checks that before anything switches.

**Indexes.** Firestore indexes single fields automatically, including for
`array-contains`, and the project has no index exemptions. None of these
queries needs a composite index *as long as they don't add `orderBy` or a
second filter*. Today the lists come back in document-ID order (that's how
`documentId() in` returns them), and a plain `array-contains` query returns
them in the same order. If we later want meetups sorted by `dateTime`, either
sort in the browser or add an `attendeeIds` (array-contains) + `dateTime` index
to `firestore.indexes.json` and deploy it before the code.

## The rule change for listing connections

Today:

```
match /mentorships/{mentorshipId} {
  allow read: if isMentorshipMember(mentorshipId);
```

`isMentorshipMember` does a `get()` on `mentorships/$(mentorshipId)`. For a
query, Firestore has to prove the rule holds for every possible result without
reading them, and it can't do that through a `get()` keyed on the wildcard. So
we expect it to reject `where('memberIds', 'array-contains', uid)`. Proposed:

```
match /mentorships/{mentorshipId} {
  allow get: if isMentorshipMember(mentorshipId);
  // Members can list the connections they're in, with
  // where('memberIds', 'array-contains', <their uid>)
  allow list: if request.auth != null
              && resource.data.memberIds.hasAny([request.auth.uid]);
```

The same goes for `tutorships` and `pairings`. Subcollection rules (`tasks`,
`checkIns`, `notes`) don't change.

This is the one place the plan *widens* access. A signed-in member can now run
a query over a connection collection, but the rule only passes if every result
has them in `memberIds`, so they can only list connections they could already
open one at a time. A query without the `array-contains` filter is rejected.

**Open question to check in the emulator:** whether today's My Tasks query
(`documentId() in [...]` on `mentorships`, `tutorships`, `pairings`) passes the
current `get()`-based rule at all. If it doesn't, those three tabs are quietly
empty in production right now (`CategoryTaskList` only logs the error), and
this change fixes them as a side effect. Either way, the new `list` rule lets
the `array-contains` query through.

## Migration steps

Each step is its own PR, so each one can be reviewed, deployed and rolled back
alone. **Rules and indexes don't go out with App Hosting.** Pushing to `main`
only deploys the app; rules go out with
`firebase deploy --only firestore:rules`. The order below is the order to
deploy in.

### Step 0: Check the data (read-only)

A small script using the Admin SDK, run locally like the earlier cleanup (with
output and backups in `~/Documents/w3develops-admin/`). It writes nothing. For
each profile, it compares every array with what the new source says and
reports:

- IDs in an array with no matching connection doc or meetup ("orphans"). The
  first few mentorship commits on February 2 wrote `mentorIds`/`menteeIds`
  before mentorship docs existed, so a few test-era entries are possible.
- Connections or attendances missing from the arrays (shouldn't happen, since
  the writes were batched).
- People listed on **both** sides, such as in `mentorIds` and `menteeIds` for
  the same partner. Reconnecting overwrites the connection doc ("Saved again if
  the two reconnect later"), so if the roles swapped, the arrays keep both but
  the doc only has the latest. After the switch, that person shows only under
  their current role.
- Connection or attendee IDs belonging to deleted accounts. That's harmless,
  because profile lookups already skip missing profiles, but worth knowing.

If the report is clean, carry on. If it isn't, decide case by case: delete
orphans, or accept the small visible change. Don't add a "read both and merge"
fallback unless the report shows we need it, since it would keep the old
fields alive.

Also take a fresh backup of `users`, `meetups`, `mentorships`, `tutorships`
and `pairings` here.

### Step 1: Allow listing connections (rules only)

- Split `allow read` into `allow get` (unchanged) and `allow list` (new) on the
  three connection collections, as above.
- Test in the Firestore emulator. There are no rules tests in the repo yet, so
  this means `firebase emulators:start --only firestore` and trying:
  - a member listing their own connections: **allowed**
  - a member listing with another uid in the filter: **denied**
  - listing with no filter: **denied**
  - getting one connection as a member or non-member: unchanged
  - accepting a request: unchanged
- Before deploying, compare the live rules in the Firebase console with
  `main`. They drifted once before (see `docs/tech-debt-audit.md`). Deploy from
  `main`.

This doesn't change any app behavior on its own.

### Step 2: Read from the new source (app only, still writing both)

- Add the `useConnections` hook and switch `MatchingDashboard`, `Finder` and
  My Tasks to it.
- Switch `MeetupsCard`'s Joined tab to the `attendeeIds` query, without the
  member's own meetups.
- Keep every write exactly as it is, so the old arrays stay current and
  rolling back is just reverting this PR.
- Optional: add the member's connection docs to the data download in
  `AccountDataControls.tsx`, since the profile copy is going away. The
  download's purpose is "everything tied to the member that their own account
  is allowed to read", and step 1 makes this readable.

Visible changes to point out in the PR:

- The Joined Meetups list is no longer cut off at 10.
- People listed on both sides after a role swap show only under their current
  role (from step 0's report).
- The people lists still load profiles with `useDocsByIds`, so they stay capped
  at 10 per side unless we chunk those lookups. Keep the cap to stay
  behavior-preserving, or lift it; that's your call.

### Step 3: Stop writing the arrays (app only)

- `MatchingProgram.tsx` `handleRequest`: the accept batch becomes just the
  request update plus the connection doc. No more `batch.update` on either
  profile. `isStartingConnection` and `isAcceptingRequest` don't depend on
  the profile writes, so the batch still passes the rules.
- `JoinMeetupButton.tsx`: drop the `joinedMeetupIds` update. The join becomes
  a single `updateDoc` on the meetup.
- Remove `ids` / `connectionIdsField` from the config types and
  `matching-programs.ts`, and the fields from `ProfileList`.
- **Leave the `users` rule exception in place for now.** Members with the site
  open in an old tab still run the old code, which writes the other person's
  profile. If the rule were gone, their accept would fail.

### Step 4: Remove the rule exception (rules only, after a grace period)

Wait about a week after step 3 is live, so old tabs have been reloaded. Then:

- Remove `isAcceptingMentorship(userId) || isAcceptingTutorship(userId) ||
  isAcceptingPairing(userId)` from the `users` update rule.
- Delete the helpers only they use: `isAddingConnection`, `connectionAfter`,
  `isAcceptingRequestFrom`, `isAcceptingMentorship`, `isAcceptingTutorship`,
  `isAcceptingPairing` and `isBeingAddedToList`. Grep first. `isAcceptingRequest`
  and `connectionIdWith` stay, because the connection rules use them.
- Test in the emulator: accepting a request (new code) still works, and
  writing to someone else's profile is denied apart from following.

This *narrows* access. Afterwards, only a profile's owner can change it, apart
from followers.

### Step 5: Remove the old data

- An Admin SDK script, dry run first, then for real after a backup: delete the
  nine fields from every `users` doc with `FieldValue.delete()`. There are
  about 90 profiles, so one batch is enough.
- Remove the fields from `UserProfile` in `src/lib/types.ts`.
- Update `docs/tech-debt-audit.md`, moving "The users doc is a grab bag" to
  Done, or noting what's left.

Before step 5, any step can be undone by reverting its PR, and the data is
still complete. Step 5 is the only one that loses information, and only
information that step 0 showed is duplicated.

## Risks

1. **The new `list` rule (step 1)** is the only change that widens access.
   It's narrow, since every result must contain the caller in `memberIds`, but
   it's a security rule. Test it in the emulator, including the "denied" cases,
   before deploying.
2. **Removing the profile exception (step 4)** breaks accepting for anyone
   still running pre-step-3 code. That's why it waits. If someone hits it,
   they see the existing "Failed to process request" toast, the request stays
   pending, and reloading fixes it.
3. **Deploy order matters, and rules deploy separately from the app.**
   Deploying step 2's code before step 1's rules would make every dashboard
   list come back empty with permission errors. Deploying step 4's rules before
   step 3's code would make every accept fail.
4. **Rules drift.** The live rules have been out of sync with the repo before.
   Compare them before each rules deploy, or the deploy could undo a hotfix
   made in the console.
5. **Visible list changes** (role swaps, orphans, the 10-item cap on meetups):
   step 0 measures them, and the step 2 PR should spell out what changes.
6. **More reads.** Each dashboard runs one query per program instead of reading
   from the profile it already has. With this site's size the cost is tiny,
   but it's an extra listener on the account page (three programs plus
   meetups).
7. **Privacy improves.** Profiles are public (`allow read: if true`), so today
   anyone can see who mentors, tutors or pairs with whom. Connection docs are
   members-only. Joined meetups were already public through `attendeeIds`.

## Not covered here

These follow the same pattern and could come next, but they weren't in scope:

- `createdMeetupIds` → `meetups` where `creatorId == uid` (public, no rules
  change). This could easily go in step 2 alongside `joinedMeetupIds`.
- `soloProjectIds` → `soloProjects` where `userId == uid` (the data download
  already queries it that way).
- `followers`, `following` and `starredSoloProjectIds` have no other source,
  so they stay.
- Profiles may still hold the old group ID arrays from before November 3. If
  so, step 5's script could remove those too.
