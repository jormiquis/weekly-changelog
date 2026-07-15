export interface DashboardRepo {
  name: string
  url: string
  totalCommits: number
  diffUrl: string
  commits: string[]
}

export interface DashboardCreatedRepo {
  name: string
  url: string
  description: string
}

export interface DashboardNote {
  emoji: string
  title: string
  tags: string[]
  sources: string[]
}

export interface DashboardData {
  week: string
  generatedAt: string
  repos: DashboardRepo[]
  createdRepos: DashboardCreatedRepo[]
  notes: DashboardNote[]
}
