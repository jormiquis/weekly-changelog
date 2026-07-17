import type { Activity } from './Activity.js';
import { isPushEvent, isCreateRepoEvent, isForkEvent, isNotionEntry } from './ActivityMeta.js';

export type TimelineEventType = 'push' | 'repo' | 'fork' | 'note'

export interface TimelineEvent {
  type: TimelineEventType
  /** ISO timestamp of when the event occurred. */
  occurredAt: string
  title: string
  /** Short metadata line, e.g. "12 commits · +340 −50". */
  meta: string
  repo?: string
}

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

export function buildTimeline(activities: Activity[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const activity of activities) {
    const meta = activity.metaData;
    const occurredAt = activity.occurredAt.toISOString();

    if (isPushEvent(meta)) {
      const count = meta.commitMessages.length;
      events.push({
        type: 'push',
        occurredAt,
        title: `Pushed to ${repoShortName(meta.repo.name)}`,
        meta: `${count} commit${count === 1 ? '' : 's'} · +${meta.additions ?? 0} −${meta.deletions ?? 0}`,
        repo: repoShortName(meta.repo.name),
      });
    } else if (isCreateRepoEvent(meta)) {
      events.push({
        type: 'repo',
        occurredAt,
        title: `Created ${repoShortName(meta.repo)}`,
        meta: meta.description || 'New repository',
        repo: repoShortName(meta.repo),
      });
    } else if (isForkEvent(meta)) {
      events.push({
        type: 'fork',
        occurredAt,
        title: `Forked ${repoShortName(meta.sourceRepo)}`,
        meta: `from ${meta.sourceRepo}`,
        repo: repoShortName(meta.fork),
      });
    } else if (isNotionEntry(meta)) {
      events.push({
        type: 'note',
        occurredAt,
        title: meta.title,
        meta: meta.tags.length > 0 ? meta.tags.join(' · ') : 'Note',
      });
    }
  }

  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
