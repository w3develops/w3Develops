# GitHub Forking & Contribution Guide

Whether you're trying to give back to the open source community or collaborating on your own projects, knowing how to properly fork and generate pull requests is essential. This tutorial describes the standard procedure for creating a fork, doing your work, issuing a pull request, and merging that pull request back into the original project.

## Creating a Fork

Just head over to the [w3Develops GitHub page](https://github.com/w3develops/w3Develops) and click the **"Fork"** button. Once you've done that, you can use your favorite git client to clone your repo or just head straight to the command line:

```shell
# Clone your fork to your local machine
git clone https://github.com/YOUR_USERNAME/w3Develops.git
```

## Keeping Your Fork Up to Date

To keep your fork up to date by tracking the original "upstream" repo that you forked, you'll need to add a remote:

```shell
# Add 'upstream' repo to list of remotes
git remote add upstream https://github.com/w3develops/w3Develops.git

# Verify the new remote named 'upstream'
git remote -v
```

Whenever you want to update your fork with the latest upstream changes, fetch the upstream repo's branches and latest commits:

```shell
# Fetch from upstream remote
git fetch upstream

# Checkout your own main branch and merge the upstream repo's main branch
git checkout main
git merge upstream/main
```

## Doing Your Work

### Create a Branch
Whenever you begin work on a new feature or bugfix, create a new branch. This keeps your changes organized and separated from the main branch.

```shell
# Checkout the main branch
git checkout main

# Create a new branch named feature/my-cool-update
git checkout -b feature/my-cool-update
```

## Submitting a Pull Request

### Cleaning Up Your Work
Prior to submitting your pull request, rebase your development branch so that merging it will be a simple fast-forward.

```shell
# Fetch upstream main and merge with your repo's main branch
git fetch upstream
git checkout main
git merge upstream/main

# Rebase your development branch
git checkout feature/my-cool-update
git rebase main
```

### Submitting
Once you've committed and pushed all of your changes to GitHub, go to the page for your fork on GitHub, select your development branch, and click the **"New Pull Request"** button.

---

**Copyright**
Copyright 2017, Chase Pettit.
MIT License, http://www.opensource.org/licenses/mit-license.php

**Additional Reading**
* [Atlassian - Merging vs. Rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing)
* [GitHub - Syncing a Fork](https://help.github.com/articles/syncing-a-fork)
