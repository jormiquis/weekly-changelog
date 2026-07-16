import type { Activity } from '../../domain/Activity.js';
import { isPushEvent } from '../../domain/ActivityMeta.js';
import { computeMetrics } from '../../domain/computeMetrics.js';
import type { Post } from '../../domain/Post.js';

const HASHTAGS = '#BuildInPublic #SoftwareEngineering #DevCommunity #WeeklyChangelog'
const MAX_REPO_NAMES = 4

export interface BuildPostOptions {
  version: string
  dashboardUrl: string
  imagePath: string
  activities: Activity[]
}

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

function repoNames(activities: Activity[]): string[] {
  const names = new Set<string>();
  for (const meta of activities.map(a => a.metaData).filter(isPushEvent)) {
    names.add(repoShortName(meta.repo.name));
  }
  return [...names]
}

/**
 * Builds a deterministic LinkedIn post — no AI. It states the raw facts of the week
 * (commits across repos, new repos, notes taken), the dashboard link, and hashtags.
 */
export function buildPost(options: BuildPostOptions): Post {
  const { version, dashboardUrl, imagePath, activities } = options
  const metrics = computeMetrics(activities)

  const lines: string[] = [`📋 Weekly Changelog — ${version}`, '']

  const facts: string[] = []

  if (metrics.totalCommits > 0) {
    const names = repoNames(activities)
    const shown = names.slice(0, MAX_REPO_NAMES).join(', ')
    const extra = names.length > MAX_REPO_NAMES ? ` +${names.length - MAX_REPO_NAMES} more` : ''
    const where = names.length > 0 ? ` (${shown}${extra})` : ''
    facts.push(`💻 ${metrics.totalCommits} commit${metrics.totalCommits === 1 ? '' : 's'} across ${metrics.repositories} repo${metrics.repositories === 1 ? '' : 's'}${where}`)
  }

  if (metrics.newRepos > 0) {
    facts.push(`🆕 ${metrics.newRepos} new repo${metrics.newRepos === 1 ? '' : 's'} created`)
  }

  if (metrics.notesTaken > 0) {
    facts.push(`📝 ${metrics.notesTaken} note${metrics.notesTaken === 1 ? '' : 's'} taken`)
  }

  lines.push(...(facts.length > 0 ? facts : ['A quiet week — no public activity recorded.']))

  lines.push('', dashboardUrl, '', HASHTAGS)

  return { text: lines.join('\n'), imagePath, link: dashboardUrl }
}
