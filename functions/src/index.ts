// Server-side jobs for w3Develops. Deploy with: firebase deploy --only functions
import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();
// Same region as the Firestore database; one instance at a time is plenty
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

export { onFollow } from './follows.js';
export { onStudyGroupMembers, onGroupProjectMembers, onBookClubMembers } from './groups.js';
export { onCheckIn, onTaskAdded, onTaskDone } from './activity.js';
export { onMentorshipRequest, onTutorRequest, onPairRequest } from './connections.js';
export { onSoloProject } from './solo.js';
export { meetingReminders } from './reminders.js';
export { onReport } from './reports.js';
export { setModerator } from './moderators.js';
