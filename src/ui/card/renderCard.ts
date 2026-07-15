import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { CardData, CardHighlight } from './CardData.js';
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

const MAX_HIGHLIGHTS_SHOWN = 10

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const value = parseInt(clean, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface SatoriNode {
  type: string
  props: { style: Record<string, unknown>; children: unknown }
}

function highlightChip(theme: CardTheme, highlight: CardHighlight, large: boolean): SatoriNode {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: large ? '16px' : '12px',
        maxWidth: large ? '520px' : '420px',
        backgroundColor: hexToRgba(highlight.accent, 0.12),
        border: `1px solid ${theme.cardBorder}`,
        borderLeft: `4px solid ${highlight.accent}`,
        borderRadius: '16px',
        padding: large ? '22px 30px' : '16px 22px',
      },
      children: [
        { type: 'div', props: { style: { display: 'flex', fontSize: large ? '36px' : '28px' }, children: highlight.emoji } },
        { type: 'div', props: { style: { display: 'flex', fontSize: large ? '22px' : '19px', fontWeight: 600, color: theme.textPrimary, lineHeight: 1.35 }, children: highlight.text } }
      ]
    }
  }
}

function moreChip(theme: CardTheme, count: number, large: boolean): SatoriNode {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: theme.cardBg,
        border: `1px dashed ${theme.cardBorder}`,
        borderRadius: '16px',
        padding: large ? '22px 30px' : '16px 22px',
      },
      children: [
        { type: 'div', props: { style: { fontSize: large ? '20px' : '18px', fontWeight: 600, color: theme.textMuted }, children: `+${count} more` } }
      ]
    }
  }
}

function emptyState(theme: CardTheme) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: '24px',
      },
      children: [
        { type: 'div', props: { style: { display: 'flex', fontSize: '42px' }, children: '🌙' } },
        { type: 'div', props: { style: { display: 'flex', fontSize: '20px', color: theme.textMuted, marginTop: '14px' }, children: 'No activity recorded this week' } }
      ]
    }
  }
}

function highlightsGrid(theme: CardTheme, highlights: CardHighlight[]) {
  if (highlights.length === 0) return emptyState(theme)

  const hasOverflow = highlights.length > MAX_HIGHLIGHTS_SHOWN
  const shownCount = hasOverflow ? MAX_HIGHLIGHTS_SHOWN - 1 : highlights.length
  const shown = highlights.slice(0, shownCount)
  const overflow = highlights.length - shownCount
  const large = shownCount + (overflow > 0 ? 1 : 0) <= 4

  const chips: SatoriNode[] = shown.map(highlight => highlightChip(theme, highlight, large))
  if (overflow > 0) chips.push(moreChip(theme, overflow, large))

  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '18px' },
            children: chips
          }
        }
      ]
    }
  }
}

export async function renderCard(data: CardData, theme: CardTheme = defaultTheme): Promise<Buffer> {
  const title = data.title ?? 'Weekly Changelog'
  const subtitle = data.subtitle ?? 'Weekly activity summary'

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          width: `${theme.width}px`,
          height: `${theme.height}px`,
          background: theme.background,
          fontFamily: theme.fontFamily,
        },
        children: [
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '56px' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { display: 'flex', flexDirection: 'row', alignItems: 'center' },
                          children: [
                            { type: 'div', props: { style: { display: 'flex', fontSize: '44px', marginRight: '18px' }, children: '📅' } },
                            {
                              type: 'div',
                              props: {
                                style: { display: 'flex', flexDirection: 'column' },
                                children: [
                                  { type: 'div', props: { style: { fontSize: '42px', fontWeight: 700, color: theme.textPrimary }, children: title } },
                                  { type: 'div', props: { style: { fontSize: '20px', fontWeight: 400, color: theme.textMuted, marginTop: '4px' }, children: subtitle } }
                                ]
                              }
                            }
                          ]
                        }
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex', backgroundColor: theme.weekPillBg, color: theme.textPrimary,
                            fontSize: '22px', fontWeight: 600, padding: '10px 24px', borderRadius: '999px',
                          },
                          children: data.week
                        }
                      }
                    ]
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', flexDirection: 'column', flex: 1, marginTop: '40px' },
                    children: [highlightsGrid(theme, data.highlights)]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    { width: theme.width, height: theme.height, fonts, loadAdditionalAsset }
  )

  const resvg = new Resvg(svg)
  return resvg.render().asPng()
}
