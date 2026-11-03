# w3Develops

w3Develops is a global community of developers who learn, build, and team up on projects together. We offer resources like remote study groups, collaborative build cohorts, and a platform to connect with other developers, all for free.

## Getting Started

To contribute to this project, please review our core documentation:

- **[Contribution Guide](docs/GITHUB_FORKING.md)**: Learn how to fork the repo, manage branches, and submit Pull Requests.
- **[Style Guide](docs/STYLE_GUIDE.md)**: Understand our coding standards, including HTML whitespace rules and Tailwind class ordering.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **Backend**: Firebase (Auth & Firestore), hosted on Firebase App Hosting
- **News brief**: headlines ranked by TypeSafe's Jev model

## Running locally

```bash
npm install
npm run dev
```

The daily news brief needs a `JEV_API_KEY` in `.env`. Without one, it sorts headlines by keyword instead. Never commit `.env`.

Firestore security rules live in `firestore.rules` and are not deployed by App Hosting. After changing them, run `firebase deploy --only firestore:rules`.

## Community

Join us on [Discord](https://discord.gg/ckQ52gA) to connect with other members and stay updated on the latest news.

## License

[BSD 3-Clause](LICENSE)
