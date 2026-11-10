import type { PartnersConfig, RolesConfig } from '@/components/MatchingProgram';

// Settings for each matching program. The program pages and the account
// dashboard both use these, so the names only live in one place.

export const MENTORSHIP: RolesConfig = {
    program: 'Mentorship',
    heading: 'Mentorship Program',
    icon: 'graduation-cap',
    dashboardTitle: 'Mentorship Dashboard',
    intro: 'Connect with experienced developers or guide newcomers. Share knowledge, grow your skills, and build lasting professional relationships.',
    pageRoute: '/mentorship',
    requestsCollection: 'mentorshipRequests',
    connectionsCollection: 'mentorships',
    connectionsRoute: '/mentorships',
    roleField: 'mentorshipRole',
    statusField: 'mentorshipStatus',
    offerer: { singular: 'mentor', plural: 'mentors', title: 'Mentor', skills: 'mentoringSkills' },
    seeker: { singular: 'mentee', plural: 'mentees', title: 'Mentee', skills: 'seekingSkills' },
};

export const TUTORING: RolesConfig = {
    program: 'Tutoring',
    heading: 'Tutoring Program',
    icon: 'graduation-cap',
    dashboardTitle: 'Tutorship Dashboard',
    intro: 'Connect with experienced tutors or help students. Share knowledge, grow your skills, and build lasting professional relationships.',
    pageRoute: '/tutor',
    requestsCollection: 'tutorRequests',
    connectionsCollection: 'tutorships',
    connectionsRoute: '/tutorships',
    roleField: 'tutorRole',
    statusField: 'tutorStatus',
    offerer: { singular: 'tutor', plural: 'tutors', title: 'Tutor', skills: 'tutoringSkills' },
    seeker: { singular: 'student', plural: 'students', title: 'Student', skills: 'seekingTutoringSkills' },
};

export const PAIR_PROGRAMMING: PartnersConfig = {
    program: 'Pair Programming',
    heading: 'Pair Programming',
    icon: 'git-branch',
    dashboardTitle: 'Pairing Dashboard',
    intro: 'Find a partner, share knowledge, and build together in real-time.',
    pageRoute: '/pair-programming',
    requestsCollection: 'pairRequests',
    connectionsCollection: 'pairings',
    connectionsRoute: '/pairings',
    statusField: 'pairProgrammingStatus',
    partner: { singular: 'partner', plural: 'partners', title: 'Partner', skills: 'pairProgrammingSkills' },
    text: {
        profileTitle: 'Your Pairing Profile',
        openLabel: 'Open to Pairing',
        openHint: 'Allow others to send you pairing requests.',
        skillsLabel: 'Skills/Topics for Pairing',
        skillsPlaceholder: 'e.g., React Hooks, TDD',
        incomingRequest: 'wants to pair with you.',
        finderHint: 'Browse and filter to find someone to pair program with.',
        requestButton: 'Request to Pair',
        requestName: 'pairing',
        howItWorks: [
            {
                title: 'Set up your pairing profile',
                text: 'Set your status to open to pairing and list the skills you want to practise or can help with.',
            },
            {
                title: 'Find a partner',
                text: 'Browse and filter members by skill, then send a pairing request to someone you\'d like to code with.',
            },
            {
                title: 'Code together',
                text: 'Once your request is accepted, you share a private pairing space with a real-time shared editor, a task list and check-ins. It\'s all free.',
            },
        ],
    },
};
