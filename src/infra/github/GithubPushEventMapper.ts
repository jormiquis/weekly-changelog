import { Activity } from '../../domain/Activity.js';
import type { EventMapper } from '../../domain/EventMapper.js';

export class GithubPushEventMapper implements EventMapper {
    canHandle(event: any): boolean {
        const [owner = '', repo = ''] = event.repo.name.split('/');
        return event.type === 'PushEvent' && owner === event.actor?.login;
    }

    map(event: any): Activity {
        const rawCommits = event.rawCommits.commits;

        const commitMessages = rawCommits.map((commit: { commit: { message: any; }; }) => ({
            message: commit.commit.message,
        }));

        return Activity.create(new Date(event.created_at),{
            repo: event.repo,
            type: 'PushEvent',
            diff: rawCommits.diff_url,
            commitMessages
        });
    }
}
