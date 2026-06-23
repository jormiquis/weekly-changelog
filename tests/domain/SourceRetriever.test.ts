import { describe, it, expect } from "vitest";

import { SourceRetriever } from '../../src/domain/SourceRetriever.js'
import { Activity } from "../../src/domain/Activity.js";

describe("SourceRetriever", () => {
  it("returns only activities within the last seven days", async () => {
    const retriever = new RetrieverTestClass()

    const activities = await retriever.retrieve()

    expect(activities).toHaveLength(1)
  })
})

class RetrieverTestClass extends SourceRetriever {
  async fetchAll(): Promise<any[]> {
    return [
      { name: 'inside the window',  created_at: new Date("2026-06-19") },
      { name: 'outside the window', created_at: new Date("2026-06-1")  },
    ]
  }

  mapToActivity(raw: any[]): Activity[] {
    return raw.map(event =>
      Activity.create(event.created_at, { name: event.name })
    )
  }
}