import { describe, it, expect, vi } from 'vitest'
import { Client } from '@notionhq/client'
import { NotionSourceRetriever } from '../../src/infra/NotionSourceRetriever.js'

describe('NotionSourceRetriever', () => {
  const notionPages = [
    {
      id: 'page-1',
      last_edited_time: '2026-06-19T15:30:00.000Z',
      properties: {
        Name: {
          type: 'title',
          title: [{ plain_text: 'Notas sobre Template Method' }]
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
          title: [{ plain_text: 'Notas antiguas' }]
        }
      },
      url: 'https://app.notion.com/p/page-2'
    }
  ]

  const mockNotion = {
    dataSources: {
      query: vi.fn().mockResolvedValue({
        results: notionPages
      })
    }
  } as unknown as Client

  it('returns only pages edited within the last seven days', async () => {
    const today = new Date('2026-06-20')
    const retriever = new NotionSourceRetriever(mockNotion, 'database-id')

    const activities = await retriever.retrieve(today)

    expect(activities).toHaveLength(1)
  })
})