export interface DashboardHighlight {
  /** The design pattern / architectural decision, enunciated. */
  title: string
  /** The alternative discarded in favour of this decision. */
  alternative: string
  /** Attractive, self-contained code snippet. */
  code: string
  /** Language for syntax highlighting, e.g. "typescript". */
  language: string
  /** Optional simple mermaid diagram source. */
  diagram?: string
}

export interface DashboardRepo {
  name: string
  url: string
  /** Link to the combined diff for the week. */
  diffUrl: string
  /** What the product this repo represents is, e.g. "a work diary project". */
  product?: string
  /** Extensive AI summary of what was done this week. */
  summary?: string
  /** Product-facing changes this week. */
  productChanges: string[]
  /** Code highlights distilled from this repo's diffs. */
  highlights: DashboardHighlight[]
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

export interface DashboardWork {
  /** AI summary of the week's day-job work, when a digest was produced. */
  summary?: string
  /** Day-job entry titles (Notion "work"/"brag" entries), surfaced verbatim. */
  items: string[]
}

export interface DashboardData {
  week: string
  generatedAt: string
  repos: DashboardRepo[]
  createdRepos: DashboardCreatedRepo[]
  forks: DashboardFork[]
  pullRequests: DashboardPullRequest[]
  notes: DashboardNote[]
  work: DashboardWork
  digest?: DashboardDigest
}
