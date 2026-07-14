import { Activity } from "../domain/Activity.js";
import { SourceRetriever } from "../domain/SourceRetriever.js";
import { Client } from '@notionhq/client'

export class NotionSourceRetriever extends SourceRetriever {

    constructor(
        private readonly notion: Client,
        private readonly databaseId: string
    ) {
        super([]);
    }

   async fetchAll(): Promise<any[]> {
    const response = await this.notion.dataSources.query({ data_source_id: this.databaseId });

    return response.results
}

    mapToActivity(raw: any[]): Activity[] {
    return raw.map(page => Activity.create(
      new Date(page.last_edited_time),
      {
        source: 'notion',
        title: page.properties?.Name?.title?.[0]?.plain_text ?? '',
        tags: page.properties?.Tags?.multi_select?.map((tag: { name: any; }) => tag.name) ?? [],
        url: page.url
      }
    ))
  }

}