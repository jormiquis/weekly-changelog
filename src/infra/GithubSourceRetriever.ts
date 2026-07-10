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

  const enriched = await Promise.all(
    response.data.map(async event => {
      if (event.type !== 'PushEvent') return event

      const payload = event.payload as any
      const [owner = '', repo = ''] = event.repo.name.split('/')

      const rawCommits = await this.retriever.rest.repos.compareCommits({
        owner,
        repo,
        base: payload.before,
        head: payload.head
      });

      const commits = rawCommits.data.commits.map(commit => ({
        message: commit.commit.message,
      }));

      const diff = rawCommits.data.diff_url

      return {
        ...event,
        commits,
        diff
      }


    })
  )

  return enriched
}

    mapToActivity(raw: any[]): Activity[] {
        return raw.map(event => Activity.create(new Date(event.created_at), event));
    }

}