import MatchingProgram, { type MatchingConfig } from '@/components/MatchingProgram';

const mentorship: MatchingConfig = {
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

export default function MentorshipPage() {
    return <MatchingProgram config={mentorship} />;
}
