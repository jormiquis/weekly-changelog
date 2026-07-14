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
  blobColors: [string, string]
}

export const defaultTheme: CardTheme = {
  width: 1200,
  height: 630,
  fontFamily: 'Poppins',
  background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 45%, #6d28d9 100%)',
  cardBg: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.14)',
  textPrimary: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  weekPillBg: 'rgba(255, 255, 255, 0.14)',
  blobColors: ['#fbbf24', '#2dd4bf'],
}
