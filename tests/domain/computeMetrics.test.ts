import { describe, it, expect } from 'vitest';
import { Activity } from '../../src/domain/Activity.js';
import { computeMetrics } from '../../src/domain/computeMetrics.js';

function push(repo: string, messages: string[], files: { filename: string; additions: number; deletions: number }[]) {
  const additions = files.reduce((s, f) => s + f.additions, 0);
  const deletions = files.reduce((s, f) => s + f.deletions, 0);
  return Activity.create(new Date(), {
    type: 'PushEvent',
    repo: { name: `jormiquis/${repo}` },
    diff: 'https://diff',
    commitMessages: messages.map(message => ({ message })),
    additions,
    deletions,
    files,
  });
}

describe('computeMetrics', () => {
  const activities = [
    push('repo-a', ['feat: a', 'fix: b', 'test: c', 'refactor: d', 'docs: e', 'wip messy'], [
      { filename: 'src/a.ts', additions: 40, deletions: 10 },
      { filename: 'src/b.py', additions: 20, deletions: 5 },
    ]),
    push('repo-b', ['feat: f'], [{ filename: 'README.md', additions: 10, deletions: 0 }]),
    Activity.create(new Date(), { source: 'notion', entry_emoji: '📝', tags: [], sources: [], title: 'note' }),
    Activity.create(new Date(), { source: 'github', type: 'CreateEvent', entityCreated: 'repository', repo: 'jormiquis/new', description: 'd' }),
  ];

  const metrics = computeMetrics(activities);

  it('counts commits, repos, notes and new repos', () => {
    expect(metrics.totalCommits).toBe(7);
    expect(metrics.repositories).toBe(2);
    expect(metrics.notesTaken).toBe(1);
    expect(metrics.newRepos).toBe(1);
  });

  it('treats conventional-format commits as atomic', () => {
    // 6 of 7 messages are conventional ("wip messy" is not).
    expect(metrics.atomicCommitRatio).toBeCloseTo(6 / 7, 5);
  });

  it('averages the commit size across all commits', () => {
    // (40+10 + 20+5 + 10+0) = 85 lines over 7 commits ≈ 12.
    expect(metrics.averageCommitSize).toBe(Math.round(85 / 7));
  });

  it('derives type ratios from conventional prefixes', () => {
    expect(metrics.testRatio).toBeCloseTo(1 / 7, 5);
    expect(metrics.refactorRatio).toBeCloseTo(1 / 7, 5);
    expect(metrics.documentationRatio).toBeCloseTo(1 / 7, 5);
  });

  it('ranks languages by files touched', () => {
    expect(metrics.languages[0]).toEqual({ language: 'TypeScript', files: 1 });
    expect(metrics.languages.map(l => l.language)).toContain('Python');
    expect(metrics.languages.map(l => l.language)).toContain('Markdown');
  });

  it('returns zeroed ratios with no activity', () => {
    const empty = computeMetrics([]);
    expect(empty.totalCommits).toBe(0);
    expect(empty.atomicCommitRatio).toBe(0);
    expect(empty.averageCommitSize).toBe(0);
  });
});
