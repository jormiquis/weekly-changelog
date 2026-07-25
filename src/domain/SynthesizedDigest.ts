export interface CodeHighlight {
  /** The design pattern / architectural decision, enunciated — never explained. */
  title: string
  /** A short, attractive, self-contained code snippet distilled from the diff. */
  code: string
  /** Language for syntax highlighting, e.g. "typescript". */
  language: string
  /** Optional simple mermaid diagram (graph/flowchart) illustrating the pattern. */
  diagram?: string
}

export interface RepoDigest {
  /** Short repository name, e.g. "weekly-changelog". */
  repo: string
  /**
   * What the product this repo represents IS, product-oriented and inferred from
   * the code — e.g. "a work diary project". A noun phrase, no repo name.
   */
  product: string
  /**
   * One product-oriented line for the card, combining the week's change with the
   * product context, e.g. "created a new way of publishing posts on a work diary project".
   */
  workedOnLine: string
  /** Extensive summary (dashboard) of what was done this week, from diffs + commits. */
  summary: string
  /** Product-facing bullets: what changed in the product this week. */
  productChanges: string[]
  /** Code highlights distilled from this repo's diffs. */
  highlights: CodeHighlight[]
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
  /** Per-repository digest, one entry per repo that had commits this week. */
  repos: RepoDigest[]
  /** Per-note summaries, one entry per note captured this week. */
  notes: NoteSummary[]
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** True for an array whose every element is a non-empty string (empty array passes). */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.every(item => typeof item === 'string' && item.trim().length > 0)
}

function isCodeHighlight(value: unknown): value is CodeHighlight {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return isNonEmptyString(candidate.title)
    && isNonEmptyString(candidate.code)
    && isNonEmptyString(candidate.language)
    && (candidate.diagram === undefined || typeof candidate.diagram === 'string')
}

function isRepoDigest(value: unknown): value is RepoDigest {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return isNonEmptyString(candidate.repo)
    && isNonEmptyString(candidate.product)
    && isNonEmptyString(candidate.workedOnLine)
    && isNonEmptyString(candidate.summary)
    && isStringArray(candidate.productChanges)
    && Array.isArray(candidate.highlights)
    && candidate.highlights.every(isCodeHighlight)
}

function isNoteSummary(value: unknown): value is NoteSummary {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return isNonEmptyString(candidate.title)
    && isNonEmptyString(candidate.summary)
}

export function isSynthesizedDigest(value: unknown): value is SynthesizedDigest {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return isNonEmptyString(candidate.headline)
    && isNonEmptyString(candidate.summary)
    && Array.isArray(candidate.repos)
    && candidate.repos.every(isRepoDigest)
    && Array.isArray(candidate.notes)
    && candidate.notes.every(isNoteSummary)
}
