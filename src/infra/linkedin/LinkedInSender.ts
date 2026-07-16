import { readFileSync } from 'fs';
import type { Post } from '../../domain/Post.js';
import type { Sender } from '../../domain/Sender.js';

const API_BASE = 'https://api.linkedin.com'
// LinkedIn only keeps ~12 monthly versions active; override via LINKEDIN_VERSION when this ages out.
const DEFAULT_VERSION = '202606'

/**
 * Publishes to LinkedIn via the versioned Posts API.
 *
 * Flow (LinkedIn best practices for reach):
 *   1. initialize an image upload and PUT the card binary,
 *   2. create the post with the native image and the hook text (no link in body),
 *   3. add the dashboard link as the FIRST COMMENT — LinkedIn deprioritizes posts
 *      whose body contains outbound links, so the link lives in a comment instead.
 *
 * Requires a member access token with the `w_member_social` scope and the author's
 * person URN (e.g. "urn:li:person:xxxx").
 */
export class LinkedInSender implements Sender {
  constructor(
    private readonly accessToken: string,
    private readonly authorUrn: string,
    private readonly apiVersion: string = DEFAULT_VERSION
  ) {}

  async publish(post: Post): Promise<void> {
    const imageUrn = await this.uploadImage(post.imagePath)
    // The dashboard link is part of the post body: member tokens can't comment via
    // the API (403), so the "link in first comment" tactic isn't available here.
    await this.createPost(post.text, imageUrn)
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'LinkedIn-Version': this.apiVersion,
      'X-Restli-Protocol-Version': '2.0.0',
      ...extra,
    }
  }

  private async uploadImage(imagePath: string): Promise<string> {
    const init = await fetch(`${API_BASE}/rest/images?action=initializeUpload`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ initializeUploadRequest: { owner: this.authorUrn } })
    })

    if (!init.ok) throw new Error(`LinkedIn image init failed with status ${init.status}`)

    const initData = await init.json()
    const uploadUrl = initData?.value?.uploadUrl
    const imageUrn = initData?.value?.image

    if (typeof uploadUrl !== 'string' || typeof imageUrn !== 'string') {
      throw new Error('LinkedIn image init response missing uploadUrl or image URN')
    }

    const upload = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: readFileSync(imagePath)
    })

    if (!upload.ok) throw new Error(`LinkedIn image upload failed with status ${upload.status}`)

    return imageUrn
  }

  private async createPost(text: string, imageUrn: string): Promise<void> {
    const response = await fetch(`${API_BASE}/rest/posts`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        author: this.authorUrn,
        commentary: text,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        content: { media: { id: imageUrn, title: 'Weekly Changelog' } },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false
      })
    })

    if (!response.ok) throw new Error(`LinkedIn post creation failed with status ${response.status}`)
  }
}
