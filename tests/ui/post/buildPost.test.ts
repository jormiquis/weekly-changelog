import { describe, it, expect } from 'vitest';
import { Activity } from '../../../src/domain/Activity.js';
import { buildPost } from '../../../src/ui/post/buildPost.js';

const dashboardUrl = 'https://jormiquis.github.io/weekly-changelog/';

function push(repo: string, commits: number) {
  return Activity.create(new Date(), {
    type: 'PushEvent',
    repo: { name: `jormiquis/${repo}` },
    diff: 'https://diff',
    commitMessages: Array.from({ length: commits }, (_, i) => ({ message: `c${i}` })),
    additions: 0,
    deletions: 0,
    files: [],
  });
}

function note(title: string) {
  return Activity.create(new Date(), { source: 'notion', entry_emoji: '📝', tags: [], sources: [], title });
}

const base = { version: 'v2026.W29', dashboardUrl, imagePath: 'docs/card.png' };

describe('buildPost (deterministic, no AI)', () => {
  it('states raw counts of commits across repos and notes taken', () => {
    const post = buildPost({ ...base, activities: [push('weekly-changelog', 5), push('api', 3), note('a'), note('b')] });

    expect(post.text).toContain('📋 Weekly Changelog — v2026.W29');
    expect(post.text).toContain('8 commits across 2 repos (weekly-changelog, api)');
    expect(post.text).toContain('2 notes taken');
  });

  it('never contains AI-style prose, only the facts, link and hashtags', () => {
    const post = buildPost({ ...base, activities: [push('weekly-changelog', 1), note('a')] });

    expect(post.text).toContain(dashboardUrl);
    expect(post.link).toBe(dashboardUrl);
    expect(post.text).toContain('#BuildInPublic');
    expect(post.imagePath).toBe('docs/card.png');
    // the link sits before the hashtags
    expect(post.text.indexOf(dashboardUrl)).toBeLessThan(post.text.indexOf('#BuildInPublic'));
  });

  it('pluralizes singular counts correctly', () => {
    const post = buildPost({ ...base, activities: [push('solo', 1), note('one')] });

    expect(post.text).toContain('1 commit across 1 repo (solo)');
    expect(post.text).toContain('1 note taken');
  });

  it('counts newly created repos', () => {
    const activities = [Activity.create(new Date(), { source: 'github', type: 'CreateEvent', entityCreated: 'repository', repo: 'jormiquis/new', description: 'd' })];
    const post = buildPost({ ...base, activities });

    expect(post.text).toContain('1 new repo created');
  });

  it('falls back to a quiet-week line when there is no activity', () => {
    const post = buildPost({ ...base, activities: [] });

    expect(post.text).toContain('A quiet week — no public activity recorded.');
    expect(post.text).toContain(dashboardUrl);
  });

  it('caps the repo names listed and shows a "+N more"', () => {
    const post = buildPost({ ...base, activities: [push('a', 1), push('b', 1), push('c', 1), push('d', 1), push('e', 1), push('f', 1)] });

    expect(post.text).toContain('(a, b, c, d +2 more)');
  });
});
