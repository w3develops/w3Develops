// Members' items moderators can edit or delete, and which fields they may
// change. firestore.rules (isModeratorEditing, isModeratorDeleting) checks
// the same field lists; keep the two in step.

export interface ModeratedField {
  label: string;
  /** Longest value allowed */
  max: number;
  /** A big text box rather than one line */
  long?: boolean;
  /** Also saved lowercased under this field, for search */
  lowercase?: string;
}

export interface ModeratedItemType {
  noun: string;
  /** Where to go once it's deleted */
  listPath: string;
  /** The field naming the member who made it */
  ownerField: string;
  fields: Record<string, ModeratedField>;
  /** Subcollections deleted along with it */
  parts: string[];
}

const GROUP_FIELDS: Record<string, ModeratedField> = {
  name: { label: 'Name', max: 75, lowercase: 'name_lowercase' },
  topic: { label: 'Topic', max: 50 },
  description: { label: 'Description', max: 500, long: true },
};

export const MODERATED_ITEMS = {
  studyGroups: { noun: 'study group', listPath: '/studygroups', ownerField: 'creatorId', fields: GROUP_FIELDS, parts: ['tasks', 'checkIns'] },
  groupProjects: { noun: 'group project', listPath: '/groupprojects', ownerField: 'creatorId', fields: GROUP_FIELDS, parts: ['tasks', 'checkIns'] },
  bookClubs: { noun: 'book club', listPath: '/book-clubs', ownerField: 'creatorId', fields: GROUP_FIELDS, parts: ['tasks', 'checkIns'] },
  meetups: {
    noun: 'meetup', listPath: '/meetups', ownerField: 'creatorId', parts: ['updates', 'tasks', 'checkIns'],
    fields: {
      name: { label: 'Name', max: 100, lowercase: 'name_lowercase' },
      topic: { label: 'Topic', max: 50 },
      description: { label: 'Description', max: 2000, long: true },
      locationAddress: { label: 'Address', max: 300 },
      virtualLink: { label: 'Meeting link', max: 500 },
    },
  },
  competitions: {
    noun: 'competition', listPath: '/competitions', ownerField: 'creatorId', parts: ['entries'],
    fields: {
      name: { label: 'Name', max: 100, lowercase: 'name_lowercase' },
      description: { label: 'Description', max: 2000, long: true },
      rules: { label: 'Rules', max: 5000, long: true },
      prize: { label: 'Prize', max: 300 },
    },
  },
  jobs: {
    noun: 'job post', listPath: '/job-board', ownerField: 'postedById', parts: [],
    fields: {
      title: { label: 'Title', max: 150, lowercase: 'title_lowercase' },
      companyName: { label: 'Company', max: 150 },
      location: { label: 'Location', max: 150 },
      description: { label: 'Description', max: 5000, long: true },
      applyUrl: { label: 'Apply link', max: 500 },
    },
  },
  soloProjects: {
    noun: 'solo project', listPath: '/solo-projects', ownerField: 'userId', parts: ['tasks'],
    fields: {
      name: { label: 'Name', max: 100 },
      description: { label: 'Description', max: 2000, long: true },
      projectUrl: { label: 'Project link', max: 500 },
    },
  },
} satisfies Record<string, ModeratedItemType>;

export type ModeratedKind = keyof typeof MODERATED_ITEMS;
