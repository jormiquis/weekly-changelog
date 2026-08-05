export interface SideProjectBullet {
  /** Project (repository) the bullet applies to — rendered as its group label on the card. */
  project: string
  /** The bullet itself, without the project name. */
  text: string
}

export interface CardData {
  week: string
  version: string
  /**
   * Personal side-project highlights (work outside the day job): the 3-4 most
   * important items, AI-summarized — merges product work and technical decisions.
   * Each one carries the project it applies to.
   */
  sideProjects: SideProjectBullet[]
  /** Raw learning-note titles captured this week — no AI involved. */
  learnings: string[]
  /** Day-job highlights: AI-summarized short bullets of the most important work entries. */
  atWork: string[]
  title?: string
  subtitle?: string
}
