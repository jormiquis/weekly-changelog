import { Activity } from '../../domain/Activity.js';
import type { EventMapper } from '../../domain/EventMapper.js';

export class GithubPushEventMapper implements EventMapper {
    canHandle(event: any): boolean {
        const [owner = '', repo = ''] = event.repo.name.split('/');
        return event.type === 'PushEvent' && owner === event.actor?.login;
    }

    map(event: any): Activity {
        const commitMessages = event.rawCommits.commits.map((commit: { commit: { message: any; }; }) => ({
            message: commit.commit.message,
        }));

        return Activity.create(new Date(event.created_at),{
            repo: event.repo,
            type: 'PushEvent',
            diff: event.rawCommits.diff_url,
            commitMessages
        });
    }
}
