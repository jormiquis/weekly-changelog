import type { Activity } from '../../domain/Activity.js';
import { isCreateRepoEvent, isForkEvent, isLearningEntry } from '../../domain/ActivityMeta.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';
import type { CardData, SideProjectBullet } from './CardData.js';

const MAX_SIDE_PROJECTS = 4
/** New repos and forks share one reserve, so they can never crowd out the AI bullets. */
const MAX_MILESTONES = 2
const MAX_LEARNINGS = 2
const MAX_AT_WORK = 3

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

/**
 * Repository milestones — new repos and forks — with NO AI involved. The digest
 * only ever attributes bullets to repositories that had commits, so these two
 * usually land with none and would otherwise never reach the card even though
 * the dashboard lists them under "New repositories" and "Forks".
 */
function buildMilestones(activities: Activity[]): SideProjectBullet[] {
  const metaData = activities.map(activity => activity.metaData)

  return [
    ...metaData.filter(isCreateRepoEvent).map(meta => ({ project: repoShortName(meta.repo), text: 'new repository' })),
    ...metaData.filter(isForkEvent).map(meta => ({ project: repoShortName(meta.fork), text: `forked from ${meta.sourceRepo}` })),
  ].slice(0, MAX_MILESTONES)
}

/**
 * "Side projects" bullets: the AI's most important personal side-project
 * highlights, merging product work and technical decisions across repos, each
 * tagged with the project it applies to, followed by the week's raw milestones.
 * Milestones keep their slots, so a week of only forks and new repos — which
 * carry no commits for the AI to summarize — still fills the column.
 */
function buildSideProjects(activities: Activity[], digest?: SynthesizedDigest): SideProjectBullet[] {
  const milestones = buildMilestones(activities)
  const bullets = (digest?.sideProjects?.bullets ?? [])
    .slice(0, MAX_SIDE_PROJECTS - milestones.length)
    .map(({ project, text }) => ({ project, text }))

  return [...bullets, ...milestones]
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
    sideProjects: buildSideProjects(activities, options.digest),
    learnings: buildLearnings(activities),
    atWork: buildAtWork(options.digest),
  }
}
