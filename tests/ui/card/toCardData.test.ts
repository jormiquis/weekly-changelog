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
  workedOn: [
    'New login flow and dropdown fix in the web app',
    'Users endpoint added to the API',
  ],
  highlights: [
    { title: 'Ports & adapters boundary', repo: 'app', code: 'interface Sender {}', language: 'typescript' },
    { title: 'Provider fallback chain', repo: 'api', code: 'class Fallback {}', language: 'typescript', diagram: 'flowchart LR\n A --> B' },
  ],
  repos: [
    { repo: 'app', summary: 'New login flow and dropdown fix' },
    { repo: 'api', summary: 'Users endpoint added' },
  ],
  notes: [
    { title: 'Ports & adapters', summary: 'Boundaries between domain and infra' },
  ],
};

describe('buildCardData', () => {
  it('builds "workedOn" bullets from the AI digest', () => {
    const activities = [push('app', ['feat: add login button']), push('api', ['feat: add users endpoint'])];

    const card = buildCardData(activities, { week: 'Week of Jul 15', digest });

    expect(card.workedOn).toEqual([
      'New login flow and dropdown fix in the web app',
      'Users endpoint added to the API',
    ]);
  });

  it('builds "decisions" bullets from the AI highlights, appending the repo for context', () => {
    const card = buildCardData([], { week: 'Week of Jul 15', digest });

    expect(card.decisions).toEqual([
      'Ports & adapters boundary · app',
      'Provider fallback chain · api',
    ]);
  });

  it('builds "learnings" from raw note titles, without AI, even when a digest exists', () => {
    const activities = [note('Ports & adapters'), note('Free-tier LLMs')];

    const card = buildCardData(activities, { week: 'Week of Jul 15', digest });

    expect(card.learnings).toEqual(['Ports & adapters', 'Free-tier LLMs']);
  });

  it('caps each topic at two bullets', () => {
    const wideDigest: SynthesizedDigest = {
      ...digest,
      workedOn: ['a', 'b', 'c'],
      highlights: [
        { title: 'd', repo: 'app', code: 'x', language: 'ts' },
        { title: 'e', repo: 'app', code: 'x', language: 'ts' },
        { title: 'f', repo: 'app', code: 'x', language: 'ts' },
      ],
    };
    const activities = [note('n1'), note('n2'), note('n3')];

    const card = buildCardData(activities, { week: 'Week of Jul 15', digest: wideDigest });

    expect(card.workedOn).toEqual(['a', 'b']);
    expect(card.decisions).toEqual(['d · app', 'e · app']);
    expect(card.learnings).toEqual(['n1', 'n2']);
  });

  it('leaves AI-driven topics empty when no digest was produced', () => {
    const activities = [push('app', ['feat: add login button']), note('A note')];

    const card = buildCardData(activities, { week: 'Week of Jul 15' });

    expect(card.workedOn).toEqual([]);
    expect(card.decisions).toEqual([]);
    // Learnings never depend on the digest.
    expect(card.learnings).toEqual(['A note']);
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

    expect(card.workedOn).toEqual([]);
    expect(card.decisions).toEqual([]);
    expect(card.learnings).toEqual([]);
    expect(card.stats).toEqual({ commits: 0, notes: 0, linesChanged: 0, repos: 0 });
  });
});
