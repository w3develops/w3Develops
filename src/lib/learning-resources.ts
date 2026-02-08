
interface LearningLink {
    title: string;
    url: string;
}

interface LearningResource {
    topic: string;
    description: string;
    links: LearningLink[];
}

export const programmingTheoryResources: LearningResource[] = [
    {
        topic: "Programming Fundamentals",
        description: "Core concepts that are essential for starting your programming journey, regardless of the language or path you choose.",
        links: [
            { title: "W3Schools - Intro to Programming", url: "https://www.w3schools.com/programming/index.php" },
            { title: "LeetCode", url: "https://leetcode.com/" },
            { title: "Advent of Code", url: "https://adventofcode.com/" },
            { title: "Teach Yourself CS", url: "https://teachyourselfcs.com/" },
        ]
    }
];

export const webLearningResources: LearningResource[] = [
    {
        topic: "Getting Started",
        description: "A prerequisite guide to understanding the basics of web development before diving into specific technologies.",
        links: [
            { title: "Getting started with the web", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started" },
        ]
    },
    {
        topic: "Git",
        description: "Git is the most widely used modern version control system in the world. It’s a distributed SCM (source code management) tool, meaning the entire codebase and history is available on every developer’s computer.",
        links: [
            { title: "Basic Git Commands", url: "https://confluence.atlassian.com/bitbucketserver/basic-git-commands-776639767.html" },
            { title: "Atlassian Git Cheatsheet [PDF Download]", url: "https://www.atlassian.com/dam/jcr:8132028b-024f-4b6b-953e-e68fcce0c5fa/atlassian-git-cheatsheet.pdf" },
        ]
    },
     {
        topic: "GitHub",
        description: "GitHub is a code hosting platform for version control and collaboration. It lets you and others work together on projects from anywhere.",
        links: [
            { title: "Interactive Courses", url: "https://learn.github.com/skills" },
            { title: "GitHub Get Started Docs", url: "https://docs.github.com/en/get-started" },
        ]
    },
    {
        topic: "Bash",
        description: "Bash is a command-line interface shell program used extensively in Linux and macOS. It's a crucial tool for developers for automating tasks and managing systems.",
        links: [
             { title: "W3Schools - Bash Tutorial", url: "https://www.w3schools.com/bash/index.php" },
        ]
    },
    {
        topic: "HTML",
        description: "HyperText Markup Language (HTML) is the standard language for creating web pages. It's the skeleton of every site.",
        links: [
            { title: "freeCodeCamp - Responsive Web Design", url: "https://www.freecodecamp.org/learn/responsive-web-design-v9/" },
            { title: "MDN - Structuring the web with HTML", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content" },
            { title: "web.dev - Learn HTML", url: "https://web.dev/learn/html" },
            { title: "W3Schools - HTML Tutorial", url: "https://www.w3schools.com/html/default.asp" }
        ]
    },
    {
        topic: "CSS",
        description: "Cascading Style Sheets (CSS) is used to style and lay out web pages — for example, to alter the font, color, size, and spacing of your content.",
        links: [
            { title: "freeCodeCamp - Responsive Web Design", url: "https://www.freecodecamp.org/learn/responsive-web-design-v9/" },
            { title: "MDN - CSS first steps", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics" },
            { title: "web.dev - Learn CSS", url: "https://web.dev/learn/css" },
            { title: "W3Schools - CSS Tutorial", url: "https://www.w3schools.com/css/default.asp" }
        ]
    },
    {
        topic: "JavaScript",
        description: "JavaScript is a programming language that enables you to create dynamically updating content, control multimedia, animate images, and much more.",
        links: [
            { title: "freeCodeCamp - JavaScript Algorithms and Data Structures", url: "https://www.freecodecamp.org/learn/javascript-v9/" },
            { title: "MDN - What is JavaScript?", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript" },
            { title: "web.dev - Learn JavaScript", url: "https://web.dev/learn/javascript" },
            { title: "W3Schools - JavaScript Tutorial", url: "https://www.w3schools.com/js/default.asp" }
        ]
    },
    {
        topic: "TypeScript",
        description: "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
        links: [
            { title: "W3Schools - TypeScript Tutorial", url: "https://www.w3schools.com/typescript/index.php" },
        ]
    },
    {
        topic: "React",
        description: "React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called 'components'.",
        links: [
            { title: "W3Schools - React Tutorial", url: "https://www.w3schools.com/react/default.asp" },
        ]
    },
    {
        topic: "Next.js",
        description: "Next.js is a React framework for building full-stack web applications. You use React Components to build user interfaces, and Next.js for additional features and optimizations.",
        links: [
            { title: "Next.js 14 Tutorial (freeCodeCamp)", url: "https://www.youtube.com/watch?v=1T312Q2S-2o" },
            { title: "Next.js Full Course (Bro Code)", url: "https://www.youtube.com/watch?v=wLp9003T3E8" },
            { title: "Learn Next.js (web.dev)", url: "https://web.dev/learn/nextjs" },
            { title: "Next.js Tutorial (W3Schools)", url: "https://www.w3schools.com/nextjs/" }
        ]
    },
     {
        topic: "AWS",
        description: "Amazon Web Services (AWS) is the world’s most comprehensive and broadly adopted cloud platform, offering over 200 fully featured services from data centers globally.",
        links: [
            { title: "W3Schools - AWS Tutorial", url: "https://www.w3schools.com/aws/index.php" },
        ]
    },
];

export const digitalMarketingResources: LearningResource[] = [
    {
        topic: "Digital Marketing",
        description: "A collection of resources to learn digital marketing, from SEO and content marketing to analytics.",
        links: [
            { title: "Google Digital Garage", url: "https://skillshop.exceedlms.com/student/catalog/list?category_ids=7879-google-digital-garage" },
            { title: "HubSpot Academy", url: "https://academy.hubspot.com" },
            { title: "Semrush Academy", url: "https://www.semrush.com/academy/" }
        ]
    }
];

export const mobileLearningResources: LearningResource[] = [
    {
        topic: "React Native",
        description: "React Native is a framework for building native apps using React. It enables you to write your code once and run it on both iOS and Android platforms.",
        links: [
            { title: "React Native Tutorial for Beginners (freeCodeCamp)", url: "https://www.youtube.com/watch?v=obH0Po_RdWk" },
            { title: "React Native Full Course (Bro Code)", url: "https://www.youtube.com/watch?v=0kL6nhutjQ8" },
            { title: "Get started with React Native (web.dev)", url: "https://web.dev/get-started-with-react-native" }
        ]
    },
    {
        topic: "Flutter",
        description: "Flutter is a UI toolkit from Google for building beautiful, natively compiled applications for mobile, web, and desktop from a single codebase.",
        links: [
            { title: "Flutter for Beginners (freeCodeCamp)", url: "https://www.youtube.com/watch?v=VPvVD8t02U8" },
            { title: "Flutter Full Course (Bro Code)", url: "https://www.youtube.com/watch?v=C-fKAoNqypA" }
        ]
    },
];

export const backendLearningResources: LearningResource[] = [
    {
        topic: "Python",
        description: "Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.",
        links: [
            { title: "W3Schools - Python Tutorial", url: "https://www.w3schools.com/python/default.asp" },
        ]
    },
    {
        topic: "Django",
        description: "Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design.",
        links: [
            { title: "W3Schools - Django Tutorial", url: "https://www.w3schools.com/django/index.php" },
        ]
    },
    {
        topic: "Node.js",
        description: "Node.js is a back-end JavaScript runtime environment that runs on the V8 engine and executes JavaScript code outside a web browser.",
        links: [
            { title: "W3Schools - Node.js Tutorial", url: "https://www.w3schools.com/nodejs/default.asp" },
        ]
    },
];

export const systemsLearningResources: LearningResource[] = [
    {
        topic: "Java",
        description: "Java is a high-level, class-based, object-oriented programming language that is designed to have as few implementation dependencies as possible.",
        links: [
            { title: "W3Schools - Java Tutorial", url: "https://www.w3schools.com/java/default.asp" },
        ]
    },
    {
        topic: "Go",
        description: "Go is a statically typed, compiled programming language designed at Google. It is syntactically similar to C, but with memory safety, garbage collection, and structural typing.",
        links: [
            { title: "W3Schools - Go Tutorial", url: "https://www.w3schools.com/go/index.php" },
        ]
    },
    {
        topic: "Rust",
        description: "Rust is a multi-paradigm, general-purpose programming language that emphasizes performance, type safety, and concurrency.",
        links: [
             { title: "W3Schools - Rust Tutorial", url: "https://www.w3schools.com/rust/index.php" },
        ]
    },
];


export const databaseResources: LearningResource[] = [
    {
        topic: "MongoDB",
        description: "MongoDB is a document-oriented NoSQL database used for high-volume data storage.",
        links: [
            { title: "W3Schools - MongoDB Tutorial", url: "https://www.w3schools.com/mongodb/index.php" }
        ]
    },
    {
        topic: "SQL",
        description: "SQL (Structured Query Language) is a standard language for storing, manipulating and retrieving data in relational databases.",
        links: [
            { title: "SQL Tutorial (W3Schools)", url: "https://www.w3schools.com/sql/default.asp" }
        ]
    },
    {
        topic: "PostgreSQL",
        description: "PostgreSQL is a powerful, open source object-relational database system with over 30 years of active development.",
        links: [
            { title: "W3Schools - PostgreSQL Tutorial", url: "https://www.w3schools.com/postgresql/index.php" }
        ]
    }
];

export const web3LearningResources: LearningResource[] = [
    {
        topic: "Ethereum",
        description: "Resources for learning Ethereum development.",
        links: [
            { title: "Ethereum Developer Bootcamp by Alchemy University (FREE)", url: "https://www.alchemy.com/university" },
        ]
    },
    {
        topic: "Solana",
        description: "Resources for learning Solana development.",
        links: [
            { title: "Solana Development Course (FREE)", url: "https://learn.blueshift.gg/" },
            { title: "Solana Developers", url: "https://solana.com/developers" },
            { title: "Solana Docs", url: "https://solana.com/docs" },
            { title: "Solana Cookbook", url: "https://solana.com/developers/cookbook" },
            { title: "Solana Learn", url: "https://solana.com/learn" },
        ]
    },
    {
        topic: "Other Web3 Resources",
        description: "Additional free courses for Web3 development.",
        links: [
            { title: "Cyfrin Updraft Courses (FREE)", url: "https://updraft.cyfrin.io/courses" },
        ]
    }
];

export const aiMachineLearningResources: LearningResource[] = [
    {
        topic: "AI & Machine Learning",
        description: "Explore the world of Artificial Intelligence and Machine Learning with these curated resources, covering everything from beginner concepts to advanced applications.",
        links: [
            { title: "Kaggle Learn", url: "https://www.kaggle.com/learn" },
            { title: "OpenML Education", url: "https://www.openml.org/" },
            { title: "Google Prompt Engineering Guide [PDF]", url: "https://www.gptaiflow.com/assets/files/2025-01-18-pdf-1-TechAI-Goolge-whitepaper_Prompt%20Engineering_v4-af36dcc7a49bb7269a58b1c9b89a8ae1.pdf" },
            { title: "GitHub - Machine Learning for Beginners", url: "https://github.com/collections/machine-learning" },
            { title: "Google for Developers - Machine Learning", url: "https://developers.google.com/machine-learning" },
            { title: "TensorFlow - Learn ML", url: "https://www.tensorflow.org/resources/learn-ml" },
            { title: "MIT - 7 Free Courses to Grasp Machine Learning", url: "https://openlearning.mit.edu/news/7-free-online-mit-courses-grasp-machine-learning" },
            { title: "Kaggle - 27 Free ML Resources", url: "https://www.kaggle.com/discussions/general/196686" },
            { title: "Reddit - 5 Best GitHub Repositories to Learn ML", url: "https://www.reddit.com/r/learnmachinelearning/comments/y43u5t/5_best_github_repositories_to_learn_machine/" },
            { title: "GitHub - ML From Scratch", url: "https://github.com/eriklindernoren/ML-From-Scratch" },
            { title: "Azure Machine Learning", url: "https://azure.microsoft.com/en-us/products/machine-learning" },
            { title: "Reddit - List of free educational ML resources", url: "https://www.reddit.com/r/learnmachinelearning/comments/1e1amzf/list_of_free_educational_ml_resources_i_used_to/" },
            { title: "AWS Skill Builder", url: "https://skillbuilder.aws/" },
            { title: "W3Schools - Artificial Intelligence", url: "https://www.w3schools.com/ai/default.asp" },
        ]
    },
    {
        topic: "Data Science",
        description: "Data science combines math and statistics, specialized programming, advanced analytics, artificial intelligence (AI), and machine learning with specific subject matter expertise to uncover actionable insights hidden in an organization’s data.",
        links: [
             { title: "W3Schools - Data Science", url: "https://www.w3schools.com/datascience/default.asp" },
        ]
    },
    {
        topic: "Generative AI",
        description: "Generative AI is a type of artificial intelligence (AI) that can create new and original content, such as text, images, music, and code.",
        links: [
            { title: "W3Schools - Generative AI", url: "https://www.w3schools.com/gen_ai/index.php" },
        ]
    }
];

export const cybersecurityResources: LearningResource[] = [
    {
        topic: "Cybersecurity",
        description: "Cybersecurity involves protecting systems, networks, and programs from digital attacks. These attacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes.",
        links: [
            { title: "W3Schools - Cybersecurity", url: "https://www.w3schools.com/cybersecurity/index.php" },
            { title: "Bugcrowd", url: "https://www.bugcrowd.com/" },
            { title: "HackerOne", url: "https://www.hackerone.com/" },
            { title: "HackerRank", url: "https://www.hackerrank.com/" },
            { title: "CyberDefenders", url: "https://cyberdefenders.org/" },
            { title: "TryHackMe", url: "https://tryhackme.com/" },
            { title: "Hack The Box", url: "https://www.hackthebox.com/" },
            { title: "Hack This Site", url: "https://www.hackthissite.org/" },
            { title: "GitHub Secure Code Game", url: "https://github.com/skills/secure-code-game" }
        ]
    }
];
