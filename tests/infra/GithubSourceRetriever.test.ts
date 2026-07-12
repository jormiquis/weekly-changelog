import { describe, it, expect, vi } from "vitest";
import { Octokit } from 'octokit'
import { GithubSourceRetriever } from "../../src/infra/GithubSourceRetriever.js";


describe("gitHub sourceRetriever implementation test", () => {
    const ghEvents = [{
        id: '123',
        type: 'PushEvent',
        actor: { login: 'jormiquis' },
        repo: { name: 'jormiquis/weekly-changelog' },
        created_at: '2026-06-19T12:00:00Z',
        payload: { before: 'abc123', head: 'def456' }
    },
    {
        id: '234',
        type: 'PushEvent',
        actor: { login: 'jormiquis' },
        repo: { name: 'jormiquis/weekly-changelog' },
        created_at: '2026-05-19T12:00:00Z',
        payload: { before: 'ghi789', head: 'jkl012' }
    }];

    const mockOctokit = {
    rest: {
        activity: {
            listEventsForAuthenticatedUser: vi.fn().mockResolvedValue({
                data: ghEvents
            })
        },
         repos: {
      compareCommits: vi.fn().mockResolvedValue({
        data: {
            diff_url: 'https://what-a-diff',
            commits: [
                { commit: { message: 'feat: add week filtering' } },
                { commit: { message: 'test: verify filtering' } }
            ],
          files: [
            { filename: 'src/domain/SourceRetriever.ts', additions: 15, deletions: 3 }
          ]
        }
      })
        }
    }
    } as unknown as Octokit

    it("returns only activities within the last seven days", async () => {
        const today = new Date('2026-06-20T10:00:00Z');

        const retriever = new GithubSourceRetriever(mockOctokit, 'jorMiquis');
        const activities = await retriever.retrieve(today);

        expect(activities).toHaveLength(1);
    });

        it("gets commit messages and diff url if it is PushEvent", async () => {
            const today = new Date('2026-06-20T10:00:00Z');

            const retriever = new GithubSourceRetriever(mockOctokit, 'jorMiquis');
            const activities = await retriever.retrieve(today);

            activities.forEach(activity => { expect( activity.metaData.commits).toHaveLength(2) });
        });

        it("gets correct payload on metaData pushEvent", async () => {
            const today = new Date('2026-06-20T10:00:00Z');

            const retriever = new GithubSourceRetriever(mockOctokit, 'jorMiquis');
            const activities = await retriever.retrieve(today);

            const pushEvents = activities.filter(activity => activity.metaData.type === 'PushEvent');

            pushEvents.forEach(pushEvent => {
                const metaDataKeys = Object.keys(pushEvent.metaData);

                expect(metaDataKeys).toEqual(expect.arrayContaining(['repo', 'commits', 'diff', 'type']));
            });

        });
    });