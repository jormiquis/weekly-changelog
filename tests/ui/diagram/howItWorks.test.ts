import { describe, it, expect } from 'vitest';
import { howItWorksSvg } from '../../../src/ui/diagram/howItWorks.js';
import { darkPalette, themedPalette } from '../../../src/ui/diagram/DiagramPalette.js';

describe('howItWorksSvg', () => {
  it('draws every stage of the pipeline, from the cron to both outcomes', () => {
    const svg = howItWorksSvg(darkPalette)

    for (const label of ['GitHub Actions', 'GitHub', 'Notion', 'Activity[]', 'Mistral', 'Groq', 'card.png', 'dashboard.html', 'Telegram', 'LinkedIn', 'Discarded']) {
      expect(svg).toContain(label)
    }
  })

  it('names the ports the arrows cross, so the hexagon reads as ports & adapters', () => {
    const svg = howItWorksSvg(darkPalette)

    expect(svg).toContain('SourceRetriever')
    expect(svg).toContain('SourceSynthesizer')
    expect(svg).toContain('Checker')
    expect(svg).toContain('Sender')
    expect(svg).toContain('<polygon')
  })

  it('escapes ampersands so the markup stays well-formed for the SVG parser', () => {
    const svg = howItWorksSvg(darkPalette)

    expect(svg).toContain('ports &amp; adapters')
    expect(svg).not.toMatch(/&(?!amp;|lt;|gt;|#)/)
  })

  it('scales to its container instead of a fixed size, and carries a text alternative', () => {
    const svg = howItWorksSvg(themedPalette)

    expect(svg).toContain('viewBox="0 0 1200 900"')
    expect(svg).not.toMatch(/<svg[^>]*\swidth=/)
    expect(svg).toContain('role="img"')
    expect(svg).toContain('aria-label="How the weekly changelog works')
  })

  it('paints from the palette it is given, so the dashboard copy follows the page theme', () => {
    const themed = howItWorksSvg(themedPalette)

    expect(themed).toContain('var(--text-primary)')
    expect(themed).toContain('var(--accent-purple)')
    expect(themed).not.toContain('#ffffff')
  })

  it('takes the heading from the caller', () => {
    expect(howItWorksSvg(darkPalette)).toContain('>Weekly Changelog<')
    expect(howItWorksSvg(darkPalette, 'How this works')).toContain('>How this works<')
  })
})
