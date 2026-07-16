import type { Activity } from './Activity.js';
import { isPushEvent, isCreateRepoEvent, isNotionEntry } from './ActivityMeta.js';
import { classifyCommit, isConventional, type CommitType } from './commitType.js';
import { languageFromPath } from './languageFromPath.js';

export interface CommitTypeCount {
  type: CommitType
  count: number
}

export interface LanguageCount {
  language: string
  files: number
}

export interface Metrics {
  totalCommits: number
  /** Share (0-1) of commits following the Conventional Commits format. */
  atomicCommitRatio: number
  /** Mean lines changed (additions + deletions) per commit. */
  averageCommitSize: number
  commitsByType: CommitTypeCount[]
  testRatio: number
  refactorRatio: number
  documentationRatio: number
  repositories: number
  languages: LanguageCount[]
  totalAdditions: number
  totalDeletions: number
  notesTaken: number
  newRepos: number
}

function ratio(count: number, total: number): number {
  return total === 0 ? 0 : count / total
}

export function computeMetrics(activities: Activity[]): Metrics {
  const pushEvents = activities.map(a => a.metaData).filter(isPushEvent);

  const messages: string[] = [];
  const repos = new Set<string>();
  const languageFiles = new Map<string, number>();
  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const push of pushEvents) {
    repos.add(push.repo.name);
    totalAdditions += push.additions ?? 0;
    totalDeletions += push.deletions ?? 0;

    for (const commit of push.commitMessages) messages.push(commit.message);

    for (const file of push.files ?? []) {
      const language = languageFromPath(file.filename);
      if (language) languageFiles.set(language, (languageFiles.get(language) ?? 0) + 1);
    }
  }

  const totalCommits = messages.length;

  const typeCounts = new Map<CommitType, number>();
  let atomic = 0;
  for (const message of messages) {
    typeCounts.set(classifyCommit(message), (typeCounts.get(classifyCommit(message)) ?? 0) + 1);
    if (isConventional(message)) atomic++;
  }

  const commitsByType: CommitTypeCount[] = [...typeCounts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const languages: LanguageCount[] = [...languageFiles.entries()]
    .map(([language, files]) => ({ language, files }))
    .sort((a, b) => b.files - a.files);

  const notesTaken = activities.map(a => a.metaData).filter(isNotionEntry).length;
  const newRepos = activities.map(a => a.metaData).filter(isCreateRepoEvent).length;

  return {
    totalCommits,
    atomicCommitRatio: ratio(atomic, totalCommits),
    averageCommitSize: totalCommits === 0 ? 0 : Math.round((totalAdditions + totalDeletions) / totalCommits),
    commitsByType,
    testRatio: ratio(typeCounts.get('test') ?? 0, totalCommits),
    refactorRatio: ratio(typeCounts.get('refactor') ?? 0, totalCommits),
    documentationRatio: ratio(typeCounts.get('docs') ?? 0, totalCommits),
    repositories: repos.size,
    languages,
    totalAdditions,
    totalDeletions,
    notesTaken,
    newRepos,
  }
}
