import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { CardData, SideProjectBullet } from './CardData.js';
import { type CardTheme, defaultTheme } from './CardTheme.js';

const fontsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'fonts')

const fonts = [
  { name: 'Poppins', data: readFileSync(join(fontsDir, 'Poppins-Regular.ttf')), weight: 400 as const, style: 'normal' as const },
  { name: 'Poppins', data: readFileSync(join(fontsDir, 'Poppins-Medium.ttf')), weight: 500 as const, style: 'normal' as const },
  { name: 'Poppins', data: readFileSync(join(fontsDir, 'Poppins-SemiBold.ttf')), weight: 600 as const, style: 'normal' as const },
  { name: 'Poppins', data: readFileSync(join(fontsDir, 'Poppins-Bold.ttf')), weight: 700 as const, style: 'normal' as const },
]

async function loadAdditionalAsset(languageCode: string, segment: string) {
  if (languageCode === 'emoji') {
    const codepoints = [...segment].map((char) => char.codePointAt(0)!.toString(16)).join('-')
    const response = await fetch(`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`)
    const svg = await response.text()
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  }
  return []
}

const SIDE_PROJECTS_ACCENT = '#2fae2f'
const AT_WORK_ACCENT = '#a78bfa'
const LEARNINGS_ACCENT = '#d55181'
const VERSION_ACCENT = '#3987e5'
const COLUMN_GAP = 22
const OUTER_PADDING_X = 56 // matches the card body's horizontal padding
const COLUMN_PADDING_X = 26
// px of bullet text per character at the 21px font, derived from the 3-column baseline (297px ≈ 25 chars).
const BASELINE_CHAR_PX = 297 / 25

/** The width of the three sizing quantities a column needs, derived from the column count. */
interface ColumnLayout { width: number; textWidth: number; charsPerLine: number }

function computeLayout(count: number, contentWidth: number): ColumnLayout {
  const width = Math.floor((contentWidth - (count - 1) * COLUMN_GAP) / count)
  const textWidth = width - COLUMN_PADDING_X * 2
  const charsPerLine = Math.max(8, Math.round(textWidth / BASELINE_CHAR_PX))
  return { width, textWidth, charsPerLine }
}

interface SatoriNode {
  type: string
  props: { style: Record<string, unknown>; children?: unknown }
}

/** A text leaf. Satori measures text height wrong if the leaf itself is display:flex, so leaves stay block. */
function text(content: string, style: Record<string, unknown>): SatoriNode {
  return { type: 'div', props: { style, children: content } }
}

function box(style: Record<string, unknown>, children: SatoriNode[]): SatoriNode {
  return { type: 'div', props: { style: { display: 'flex', ...style }, children } }
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const value = parseInt(clean, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const LINE_PX = 38
const LABEL_LINE_PX = 28
const SECTION_GAP = 12

/**
 * A block of bullets inside a column, optionally introduced by a label — side
 * projects use it to say which project the bullets under it apply to; the other
 * columns are a single unlabelled section.
 */
interface Section { label: string; bullets: string[] }

/** Estimated rendered lines for a "•  {value}" bullet (accounts for word wrap, no ellipsis). */
function bulletLines(value: string, charsPerLine: number): number {
  return Math.max(1, Math.ceil((value.length + 3) / charsPerLine))
}

/** Total px a column's sections occupy (one empty line for the empty placeholder). */
function contentHeight(sections: Section[], charsPerLine: number): number {
  if (sections.length === 0) return LINE_PX

  const sectionsPx = sections.reduce((sum, section) => {
    const bulletsPx = section.bullets.reduce((lines, value) => lines + bulletLines(value, charsPerLine), 0) * LINE_PX
    return sum + (section.label ? LABEL_LINE_PX : 0) + bulletsPx
  }, 0)

  return sectionsPx + (sections.length - 1) * SECTION_GAP
}

/** One labelled (or unlabelled) block of bullets. Heights are explicit — satori under-measures hard-wrapped blocks. */
function section(theme: CardTheme, accent: string, { label, bullets }: Section, layout: ColumnLayout): SatoriNode {
  const bulletBlock = bullets.map(value => `•  ${value}`).join('\n')
  const bulletsPx = bullets.reduce((lines, value) => lines + bulletLines(value, layout.charsPerLine), 0) * LINE_PX

  return box({ flexDirection: 'column', width: `${layout.textWidth}px` }, [
    ...(label ? [text(label, {
      height: `${LABEL_LINE_PX}px`,
      fontSize: '16px',
      fontWeight: 600,
      letterSpacing: '0.04em',
      lineHeight: `${LABEL_LINE_PX}px`,
      color: hexToRgba(accent, 0.85),
    })] : []),
    text(bulletBlock, {
      width: `${layout.textWidth}px`,
      height: `${bulletsPx}px`,
      whiteSpace: 'pre-wrap',
      fontSize: '21px',
      fontWeight: 500,
      lineHeight: `${LINE_PX}px`,
      color: theme.textPrimary,
    })
  ])
}

function column(theme: CardTheme, accent: string, emoji: string, title: string, sections: Section[], height: number, layout: ColumnLayout): SatoriNode {
  const body = sections.length > 0
    ? sections.map(current => section(theme, accent, current, layout))
    : [text('—', { fontSize: '21px', fontWeight: 500, lineHeight: `${LINE_PX}px`, color: theme.textMuted })]

  return box({
    flexDirection: 'column',
    width: `${layout.width}px`,
    height: `${height}px`,
    flexShrink: 0,
    gap: '18px',
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderTop: `4px solid ${accent}`,
    borderRadius: '20px',
    padding: `30px ${COLUMN_PADDING_X}px`,
  }, [
    text(`${emoji}  ${title}`, { fontSize: '18px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent }),
    box({ flexDirection: 'column', gap: `${SECTION_GAP}px` }, body),
  ])
}

/** Side-project bullets, grouped under the project they apply to, in first-seen order. */
function byProject(bullets: SideProjectBullet[]): Section[] {
  const sections: Section[] = []

  for (const { project, text: value } of bullets) {
    const label = project.trim()
    const current = sections.find(existing => existing.label === label)

    if (current) current.bullets.push(value)
    else sections.push({ label, bullets: [value] })
  }

  return sections
}

/** A column with no grouping: a single unlabelled section, absent when there is nothing to show. */
function flat(bullets: string[]): Section[] {
  return bullets.length > 0 ? [{ label: '', bullets }] : []
}

function header(theme: CardTheme, data: CardData, title: string, subtitle: string): SatoriNode {
  return box({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
    box({ flexDirection: 'row', alignItems: 'center', gap: '18px' }, [
      text('📋', { fontSize: '46px' }),
      box({ flexDirection: 'column' }, [
        text(title, { fontSize: '40px', fontWeight: 700, letterSpacing: '0.02em', color: theme.textPrimary }),
        text(subtitle, { fontSize: '19px', fontWeight: 400, color: theme.textMuted, marginTop: '2px' })
      ])
    ]),
    box({ flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }, [
      text(data.version, { fontSize: '22px', fontWeight: 600, color: VERSION_ACCENT, backgroundColor: hexToRgba(VERSION_ACCENT, 0.14), padding: '8px 20px', borderRadius: '999px' }),
      text(data.week, { fontSize: '17px', color: theme.textMuted })
    ])
  ])
}

export async function renderCard(data: CardData, theme: CardTheme = defaultTheme): Promise<Buffer> {
  const title = data.title ?? 'Changelog'
  const subtitle = data.subtitle ?? 'Weekly engineering release'

  // "At work" only appears when there are day-job entries; the other two are always shown.
  const columns = [
    { accent: SIDE_PROJECTS_ACCENT, emoji: '🚀', title: 'Side projects', sections: byProject(data.sideProjects) },
    ...(data.atWork.length > 0 ? [{ accent: AT_WORK_ACCENT, emoji: '💼', title: 'At work', sections: flat(data.atWork) }] : []),
    { accent: LEARNINGS_ACCENT, emoji: '📚', title: 'Learnings', sections: flat(data.learnings) },
  ]

  const layout = computeLayout(columns.length, theme.width - OUTER_PADDING_X * 2)

  // Header (~30) + gap (18) + content + vertical padding (60); all columns share the taller one.
  const maxContent = Math.max(...columns.map(c => contentHeight(c.sections, layout.charsPerLine)))
  // Floor keeps the columns filling the card now that the stats bar is gone; content taller than the floor still grows.
  const MIN_COLUMN_HEIGHT = 480
  const columnHeight = Math.max(30 + 18 + maxContent + 60, MIN_COLUMN_HEIGHT)

  const svg = await satori(
    box({ width: `${theme.width}px`, height: `${theme.height}px`, background: theme.background, fontFamily: theme.fontFamily }, [
      box({ flexDirection: 'column', width: '100%', height: '100%', padding: `52px ${OUTER_PADDING_X}px` }, [
        header(theme, data, title, subtitle),
        box({ flexDirection: 'row', gap: `${COLUMN_GAP}px`, marginTop: '34px' },
          columns.map(c => column(theme, c.accent, c.emoji, c.title, c.sections, columnHeight, layout)),
        ),
      ])
    ]),
    { width: theme.width, height: theme.height, fonts, loadAdditionalAsset }
  )

  const resvg = new Resvg(svg)
  return resvg.render().asPng()
}
