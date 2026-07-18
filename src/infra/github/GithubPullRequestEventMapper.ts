import { Activity } from '../../domain/Activity.js';
import type { EventMapper } from '../../domain/EventMapper.js'

/**
 * Maps a GitHub Search API issue item (restricted to pull requests authored by
 * the user in third-party repos) to a PullRequestEvent activity.
 *
 * The search feed — unlike the events feed — surfaces a PR even when someone
 * else merges it, which is exactly what an open-source contribution needs.
 */
export class GithubPullRequestEventMapper implements EventMapper {
    canHandle(item: any): boolean {
        // Only PR search items carry a `pull_request` sub-object.
        if (!item?.pull_request) return false

        // Keep the two casuistics only: opened (still open) or merged.
        // Closed-but-not-merged PRs are dropped.
        const merged = Boolean(item.pull_request.merged_at)
        const open = item.state === 'open'
        return merged || open
    }

    map(item: any): Activity {
        const mergedAt: string | null = item.pull_request?.merged_at ?? null
        const state = mergedAt ? 'merged' : 'opened'
        // A merged PR "happened" when it landed; an open one, when it was raised.
        const occurredAt = mergedAt ?? item.created_at

        return Activity.create(new Date(occurredAt), {
            source: 'github',
            type: 'PullRequestEvent',
            state,
            repo: repoFromApiUrl(item.repository_url),
            number: item.number,
            title: item.title,
            url: item.html_url,
        })
    }
}

/** "https://api.github.com/repos/vercel/next.js" -> "vercel/next.js". */
function repoFromApiUrl(repositoryUrl: string): string {
    return repositoryUrl?.split('/repos/')[1] ?? ''
}
