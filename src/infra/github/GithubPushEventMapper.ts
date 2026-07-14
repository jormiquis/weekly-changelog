import { Activity } from '../../domain/Activity.js';
import type { EventMapper } from '../../domain/EventMapper.js'

export class GithubPushEventMapper implements EventMapper {
    canHandle(event: any): boolean {
        return event.type === 'PushEvent'
    }

    map(event: any): Activity {
        const rawCommits = event.rawCommits.commits;

        const commitMessages = rawCommits.map((commit: { message: string; }) => ({
            message: commit.message,
        }));

        return Activity.create(new Date(event.created_at),{
            repo: event.repo,
            type: 'GithubPushEvent',
            diff: rawCommits.diff_url,
            commitMessages
        });
    }
}
