export interface CardHighlight {
  emoji: string
  text: string
  /** Hex accent color, e.g. "#2dd4bf". Differentiates the event type. */
  accent: string
}

export interface CardData {
  week: string
  highlights: CardHighlight[]
  title?: string
  subtitle?: string
}
