import { describe, it, expect } from 'vitest';
import { Activity } from '../../../src/domain/Activity.js';
import type { SynthesizedDigest } from '../../../src/domain/SynthesizedDigest.js';
import { buildDashboardData } from '../../../src/ui/dashboard/toDashboardData.js';

function push(repo: string, messages: string[], additions: number, deletions: number, when = new Date()) {
  return Activity.create(when, {
    type: 'PushEvent',
    repo: { name: `jormiquis/${repo}` },
    diff: 'https://diff',
    commitMessages: messages.map(message => ({ message })),
    additions,
    deletions,
    files: [{ filename: 'src/main.ts', additions, deletions }],
  });
}

const digest: SynthesizedDigest = {
  headline: 'A focused week on the changelog',
  summary: 'Steady progress shipping the AI digest feature end to end.',
  repos: [{ repo: 'weekly-changelog', summary: 'Ships the AI digest end to end.' }],
  notes: [{ title: 'Ports & adapters', summary: 'Boundaries between domain and infra.' }],
};

describe('buildDashboardData', () => {
  const activities = [push('weekly-changelog', ['feat: ship it'], 120, 30)];

  it('exposes the digest hero as headline and summary', () => {
    const dashboard = buildDashboardData(activities, { week: 'Week of Jul 15', digest });

    expect(dashboard.digest).toEqual({
      headline: digest.headline,
      summary: digest.summary,
    });
  });

  it('attaches the matching per-repo summary and diff stats to its repo', () => {
    const dashboard = buildDashboardData(activities, { week: 'Week of Jul 15', digest });

    const repo = dashboard.repos[0]!;
    expect(repo.evaluation).toBe('Ships the AI digest end to end.');
    expect(repo.additions).toBe(120);
    expect(repo.deletions).toBe(30);
  });

  it('attaches the matching per-note summary to its note', () => {
    const withNote = [
      ...activities,
      Activity.create(new Date(), { source: 'notion', entry_emoji: '📝', tags: [], sources: [], title: 'Ports & adapters' }),
    ];

    const dashboard = buildDashboardData(withNote, { week: 'Week of Jul 15', digest });

    expect(dashboard.notes[0]!.summary).toBe('Boundaries between domain and infra.');
  });

  it('builds a timeline and computes metrics from the activities', () => {
    const dashboard = buildDashboardData(activities, { week: 'Week of Jul 15', digest });

    expect(dashboard.timeline).toHaveLength(1);
    expect(dashboard.timeline[0]!.type).toBe('push');
    expect(dashboard.metrics.totalCommits).toBe(1);
    expect(dashboard.metrics.repositories).toBe(1);
  });

  it('leaves digest undefined and repo evaluation unset when no digest was produced', () => {
    const dashboard = buildDashboardData(activities, { week: 'Week of Jul 15' });

    expect(dashboard.digest).toBeUndefined();
    expect(dashboard.repos[0]!.evaluation).toBeUndefined();
  });

  it('surfaces pull requests to third-party repos as their own dashboard section', () => {
    const withPr = [
      ...activities,
      Activity.create(new Date(), { source: 'github', type: 'PullRequestEvent', state: 'merged', repo: 'vercel/next.js', number: 42, title: 'Fix flaky test', url: 'https://github.com/vercel/next.js/pull/42' }),
    ];

    const dashboard = buildDashboardData(withPr, { week: 'Week of Jul 15' });

    expect(dashboard.pullRequests).toEqual([
      { state: 'merged', repo: 'vercel/next.js', number: 42, title: 'Fix flaky test', url: 'https://github.com/vercel/next.js/pull/42' },
    ]);
  });

  it('surfaces fork events as their own dashboard section', () => {
    const withFork = [
      ...activities,
      Activity.create(new Date(), { source: 'github', type: 'ForkEvent', sourceRepo: 'vercel/next.js', fork: 'jormiquis/next.js', forkUrl: 'https://github.com/jormiquis/next.js' }),
    ];

    const dashboard = buildDashboardData(withFork, { week: 'Week of Jul 15' });

    expect(dashboard.forks).toEqual([
      { name: 'next.js', url: 'https://github.com/jormiquis/next.js', from: 'vercel/next.js' },
    ]);
  });
});
