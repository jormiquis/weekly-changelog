import type { Activity } from '../../domain/Activity.js';
import type { CardData, CardSection } from './CardData.js';

interface PushEventMeta {
  [key: string]: unknown
  type: 'PushEvent'
  repo: { name: string }
  commitMessages: { message: string }[]
}

interface CreateRepoEventMeta {
  [key: string]: unknown
  source: 'github'
  type: 'CreateEvent'
  entityCreated: 'repository'
  repo: string
  description: string
}

interface NotionEntryMeta {
  [key: string]: unknown
  source: 'notion'
  entry_emoji?: string
  tags: string[]
  title: string
}

function isPushEvent(metaData: Record<string, unknown>): metaData is PushEventMeta {
  return metaData.type === 'PushEvent'
}

function isCreateRepoEvent(metaData: Record<string, unknown>): metaData is CreateRepoEventMeta {
  return metaData.type === 'CreateEvent' && metaData.entityCreated === 'repository'
}

function isNotionEntry(metaData: Record<string, unknown>): metaData is NotionEntryMeta {
  return metaData.source === 'notion'
}

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
      accent: '#2dd4bf',
      title: 'Work on personal repos',
      subtitle: `${totalCommits} commit${totalCommits === 1 ? '' : 's'} across ${repos.length} repo${repos.length === 1 ? '' : 's'}`,
      repos
    })
  }

  if (createEvents.length > 0) {
    const repoNames = createEvents.map(event => repoShortName(event.repo))

    sections.push({
      accent: '#f472b6',
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
      accent: '#fbbf24',
      title: 'Knowledge gained',
      subtitle: `${notes.length} note${notes.length > 1 ? 's' : ''} added`,
      notes
    })
  }

  return { week: options.week, sections }
}
