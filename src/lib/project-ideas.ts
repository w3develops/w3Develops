// Project ideas for /project-ideas: things members can build alone (a solo
// project) or with a team (a group project), from first steps to bigger
// builds. Each idea says what to build and what it teaches.

export const IDEA_LEVELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;
export type IdeaLevel = keyof typeof IDEA_LEVELS;

export const IDEA_TRACKS = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Full stack',
  devops: 'DevOps',
  data: 'Data and AI',
  mobile: 'Mobile',
} as const;
export type IdeaTrack = keyof typeof IDEA_TRACKS;

export interface ProjectIdea {
  slug: string;
  title: string;
  level: IdeaLevel;
  track: IdeaTrack;
  summary: string;
  /** What building it teaches */
  learn: string[];
  /** Good for a team: there's enough to split up */
  team?: boolean;
}

export const PROJECT_IDEAS: ProjectIdea[] = [
  // Beginner
  { slug: 'personal-site', title: 'Personal portfolio site', level: 'beginner', track: 'frontend', summary: 'A one-page site about you, your skills and the projects you build next. Put it online for free.', learn: ['HTML and CSS layout', 'Responsive design', 'Deploying a static site'] },
  { slug: 'tip-calculator', title: 'Tip and bill splitter', level: 'beginner', track: 'frontend', summary: 'Enter a bill, a tip percentage and how many people, and see what each person pays.', learn: ['Forms and input events', 'Rounding money correctly', 'Showing results as you type'] },
  { slug: 'todo-list', title: 'To-do list that remembers', level: 'beginner', track: 'frontend', summary: 'Add, tick off and delete tasks; they are still there after a reload.', learn: ['DOM updates', 'localStorage', 'Keeping state in one place'] },
  { slug: 'weather', title: 'Weather lookup', level: 'beginner', track: 'frontend', summary: 'Type a city and show today’s weather and the next few days from a free weather API.', learn: ['Calling an API with fetch', 'Loading and error states', 'Hiding API keys'] },
  { slug: 'cli-notes', title: 'Command-line notes', level: 'beginner', track: 'backend', summary: 'A terminal tool to add, list, search and delete notes saved in a file.', learn: ['Reading command-line arguments', 'Reading and writing files', 'JSON'] },
  { slug: 'unit-converter', title: 'Unit converter', level: 'beginner', track: 'frontend', summary: 'Convert length, weight and temperature in both directions.', learn: ['Pure functions', 'Testing small functions', 'Accessible form labels'] },
  { slug: 'github-stats', title: 'GitHub profile card', level: 'beginner', track: 'frontend', summary: 'Enter a GitHub username and show their avatar, repos and most-used languages.', learn: ['Public APIs and rate limits', 'Combining several requests', 'Cards and grids'] },
  { slug: 'expense-csv', title: 'Expense summary from a CSV', level: 'beginner', track: 'data', summary: 'Read a bank export CSV and print spending by category and month.', learn: ['Parsing CSV', 'Grouping and totals', 'Simple charts'] },

  // Intermediate
  { slug: 'url-shortener', title: 'URL shortener', level: 'intermediate', track: 'backend', summary: 'An API and small page that turn long links into short ones and count clicks.', learn: ['REST APIs', 'A database', 'Unique IDs and redirects'] },
  { slug: 'blog-api', title: 'Blog with an admin area', level: 'intermediate', track: 'fullstack', summary: 'Public posts, plus a signed-in area to write, edit and publish them.', learn: ['Authentication', 'CRUD', 'Server-side rendering for search engines'], team: true },
  { slug: 'habit-tracker', title: 'Habit tracker with streaks', level: 'intermediate', track: 'fullstack', summary: 'Track daily habits, see streaks and a calendar of the month.', learn: ['Dates and time zones', 'User accounts', 'Charts'] },
  { slug: 'markdown-notes', title: 'Markdown notes app', level: 'intermediate', track: 'frontend', summary: 'Write notes in Markdown with a live preview, tags and search.', learn: ['Rendering Markdown safely', 'Search and filters', 'Keyboard shortcuts'] },
  { slug: 'job-tracker', title: 'Job application tracker', level: 'intermediate', track: 'fullstack', summary: 'A board of applications moving from applied to interview to offer, with notes and dates.', learn: ['Drag and drop', 'Data modeling', 'Reminders'] },
  { slug: 'recipe-finder', title: 'Recipe finder', level: 'intermediate', track: 'frontend', summary: 'Search recipes by what is in your fridge and save favorites.', learn: ['Debounced search', 'Pagination', 'Saving user data'] },
  { slug: 'discord-bot', title: 'Study-group Discord bot', level: 'intermediate', track: 'backend', summary: 'A bot that posts daily check-in prompts and tracks who answered.', learn: ['Bot APIs and webhooks', 'Scheduled jobs', 'Hosting a long-running process'], team: true },
  { slug: 'mobile-flashcards', title: 'Flashcards app', level: 'intermediate', track: 'mobile', summary: 'Make decks, study them, and see cards you get wrong more often.', learn: ['A mobile framework', 'Spaced repetition', 'Offline storage'] },
  { slug: 'ci-pipeline', title: 'CI pipeline for a small app', level: 'intermediate', track: 'devops', summary: 'Lint, test and build on every pull request, and deploy main automatically.', learn: ['GitHub Actions', 'Tests in CI', 'Secrets and environments'] },
  { slug: 'scraper-dashboard', title: 'Price tracker', level: 'intermediate', track: 'data', summary: 'Check a few product pages each day and chart how prices change.', learn: ['Scheduled jobs', 'Storing time series', 'Respecting robots.txt'] },

  // Advanced
  { slug: 'realtime-chat', title: 'Real-time chat with rooms', level: 'advanced', track: 'fullstack', summary: 'Rooms, typing indicators, unread counts and message history.', learn: ['WebSockets or real-time databases', 'Presence', 'Moderation and rate limits'], team: true },
  { slug: 'kanban-team', title: 'Team Kanban board', level: 'advanced', track: 'fullstack', summary: 'Boards, columns and cards that several people edit at once.', learn: ['Live collaboration', 'Permissions and roles', 'Optimistic updates'], team: true },
  { slug: 'ecommerce', title: 'Small online shop', level: 'advanced', track: 'fullstack', summary: 'Products, a cart, checkout in a payment provider’s test mode, and an orders page.', learn: ['Payments in test mode', 'Webhooks', 'Inventory and orders'], team: true },
  { slug: 'code-runner', title: 'Online code runner', level: 'advanced', track: 'backend', summary: 'Run small programs in a sandbox and show the output, like a mini playground.', learn: ['Containers and sandboxing', 'Timeouts and resource limits', 'Queues'], team: true },
  { slug: 'infra-as-code', title: 'Infrastructure as code', level: 'advanced', track: 'devops', summary: 'Describe a web app’s servers, database and DNS in Terraform and rebuild it from scratch.', learn: ['Terraform', 'Cloud networking', 'Monitoring and alerts'] },
  { slug: 'rag-docs', title: 'Ask-the-docs assistant', level: 'advanced', track: 'data', summary: 'Answer questions about a project’s docs, citing the pages it used.', learn: ['Embeddings and search', 'Calling an LLM API', 'Evaluating answers'], team: true },
  { slug: 'open-source-clone', title: 'Contribute to an open-source tool', level: 'advanced', track: 'fullstack', summary: 'Pick an issue labeled good-first-issue in a project you use and get a pull request merged.', learn: ['Reading a large codebase', 'Project conventions', 'Code review'] },
  { slug: 'mobile-social', title: 'Mobile meetup finder', level: 'advanced', track: 'mobile', summary: 'Find and join local developer meetups on a map, with push reminders.', learn: ['Maps and location', 'Push notifications', 'App store releases'], team: true },
];
