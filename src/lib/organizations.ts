// Organization pages (/orgs): businesses, nonprofits, communities and teams.
// firestore.rules (isValidOrganization) checks the same limits; keep them in
// step.

export const ORG_KINDS = {
  business: 'Business',
  nonprofit: 'Nonprofit',
  community: 'Community',
  team: 'Team',
} as const;
export type OrgKind = keyof typeof ORG_KINDS;

/** A page's address: 3 to 40 lowercase letters, numbers and dashes, not starting or ending with a dash */
export const ORG_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const MAX_ORG_NAME = 80;
export const MAX_ORG_TAGLINE = 120;
export const MAX_ORG_ABOUT = 2000;
export const MAX_ORG_LOCATION = 100;
export const MAX_ORG_ADMINS = 10;
export const MAX_ORG_MEMBERS = 500;

/** "Code for Good!" → "code-for-good" */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
}
