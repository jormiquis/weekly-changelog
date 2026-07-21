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

export interface CodeHighlight {
  /** The design pattern / architectural decision, enunciated — never explained. */
  title: string
  /** Short repo name where it was done, e.g. "weekly-changelog". */
  repo: string
  /** A short, attractive, self-contained code snippet distilled from the diff. */
  code: string
  /** Language for syntax highlighting, e.g. "typescript". */
  language: string
  /** Optional simple mermaid diagram (graph/flowchart) illustrating the pattern. */
  diagram?: string
}

export interface SynthesizedDigest {
  headline: string
  summary: string
  /**
   * 1-2 bullets synthesizing the concrete work delivered this week — commits,
   * pushes, forks, PRs, new repos. Grouped by outcome, not by repository.
   */
  workedOn: string[]
  /**
   * Code highlights the AI distilled from the week's diffs: a design pattern or
   * architectural decision, enunciated (never explained), with an attractive
   * code snippet, the repo it lives in, and an optional simple diagram.
   */
  highlights: CodeHighlight[]
  /** Per-repository summaries, one entry per repo that had commits this week. */
  repos: RepoSummary[]
  /** Per-note summaries, one entry per note captured this week. */
  notes: NoteSummary[]
}

/** True for an array whose every element is a non-empty string (empty array passes). */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every(item => typeof item === 'string' && item.trim().length > 0)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isCodeHighlight(value: unknown): value is CodeHighlight {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return isNonEmptyString(candidate.title)
    && isNonEmptyString(candidate.repo)
    && isNonEmptyString(candidate.code)
    && isNonEmptyString(candidate.language)
    && (candidate.diagram === undefined || typeof candidate.diagram === 'string')
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
    && isStringArray(candidate.workedOn)
    && Array.isArray(candidate.highlights)
    && candidate.highlights.every(isCodeHighlight)
    && Array.isArray(candidate.repos)
    && candidate.repos.every(isRepoSummary)
    && Array.isArray(candidate.notes)
    && candidate.notes.every(isNoteSummary)
}
