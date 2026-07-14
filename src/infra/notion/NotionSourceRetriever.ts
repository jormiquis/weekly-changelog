import type { EventMapper } from "../../domain/EventMapper.js";
import { SourceRetriever } from "../../domain/SourceRetriever.js";
import { Client } from '@notionhq/client'

export class NotionSourceRetriever extends SourceRetriever {

    constructor(
        private readonly notion: Client,
        private readonly databaseId: string,
        mappers: EventMapper[]
    ) {
        super(mappers);
    }

   async fetchAll(): Promise<any[]> {
    const response = await this.notion.dataSources.query({ data_source_id: this.databaseId });

    return response.results;
}

}