export interface CommitEvaluation {
  repo: string
  evaluation: string
}

export interface SynthesizedDigest {
  headline: string
  summary: string
  highlights: string[]
  commitEvaluations: CommitEvaluation[]
}

function isCommitEvaluation(value: unknown): value is CommitEvaluation {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return typeof candidate.repo === 'string'
    && candidate.repo.trim().length > 0
    && typeof candidate.evaluation === 'string'
    && candidate.evaluation.trim().length > 0
}

export function isSynthesizedDigest(value: unknown): value is SynthesizedDigest {
  if (typeof value !== 'object' || value === null) return false

  const candidate = value as Record<string, unknown>

  return typeof candidate.headline === 'string'
    && candidate.headline.trim().length > 0
    && typeof candidate.summary === 'string'
    && candidate.summary.trim().length > 0
    && Array.isArray(candidate.highlights)
    && candidate.highlights.every(highlight => typeof highlight === 'string')
    && Array.isArray(candidate.commitEvaluations)
    && candidate.commitEvaluations.every(isCommitEvaluation)
}
