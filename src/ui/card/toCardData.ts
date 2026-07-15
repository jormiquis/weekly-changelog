import type { Activity } from '../../domain/Activity.js';
import { isPushEvent, isCreateRepoEvent, isNotionEntry } from '../../domain/ActivityMeta.js';
import type { CardData, CardSection } from './CardData.js';

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

export interface BuildCardDataOptions {
  week: string
}

export function buildCardData(activities: Activity[], options: BuildCardDataOptions): CardData {
  const pushEvents = activities.map(a => a.metaData).filter(isPushEvent)
  const createEvents = activities.map(a => a.metaData).filter(isCreateRepoEvent)
  const notionEntries = activities.map(a => a.metaData).filter(isNotionEntry)

  const sections: CardSection[] = [];

  if (pushEvents.length > 0) {
    const commitsByRepo = new Map<string, number>();
    for (const event of pushEvents) {
      const repoName = repoShortName(event.repo.name);
      commitsByRepo.set(repoName, (commitsByRepo.get(repoName) ?? 0) + event.commitMessages.length);
    }
    const repos = [...commitsByRepo.entries()].map(([name, commits]) => ({ name, commits }));
    const totalCommits = repos.reduce((sum, repo) => sum + repo.commits, 0);

    sections.push({
      accent: '#3987e5',
      title: 'Work on personal repos',
      subtitle: `${totalCommits} commit${totalCommits === 1 ? '' : 's'} across ${repos.length} repo${repos.length === 1 ? '' : 's'}`,
      repos
    })
  }

  if (createEvents.length > 0) {
    const repoNames = createEvents.map(event => repoShortName(event.repo))

    sections.push({
      accent: '#008300',
      title: 'New repos created',
      subtitle: repoNames.join(', '),
      stats: [{ value: createEvents.length, label: 'repos' }]
    })
  }

  if (notionEntries.length > 0) {
    const notes = notionEntries.map(entry => ({
      emoji: entry.entry_emoji || '📝',
      title: entry.title,
      tags: entry.tags
    }))

    sections.push({
      accent: '#d55181',
      title: 'Knowledge gained',
      subtitle: `${notes.length} note${notes.length > 1 ? 's' : ''} added`,
      notes
    })
  }

  return { week: options.week, sections }
}
