/**
 * Colours the how-it-works diagram draws with. The dashboard passes CSS custom
 * properties so the inline SVG follows the page theme; the PNG export passes
 * literal colours, because resvg has no CSS variables to resolve.
 */
export interface DiagramPalette {
  background: string
  surface: string
  border: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  line: string
  ai: string
  aiSurface: string
  gate: string
  gateSurface: string
  publish: string
  publishSurface: string
}

/** Follows the dashboard theme (light or dark) through its CSS variables. */
export const themedPalette: DiagramPalette = {
  background: 'none',
  surface: 'var(--tag-bg)',
  border: 'var(--border)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  line: 'var(--text-muted)',
  ai: 'var(--accent-purple)',
  aiSurface: 'var(--accent-purple-bg)',
  gate: 'var(--accent-magenta)',
  gateSurface: 'var(--accent-magenta-bg)',
  publish: 'var(--accent-blue)',
  publishSurface: 'var(--accent-blue-bg)',
}

/** Standalone dark palette for the PNG export (LinkedIn, README). */
export const darkPalette: DiagramPalette = {
  background: '#0d0d0d',
  surface: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.12)',
  textPrimary: '#ffffff',
  textSecondary: '#c3c2b7',
  textMuted: '#898781',
  line: 'rgba(255, 255, 255, 0.34)',
  ai: '#a78bfa',
  aiSurface: 'rgba(167, 139, 250, 0.12)',
  gate: '#d55181',
  gateSurface: 'rgba(213, 81, 129, 0.14)',
  publish: '#3987e5',
  publishSurface: 'rgba(57, 135, 229, 0.14)',
}
