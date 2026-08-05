import type { Activity } from '../../domain/Activity.js';
import { isLearningEntry } from '../../domain/ActivityMeta.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';
import type { CardData, SideProjectBullet } from './CardData.js';

const MAX_SIDE_PROJECTS = 4
const MAX_LEARNINGS = 2
const MAX_AT_WORK = 3

/**
 * "Side projects" bullets: the AI's 3-4 most important personal side-project
 * highlights, merging product work and technical decisions across repos, each
 * tagged with the project it applies to. Empty when no digest was produced.
 */
function buildSideProjects(digest?: SynthesizedDigest): SideProjectBullet[] {
  return (digest?.sideProjects?.bullets ?? [])
    .slice(0, MAX_SIDE_PROJECTS)
    .map(({ project, text }) => ({ project, text }))
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
    sideProjects: buildSideProjects(options.digest),
    learnings: buildLearnings(activities),
    atWork: buildAtWork(options.digest),
  }
}
