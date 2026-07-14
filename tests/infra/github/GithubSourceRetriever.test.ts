import { describe, it, expect, vi } from "vitest";
import { Octokit } from 'octokit'
import { GithubSourceRetriever } from "../../../src/infra/github/GithubSourceRetriever.js";
import { GithubPushEventMapper } from "../../../src/infra/github/GithubPushEventMapper.js";
import { GithubCreateRepoEventMapper } from "../../../src/infra/github/GithubCreateRepoEventMapper.js";


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
    },
    {
        "id": "14723031000",
        "type": "CreateEvent",
        "actor": {
            "id": 193163902,
            "login": "jormiquis"
        },
        "repo": {
            "name": "jormiquis/new-project"
        },
        "payload": {
            "ref": null,
            "ref_type": "repository",
            "master_branch": "main",
            "description": "A new side project"
        },
        "public": true,
        "created_at": "2026-06-15T10:00:00Z"
    }
];

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
        const ghPushMapper = new GithubPushEventMapper();
        const ghCreateRepoMapper = new GithubCreateRepoEventMapper();
        const retriever = new GithubSourceRetriever(mockOctokit, 'jorMiquis',[ghPushMapper,ghCreateRepoMapper ]);
        const activities = await retriever.retrieve(today);

        expect(activities).toHaveLength(2);
    });

        it("gets commit messages and diff url if it is PushEvent", async () => {
            const today = new Date('2026-06-20T10:00:00Z');
            const ghPushMapper = new GithubPushEventMapper();
            const ghCreateRepoMapper = new GithubCreateRepoEventMapper();
            const retriever = new GithubSourceRetriever(mockOctokit, 'jorMiquis',[ghPushMapper,ghCreateRepoMapper ]);
            const activities = await retriever.retrieve(today);

            const pushEvents = activities.filter(activity => activity.metaData.type === 'PushEvent');

            pushEvents.forEach(activity => { expect( activity.metaData.commitMessages).toHaveLength(2) });
        });

        it("gets commit messages are not blank", async () => {
            const today = new Date('2026-06-20T10:00:00Z');
            const ghPushMapper = new GithubPushEventMapper();
            const ghCreateRepoMapper = new GithubCreateRepoEventMapper();
            const retriever = new GithubSourceRetriever(mockOctokit, 'jorMiquis',[ghPushMapper,ghCreateRepoMapper ]);
            const activities = await retriever.retrieve(today);

            const pushEvents = activities.filter(activity => activity.metaData.type === 'PushEvent');

            pushEvents.forEach(activity => {
            const metadata = activity.metaData as any
            metadata.commitMessages.forEach((commit: { message: any; }) => {
                expect(commit.message).not.toBe('');
            })
            })
        });

        it("gets correct payload on metaData PushEvent", async () => {
            const today = new Date('2026-06-20T10:00:00Z');
            const ghPushMapper = new GithubPushEventMapper();
            const ghCreateRepoMapper = new GithubCreateRepoEventMapper();
            const retriever = new GithubSourceRetriever(mockOctokit, 'jorMiquis',[ghPushMapper,ghCreateRepoMapper ]);
            const activities = await retriever.retrieve(today);

            const pushEvents = activities.filter(activity => activity.metaData.type === 'PushEvent');

            pushEvents.forEach(PushEvent => {
                const metaDataKeys = Object.keys(PushEvent.metaData);

                expect(metaDataKeys).toEqual(['repo', 'type', 'diff', 'commitMessages']);
            });
        });

        it("gets correct payload on metaData createEvent", async () => {
            const today = new Date('2026-06-20T10:00:00Z');
            const ghPushMapper = new GithubPushEventMapper();
            const ghCreateRepoMapper = new GithubCreateRepoEventMapper();
            const retriever = new GithubSourceRetriever(mockOctokit, 'jorMiquis',[ghPushMapper,ghCreateRepoMapper ]);
            const activities = await retriever.retrieve(today);

            const pushEvents = activities.filter(activity => activity.metaData.type === 'CreateEvent');

            pushEvents.forEach(PushEvent => {
                const metaDataKeys = Object.keys(PushEvent.metaData);

                expect(metaDataKeys).toEqual(['source', 'type', 'entityCreated', 'repo', 'description']);
            });

        });
    });