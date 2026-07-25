import type { Activity } from '../../domain/Activity.js';
import { isNotionEntry } from '../../domain/ActivityMeta.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';
import type { CardData } from './CardData.js';

const MAX_WORKED_ON = 3
const MAX_DECISIONS = 3
const MAX_LEARNINGS = 2

/**
 * "Worked on" bullets: one product-oriented line per repo, combining the week's
 * change with what the product is. Empty when no digest was produced.
 */
function buildWorkedOn(digest?: SynthesizedDigest): string[] {
  if (!digest) return []

  return digest.repos.map(repo => repo.workedOnLine).slice(0, MAX_WORKED_ON)
}

/**
 * "Decisions" bullets: the factual technical decisions the AI distilled from the
 * diffs (e.g. "Composition over inheritance"), stated with no location. Empty
 * when no digest was produced or nothing worthwhile was found.
 */
function buildDecisions(digest?: SynthesizedDigest): string[] {
  if (!digest) return []

  const titles = digest.repos.flatMap(repo => repo.highlights.map(highlight => highlight.title))
  return [...new Set(titles)].slice(0, MAX_DECISIONS)
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
  return {
    week: options.week,
    version: options.version ?? options.week,
    workedOn: buildWorkedOn(options.digest),
    decisions: buildDecisions(options.digest),
    learnings: buildLearnings(activities),
  }
}
