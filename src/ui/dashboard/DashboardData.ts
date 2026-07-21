import type { Metrics } from '../../domain/computeMetrics.js';

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

export interface DashboardPullRequest {
  /** "opened" or "merged". */
  state: 'opened' | 'merged'
  /** Full name of the third-party repo, e.g. "vercel/next.js". */
  repo: string
  number: number
  title: string
  url: string
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

export interface DashboardHighlight {
  /** The design pattern / architectural decision, enunciated. */
  title: string
  /** Short repo name where it lives. */
  repo: string
  /** Attractive, self-contained code snippet. */
  code: string
  /** Language for syntax highlighting, e.g. "typescript". */
  language: string
  /** Optional simple mermaid diagram source. */
  diagram?: string
}

export interface DashboardData {
  week: string
  generatedAt: string
  highlights: DashboardHighlight[]
  repos: DashboardRepo[]
  createdRepos: DashboardCreatedRepo[]
  forks: DashboardFork[]
  pullRequests: DashboardPullRequest[]
  notes: DashboardNote[]
  metrics: Metrics
  digest?: DashboardDigest
}
