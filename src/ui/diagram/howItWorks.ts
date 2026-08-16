import type { DiagramPalette } from './DiagramPalette.js';
import { icon, type IconName } from './icons.js';

const WIDTH = 1200
const HEIGHT = 900
const COLS = [52, 344, 636, 928]
const BOX_W = 200
const SPINE_Y = 420
const SPINE_H = 150
const SPINE_MID = SPINE_Y + SPINE_H / 2
const HEX_R = 100
const HEX_X = COLS[1]! + BOX_W / 2
const HEX_HALF_H = HEX_R * Math.sqrt(3) / 2

const centre = (column: number): number => COLS[column]! + BOX_W / 2

/** Labels are authored here, but they still carry `&` — keep the SVG well-formed. */
function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

interface TextOptions {
  size?: number
  fill: string
  weight?: number
  anchor?: 'start' | 'middle' | 'end'
  spacing?: number
}

function text(x: number, y: number, content: string, options: TextOptions): string {
  const { size = 13, fill, weight = 400, anchor = 'middle', spacing = 0 } = options
  const letterSpacing = spacing ? ` letter-spacing="${spacing}"` : ''
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${letterSpacing}>${escapeXml(content)}</text>`
}

interface BoxOptions {
  fill: string
  stroke: string
  radius?: number
  dashed?: boolean
}

function box(x: number, y: number, width: number, height: number, options: BoxOptions): string {
  const { fill, stroke, radius = 14, dashed = false } = options
  const dash = dashed ? ' stroke-dasharray="7 6"' : ''
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"${dash}/>`
}

/** A flat-top hexagon — the domain, with a vertex pointing at each neighbour. */
function hexagon(cx: number, cy: number, r: number, options: BoxOptions): string {
  const half = r * Math.sqrt(3) / 2
  const points = [
    [cx + r, cy], [cx + r / 2, cy - half], [cx - r / 2, cy - half],
    [cx - r, cy], [cx - r / 2, cy + half], [cx + r / 2, cy + half],
  ].map(([x, y]) => `${x!.toFixed(1)},${y!.toFixed(1)}`).join(' ')
  return `<polygon points="${points}" fill="${options.fill}" stroke="${options.stroke}" stroke-width="1.8"/>`
}

/** A straight arrow with a solid head, so it survives renderers without marker support. */
function arrow(x1: number, y1: number, x2: number, y2: number, colour: string): string {
  const length = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / length
  const uy = (y2 - y1) / length
  const head = 7
  const baseX = x2 - ux * head * 1.7
  const baseY = y2 - uy * head * 1.7
  const perpX = -uy * head * 0.62
  const perpY = ux * head * 0.62
  return `<line x1="${x1}" y1="${y1}" x2="${baseX.toFixed(1)}" y2="${baseY.toFixed(1)}" stroke="${colour}" stroke-width="1.8" stroke-linecap="round"/>`
    + `<polygon points="${x2},${y2} ${(baseX + perpX).toFixed(1)},${(baseY + perpY).toFixed(1)} ${(baseX - perpX).toFixed(1)},${(baseY - perpY).toFixed(1)}" fill="${colour}"/>`
}

/** Drops from (x1, y1), turns at `turnY`, and arrives pointing down at (x2, y2). */
function elbow(x1: number, y1: number, x2: number, y2: number, turnY: number, colour: string): string {
  return `<path d="M ${x1} ${y1} V ${turnY} H ${x2}" fill="none" stroke="${colour}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
    + arrow(x2, turnY, x2, y2, colour)
}

/** An icon-led row inside a two-item box: mark on the left, title and detail beside it. */
function row(x: number, top: number, name: IconName, title: string, detail: string, palette: DiagramPalette): string {
  return icon(name, x + 20, top, 22, palette.textPrimary)
    + text(x + 52, top + 10, title, { size: 17, weight: 600, fill: palette.textPrimary, anchor: 'start' })
    + text(x + 52, top + 29, detail, { size: 11.5, fill: palette.textMuted, anchor: 'start' })
}

function pill(x: number, label: string, palette: DiagramPalette, highlight = false): { markup: string; width: number } {
  const width = 26 + label.length * 7.4
  const markup = box(x, 826, width, 40, { fill: palette.surface, stroke: palette.border, radius: 20 })
    + text(x + width / 2, 851, label, { size: 13, fill: highlight ? palette.textPrimary : palette.textMuted })
  return { markup, width }
}

/**
 * The one-picture explanation of the pipeline: what triggers it, which adapters
 * feed the domain, where the AI hangs off to the side, and the human gate that
 * decides whether anything is published at all.
 */
export function howItWorksSvg(palette: DiagramPalette, heading = 'Weekly Changelog'): string {
  const parts: string[] = []
  const at = (column: number) => centre(column)

  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="${palette.background}"/>`)

  // Header
  parts.push(text(52, 86, heading, { size: 38, weight: 700, fill: palette.textPrimary, anchor: 'start' }))
  parts.push(text(52, 118, 'A week of commits and notes, turned into a post — and nothing published without a human yes.', { size: 16, fill: palette.textMuted, anchor: 'start' }))

  // Trigger
  parts.push(box(52, 196, 240, 100, { fill: palette.surface, stroke: palette.border }))
  parts.push(icon('github', 76, 233, 26, palette.textPrimary))
  parts.push(text(118, 242, 'GitHub Actions', { size: 18, weight: 600, fill: palette.textPrimary, anchor: 'start' }))
  parts.push(text(118, 264, 'cron · every Wed 07:25 UTC', { size: 12, fill: palette.textMuted, anchor: 'start' }))
  parts.push(arrow(222, 306, 222, 412, palette.line))

  // AI chain — a branch off the spine, never a step in it
  parts.push(box(380, 190, 520, 152, { fill: palette.aiSurface, stroke: palette.ai, radius: 18, dashed: true }))
  parts.push(text(640, 218, 'SourceSynthesizer · first free-tier provider that answers wins', { size: 11.5, fill: palette.ai, spacing: 0.6 }))
  const provider = (x: number, name: string, role: string) =>
    box(x, 238, 200, 84, { fill: palette.surface, stroke: palette.border })
    + icon('spark', x + 14, 252, 18, palette.ai)
    + text(x + 100, 282, name, { size: 19, weight: 600, fill: palette.textPrimary })
    + text(x + 100, 304, role, { size: 12, fill: palette.textMuted })
  parts.push(provider(400, 'Mistral', 'primary'))
  parts.push(provider(680, 'Groq', 'fallback'))
  parts.push(arrow(606, 280, 674, 280, palette.ai))
  parts.push(text(640, 266, 'on error', { size: 10.5, fill: palette.ai }))

  parts.push(arrow(HEX_X, SPINE_MID - HEX_HALF_H - 6, HEX_X, 350, palette.ai))
  parts.push(text(HEX_X - 10, 380, 'activities', { size: 11, fill: palette.ai, anchor: 'end' }))
  parts.push(arrow(at(2), 350, at(2), SPINE_Y - 8, palette.ai))
  parts.push(text(at(2) + 10, 380, 'digest (optional)', { size: 11, fill: palette.ai, anchor: 'start' }))

  // Stage labels
  const stages = ['SOURCES', 'DOMAIN', 'RENDER', 'APPROVAL']
  stages.forEach((stage, index) => {
    parts.push(text(COLS[index]! + 4, 404, stage, { size: 11.5, fill: palette.textMuted, anchor: 'start', spacing: 3 }))
  })

  // Sources
  parts.push(box(COLS[0]!, SPINE_Y, BOX_W, SPINE_H, { fill: palette.surface, stroke: palette.border }))
  parts.push(row(COLS[0]!, 452, 'github', 'GitHub', 'commits · PRs · repos', palette))
  parts.push(`<line x1="${COLS[0]! + 20}" y1="498" x2="${COLS[0]! + BOX_W - 20}" y2="498" stroke="${palette.border}" stroke-width="1"/>`)
  parts.push(row(COLS[0]!, 518, 'notion', 'Notion', 'notes · learnings', palette))

  // Domain
  parts.push(hexagon(HEX_X, SPINE_MID, HEX_R, { fill: palette.surface, stroke: palette.textSecondary }))
  parts.push(text(HEX_X, 490, 'Activity[]', { size: 23, weight: 600, fill: palette.textPrimary }))
  parts.push(text(HEX_X, 514, 'pure domain · last 7 days', { size: 11.5, fill: palette.textMuted }))
  parts.push(text(HEX_X, 620, 'every labelled arrow is a port — swap the adapter, the hexagon never moves', { size: 11.5, fill: palette.textMuted }))

  // Render
  parts.push(box(COLS[2]!, SPINE_Y, BOX_W, SPINE_H, { fill: palette.surface, stroke: palette.border }))
  parts.push(row(COLS[2]!, 452, 'image', 'card.png', 'satori + resvg', palette))
  parts.push(`<line x1="${COLS[2]! + 20}" y1="498" x2="${COLS[2]! + BOX_W - 20}" y2="498" stroke="${palette.border}" stroke-width="1"/>`)
  parts.push(row(COLS[2]!, 518, 'browser', 'dashboard.html', 'GitHub Pages', palette))

  // Human gate
  parts.push(box(COLS[3]!, SPINE_Y, BOX_W, SPINE_H, { fill: palette.gateSurface, stroke: palette.gate }))
  parts.push(icon('telegram', at(3) - 15, 446, 30, palette.gate))
  parts.push(text(at(3), 508, 'Telegram', { size: 19, weight: 600, fill: palette.textPrimary }))
  parts.push(text(at(3), 528, 'the card lands in my chat', { size: 11.5, fill: palette.textMuted }))
  parts.push(text(at(3), 549, 'I reply  yes / no', { size: 12.5, weight: 500, fill: palette.gate }))

  // Spine arrows, named after the port they cross
  parts.push(arrow(COLS[0]! + BOX_W + 4, SPINE_MID, HEX_X - HEX_R - 4, SPINE_MID, palette.line))
  parts.push(text((COLS[0]! + BOX_W + HEX_X - HEX_R) / 2, SPINE_MID - 14, 'SourceRetriever', { size: 10.5, fill: palette.textMuted }))
  parts.push(arrow(HEX_X + HEX_R + 4, SPINE_MID, COLS[2]! - 4, SPINE_MID, palette.line))
  parts.push(text((HEX_X + HEX_R + COLS[2]!) / 2, SPINE_MID - 14, 'render', { size: 10.5, fill: palette.textMuted }))
  parts.push(arrow(COLS[2]! + BOX_W + 4, SPINE_MID, COLS[3]! - 4, SPINE_MID, palette.line))
  parts.push(text((COLS[2]! + BOX_W + COLS[3]!) / 2, SPINE_MID - 14, 'Checker', { size: 10.5, fill: palette.textMuted }))

  // Outcomes
  parts.push(box(COLS[2]!, 646, BOX_W, 112, { fill: palette.surface, stroke: palette.border }))
  parts.push(icon('blocked', at(2) - 11, 672, 22, palette.textMuted))
  parts.push(text(at(2), 716, 'Discarded', { size: 17, weight: 600, fill: palette.textSecondary }))
  parts.push(text(at(2), 736, 'nothing is published', { size: 11.5, fill: palette.textMuted }))

  parts.push(box(COLS[3]!, 646, BOX_W, 112, { fill: palette.publishSurface, stroke: palette.publish }))
  parts.push(icon('linkedin', at(3) - 12, 670, 24, palette.publish))
  parts.push(text(at(3), 716, 'LinkedIn', { size: 17, weight: 600, fill: palette.textPrimary }))
  parts.push(text(at(3), 736, 'post + card + dashboard', { size: 11.5, fill: palette.textMuted }))

  parts.push(elbow(at(3), SPINE_Y + SPINE_H, at(2), 638, 606, palette.line))
  parts.push(arrow(at(3), 606, at(3), 638, palette.publish))
  parts.push(text(at(2) - 10, 630, 'no', { size: 12, fill: palette.textMuted, anchor: 'end' }))
  parts.push(text(at(3) + 10, 630, 'yes · Sender', { size: 12, fill: palette.publish, anchor: 'start' }))

  // Footer claims
  parts.push(`<line x1="52" y1="798" x2="1148" y2="798" stroke="${palette.border}" stroke-width="1"/>`)
  let x = 52
  const claims: [string, boolean][] = [
    ['TypeScript · ports & adapters', false],
    ['1 LLM call per week', false],
    ['every provider on a free tier', false],
    ['no AI? it still ships', true],
  ]
  for (const [label, highlight] of claims) {
    const { markup, width } = pill(x, label, palette, highlight)
    parts.push(markup)
    x += width + 14
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" font-family="Poppins, sans-serif" aria-label="How the weekly changelog works: a GitHub Actions cron pulls GitHub and Notion activity into a domain hexagon, an optional free-tier LLM chain adds a digest, a card and dashboard are rendered, and a Telegram approval decides whether the post reaches LinkedIn.">${parts.join('')}</svg>`
}
