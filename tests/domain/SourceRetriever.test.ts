import { describe, it, expect } from "vitest";

import { SourceRetriever } from '../../src/domain/SourceRetriever.js'

describe("SourceRetriever test suite", () => {
    it("should filter events", async ()=> {
        const retriever = new RetrieverTestClass();
        const allActivities = await retriever.fetch();

        expect(allActivities).toEqual([{
            name: 'asdf',
            created_at: new Date(2026,11,25)
        }]);
    });
});

class RetrieverTestClass extends SourceRetriever {
    async fetch(): Promise<any[]> {
         return [{
            name: 'asdf',
            created_at: new Date(2026,11,25)
        }];
    }
}