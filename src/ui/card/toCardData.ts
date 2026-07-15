import type { Activity } from '../../domain/Activity.js';
import { isPushEvent, isCreateRepoEvent, isNotionEntry } from '../../domain/ActivityMeta.js';
import type { CardData, CardHighlight } from './CardData.js';

const EVENT_STYLE = {
  commit: { emoji: '💻', accent: '#3987e5' },
  repo: { emoji: '🆕', accent: '#008300' },
  note: { emoji: '📝', accent: '#d55181' },
} as const

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

function buildHighlights(activities: Activity[]): CardHighlight[] {
  const highlights: CardHighlight[] = [];

  const commitsByRepo = new Map<string, number>();
  for (const meta of activities.map(a => a.metaData).filter(isPushEvent)) {
    const repoName = repoShortName(meta.repo.name);
    commitsByRepo.set(repoName, (commitsByRepo.get(repoName) ?? 0) + meta.commitMessages.length);
  }
  for (const [repoName, commits] of commitsByRepo) {
    highlights.push({ ...EVENT_STYLE.commit, text: `${commits} commit${commits === 1 ? '' : 's'} in ${repoName}` });
  }

  for (const meta of activities.map(a => a.metaData).filter(isCreateRepoEvent)) {
    highlights.push({ ...EVENT_STYLE.repo, text: `New repo: ${repoShortName(meta.repo)}` });
  }

  for (const meta of activities.map(a => a.metaData).filter(isNotionEntry)) {
    highlights.push({ ...EVENT_STYLE.note, text: meta.title });
  }

  return highlights
}

export interface BuildCardDataOptions {
  week: string
}

export function buildCardData(activities: Activity[], options: BuildCardDataOptions): CardData {
  return { week: options.week, highlights: buildHighlights(activities) }
}
