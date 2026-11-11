// Storage rules tests for images on community feed posts (storage.rules).
// Run with npm run test:rules, which also starts the Storage emulator.
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes, uploadString } from 'firebase/storage';

let env;
const verified = uid => env.authenticatedContext(uid, { email_verified: true, firebase: { sign_in_provider: 'password' } }).storage();
const unverified = uid => env.authenticatedContext(uid, { email_verified: false, firebase: { sign_in_provider: 'password' } }).storage();
const moderator = () => env.authenticatedContext('mod', { email_verified: true, moderator: true, firebase: { sign_in_provider: 'password' } }).storage();
const anon = () => env.unauthenticatedContext().storage();
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const upload = (storage, path, type = 'image/png', bytes = png) => uploadBytes(ref(storage, path), bytes, { contentType: type });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-w3develops-storage',
    storage: { rules: readFileSync(new URL('../../storage.rules', import.meta.url), 'utf8') },
  });
});
after(async () => env?.cleanup());
beforeEach(async () => {
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async context => {
    await uploadBytes(ref(context.storage(), 'memberPosts/bob/p1/photo.png'), png, { contentType: 'image/png' });
  });
});

describe('post images', () => {
  test('a verified member can upload an image to their own post folder', async () => {
    await assertSucceeds(upload(verified('alice'), 'memberPosts/alice/p1/photo.png'));
    await assertSucceeds(upload(verified('alice'), 'memberPosts/alice/p2/photo.webp', 'image/webp'));
  });

  test("uploading to someone else's folder is refused", async () => {
    await assertFails(upload(verified('alice'), 'memberPosts/bob/p2/photo.png'));
  });

  test('visitors and unverified members cannot upload', async () => {
    await assertFails(upload(anon(), 'memberPosts/alice/p1/photo.png'));
    await assertFails(upload(unverified('alice'), 'memberPosts/alice/p1/photo.png'));
  });

  test('only images are accepted', async () => {
    await assertFails(uploadString(ref(verified('alice'), 'memberPosts/alice/p1/run.svg'), '<svg/>', 'raw', { contentType: 'image/svg+xml' }));
    await assertFails(uploadString(ref(verified('alice'), 'memberPosts/alice/p1/notes.txt'), 'hi', 'raw', { contentType: 'text/plain' }));
  });

  test('images must be under 5 MB', async () => {
    await assertFails(upload(verified('alice'), 'memberPosts/alice/p1/big.png', 'image/png', new Uint8Array(5 * 1024 * 1024 + 1)));
  });

  test('an image cannot be replaced', async () => {
    await assertFails(upload(verified('bob'), 'memberPosts/bob/p1/photo.png'));
  });

  test('anyone can view a post image', async () => {
    await assertSucceeds(getBytes(ref(anon(), 'memberPosts/bob/p1/photo.png')));
  });

  test('the author and moderators can delete it, others cannot', async () => {
    await assertFails(deleteObject(ref(verified('alice'), 'memberPosts/bob/p1/photo.png')));
    await assertSucceeds(deleteObject(ref(moderator(), 'memberPosts/bob/p1/photo.png')));
  });

  test('the author can delete their own image', async () => {
    await assertSucceeds(deleteObject(ref(verified('bob'), 'memberPosts/bob/p1/photo.png')));
  });

  test('nothing else in Storage is open', async () => {
    await assertFails(upload(verified('alice'), 'avatars/alice.png'));
    await assertFails(getBytes(ref(anon(), 'other/file.png')));
  });
});
