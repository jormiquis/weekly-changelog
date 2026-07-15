import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { CardData, CardSection } from './CardData.js';
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

const MAX_REPOS_SHOWN = 4
const MAX_NOTES_SHOWN = 2

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const value = parseInt(clean, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function statItem(theme: CardTheme, value: string | number, label: string) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column' },
      children: [
        { type: 'div', props: { style: { fontSize: '34px', fontWeight: 700, color: theme.textPrimary }, children: String(value) } },
        { type: 'div', props: { style: { fontSize: '16px', color: theme.textMuted, marginTop: '2px' }, children: label } }
      ]
    }
  }
}

function repoChip(theme: CardTheme, accent: string, name: string, commits: number) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 18px',
        borderRadius: '999px',
        backgroundColor: hexToRgba(accent, 0.12),
      },
      children: [
        { type: 'div', props: { style: { fontSize: '17px', fontWeight: 500, color: theme.textPrimary }, children: name } },
        { type: 'div', props: { style: { fontSize: '16px', fontWeight: 600, color: accent }, children: `${commits} commit${commits === 1 ? '' : 's'}` } }
      ]
    }
  }
}

function moreIndicator(theme: CardTheme, count: number, label: string) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', alignItems: 'center', fontSize: '16px', fontWeight: 500, color: theme.textMuted, padding: '12px 6px' },
      children: `+${count} more ${label}${count === 1 ? '' : 's'}`
    }
  }
}

function tagPill(accent: string, text: string, size: 'md' | 'sm' = 'md') {
  const sizes = {
    md: { fontSize: '16px', padding: '8px 18px' },
    sm: { fontSize: '14px', padding: '6px 16px' },
  }
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        backgroundColor: hexToRgba(accent, 0.16),
        color: accent,
        fontWeight: 500,
        borderRadius: '999px',
        ...sizes[size],
      },
      children: text
    }
  }
}

function noteRow(theme: CardTheme, accent: string, note: { emoji: string; title: string; tags: string[] }) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '14px 18px',
        borderRadius: '14px',
        backgroundColor: hexToRgba(accent, 0.1),
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' },
            children: [
              { type: 'div', props: { style: { display: 'flex', fontSize: '20px' }, children: note.emoji } },
              { type: 'div', props: { style: { fontSize: '17px', fontWeight: 500, color: theme.textPrimary }, children: note.title } }
            ]
          }
        },
        note.tags.length > 0 && {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'row', gap: '8px', flexWrap: 'wrap' },
            children: note.tags.map(tag => tagPill(accent, tag, 'sm'))
          }
        }
      ].filter(Boolean)
    }
  }
}

function sectionBar(theme: CardTheme, section: CardSection) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '32px',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderLeft: `4px solid ${section.accent}`,
        borderRadius: '20px',
        padding: '28px 32px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', width: '300px', flexShrink: 0 },
            children: [
              { type: 'div', props: { style: { fontSize: '25px', fontWeight: 600, color: theme.textPrimary }, children: section.title } },
              { type: 'div', props: { style: { fontSize: '16px', color: theme.textMuted, marginTop: '4px' }, children: section.subtitle } }
            ]
          }
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flex: 1, minWidth: 0 },
            children: [
              section.repos && {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '10px' },
                  children: [
                    ...section.repos.slice(0, MAX_REPOS_SHOWN).map(repo => repoChip(theme, section.accent, repo.name, repo.commits)),
                    section.repos.length > MAX_REPOS_SHOWN && moreIndicator(theme, section.repos.length - MAX_REPOS_SHOWN, 'repo')
                  ].filter(Boolean)
                }
              },
              section.stats && {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'row', gap: '40px' },
                  children: section.stats.map(stat => statItem(theme, stat.value, stat.label))
                }
              },
              section.notes && {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' },
                  children: [
                    ...section.notes.slice(0, MAX_NOTES_SHOWN).map(note => noteRow(theme, section.accent, note)),
                    section.notes.length > MAX_NOTES_SHOWN && moreIndicator(theme, section.notes.length - MAX_NOTES_SHOWN, 'note')
                  ].filter(Boolean)
                }
              }
            ].filter(Boolean)
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
                    style: { display: 'flex', flexDirection: 'column', gap: '22px', flex: 1, marginTop: '40px', justifyContent: 'flex-start' },
                    children: data.sections.map(section => sectionBar(theme, section))
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
