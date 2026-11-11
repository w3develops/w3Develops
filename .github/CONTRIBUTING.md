# Contributing to w3Develops

Thanks for helping! w3Develops is a free community for developers, built by
volunteers. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) first.

## Ways to help

- **Code:** fix bugs and build features on w3develops.org (this repository).
- **Writing:** [apply to write for w3Develops](https://w3develops.org/news/write).
  Follow the [Developer News Style Guide](https://w3develops.org/news/developer-news-style-guide).
- **Community:** welcome people and answer questions on
  [Discord](https://w3develops.org/chat) and the
  [community feed](https://w3develops.org/feed).
- **Ideas and bugs:** [open an issue](https://github.com/w3develops/w3Develops/issues/new/choose).

## Contributing code

1. **Find something to work on.** Issues labeled `good first issue` are a
   good start. Comment on the issue so others know you're on it.
2. **Fork and set up.** Follow [docs/GITHUB_FORKING.md](../docs/GITHUB_FORKING.md),
   then the setup in [AGENTS.md](../AGENTS.md#commands) (`npm install`,
   `npm run dev`).
3. **Branch.** Make a branch from an up-to-date `main`, named for the change,
   like `fix/feed-image-upload` or `feature/events-page`.
4. **Make the change**, following [docs/STYLE_GUIDE.md](../docs/STYLE_GUIDE.md)
   and the rules in [AGENTS.md](../AGENTS.md#rules-to-follow). If you change
   `firestore.rules`, add tests in `tests/rules`.
5. **Check it** before pushing:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   npm run test:rules   # if you touched firestore.rules (needs Java 21)
   ```
6. **Open a pull request** against `main`, fill in the template, and add a
   line to the **Unreleased** section of [CHANGELOG.md](CHANGELOG.md).

Our Git workflow (protected `main`, reviews, checks) is described in
[docs/GIT_WORKFLOW.md](../docs/GIT_WORKFLOW.md).
