export interface CardStats {
  commits: number
  notes: number
  linesChanged: number
  repos: number
}

export interface CardData {
  week: string
  version: string
  /** AI-synthesized bullets on the work delivered: commits, pushes, forks, PRs. */
  workedOn: string[]
  /** AI-surfaced architectural/product decisions, evidenced not explained. */
  decisions: string[]
  /** Raw note titles captured this week — no AI involved. */
  learnings: string[]
  stats: CardStats
  title?: string
  subtitle?: string
}
