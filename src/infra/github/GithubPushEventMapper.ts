import { Activity } from '../../domain/Activity.js';
import type { EventMapper } from '../../domain/EventMapper.js';

export class GithubPushEventMapper implements EventMapper {
    canHandle(event: any): boolean {
        const [owner = '', repo = ''] = event.repo.name.split('/');

        return event.public === true && event.type === 'PushEvent' && owner === event.actor?.login;
    }

    map(event: any): Activity {
        const commitMessages = event.rawCommits.commits.map((commit: { commit: { message: any; }; }) => ({
            message: commit.commit.message,
        }));

        const files = (event.rawCommits.files ?? []).map((file: { filename: string; additions: number; deletions: number; patch?: string }) => ({
            filename: file.filename,
            additions: file.additions ?? 0,
            deletions: file.deletions ?? 0,
            ...(file.patch ? { patch: file.patch } : {}),
        }));

        const additions = files.reduce((sum: number, file: { additions: number }) => sum + file.additions, 0);
        const deletions = files.reduce((sum: number, file: { deletions: number }) => sum + file.deletions, 0);

        return Activity.create(new Date(event.created_at),{
            repo: event.repo,
            type: 'PushEvent',
            diff: event.rawCommits.diff_url,
            commitMessages,
            additions,
            deletions,
            files
        });
    }
}
