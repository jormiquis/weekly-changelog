import { describe, it, expect, vi } from "vitest";
import { Octokit } from 'octokit'
import { GithubSourceRetriever } from "../../../src/infra/GithubSourceRetriever.js";


describe("gitHub sourceRetriever implementation test", () => {
    const ghEvents = [{
            "id": "123",
            "type": "PushEvent",
            "actor": { "login": "jormiquis" },
            "repo": { "name": "jormiquis/weekly-changelog" },
            "created_at": "2026-06-19T12:00:00Z",
    }, {
            "id": "234",
            "type": "PushEvent",
            "actor": { "login": "jormiquis" },
            "repo": { "name": "jormiquis/weekly-changelog" },
            "created_at": "2026-05-19T12:00:00Z",
    }];

    const mockOctokit = {
    rest: {
        activity: {
            listPublicEventsForUser: vi.fn().mockResolvedValue({
                data: ghEvents
            })
        }
    }
    } as unknown as Octokit

    it("returns only activities within the last seven days", async () => {
        const today = new Date('2026-06-20T10:00:00Z');

        const retriever = new GithubSourceRetriever(mockOctokit);
        const activities = await retriever.retrieve(today);

        expect(activities).toHaveLength(1);
    });
});