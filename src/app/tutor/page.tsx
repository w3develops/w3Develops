import MatchingProgram, { type MatchingConfig } from '@/components/MatchingProgram';

const tutoring: MatchingConfig = {
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

export default function TutorPage() {
    return <MatchingProgram config={tutoring} />;
}
