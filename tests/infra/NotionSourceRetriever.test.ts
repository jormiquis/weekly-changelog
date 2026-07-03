import { describe, it, expect, vi } from "vitest";
import { NotionSourceRetriever } from '../../src/infra/NotionSourceRetriever'
import { Client } from '@notionhq/client'

// Mock del cliente
const mockNotion = {
  dataSources: {
    query: vi.fn().mockResolvedValue({
      results: [
        {
          id: 'page-1',
          last_edited_time: '2026-06-22T15:30:00.000Z',
          properties: {
            Name: {
              type: 'title',
              title: [{ plain_text: 'Notas sobre Template Method' }]
            },
            Tags: {
              type: 'multi_select',
              multi_select: [
                { name: 'DDD' },
                { name: 'TypeScript' }
              ]
            },
            Status: {
              type: 'select',
              select: { name: 'Done' }
            }
          },
          url: 'https://notion.so/page-1'
        },
        {
          id: 'page-2',
          last_edited_time: '2026-05-10T10:00:00.000Z',
          properties: {
            Name: {
              type: 'title',
              title: [{ plain_text: 'Notas antiguas' }]
            },
            Tags: {
              type: 'multi_select',
              multi_select: [{ name: 'Node.js' }]
            },
            Status: {
              type: 'select',
              select: { name: 'Done' }
            }
          },
          url: 'https://notion.so/page-2'
        }
      ]
    })
  }
} as unknown as Client

describe("Notion sourceRetriever implementation test", () => {
 it("returns only activities within the last seven days", async ()=> {
    const today = new Date('2026-06-28T10:00:00Z');
    const retriever = new NotionSourceRetriever(mockNotion, 'database-id')

    const activities = await retriever.retrieve(today)

    expect(activities).toHaveLength(1)

 });
});
