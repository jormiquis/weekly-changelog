export type CommitType =
  | 'feat'
  | 'fix'
  | 'test'
  | 'refactor'
  | 'docs'
  | 'chore'
  | 'style'
  | 'perf'
  | 'build'
  | 'ci'
  | 'other'

const CONVENTIONAL = /^(feat|fix|test|refactor|docs|chore|style|perf|build|ci)(\([^)]*\))?(!)?:\s/i

const KNOWN_TYPES: CommitType[] = ['feat', 'fix', 'test', 'refactor', 'docs', 'chore', 'style', 'perf', 'build', 'ci']

/** Reads the first line of a (possibly multi-line) commit message. */
function subject(message: string): string {
  return (message.split('\n')[0] ?? message).trim()
}

/**
 * A commit is treated as "atomic" when it follows the Conventional Commits format
 * (`type(scope)?: description`) — a proxy for a single, focused, well-scoped change.
 */
export function isConventional(message: string): boolean {
  return CONVENTIONAL.test(subject(message))
}

export function classifyCommit(message: string): CommitType {
  const match = subject(message).match(CONVENTIONAL)
  if (!match) return 'other'

  const type = match[1]!.toLowerCase() as CommitType
  return KNOWN_TYPES.includes(type) ? type : 'other'
}
