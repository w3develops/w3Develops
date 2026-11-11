# Git workflow

How changes get into w3Develops. The goal: `main` is always deployable,
because every push to `main` deploys the live site.

## Rules

1. **Nobody commits to `main` directly.** Every change, including the
   maintainers', goes through a pull request.
2. **Pull requests need one approving review** from someone other than the
   author, and all checks must pass, before merging.
3. **If a pull request breaks a check, its author fixes it** in the same
   pull request. If a review asks for changes, the pull request isn't merged
   until they're made and the reviewer approves.
4. **Keep pull requests small and about one thing.** Large features can land
   in several pull requests.
5. **Changes to `firestore.rules` or `storage.rules` need tests** in
   `tests/rules`, and are deployed separately after merging
   (`firebase deploy --only firestore:rules`).

## Branches

- `main`: what's live. Protected.
- Work branches: `feature/<short-name>`, `fix/<short-name>`,
  `docs/<short-name>`. Delete them after merging.

## Commits

Write commit messages that say what changed and why, in plain words:

```
Show follow requests on the feed

Private accounts can now accept or decline people who ask to follow them,
from the "Your feed" card.
```

## Checks

The CI workflow (`.github/workflows/ci.yml`) runs on every pull request:
lint, type check, build, and the Firestore rules tests.

## Repositories

Work is merged in `JonDevOps/w3Develops`, which deploys the site, and synced
to `w3develops/w3Develops`, which holds the issues:

```bash
git push upstream origin/main:refs/heads/main
```

## Setting up branch protection (maintainers)

In GitHub: **Settings → Branches → Add branch ruleset** for `main`, with
"Require a pull request before merging" (1 approval), "Require status
checks to pass" (the CI job), and "Block force pushes".
