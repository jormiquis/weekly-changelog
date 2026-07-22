import type { Activity } from '../../domain/Activity.js';
import type { Post } from '../../domain/Post.js';

const HASHTAGS = '#BuildInPublic #SoftwareEngineering #DevCommunity #WeeklyChangelog'

export interface BuildPostOptions {
  version: string
  dashboardUrl: string
  imagePath: string
  activities: Activity[]
}

/**
 * Builds a deterministic LinkedIn post — no AI. It links to the dashboard and hashtags.
 */
export function buildPost(options: BuildPostOptions): Post {
  const { version, dashboardUrl, imagePath } = options

  const lines: string[] = [`📋 Weekly personal work diary — ${version}`, '']

  lines.push('Detailed technical dashboard', dashboardUrl, '', HASHTAGS)

  return { text: lines.join('\n'), imagePath, link: dashboardUrl }
}
