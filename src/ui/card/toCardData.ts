import type { Activity } from '../../domain/Activity.js';
import { isPushEvent, isNotionEntry } from '../../domain/ActivityMeta.js';
import { classifyCommit } from '../../domain/commitType.js';
import { computeMetrics } from '../../domain/computeMetrics.js';
import { areaFromFiles, describeWork, WORK_PRIORITY } from '../../domain/workCategory.js';
import type { CardData } from './CardData.js';

const MAX_SHIPPED = 5
const MAX_LEARNED = 4

/**
 * Generic, context-free "worked on" bullets — the kind of work, not the literal
 * commit message. Each commit is categorized by its type and the area it touched,
 * then de-duplicated and ranked so the card reads like a product changelog.
 */
function buildShipped(activities: Activity[]): string[] {
  const bestPriority = new Map<string, number>();

  for (const meta of activities.map(a => a.metaData).filter(isPushEvent)) {
    const area = areaFromFiles(meta.files ?? []);

    for (const commit of meta.commitMessages) {
      const type = classifyCommit(commit.message);
      const phrase = describeWork(type, area);
      if (!phrase) continue;

      const priority = WORK_PRIORITY[type];
      if (!bestPriority.has(phrase) || priority < bestPriority.get(phrase)!) {
        bestPriority.set(phrase, priority);
      }
    }
  }

  return [...bestPriority.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([phrase]) => phrase)
    .slice(0, MAX_SHIPPED)
}

function buildLearned(activities: Activity[]): string[] {
  return activities
    .map(a => a.metaData)
    .filter(isNotionEntry)
    .map(note => note.title)
    .slice(0, MAX_LEARNED)
}

export interface BuildCardDataOptions {
  week: string
  version?: string
}

export function buildCardData(activities: Activity[], options: BuildCardDataOptions): CardData {
  const metrics = computeMetrics(activities);

  return {
    week: options.week,
    version: options.version ?? options.week,
    shipped: buildShipped(activities),
    learned: buildLearned(activities),
    stats: {
      commits: metrics.totalCommits,
      notes: metrics.notesTaken,
      linesChanged: metrics.totalAdditions + metrics.totalDeletions,
      repos: metrics.repositories,
    },
  }
}
