// The FAQ page's questions and answers. Also published as Markdown in
// /llms-full.txt, so AI tools can read and quote them.
// Answers may contain simple HTML links and <strong>.

export interface FaqSection {
  title: string;
  icon: 'help' | 'sparkles' | 'users' | 'code' | 'globe';
  items: { question: string; answer: string }[];
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "General & Mission",
    icon: 'help',
    items: [
      {
        question: "What exactly is w3Develops?",
        answer: "w3Develops is a global community of developers who learn, build, and team up on projects together. We offer resources like remote study groups, collaborative build cohorts, and a platform to connect with other developers—all focused on bridging the gap between learning and employment."
      },
      {
        question: "Is w3Develops really free? What's the catch?",
        answer: "Yes, it is 100% free. There is no catch. Our mission is to make tech education accessible to everyone. We are supported by donations and the work of our volunteers. We don't sell your data, and we don't serve ads."
      }
    ]
  },
  {
    title: "AI & Community News",
    icon: 'sparkles',
    items: [
      {
        question: "What is the AI News Summary at the top of the news page?",
        answer: "Eight times a day (1am, 4am, 7am, 10am, 1pm, 4pm, 7pm and 10pm Pacific time), we gather the newest headlines from dozens of tech news feeds. Jev, an AI model, sorts each one into a topic and ranks how important it is, and the top stories become a short briefing, so you can stay informed without reading every article."
      },
      {
        question: "How do 'Hearts' and 'Shares' work on news articles?",
        answer: "If you're logged in, you can heart articles to show support. This data helps the community see what topics are most relevant. You can also use the share button to instantly post articles to X (Twitter), WhatsApp, or Facebook."
      }
    ]
  },
  {
    title: "Collaboration Hubs",
    icon: 'users',
    items: [
      {
        question: "What's the difference between a Study Group and a Group Project?",
        answer: "<strong>Study Groups</strong> are for collective learning about a specific topic (e.g., learning Rust together). <strong>Group Projects</strong> are collaborative cohorts where you build a real application from scratch to gain portfolio experience."
      },
      {
        question: "What is Pair Programming and how do I find a partner?",
        answer: "Pair Programming allows two developers to work on the same code in real-time. You can set your status to 'Open to Pairing' in your settings, list your skills, and others can send you a request to start a session with a shared editor."
      },
      {
        question: "How do the 'Check-ins' work?",
        answer: "Consistency is key. Our daily and weekly check-in systems allow group members to post their progress and blockers. This builds accountability and keeps projects moving forward."
      }
    ]
  },
  {
    title: "Mentorship & Growth",
    icon: 'code',
    items: [
      {
        question: "How can I find a Mentor or a Tutor?",
        answer: "Visit the <a href='/mentorship' class='text-primary underline'>Mentorship</a> or <a href='/tutor' class='text-primary underline'>Tutor</a> pages. You can filter users by specific skills and send a request. Once accepted, you'll get a private shared dashboard with a real-time note editor and task manager."
      },
      {
        question: "How do I showcase my own work?",
        answer: "Use the <a href='/solo-projects' class='text-primary underline'>Solo Projects</a> gallery. You can submit links to your live apps or GitHub repos. Other members can star your projects, helping you get eyes on your hard work."
      },
      {
        question: "Can I apply for an internship here?",
        answer: "Yes! We often have internal openings for web development and digital marketing volunteers. Check the <a href='/careers' class='text-primary underline'>Careers page</a> to see current roles and apply directly."
      }
    ]
  },
  {
    title: "Logistics & Privacy",
    icon: 'globe',
    items: [
      {
        question: "Why does the site use UTC time for everything?",
        answer: "Our members live in every time zone on Earth. Coordinated Universal Time (UTC) acts as a global anchor. We provide a <a href='/time-converter' class='text-primary underline'>Time Converter</a> to help you find your offset, and most event pages will automatically show you the time in your local zone if you have it set in your profile."
      },
      {
        question: "What is 'Radical Data Minimization'?",
        answer: "It means we only collect what is strictly necessary. We don't track your behavior across the web or build a 'shadow profile' of you. Read our full <a href='/privacy' class='text-primary underline'>Privacy Policy</a> for our commitment to user agency."
      },
      {
        question: "What if I find a bug or need help?",
        answer: "If you have a technical issue, submit a ticket on our <a href='/support' class='text-primary underline'>Support</a> page. For general questions, the best place to get a fast answer is our <a href='/chat' class='text-primary underline'>Discord community</a>."
      }
    ]
  }
];
