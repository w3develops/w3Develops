import type { MatchingConfig } from '@/components/MatchingProgram';

// Settings for each matching program. The program pages and the account
// dashboard both use these, so the names only live in one place.

export const MENTORSHIP: MatchingConfig = {
    program: 'Mentorship',
    dashboardTitle: 'Mentorship Dashboard',
    intro: 'Connect with experienced developers or guide newcomers. Share knowledge, grow your skills, and build lasting professional relationships.',
    pageRoute: '/mentorship',
    offerer: { singular: 'mentor', plural: 'mentors', title: 'Mentor' },
    seeker: { singular: 'mentee', plural: 'mentees', title: 'Mentee' },
    requestsCollection: 'mentorshipRequests',
    connectionsCollection: 'mentorships',
    connectionsRoute: '/mentorships',
    fields: {
        role: 'mentorshipRole',
        status: 'mentorshipStatus',
        offerSkills: 'mentoringSkills',
        seekSkills: 'seekingSkills',
        offererIds: 'mentorIds',
        seekerIds: 'menteeIds',
        connectionIds: 'mentorshipIds',
    },
};

export const TUTORING: MatchingConfig = {
    program: 'Tutoring',
    dashboardTitle: 'Tutorship Dashboard',
    intro: 'Connect with experienced tutors or help students. Share knowledge, grow your skills, and build lasting professional relationships.',
    pageRoute: '/tutor',
    offerer: { singular: 'tutor', plural: 'tutors', title: 'Tutor' },
    seeker: { singular: 'student', plural: 'students', title: 'Student' },
    requestsCollection: 'tutorRequests',
    connectionsCollection: 'tutorships',
    connectionsRoute: '/tutorships',
    fields: {
        role: 'tutorRole',
        status: 'tutorStatus',
        offerSkills: 'tutoringSkills',
        seekSkills: 'seekingTutoringSkills',
        offererIds: 'tutorIds',
        seekerIds: 'studentIds',
        connectionIds: 'tutorshipIds',
    },
};
