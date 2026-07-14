import type { Activity } from '../../domain/Activity.js';
import { isPushEvent, isCreateRepoEvent, isNotionEntry } from '../../domain/ActivityMeta.js';
import type { DashboardCreatedRepo, DashboardData, DashboardNote, DashboardRepo } from './DashboardData.js';

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export interface BuildDashboardDataOptions {
  week: string
}

export function buildDashboardData(activities: Activity[], options: BuildDashboardDataOptions): DashboardData {
  interface PendingPush {
    diffUrl: string
    commits: string[]
  }

  const repoPushes = new Map<string, { url: string; pushes: PendingPush[] }>();

  for (const activity of activities) {
    const meta = activity.metaData;
    if (!isPushEvent(meta)) continue;

    const fullName = meta.repo.name;
    if (!repoPushes.has(fullName)) {
      repoPushes.set(fullName, { url: `https://github.com/${fullName}`, pushes: [] });
    }
    repoPushes.get(fullName)!.pushes.push({
      diffUrl: meta.diff,
      commits: meta.commitMessages.map(commit => (commit.message.split('\n')[0] ?? commit.message).trim())
    });
  }

  const repos: DashboardRepo[] = [...repoPushes.entries()]
    .map(([fullName, { url, pushes }]) => ({
      name: repoShortName(fullName),
      url,
      totalCommits: pushes.reduce((sum, push) => sum + push.commits.length, 0),
      pushes
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const createdRepos: DashboardCreatedRepo[] = activities
    .map(activity => activity.metaData)
    .filter(isCreateRepoEvent)
    .map(meta => ({
      name: repoShortName(meta.repo),
      url: `https://github.com/${meta.repo}`,
      description: meta.description
    }));

  const notes: DashboardNote[] = activities
    .map(activity => activity.metaData)
    .filter(isNotionEntry)
    .map(meta => ({
      emoji: meta.entry_emoji || '📝',
      title: meta.title,
      tags: meta.tags,
      sources: meta.sources
    }));

  return {
    week: options.week,
    generatedAt: formatGeneratedAt(new Date()),
    repos,
    createdRepos,
    notes
  }
}
