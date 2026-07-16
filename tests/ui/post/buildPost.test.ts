import { describe, it, expect } from 'vitest';
import type { SynthesizedDigest } from '../../../src/domain/SynthesizedDigest.js';
import { buildPost } from '../../../src/ui/post/buildPost.js';

const dashboardUrl = 'https://jormiquis.github.io/weekly-changelog/';

const digest: SynthesizedDigest = {
  headline: 'AI digest pipeline shipped',
  summary: 'A resilient synthesis layer with automatic provider fallback landed this week.',
  highlights: [
    { text: 'Mistral + Groq fallback', evidence: [] },
    { text: 'Simplified card', evidence: [] },
    { text: 'Per-repo evaluation', evidence: [] },
    { text: 'A fourth one', evidence: [] },
  ],
  commitEvaluations: []
};

describe('buildPost (LinkedIn best practices)', () => {
  it('uses the digest headline as the hook on the very first line', () => {
    const post = buildPost({ week: 'Week of Jul 15', dashboardUrl, imagePath: 'docs/card.png', digest });

    expect(post.text.split('\n')[0]).toBe('🚀 AI digest pipeline shipped');
  });

  it('never puts the outbound link in the body — it travels in Post.link for the first comment', () => {
    const post = buildPost({ week: 'Week of Jul 15', dashboardUrl, imagePath: 'docs/card.png', digest });

    expect(post.text).not.toContain('http');
    expect(post.text).not.toContain(dashboardUrl);
    expect(post.link).toBe(dashboardUrl);
    expect(post.text.toLowerCase()).toContain('link in the comments');
  });

  it('includes the card as the native image and a small set of hashtags', () => {
    const post = buildPost({ week: 'Week of Jul 15', dashboardUrl, imagePath: 'docs/card.png', digest });

    expect(post.imagePath).toBe('docs/card.png');
    expect(post.text).toContain('#BuildInPublic');
    expect(post.text).toContain('#SoftwareEngineering');
  });

  it('caps the highlights shown in the body to keep the post scannable', () => {
    const post = buildPost({ week: 'Week of Jul 15', dashboardUrl, imagePath: 'docs/card.png', digest });

    const bullets = post.text.split('\n').filter(line => line.startsWith('↳'));
    expect(bullets).toHaveLength(3);
    expect(bullets).not.toContain('↳ A fourth one');
  });

  it('falls back to a week-based hook when no digest is available', () => {
    const post = buildPost({ week: 'Week of Jul 15', dashboardUrl, imagePath: 'docs/card.png' });

    expect(post.text.split('\n')[0]).toBe('🚀 Weekly Changelog — Week of Jul 15');
    expect(post.text).not.toContain('http');
    expect(post.link).toBe(dashboardUrl);
    expect(post.text).toContain('#WeeklyChangelog');
  });
});
