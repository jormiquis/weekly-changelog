export interface RepoSummary {
  /** Short repository name, e.g. "weekly-changelog". */
  repo: string
  /** One-sentence AI summary of what the commits accomplished for that repo. */
  summary: string
}

export interface NoteSummary {
  /** Note title, copied verbatim so it can be matched back to the source note. */
  title: string
  /** One-sentence AI summary of what the note is about. */
  summary: string
}

export interface SynthesizedDigest {
  headline: string
  summary: string
  /** Per-repository summaries, one entry per repo that had commits this week. */
  repos: RepoSummary[]
  /** Per-note summaries, one entry per note captured this week. */
  notes: NoteSummary[]
}

function isRepoSummary(value: unknown): value is RepoSummary {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return typeof candidate.repo === 'string'
    && candidate.repo.trim().length > 0
    && typeof candidate.summary === 'string'
    && candidate.summary.trim().length > 0
}

function isNoteSummary(value: unknown): value is NoteSummary {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return typeof candidate.title === 'string'
    && candidate.title.trim().length > 0
    && typeof candidate.summary === 'string'
    && candidate.summary.trim().length > 0
}

export function isSynthesizedDigest(value: unknown): value is SynthesizedDigest {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return typeof candidate.headline === 'string'
    && candidate.headline.trim().length > 0
    && typeof candidate.summary === 'string'
    && candidate.summary.trim().length > 0
    && Array.isArray(candidate.repos)
    && candidate.repos.every(isRepoSummary)
    && Array.isArray(candidate.notes)
    && candidate.notes.every(isNoteSummary)
}
