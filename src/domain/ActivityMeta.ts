export interface PushEventMeta {
  [key: string]: unknown
  type: 'PushEvent'
  repo: { name: string }
  diff: string
  commitMessages: { message: string }[]
}

export interface CreateRepoEventMeta {
  [key: string]: unknown
  source: 'github'
  type: 'CreateEvent'
  entityCreated: 'repository'
  repo: string
  description: string
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

export function isNotionEntry(metaData: Record<string, unknown>): metaData is NotionEntryMeta {
  return metaData.source === 'notion'
}
