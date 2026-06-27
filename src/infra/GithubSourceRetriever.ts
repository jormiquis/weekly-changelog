import type { Octokit } from "octokit";
import { Activity } from "../domain/Activity.js";
import { SourceRetriever } from "../domain/SourceRetriever.js";

export class GithubSourceRetriever extends SourceRetriever {

    constructor(
        private readonly retriever: Octokit,
        private readonly userName: string
    ) {
        super();
    }

    async fetchAll(): Promise<any[]> {
        const response = await this.retriever.rest.activity.listPublicEventsForUser({ username: this.userName });

        return response.data;
    }

    mapToActivity(raw: any[]): Activity[] {
        return raw.map(event => Activity.create(new Date(event.created_at), event));
    }

}