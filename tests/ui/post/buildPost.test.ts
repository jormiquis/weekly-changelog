import { describe, it, expect } from 'vitest';
import { buildPost } from '../../../src/ui/post/buildPost.js';

const dashboardUrl = 'https://jormiquis.github.io/weekly-changelog/';
const base = { version: 'v2026.W29', dashboardUrl, imagePath: 'docs/card.png', activities: [] };

describe('buildPost (deterministic, no AI)', () => {
  it('renders a hook, the dashboard label above the link, and hashtags', () => {
    const post = buildPost(base);

    expect(post.text).toContain('📋 Weekly personal work diary — v2026.W29');
    expect(post.text).toContain('Detailed dashboard');
    expect(post.text).toContain(dashboardUrl);
    expect(post.text).toContain('#BuildInPublic');
    expect(post.imagePath).toBe('docs/card.png');
    expect(post.link).toBe(dashboardUrl);
  });

  it('puts the dashboard label immediately before the link, and the link before the hashtags', () => {
    const post = buildPost(base);

    expect(post.text.indexOf('Detailed dashboard')).toBeLessThan(post.text.indexOf(dashboardUrl));
    expect(post.text.indexOf(dashboardUrl)).toBeLessThan(post.text.indexOf('#BuildInPublic'));
  });
});
