import { describe, it, expect } from 'vitest';
import { Activity } from '../../../src/domain/Activity.js';
import type { SynthesizedDigest } from '../../../src/domain/SynthesizedDigest.js';
import { buildDashboardData } from '../../../src/ui/dashboard/toDashboardData.js';

describe('buildDashboardData with an AI digest', () => {
  const activities = [
    Activity.create(new Date(), {
      type: 'PushEvent',
      repo: { name: 'jormiquis/weekly-changelog' },
      diff: 'https://diff',
      commitMessages: [{ message: 'feat: ship it' }]
    })
  ];

  const digest: SynthesizedDigest = {
    headline: 'A focused week on the changelog',
    summary: 'Steady progress shipping the AI digest feature end to end.',
    highlights: ['Digest feature shipped', 'Fallback provider added'],
    commitEvaluations: [{ repo: 'weekly-changelog', evaluation: 'Ships the AI digest end to end.' }]
  };

  it('carries the digest through for the dashboard hero section', () => {
    const dashboardData = buildDashboardData(activities, { week: 'Week of Jul 15', digest });

    expect(dashboardData.digest).toEqual(digest);
  });

  it('attaches the matching commit evaluation to its repo', () => {
    const dashboardData = buildDashboardData(activities, { week: 'Week of Jul 15', digest });

    expect(dashboardData.repos[0]!.evaluation).toBe('Ships the AI digest end to end.');
  });

  it('leaves the repo evaluation unset when the digest has no entry for it', () => {
    const digestWithoutMatch: SynthesizedDigest = { ...digest, commitEvaluations: [{ repo: 'some-other-repo', evaluation: 'Unrelated.' }] };
    const dashboardData = buildDashboardData(activities, { week: 'Week of Jul 15', digest: digestWithoutMatch });

    expect(dashboardData.repos[0]!.evaluation).toBeUndefined();
  });

  it('leaves digest undefined when none was produced, so the hero section is skipped', () => {
    const dashboardData = buildDashboardData(activities, { week: 'Week of Jul 15' });

    expect(dashboardData.digest).toBeUndefined();
    expect(dashboardData.repos[0]!.evaluation).toBeUndefined();
  });
});
