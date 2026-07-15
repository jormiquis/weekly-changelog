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
  background: 'linear-gradient(160deg, #0d0d0d 0%, #1a1a19 100%)',
  cardBg: 'rgba(255, 255, 255, 0.04)',
  cardBorder: 'rgba(255, 255, 255, 0.10)',
  textPrimary: '#ffffff',
  textMuted: '#898781',
  weekPillBg: 'rgba(255, 255, 255, 0.08)',
}
