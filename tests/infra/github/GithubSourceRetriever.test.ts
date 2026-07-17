import { describe, it, expect, vi } from "vitest";
import { Octokit } from 'octokit'
import { GithubSourceRetriever } from "../../../src/infra/github/GithubSourceRetriever.js";
import { GithubPushEventMapper } from "../../../src/infra/github/GithubPushEventMapper.js";
import { GithubCreateRepoEventMapper } from "../../../src/infra/github/GithubCreateRepoEventMapper.js";
import { GithubForkEventMapper } from "../../../src/infra/github/GithubForkEventMapper.js";


describe("gitHub sourceRetriever implementation test", () => {
    const ghEvents = [{
        id: '123',
        type: 'PushEvent',
        public: true,
        actor: { login: 'jormiquis' },
        repo: { name: 'jormiquis/weekly-changelog' },
        created_at: '2026-06-19T12:00:00Z',
        payload: { before: 'abc123', head: 'def456' }
    },
    {
        id: '234',
        type: 'PushEvent',
        public: true,
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

    it("ignores private-repo events so they never reach the public dashboard", async () => {
        const privateOctokit = {
            rest: {
                activity: {
                    listEventsForAuthenticatedUser: vi.fn().mockResolvedValue({
                        data: [{
                            id: '999',
                            type: 'PushEvent',
                            public: false,
                            actor: { login: 'jormiquis' },
                            repo: { name: 'jormiquis/secret-repo' },
                            created_at: '2026-06-19T12:00:00Z',
                            payload: { before: 'aaa', head: 'bbb' }
                        }]
                    })
                },
                repos: { compareCommits: vi.fn() }
            }
        } as unknown as Octokit;

        const retriever = new GithubSourceRetriever(privateOctokit, 'jormiquis', [new GithubPushEventMapper(), new GithubCreateRepoEventMapper()]);
        const activities = await retriever.retrieve(new Date('2026-06-20T10:00:00Z'));

        expect(activities).toHaveLength(0);
    });

    it("maps a public ForkEvent to the upstream repo and the created fork", async () => {
        const forkOctokit = {
            rest: {
                activity: {
                    listEventsForAuthenticatedUser: vi.fn().mockResolvedValue({
                        data: [{
                            id: '777',
                            type: 'ForkEvent',
                            public: true,
                            actor: { login: 'jormiquis' },
                            repo: { name: 'vercel/next.js' },
                            created_at: '2026-06-19T12:00:00Z',
                            payload: {
                                forkee: { full_name: 'jormiquis/next.js', html_url: 'https://github.com/jormiquis/next.js' }
                            }
                        }]
                    })
                },
                repos: { compareCommits: vi.fn() }
            }
        } as unknown as Octokit;

        const retriever = new GithubSourceRetriever(forkOctokit, 'jormiquis', [new GithubForkEventMapper()]);
        const activities = await retriever.retrieve(new Date('2026-06-20T10:00:00Z'));

        expect(activities).toHaveLength(1);
        expect(activities[0]!.metaData).toEqual({
            source: 'github',
            type: 'ForkEvent',
            sourceRepo: 'vercel/next.js',
            fork: 'jormiquis/next.js',
            forkUrl: 'https://github.com/jormiquis/next.js',
        });
    });

    it("ignores a private ForkEvent", async () => {
        const privateForkOctokit = {
            rest: {
                activity: {
                    listEventsForAuthenticatedUser: vi.fn().mockResolvedValue({
                        data: [{
                            id: '778',
                            type: 'ForkEvent',
                            public: false,
                            actor: { login: 'jormiquis' },
                            repo: { name: 'secret/private-repo' },
                            created_at: '2026-06-19T12:00:00Z',
                            payload: { forkee: { full_name: 'jormiquis/private-repo', html_url: 'https://x' } }
                        }]
                    })
                },
                repos: { compareCommits: vi.fn() }
            }
        } as unknown as Octokit;

        const retriever = new GithubSourceRetriever(privateForkOctokit, 'jormiquis', [new GithubForkEventMapper()]);
        const activities = await retriever.retrieve(new Date('2026-06-20T10:00:00Z'));

        expect(activities).toHaveLength(0);
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

                expect(metaDataKeys).toEqual(['repo', 'type', 'diff', 'commitMessages', 'additions', 'deletions', 'files']);
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