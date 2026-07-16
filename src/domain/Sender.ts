import type { Post } from './Post.js';

export interface Sender {
  publish(post: Post): Promise<void>
}
