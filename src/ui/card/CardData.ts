export interface CardStats {
  commits: number
  notes: number
  linesChanged: number
  repos: number
}

export interface CardData {
  week: string
  version: string
  shipped: string[]
  learned: string[]
  stats: CardStats
  title?: string
  subtitle?: string
}
