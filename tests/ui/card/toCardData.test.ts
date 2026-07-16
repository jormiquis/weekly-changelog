import { describe, it, expect } from 'vitest';
import { Activity } from '../../../src/domain/Activity.js';
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

describe('buildCardData (product changelog, no AI)', () => {
  it('turns commits into generic, context-free "shipped" bullets by type and area', () => {
    const activities = [
      push('app', ['feat: add login button', 'fix: dropdown glitch'], 0, 0, [{ filename: 'src/ui/Button.tsx', additions: 10, deletions: 0 }]),
      push('api', ['feat: add users endpoint'], 0, 0, [{ filename: 'src/api/users.py', additions: 20, deletions: 0 }]),
      push('core', ['refactor: tidy the mapper', 'chore: bump deps'], 0, 0, [{ filename: 'src/domain/mapper.ts', additions: 5, deletions: 5 }]),
    ];

    const card = buildCardData(activities, { week: 'Week of Jul 15' });

    // Generic phrases, de-duplicated and ranked (feat before fix/refactor/chore).
    expect(card.shipped).toEqual([
      'Created a visual component',
      'New backend development',
      'Fixed UI issues',
      'Refactored code',
      'Tooling & maintenance',
    ]);
  });

  it('never emits the literal commit subject', () => {
    const activities = [push('app', ['feat: add a very specific thing nobody else needs to know'])];

    const card = buildCardData(activities, { week: 'Week of Jul 15' });

    expect(card.shipped.join(' ')).not.toContain('specific thing');
  });

  it('uses Notion note titles as "learned" bullets', () => {
    const activities = [
      Activity.create(new Date(), { source: 'notion', entry_emoji: '📝', tags: [], sources: [], title: 'Ports & adapters' }),
      Activity.create(new Date(), { source: 'notion', entry_emoji: '💡', tags: [], sources: [], title: 'Free-tier LLMs' }),
    ];

    const card = buildCardData(activities, { week: 'Week of Jul 15' });

    expect(card.learned).toEqual(['Ports & adapters', 'Free-tier LLMs']);
  });

  it('computes raw stats: commits, notes, lines changed, and repos', () => {
    const activities = [
      push('repo-a', ['feat: a', 'fix: b'], 100, 20),
      push('repo-b', ['feat: c'], 30, 10),
      Activity.create(new Date(), { source: 'notion', entry_emoji: '📝', tags: [], sources: [], title: 'A note' }),
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
