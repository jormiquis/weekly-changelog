import type { CommitType } from './commitType.js';
import type { CommitFile } from './ActivityMeta.js';

export type WorkArea = 'visual' | 'backend' | 'tests' | 'docs' | 'infra' | 'data' | 'code'

/** Buckets a file path into the kind of work it represents. */
export function fileArea(path: string): WorkArea {
  const p = path.toLowerCase()
  if (/(\.test\.|\.spec\.|(^|\/)(tests?|__tests__)\/)/.test(p)) return 'tests'
  if (/(\.mdx?$|(^|\/)docs?\/|readme)/.test(p)) return 'docs'
  if (/(\.(tsx|jsx|vue|svelte|css|scss|sass|less|html)$|(^|\/)(ui|components?|views?|pages?|styles?)\/)/.test(p)) return 'visual'
  if (/(\.sql$|(^|\/)(migrations?|schema)\/)/.test(p)) return 'data'
  if (/(\.(py|go|rb|java|rs|php|cs|ex|exs|kt|scala)$|(^|\/)(api|server|routes?|controllers?|services?|handlers?|backend)\/)/.test(p)) return 'backend'
  if (/(\.(ya?ml|toml)$|dockerfile|(^|\/)(\.github|\.circleci|infra|deploy)\/|(^|\/)package(-lock)?\.json$)/.test(p)) return 'infra'
  return 'code'
}

/** Dominant work area across the files touched by a push. */
export function areaFromFiles(files: CommitFile[]): WorkArea {
  if (files.length === 0) return 'code'

  const counts = new Map<WorkArea, number>()
  for (const file of files) {
    const area = fileArea(file.filename)
    counts.set(area, (counts.get(area) ?? 0) + 1)
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
}

/**
 * Turns a commit into a generic, context-free description of the kind of work done
 * (e.g. "Created a visual component", "New backend development", "Refactored code").
 * Returns null for commits not worth surfacing on the card.
 */
export function describeWork(type: CommitType, area: WorkArea): string | null {
  switch (type) {
    case 'feat':
      return {
        visual: 'Created a visual component',
        backend: 'New backend development',
        tests: 'Added test coverage',
        docs: 'Wrote new documentation',
        infra: 'Set up tooling & CI',
        data: 'New data & model work',
        code: 'Built new functionality',
      }[area]
    case 'fix':
      return area === 'visual' ? 'Fixed UI issues' : area === 'backend' ? 'Fixed backend issues' : 'Fixed bugs'
    case 'refactor':
      return area === 'visual' ? 'Refactored UI code' : area === 'backend' ? 'Refactored backend code' : 'Refactored code'
    case 'perf':
      return 'Improved performance'
    case 'test':
      return 'Added test coverage'
    case 'docs':
      return 'Updated documentation'
    case 'style':
      return 'Polished styling'
    case 'build':
    case 'ci':
    case 'chore':
      return 'Tooling & maintenance'
    default:
      return null
  }
}

/** Ordering used to rank generic work phrases on the card (most notable first). */
export const WORK_PRIORITY: Record<CommitType, number> = {
  feat: 0, fix: 1, refactor: 2, perf: 3, test: 4, docs: 5, style: 6, build: 7, ci: 7, chore: 7, other: 8,
}
