import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import type { Post } from '../../../src/domain/Post.js';
import type { Sender } from '../../../src/domain/Sender.js';
import { LinkedInSender } from '../../../src/infra/linkedin/LinkedInSender.js';

describe('LinkedInSender', () => {
  const imagePath = '/tmp/linkedin-sender-test-card.png';
  const authorUrn = 'urn:li:person:abc123';
  const link = 'https://jormiquis.github.io/weekly-changelog/';

  const post: Post = {
    text: '🚀 AI digest pipeline shipped\n\nSummary.\n\nFull weekly breakdown 👇 (link in the comments)\n\n#BuildInPublic',
    imagePath,
    link
  };

  beforeEach(() => {
    writeFileSync(imagePath, Buffer.from('fake-png-bytes'));
  });

  afterEach(() => {
    unlinkSync(imagePath);
    vi.unstubAllGlobals();
  });

  function stubLinkedInFetch() {
    return vi.fn().mockImplementation(async (url: string, options: any) => {
      if (url.includes('/rest/images?action=initializeUpload')) {
        return { ok: true, json: async () => ({ value: { uploadUrl: 'https://upload.linkedin.com/xyz', image: 'urn:li:image:IMG1' } }) };
      }
      if (url === 'https://upload.linkedin.com/xyz') {
        return { ok: true };
      }
      if (url.endsWith('/rest/posts')) {
        return { ok: true, headers: new Headers({ 'x-restli-id': 'urn:li:share:POST1' }) };
      }
      if (url.includes('/rest/socialActions/')) {
        return { ok: true };
      }
      throw new Error(`unexpected url ${url} ${options?.method}`);
    });
  }

  it('uploads the card, creates the post with the image, and puts the link in the first comment', async () => {
    const fetchMock = stubLinkedInFetch();
    vi.stubGlobal('fetch', fetchMock);

    const sender: Sender = new LinkedInSender('token', authorUrn);
    await sender.publish(post);

    const calls = fetchMock.mock.calls;
    expect(calls).toHaveLength(4);

    // 1) initialize upload with the author as owner
    expect(calls[0]![0]).toContain('/rest/images?action=initializeUpload');
    expect(JSON.parse(calls[0]![1].body).initializeUploadRequest.owner).toBe(authorUrn);

    // 2) binary uploaded to the returned uploadUrl
    expect(calls[1]![0]).toBe('https://upload.linkedin.com/xyz');
    expect(calls[1]![1].method).toBe('PUT');

    // 3) post created with the returned image URN and the hook text (no link)
    expect(calls[2]![0]).toContain('/rest/posts');
    const postBody = JSON.parse(calls[2]![1].body);
    expect(postBody.content.media.id).toBe('urn:li:image:IMG1');
    expect(postBody.commentary).toBe(post.text);
    expect(postBody.commentary).not.toContain(link);
    expect(postBody.visibility).toBe('PUBLIC');

    // 4) link posted as the first comment on the created post
    expect(calls[3]![0]).toContain('/rest/socialActions/');
    expect(calls[3]![0]).toContain(encodeURIComponent('urn:li:share:POST1'));
    const commentBody = JSON.parse(calls[3]![1].body);
    expect(commentBody.actor).toBe(authorUrn);
    expect(commentBody.message.text).toContain(link);
  });

  it('sends the versioned LinkedIn API headers on the create-post call', async () => {
    const fetchMock = stubLinkedInFetch();
    vi.stubGlobal('fetch', fetchMock);

    await new LinkedInSender('token', authorUrn, '202405').publish(post);

    const postHeaders = fetchMock.mock.calls[2]![1].headers;
    expect(postHeaders.Authorization).toBe('Bearer token');
    expect(postHeaders['LinkedIn-Version']).toBe('202405');
    expect(postHeaders['X-Restli-Protocol-Version']).toBe('2.0.0');
  });

  it('throws if the image upload cannot be initialized (e.g. invalid token)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await expect(new LinkedInSender('bad-token', authorUrn).publish(post)).rejects.toThrow('401');
  });

  it('does not create the post if the image upload fails', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('initializeUpload')) {
        return { ok: true, json: async () => ({ value: { uploadUrl: 'https://upload.linkedin.com/xyz', image: 'urn:li:image:IMG1' } }) };
      }
      if (url === 'https://upload.linkedin.com/xyz') {
        return { ok: false, status: 500 };
      }
      throw new Error(`should not reach ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(new LinkedInSender('token', authorUrn).publish(post)).rejects.toThrow('500');
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/rest/posts'))).toBe(false);
  });
});
