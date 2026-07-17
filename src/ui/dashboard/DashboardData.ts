import type { Metrics } from '../../domain/computeMetrics.js';
import type { TimelineEventType } from '../../domain/buildTimeline.js';

export interface DashboardRepo {
  name: string
  url: string
  totalCommits: number
  diffUrl: string
  commits: string[]
  additions: number
  deletions: number
  evaluation?: string
}

export interface DashboardCreatedRepo {
  name: string
  url: string
  description: string
}

export interface DashboardFork {
  name: string
  url: string
  /** Upstream repo the fork was created from. */
  from: string
}

export interface DashboardNote {
  emoji: string
  title: string
  tags: string[]
  sources: string[]
  /** AI summary of the note, when a digest was produced. */
  summary?: string
}

export interface DashboardDigest {
  headline: string
  summary: string
}

export interface DashboardTimelineEvent {
  type: TimelineEventType
  /** Display-formatted timestamp, e.g. "Mon, Jul 14 · 3:20 PM". */
  when: string
  title: string
  meta: string
}

export interface DashboardData {
  week: string
  generatedAt: string
  timeline: DashboardTimelineEvent[]
  repos: DashboardRepo[]
  createdRepos: DashboardCreatedRepo[]
  forks: DashboardFork[]
  notes: DashboardNote[]
  metrics: Metrics
  digest?: DashboardDigest
}
