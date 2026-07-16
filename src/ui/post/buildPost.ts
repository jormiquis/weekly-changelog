import type { Post } from '../../domain/Post.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';

const HASHTAGS = '#BuildInPublic #SoftwareEngineering #DevCommunity #WeeklyChangelog'
const MAX_HIGHLIGHTS = 3

export interface BuildPostOptions {
  week: string
  dashboardUrl: string
  imagePath: string
  digest?: SynthesizedDigest
}

/**
 * Builds a LinkedIn-optimized post. Best practices applied:
 * - Hook on the first line (shown above the "see more" fold — the single biggest
 *   reach factor in the LinkedIn algorithm).
 * - No outbound link in the body: LinkedIn deprioritizes posts with external links,
 *   so the dashboard URL travels in `Post.link` and is placed in the first comment
 *   by the sender.
 * - Native image (the card), short scannable lines, and a small set of hashtags.
 */
export function buildPost(options: BuildPostOptions): Post {
  const { week, dashboardUrl, imagePath, digest } = options

  const lines: string[] = []

  // 1) Hook first.
  lines.push(digest ? `🚀 ${digest.headline}` : `🚀 Weekly Changelog — ${week}`)
  lines.push('')

  // 2) Body.
  if (digest) {
    lines.push(digest.summary)

    const highlights = digest.highlights.slice(0, MAX_HIGHLIGHTS)
    if (highlights.length > 0) {
      lines.push('')
      for (const highlight of highlights) lines.push(`↳ ${highlight.text}`)
    }
  } else {
    lines.push("A fresh recap of this week's engineering activity.")
  }

  // 3) Soft CTA pointing to the first comment (never the raw link in the body).
  lines.push('')
  lines.push('Full weekly breakdown 👇 (link in the comments)')

  // 4) Hashtags.
  lines.push('')
  lines.push(HASHTAGS)

  return { text: lines.join('\n'), imagePath, link: dashboardUrl }
}
