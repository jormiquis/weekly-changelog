export interface CommitFile {
  filename: string
  additions: number
  deletions: number
}

export interface PushEventMeta {
  [key: string]: unknown
  type: 'PushEvent'
  repo: { name: string }
  diff: string
  commitMessages: { message: string }[]
  additions: number
  deletions: number
  files: CommitFile[]
}

export interface CreateRepoEventMeta {
  [key: string]: unknown
  source: 'github'
  type: 'CreateEvent'
  entityCreated: 'repository'
  repo: string
  description: string
}

export interface ForkEventMeta {
  [key: string]: unknown
  source: 'github'
  type: 'ForkEvent'
  /** The upstream repository that was forked (e.g. "vercel/next.js"). */
  sourceRepo: string
  /** The full name of the created fork (e.g. "jormiquis/next.js"). */
  fork: string
  forkUrl: string
}

export interface NotionEntryMeta {
  [key: string]: unknown
  source: 'notion'
  entry_emoji?: string
  tags: string[]
  sources: string[]
  title: string
}

export function isPushEvent(metaData: Record<string, unknown>): metaData is PushEventMeta {
  return metaData.type === 'PushEvent'
}

export function isCreateRepoEvent(metaData: Record<string, unknown>): metaData is CreateRepoEventMeta {
  return metaData.type === 'CreateEvent' && metaData.entityCreated === 'repository'
}

export function isForkEvent(metaData: Record<string, unknown>): metaData is ForkEventMeta {
  return metaData.type === 'ForkEvent'
}

export function isNotionEntry(metaData: Record<string, unknown>): metaData is NotionEntryMeta {
  return metaData.source === 'notion'
}
