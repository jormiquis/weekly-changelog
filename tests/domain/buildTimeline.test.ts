import { describe, it, expect } from 'vitest';
import { Activity } from '../../src/domain/Activity.js';
import { buildTimeline } from '../../src/domain/buildTimeline.js';

describe('buildTimeline', () => {
  it('produces typed events with metadata, most recent first', () => {
    const activities = [
      Activity.create(new Date('2026-07-13T10:00:00Z'), {
        type: 'PushEvent', repo: { name: 'jormiquis/repo-a' }, diff: 'https://d',
        commitMessages: [{ message: 'feat: a' }, { message: 'fix: b' }], additions: 40, deletions: 10, files: [],
      }),
      Activity.create(new Date('2026-07-15T09:00:00Z'), {
        source: 'notion', entry_emoji: '📝', tags: ['DDD'], sources: [], title: 'A note',
      }),
      Activity.create(new Date('2026-07-14T08:00:00Z'), {
        source: 'github', type: 'CreateEvent', entityCreated: 'repository', repo: 'jormiquis/new', description: 'A new repo',
      }),
    ];

    const timeline = buildTimeline(activities);

    expect(timeline.map(e => e.type)).toEqual(['note', 'repo', 'push']);
    expect(timeline[0]).toMatchObject({ type: 'note', title: 'A note', meta: 'DDD' });
    expect(timeline[1]).toMatchObject({ type: 'repo', title: 'Created new' });
    expect(timeline[2]!.meta).toBe('2 commits · +40 −10');
  });

  it('includes pull request events, labelling opened vs merged', () => {
    const activities = [
      Activity.create(new Date('2026-07-15T09:00:00Z'), {
        source: 'github', type: 'PullRequestEvent', state: 'merged', repo: 'vercel/next.js', number: 42, title: 'Fix flaky test', url: 'https://github.com/vercel/next.js/pull/42',
      }),
      Activity.create(new Date('2026-07-14T09:00:00Z'), {
        source: 'github', type: 'PullRequestEvent', state: 'opened', repo: 'facebook/react', number: 7, title: 'Docs typo', url: 'https://github.com/facebook/react/pull/7',
      }),
    ];

    const timeline = buildTimeline(activities);

    expect(timeline[0]).toMatchObject({ type: 'pr', title: 'Merged PR in next.js', meta: '#42 · Fix flaky test' });
    expect(timeline[1]).toMatchObject({ type: 'pr', title: 'Opened PR in react', meta: '#7 · Docs typo' });
  });

  it('includes fork events with the upstream repo as metadata', () => {
    const activities = [
      Activity.create(new Date('2026-07-15T09:00:00Z'), {
        source: 'github', type: 'ForkEvent', sourceRepo: 'vercel/next.js', fork: 'jormiquis/next.js', forkUrl: 'https://github.com/jormiquis/next.js',
      }),
    ];

    const timeline = buildTimeline(activities);

    expect(timeline[0]).toMatchObject({ type: 'fork', title: 'Forked next.js', meta: 'from vercel/next.js' });
  });
});
