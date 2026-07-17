import { describe, it, expect } from 'vitest';
import { Activity } from '../../../src/domain/Activity.js';
import type { SynthesizedDigest } from '../../../src/domain/SynthesizedDigest.js';
import { buildCardData } from '../../../src/ui/card/toCardData.js';

function push(repo: string, messages: string[], additions = 0, deletions = 0, files = [{ filename: 'src/main.ts', additions: 0, deletions: 0 }]) {
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

function note(title: string) {
  return Activity.create(new Date(), { source: 'notion', entry_emoji: '📝', tags: [], sources: [], title });
}

const digest: SynthesizedDigest = {
  headline: 'A focused week',
  summary: 'Steady progress across a few repositories.',
  repos: [
    { repo: 'app', summary: 'New login flow and dropdown fix' },
    { repo: 'api', summary: 'Users endpoint added' },
  ],
  notes: [
    { title: 'Ports & adapters', summary: 'Boundaries between domain and infra' },
  ],
};

describe('buildCardData (AI-driven, grouped by repo and note)', () => {
  it('builds "shipped" bullets from the AI digest, one per repository', () => {
    const activities = [push('app', ['feat: add login button']), push('api', ['feat: add users endpoint'])];

    const card = buildCardData(activities, { week: 'Week of Jul 15', digest });

    expect(card.shipped).toEqual([
      'app — New login flow and dropdown fix',
      'api — Users endpoint added',
    ]);
  });

  it('builds "learned" bullets from the AI per-note summaries', () => {
    const activities = [note('Ports & adapters')];

    const card = buildCardData(activities, { week: 'Week of Jul 15', digest });

    expect(card.learned).toEqual(['Ports & adapters — Boundaries between domain and infra']);
  });

  it('falls back to raw note titles for "learned" when no digest was produced', () => {
    const activities = [note('Ports & adapters'), note('Free-tier LLMs')];

    const card = buildCardData(activities, { week: 'Week of Jul 15' });

    expect(card.learned).toEqual(['Ports & adapters', 'Free-tier LLMs']);
  });

  it('leaves "shipped" empty when no digest was produced', () => {
    const activities = [push('app', ['feat: add login button'])];

    const card = buildCardData(activities, { week: 'Week of Jul 15' });

    expect(card.shipped).toEqual([]);
  });

  it('computes raw stats: commits, notes, lines changed, and repos', () => {
    const activities = [
      push('repo-a', ['feat: a', 'fix: b'], 100, 20),
      push('repo-b', ['feat: c'], 30, 10),
      note('A note'),
    ];

    const card = buildCardData(activities, { week: 'Week of Jul 15', version: 'v2026.W29' });

    expect(card.version).toBe('v2026.W29');
    expect(card.stats).toEqual({ commits: 3, notes: 1, linesChanged: 160, repos: 2 });
  });

  it('produces empty bullet lists and zeroed stats when there is no activity', () => {
    const card = buildCardData([], { week: 'Week of Jul 15' });

    expect(card.shipped).toEqual([]);
    expect(card.learned).toEqual([]);
    expect(card.stats).toEqual({ commits: 0, notes: 0, linesChanged: 0, repos: 0 });
  });
});
