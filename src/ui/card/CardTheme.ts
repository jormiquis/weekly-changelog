export interface CardTheme {
  width: number
  height: number
  fontFamily: string
  background: string
  cardBg: string
  cardBorder: string
  textPrimary: string
  textMuted: string
  weekPillBg: string
}

export const defaultTheme: CardTheme = {
  width: 1200,
  height: 760,
  fontFamily: 'Poppins',
  background: 'linear-gradient(160deg, #1a0b2e 0%, #2d1b4e 55%, #1a0b2e 100%)',
  cardBg: 'rgba(185, 103, 255, 0.07)',
  cardBorder: 'rgba(185, 103, 255, 0.28)',
  textPrimary: '#ffffff',
  textMuted: '#a599c2',
  weekPillBg: 'rgba(255, 255, 255, 0.08)',
}
