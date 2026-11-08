/**
 * Usernames nobody can sign up with, so no one can pose as the site's staff.
 * The Firestore rules (isReservedUsername) refuse the same names; keep the
 * two lists in step.
 */
export const RESERVED_USERNAMES = [
  'root', 'admin', 'administrator', 'abuse', 'webmaster', 'spam', 'help', 'support',
  'administratorrequest', 'invalid', 'valid', 'error', 'motd', 'authenticateduser',
  'moderator', 'staff', 'official', 'security', 'system', 'w3develops',
];
