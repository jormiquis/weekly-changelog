import { describe, it, expect, vi, afterEach } from 'vitest';
import { Activity } from '../../../src/domain/Activity.js';
import { MistralSourceSynthesizer } from '../../../src/infra/mistral/MistralSourceSynthesizer.js';

describe('MistralSourceSynthesizer', () => {
  const activities = [Activity.create(new Date(), { type: 'PushEvent', repo: { name: 'jormiquis/weekly-changelog' }, diff: 'https://diff', commitMessages: [{ message: 'feat: ship it' }] })];
  const week = 'Week of Jul 15';

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the prompt to the Mistral chat completions API and parses the digest from the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ headline: 'A productive week', summary: 'Steady progress across the codebase.', highlights: ['Feature shipped'], commitEvaluations: [{ repo: 'weekly-changelog', evaluation: 'Ships the AI digest feature.' }] }) } }]
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const synthesizer = new MistralSourceSynthesizer('mistral-key');
    const digest = await synthesizer.synthesize(activities, week);

    expect(digest).toEqual({ headline: 'A productive week', summary: 'Steady progress across the codebase.', highlights: ['Feature shipped'], commitEvaluations: [{ repo: 'weekly-changelog', evaluation: 'Ships the AI digest feature.' }] });

    const [url, options] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://api.mistral.ai/v1/chat/completions');
    expect(options.headers.Authorization).toBe('Bearer mistral-key');
    const body = JSON.parse(options.body);
    expect(body.messages[0].content).toContain(week);
  });

  it('throws when the HTTP call is not ok (e.g. free-tier quota exceeded)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    const synthesizer = new MistralSourceSynthesizer('mistral-key');

    await expect(synthesizer.synthesize(activities, week)).rejects.toThrow('429');
  });

  it('throws when the response does not match the expected digest shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ unexpected: true }) } }] })
    }));

    const synthesizer = new MistralSourceSynthesizer('mistral-key');

    await expect(synthesizer.synthesize(activities, week)).rejects.toThrow();
  });
});
