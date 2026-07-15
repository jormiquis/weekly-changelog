export interface DashboardRepo {
  name: string
  url: string
  totalCommits: number
  diffUrl: string
  commits: string[]
  evaluation?: string
}

export interface DashboardCreatedRepo {
  name: string
  url: string
  description: string
}

export interface DashboardNote {
  emoji: string
  title: string
  sources: string[]
}

export interface DashboardDigest {
  headline: string
  summary: string
  highlights: string[]
}

export interface DashboardData {
  week: string
  generatedAt: string
  repos: DashboardRepo[]
  createdRepos: DashboardCreatedRepo[]
  notes: DashboardNote[]
  digest?: DashboardDigest
}
