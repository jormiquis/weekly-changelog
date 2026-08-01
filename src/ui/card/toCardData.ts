import type { Activity } from '../../domain/Activity.js';
import { isLearningEntry } from '../../domain/ActivityMeta.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';
import type { CardData } from './CardData.js';

const MAX_WORKED_ON = 3
const MAX_DECISIONS = 3
const MAX_LEARNINGS = 2
const MAX_AT_WORK = 3

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
 * "Learnings" bullets: the raw learning-note titles captured this week, with NO
 * AI involved — the notes are surfaced verbatim. Excludes day-job work entries.
 */
function buildLearnings(activities: Activity[]): string[] {
  return activities
    .map(a => a.metaData)
    .filter(isLearningEntry)
    .map(note => note.title)
    .slice(0, MAX_LEARNINGS)
}

/**
 * "At work" bullets: the AI's short, card-ready summaries of the most important
 * day-job items — the raw Notion titles are often too long for the card. Empty
 * when no digest was produced.
 */
function buildAtWork(digest?: SynthesizedDigest): string[] {
  return (digest?.work?.bullets ?? []).slice(0, MAX_AT_WORK)
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
    atWork: buildAtWork(options.digest),
  }
}
