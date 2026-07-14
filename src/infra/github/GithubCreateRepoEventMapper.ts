import { Activity } from '../../domain/Activity.js';
import type { EventMapper } from '../../domain/EventMapper.js'

export class GithubCreateRepoEventMapper implements EventMapper {
    canHandle(event: any): boolean {
        return event.type === 'CreateEvent' && event.payload.ref_type === 'repository'
    }

    map(event: any): Activity {
        const payload = event.payload as any;

        return Activity.create(new Date(event.created_at), {
            source: 'github',
            type: 'CreateEvent',
            entityCreated: 'repository',
            repo: event.repo.name,
            description: payload.description ?? ''
        })
  }
}
