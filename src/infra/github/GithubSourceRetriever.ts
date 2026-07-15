import type { Octokit } from "octokit";
import { SourceRetriever } from "../../domain/SourceRetriever.js";
import type { EventMapper } from "../../domain/EventMapper.js";

export class GithubSourceRetriever extends SourceRetriever {

    constructor(
        private readonly retriever: Octokit,
        private readonly userName: string,
        mappers: EventMapper[]
    ) {
        super(mappers);
    }

    async fetchAll(): Promise<any[]> {
      const response = await this.retriever.rest.activity.listEventsForAuthenticatedUser({ username: this.userName });

      const enriched = await Promise.all(
        response.data.map(async event => {
        const payload = event.payload as any;

          // Only enrich public push events: skips wasted compareCommits calls on
          // events that the mappers will discard, and never fetches private-repo diffs.
          if (event.public === true && event.type === 'PushEvent') {
            const [owner = '', repo = ''] = event.repo.name.split('/');

            const rawCommits = await this.retriever.rest.repos.compareCommits({
              owner,
              repo,
              base: payload.before,
              head: payload.head
            });

          return { ...event, rawCommits: rawCommits.data }
        }

        return event;
      })
    );

  return enriched;
}

}