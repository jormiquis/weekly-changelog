import { Activity } from '../../domain/Activity.js';
import type { EventMapper } from '../../domain/EventMapper.js';

export class NotionEventMapper implements EventMapper {
    canHandle(event: any): boolean {
        return !event.in_trash
        && !event.is_archived;
    }
    map(event: any): Activity {
        const tags = event.properties.Tags.multi_select.map((tag: { name: any; }) => tag.name);

        const sources = event.properties?.Sources?.rich_text?.filter((entry: { plain_text: string; }) =>
            entry.plain_text.trim() !== '').map((entry: { plain_text: string; }) => entry.plain_text.trim()) ?? [];

        const title = event.properties.Name.title[0].plain_text;

        return Activity.create(new Date(event.last_edited_time),{
            entry_emoji: event.emoji,
            tags,
            sources,
            title
        });
    }
}