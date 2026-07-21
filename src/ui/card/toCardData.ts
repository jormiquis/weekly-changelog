import type { Activity } from '../../domain/Activity.js';
import { isNotionEntry } from '../../domain/ActivityMeta.js';
import { computeMetrics } from '../../domain/computeMetrics.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';
import type { CardData } from './CardData.js';

const MAX_WORKED_ON = 2
const MAX_DECISIONS = 2
const MAX_LEARNINGS = 2

/**
 * "Worked on" bullets: the AI synthesis of the week's code activity (commits,
 * pushes, forks, PRs). Empty when no digest was produced.
 */
function buildWorkedOn(digest?: SynthesizedDigest): string[] {
  if (!digest) return []

  return digest.workedOn.slice(0, MAX_WORKED_ON)
}

/**
 * "Decisions" bullets: the design patterns / architectural decisions the AI
 * distilled from the week's code diffs, stated as facts (never explained) and
 * carrying the repo where each lives for context. Empty when no digest was
 * produced or nothing worthwhile was found.
 */
function buildDecisions(digest?: SynthesizedDigest): string[] {
  if (!digest) return []

  return digest.highlights
    .slice(0, MAX_DECISIONS)
    .map(highlight => `${highlight.title} · ${highlight.repo}`)
}

/**
 * "Learnings" bullets: the raw note titles captured this week, with NO AI
 * involved — the notes are surfaced verbatim.
 */
function buildLearnings(activities: Activity[]): string[] {
  return activities
    .map(a => a.metaData)
    .filter(isNotionEntry)
    .map(note => note.title)
    .slice(0, MAX_LEARNINGS)
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
    workedOn: buildWorkedOn(options.digest),
    decisions: buildDecisions(options.digest),
    learnings: buildLearnings(activities),
    stats: {
      commits: metrics.totalCommits,
      notes: metrics.notesTaken,
      linesChanged: metrics.totalAdditions + metrics.totalDeletions,
      repos: metrics.repositories,
    },
  }
}
