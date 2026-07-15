import { describe, it, expect, vi } from 'vitest';
import { Client } from '@notionhq/client';
import { NotionSourceRetriever } from '../../../src/infra/notion/NotionSourceRetriever';
import { NotionEventMapper } from '../../../src/infra/notion/NotionEventMapper';

describe('NotionSourceRetriever', () => {
  const notionPages = [
  {
    id: 'page-1',
    last_edited_time: '2026-06-19T15:30:00.000Z',
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
      },
      Sources: {
        type: 'rich_text',
        rich_text: [
          { plain_text: 'https://refactoring.guru/template-method' },
          { plain_text: '\n' },
          { plain_text: 'https://example.com/ddd-patterns' }
        ]
      }
    },
    url: 'https://app.notion.com/p/page-1'
  },
  {
    id: 'page-2',
    last_edited_time: '2026-05-10T10:00:00.000Z',
    properties: {
      Name: {
        type: 'title',
        title: [{ plain_text: 'Notas sobre SOLID' }]
      },
      Tags: {
        type: 'multi_select',
        multi_select: [
          { name: 'SOLID' }
        ]
      },
      Status: {
        type: 'select',
        select: { name: 'Draft' }
      },
      Sources: {
        type: 'rich_text',
        rich_text: []
      }
    },
    url: 'https://app.notion.com/p/page-2'
  }
];

  const mockNotion = {
    dataSources: {
      query: vi.fn().mockResolvedValue({
        results: notionPages
      })
    }
  } as unknown as Client

  it('returns only pages edited within the last seven days', async () => {
    const today = new Date('2026-06-20');
    const mapper = new NotionEventMapper()
    const retriever = new NotionSourceRetriever(mockNotion, 'database-id',[ mapper ]);

    const activities = await retriever.retrieve(today)

    expect(activities).toHaveLength(1);
  })

          it("gets correct payload on metaData PushEvent", async () => {
              const today = new Date('2026-06-20T10:00:00Z');
              const mapper = new NotionEventMapper()
              const retriever = new NotionSourceRetriever(mockNotion, 'database-id',[ mapper ]);

              const activities = await retriever.retrieve(today);

              activities.forEach(activity => {
                  const metaDataKeys = Object.keys(activity.metaData);

                  expect(metaDataKeys).toEqual(['source', 'entry_emoji', 'tags', 'sources', 'title']);
              });
          });
})