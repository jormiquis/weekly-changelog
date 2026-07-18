import type { Octokit } from "octokit";
import { SourceRetriever } from "../../domain/SourceRetriever.js";
import type { EventMapper } from "../../domain/EventMapper.js";

/**
 * Retrieves the user's pull requests to third-party-owned public repos via the
 * GitHub Search API. The events feed only carries actions the user performed,
 * so it misses PRs merged by maintainers — the search feed does not.
 */
export class GithubPullRequestRetriever extends SourceRetriever {

    constructor(
        private readonly retriever: Octokit,
        private readonly userName: string,
        mappers: EventMapper[]
    ) {
        super(mappers);
    }

    async fetchAll(): Promise<any[]> {
        // author:me, PRs only, public repos, excluding repos the user owns
        // (`-user:me`) so only third-party contributions come back.
        const q = `type:pr author:${this.userName} -user:${this.userName} is:public`;

        const response = await this.retriever.rest.search.issuesAndPullRequests({
            q,
            sort: 'updated',
            order: 'desc',
            per_page: 50,
        });

        return response.data.items;
    }
}
