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
  highlights: [{ text: 'Digest feature shipped', evidence: ['feat: ship it'] }],
  commitEvaluations: [{ repo: 'weekly-changelog', evaluation: 'Ships the AI digest end to end.' }],
};

describe('buildDashboardData', () => {
  const activities = [push('weekly-changelog', ['feat: ship it'], 120, 30)];

  it('exposes the digest hero as headline, summary and evidence-backed highlights', () => {
    const dashboard = buildDashboardData(activities, { week: 'Week of Jul 15', digest });

    expect(dashboard.digest).toEqual({
      headline: digest.headline,
      summary: digest.summary,
      highlights: [{ text: 'Digest feature shipped', evidence: ['feat: ship it'] }],
    });
  });

  it('attaches the matching commit evaluation and diff stats to its repo', () => {
    const dashboard = buildDashboardData(activities, { week: 'Week of Jul 15', digest });

    const repo = dashboard.repos[0]!;
    expect(repo.evaluation).toBe('Ships the AI digest end to end.');
    expect(repo.additions).toBe(120);
    expect(repo.deletions).toBe(30);
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
});
