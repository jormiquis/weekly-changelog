import type { Activity } from '../../domain/Activity.js';
import { isNotionEntry } from '../../domain/ActivityMeta.js';
import { computeMetrics } from '../../domain/computeMetrics.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';
import type { CardData } from './CardData.js';

const MAX_SHIPPED = 5
const MAX_LEARNED = 4

/**
 * "Shipped" bullets, one per repository, built from the AI digest. Each bullet
 * reads "repo — what changed", so the card is grouped by repository.
 */
function buildShipped(digest?: SynthesizedDigest): string[] {
  if (!digest) return []

  return digest.repos
    .map(repo => `${repo.repo} — ${repo.summary}`)
    .slice(0, MAX_SHIPPED)
}

/**
 * "Learned" bullets, one per note. Uses the AI per-note summary when available,
 * otherwise falls back to the raw note titles so the card still renders offline.
 */
function buildLearned(activities: Activity[], digest?: SynthesizedDigest): string[] {
  if (digest) {
    return digest.notes
      .map(note => `${note.title} — ${note.summary}`)
      .slice(0, MAX_LEARNED)
  }

  return activities
    .map(a => a.metaData)
    .filter(isNotionEntry)
    .map(note => note.title)
    .slice(0, MAX_LEARNED)
}

export interface BuildCardDataOptions {
  week: string
  version?: string
  digest?: SynthesizedDigest
}

export function buildCardData(activities: Activity[], options: BuildCardDataOptions): CardData {
  const metrics = computeMetrics(activities);

  return {
    week: options.week,
    version: options.version ?? options.week,
    shipped: buildShipped(options.digest),
    learned: buildLearned(activities, options.digest),
    stats: {
      commits: metrics.totalCommits,
      notes: metrics.notesTaken,
      linesChanged: metrics.totalAdditions + metrics.totalDeletions,
      repos: metrics.repositories,
    },
  }
}
