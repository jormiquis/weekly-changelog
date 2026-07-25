export interface CardData {
  week: string
  version: string
  /** Product-oriented lines, one per repo: the week's change + what the product is. */
  workedOn: string[]
  /** Factual technical decisions distilled from the diffs (no location). */
  decisions: string[]
  /** Raw note titles captured this week — no AI involved. */
  learnings: string[]
  title?: string
  subtitle?: string
}
