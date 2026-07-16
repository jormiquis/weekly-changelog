import type { Activity } from '../../domain/Activity.js';
import { isPushEvent, isCreateRepoEvent, isNotionEntry } from '../../domain/ActivityMeta.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';
import { computeMetrics } from '../../domain/computeMetrics.js';
import { buildTimeline } from '../../domain/buildTimeline.js';
import type { DashboardCreatedRepo, DashboardData, DashboardNote, DashboardRepo, DashboardTimelineEvent } from './DashboardData.js';

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function parseCompareShas(diffUrl: string): { before: string; after: string } | null {
  const match = diffUrl.match(/\/compare\/([0-9a-f]+)\.\.\.([0-9a-f]+)\.diff$/i)
  if (!match) return null
  return { before: match[1]!, after: match[2]! }
}

function combinedDiffUrl(fullName: string, pushes: PendingPush[]): string {
  const newest = parseCompareShas(pushes[0]!.diffUrl)
  const oldest = parseCompareShas(pushes[pushes.length - 1]!.diffUrl)
  if (!newest || !oldest) return pushes[0]!.diffUrl

  return `https://github.com/${fullName}/compare/${oldest.before}...${newest.after}.diff`
}

interface PendingPush {
  diffUrl: string
  commits: string[]
  additions: number
  deletions: number
}

export interface BuildDashboardDataOptions {
  week: string
  digest?: SynthesizedDigest
}

export function buildDashboardData(activities: Activity[], options: BuildDashboardDataOptions): DashboardData {
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
      commits: meta.commitMessages.map(commit => (commit.message.split('\n')[0] ?? commit.message).trim()),
      additions: meta.additions,
      deletions: meta.deletions,
    });
  }

  const evaluationByRepo = new Map((options.digest?.commitEvaluations ?? []).map(({ repo, evaluation }) => [repo, evaluation]));

  const repos: DashboardRepo[] = [...repoPushes.entries()]
    .map(([fullName, { url, pushes }]) => {
      const name = repoShortName(fullName);
      const evaluation = evaluationByRepo.get(name);

      return {
        name,
        url,
        totalCommits: pushes.reduce((sum, push) => sum + push.commits.length, 0),
        diffUrl: combinedDiffUrl(fullName, pushes),
        commits: pushes.flatMap(push => push.commits),
        additions: pushes.reduce((sum, push) => sum + push.additions, 0),
        deletions: pushes.reduce((sum, push) => sum + push.deletions, 0),
        ...(evaluation ? { evaluation } : {})
      }
    })
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

  const timeline: DashboardTimelineEvent[] = buildTimeline(activities).map(event => ({
    type: event.type,
    when: formatWhen(event.occurredAt),
    title: event.title,
    meta: event.meta,
  }));

  return {
    week: options.week,
    generatedAt: formatGeneratedAt(new Date()),
    timeline,
    repos,
    createdRepos,
    notes,
    metrics: computeMetrics(activities),
    ...(options.digest ? { digest: { headline: options.digest.headline, summary: options.digest.summary, highlights: options.digest.highlights } } : {})
  }
}
