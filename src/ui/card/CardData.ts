export interface CardStat {
  value: string | number
  label: string
}

export interface CardRepoStat {
  name: string
  commits: number
}

export interface CardNote {
  emoji: string
  title: string
  tags: string[]
}

export interface CardSection {
  /** Hex accent color, e.g. "#2dd4bf". Badge/tag backgrounds are derived from it. */
  accent: string
  title: string
  subtitle: string
  stats?: CardStat[]
  repos?: CardRepoStat[]
  notes?: CardNote[]
}

export interface CardData {
  week: string
  sections: CardSection[]
  title?: string
  subtitle?: string
}
