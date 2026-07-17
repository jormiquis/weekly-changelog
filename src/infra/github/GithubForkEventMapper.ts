import { Activity } from '../../domain/Activity.js';
import type { EventMapper } from '../../domain/EventMapper.js'

export class GithubForkEventMapper implements EventMapper {
    canHandle(event: any): boolean {
        // event.public guards against leaking private-repo activity into the public dashboard.
        return event.public === true && event.type === 'ForkEvent'
    }

    map(event: any): Activity {
        const forkee = event.payload?.forkee ?? {};

        return Activity.create(new Date(event.created_at), {
            source: 'github',
            type: 'ForkEvent',
            sourceRepo: event.repo.name,
            fork: forkee.full_name ?? event.repo.name,
            forkUrl: forkee.html_url ?? `https://github.com/${forkee.full_name ?? event.repo.name}`,
        })
    }
}
