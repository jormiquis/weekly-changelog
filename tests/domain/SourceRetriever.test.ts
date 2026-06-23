import { describe, it, expect } from "vitest";

import { SourceRetriever } from '../../src/domain/SourceRetriever.js'
import { Activity } from "../../src/domain/Activity.js";

describe("SourceRetriever test suite", () => {
    it("should retrieve events for this week", async ()=> {
        const retriever = new RetrieverTestClass();
        const rawEvents = await retriever.fetchAll();
        const activities = retriever.mapToActivity(rawEvents);

        expect(activities.length).toEqual(2);
    });
});

class RetrieverTestClass extends SourceRetriever {

    mapToActivity(raw: any[]): Activity[] {
    return raw.map(event => {
        const metadata = { name: event.name }
        return Activity.create(event.created_at, metadata);
    })
}

    async fetchAll(): Promise<any[]> {
         return [
            {
                name: 'first event',
                created_at: new Date(2026,6,19)
            },
            {
                name: 'second event',
                created_at: new Date(2026,6,1)
            }
        ];
    }
}