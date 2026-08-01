export interface CardData {
  week: string
  version: string
  /**
   * Personal side-project highlights (work outside the day job): the 3-4 most
   * important items, AI-summarized — merges product work and technical decisions.
   */
  sideProjects: string[]
  /** Raw learning-note titles captured this week — no AI involved. */
  learnings: string[]
  /** Day-job highlights: AI-summarized short bullets of the most important work entries. */
  atWork: string[]
  title?: string
  subtitle?: string
}
