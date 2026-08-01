export interface CodeHighlight {
  /** The design pattern / architectural decision, enunciated — never explained. */
  title: string
  /**
   * The alternative that was discarded in favour of this decision, enunciated as
   * a bare noun phrase — e.g. "class inheritance", "a single hardcoded provider".
   */
  alternative: string
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

export interface WorkDigest {
  /**
   * Impersonal, outcome-oriented summary of the week's day-job work, synthesized
   * from the "work"/"brag" Notion entries. Empty string when there were none.
   */
  summary: string
  /**
   * The 1-3 most important day-job items, each AI-summarized into a single short,
   * card-ready bullet (the raw entry titles are often too long for the card).
   */
  bullets?: string[]
}

export interface SideProjectsDigest {
  /**
   * The 3-4 most important personal side-project items for the card, each a short
   * bullet — a synthesis of the week's product work AND technical decisions across
   * all repos. This is the summarized counterpart to the full per-repo detail.
   */
  bullets: string[]
}

export interface SynthesizedDigest {
  headline: string
  summary: string
  /** Per-repository digest, one entry per repo that had commits this week. */
  repos: RepoDigest[]
  /** Summarized side-project highlights for the card. Absent when no repos had commits. */
  sideProjects?: SideProjectsDigest
  /** Per-note summaries, one entry per learning note captured this week. */
  notes: NoteSummary[]
  /** AI summary of the week's day-job work. Absent when no work entries exist. */
  work?: WorkDigest
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
    && isNonEmptyString(candidate.alternative)
    && isNonEmptyString(candidate.code)
    && isNonEmptyString(candidate.language)
    && (candidate.diagram === undefined || typeof candidate.diagram === 'string')
}

function isRepoDigest(value: unknown): value is RepoDigest {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return isNonEmptyString(candidate.repo)
    && isNonEmptyString(candidate.product)
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

// The model may omit `work` entirely, or return { summary: "" } when there are no
// work entries — both are valid; only a non-string summary is rejected.
function isSideProjectsDigest(value: unknown): value is SideProjectsDigest {
  if (typeof value !== 'object' || value === null) return false

  return isStringArray((value as Record<string, unknown>).bullets)
}

function isWorkDigest(value: unknown): value is WorkDigest {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>
  return typeof candidate.summary === 'string'
    && (candidate.bullets === undefined || isStringArray(candidate.bullets))
}

export function isSynthesizedDigest(value: unknown): value is SynthesizedDigest {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return isNonEmptyString(candidate.headline)
    && isNonEmptyString(candidate.summary)
    && Array.isArray(candidate.repos)
    && candidate.repos.every(isRepoDigest)
    && (candidate.sideProjects === undefined || isSideProjectsDigest(candidate.sideProjects))
    && Array.isArray(candidate.notes)
    && candidate.notes.every(isNoteSummary)
    && (candidate.work === undefined || isWorkDigest(candidate.work))
}
