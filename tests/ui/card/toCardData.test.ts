import { describe, it, expect } from 'vitest';
import { Activity } from '../../../src/domain/Activity.js';
import { buildCardData } from '../../../src/ui/card/toCardData.js';

describe('buildCardData', () => {
  it('builds one highlight per event type, each with a distinct emoji and accent color, no AI involved', () => {
    const activities = [
      Activity.create(new Date(), {
        type: 'PushEvent',
        repo: { name: 'jormiquis/weekly-changelog' },
        diff: 'https://diff',
        commitMessages: [{ message: 'feat: ship it' }, { message: 'fix: typo' }]
      }),
      Activity.create(new Date(), {
        source: 'github',
        type: 'CreateEvent',
        entityCreated: 'repository',
        repo: 'jormiquis/new-project',
        description: 'A new side project'
      }),
      Activity.create(new Date(), {
        source: 'notion',
        entry_emoji: '📝',
        tags: ['Documentation'],
        sources: ['https://example.com'],
        title: 'A note'
      })
    ];

    const cardData = buildCardData(activities, { week: 'Week of Jul 15' });

    expect(cardData.highlights).toEqual([
      { emoji: '💻', accent: '#3987e5', text: '2 commits in weekly-changelog' },
      { emoji: '🆕', accent: '#008300', text: 'New repo: new-project' },
      { emoji: '📝', accent: '#d55181', text: 'A note' }
    ]);
  });

  it('adds one highlight per note, using its title', () => {
    const activities = [
      Activity.create(new Date(), { source: 'notion', entry_emoji: '📝', tags: [], sources: [], title: 'First note' }),
      Activity.create(new Date(), { source: 'notion', entry_emoji: '💡', tags: [], sources: [], title: 'Second note' })
    ];

    const cardData = buildCardData(activities, { week: 'Week of Jul 15' });

    expect(cardData.highlights).toEqual([
      { emoji: '📝', accent: '#d55181', text: 'First note' },
      { emoji: '📝', accent: '#d55181', text: 'Second note' }
    ]);
  });

  it('aggregates commit counts per repo, not per push', () => {
    const activities = [
      Activity.create(new Date(), { type: 'PushEvent', repo: { name: 'jormiquis/repo-a' }, diff: 'https://diff', commitMessages: [{ message: 'a' }] }),
      Activity.create(new Date(), { type: 'PushEvent', repo: { name: 'jormiquis/repo-a' }, diff: 'https://diff', commitMessages: [{ message: 'b' }, { message: 'c' }] })
    ];

    const cardData = buildCardData(activities, { week: 'Week of Jul 15' });

    expect(cardData.highlights).toEqual([{ emoji: '💻', accent: '#3987e5', text: '3 commits in repo-a' }]);
  });

  it('produces no highlights when there is no activity', () => {
    const cardData = buildCardData([], { week: 'Week of Jul 15' });

    expect(cardData.highlights).toEqual([]);
  });
});
