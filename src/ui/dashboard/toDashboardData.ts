import type { Activity } from '../../domain/Activity.js';
import { isPushEvent, isCreateRepoEvent, isForkEvent, isPullRequestEvent, isLearningEntry, isWorkEntry } from '../../domain/ActivityMeta.js';
import type { RepoDigest, SynthesizedDigest } from '../../domain/SynthesizedDigest.js';
import type { DashboardCreatedRepo, DashboardData, DashboardFork, DashboardNote, DashboardPullRequest, DashboardRepo } from './DashboardData.js';

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

function formatGeneratedAt(date: Date): string {
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
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
    repoPushes.get(fullName)!.pushes.push({ diffUrl: meta.diff });
  }

  const digestByRepo = new Map<string, RepoDigest>((options.digest?.repos ?? []).map(repo => [repo.repo, repo]));

  const repos: DashboardRepo[] = [...repoPushes.entries()]
    .map(([fullName, { url, pushes }]) => {
      const name = repoShortName(fullName);
      const repoDigest = digestByRepo.get(name);

      return {
        name,
        url,
        diffUrl: combinedDiffUrl(fullName, pushes),
        productChanges: repoDigest?.productChanges ?? [],
        highlights: (repoDigest?.highlights ?? []).map(highlight => ({
          title: highlight.title,
          alternative: highlight.alternative,
          code: highlight.code,
          language: highlight.language,
          ...(highlight.diagram && highlight.diagram.trim().length > 0 ? { diagram: highlight.diagram } : {})
        })),
        ...(repoDigest?.product ? { product: repoDigest.product } : {}),
        ...(repoDigest?.summary ? { summary: repoDigest.summary } : {}),
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

  const forks: DashboardFork[] = activities
    .map(activity => activity.metaData)
    .filter(isForkEvent)
    .map(meta => ({
      name: repoShortName(meta.fork),
      url: meta.forkUrl,
      from: meta.sourceRepo
    }));

  const pullRequests: DashboardPullRequest[] = activities
    .map(activity => activity.metaData)
    .filter(isPullRequestEvent)
    .map(meta => ({
      state: meta.state,
      repo: meta.repo,
      number: meta.number,
      title: meta.title,
      url: meta.url,
    }));

  const summaryByNote = new Map((options.digest?.notes ?? []).map(({ title, summary }) => [title, summary]));

  const notes: DashboardNote[] = activities
    .map(activity => activity.metaData)
    .filter(isLearningEntry)
    .map(meta => {
      const summary = summaryByNote.get(meta.title);

      return {
        emoji: meta.entry_emoji || '📝',
        title: meta.title,
        tags: meta.tags,
        sources: meta.sources,
        ...(summary ? { summary } : {})
      }
    });

  const workItems = activities
    .map(activity => activity.metaData)
    .filter(isWorkEntry)
    .map(meta => meta.title);

  // The AI work summary is meaningless without any work entries to summarize.
  const workSummary = workItems.length > 0 ? options.digest?.work?.summary?.trim() : undefined;
  const work = {
    items: workItems,
    ...(workSummary ? { summary: workSummary } : {})
  };

  return {
    week: options.week,
    generatedAt: formatGeneratedAt(new Date()),
    repos,
    createdRepos,
    forks,
    pullRequests,
    notes,
    work,
    ...(options.digest ? { digest: { headline: options.digest.headline, summary: options.digest.summary } } : {})
  }
}
