import { describe, it, expect, vi } from 'vitest';
import { Activity } from '../../src/domain/Activity.js';
import type { SourceSynthesizer } from '../../src/domain/SourceSynthesizer.js';
import type { SynthesizedDigest } from '../../src/domain/SynthesizedDigest.js';
import { FallbackSourceSynthesizer } from '../../src/domain/FallbackSourceSynthesizer.js';

function fakeDigest(headline: string): SynthesizedDigest {
  return { headline, summary: 'A quiet but productive week.', highlights: [{ text: 'Feature shipped', evidence: [] }], commitEvaluations: [] };
}

function synthesizerThatResolves(digest: SynthesizedDigest): SourceSynthesizer {
  return { synthesize: vi.fn().mockResolvedValue(digest) };
}

function synthesizerThatFails(message: string): SourceSynthesizer {
  return { synthesize: vi.fn().mockRejectedValue(new Error(message)) };
}

describe('FallbackSourceSynthesizer', () => {
  const activities = [Activity.create(new Date(), { type: 'PushEvent', repo: { name: 'jormiquis/weekly-changelog' }, diff: 'https://diff', commitMessages: [] })];
  const week = 'Week of Jul 15';

  it('uses the first synthesizer when it succeeds, without calling the rest', async () => {
    const primary = synthesizerThatResolves(fakeDigest('Primary headline'));
    const secondary = synthesizerThatResolves(fakeDigest('Secondary headline'));

    const fallback = new FallbackSourceSynthesizer([primary, secondary]);
    const digest = await fallback.synthesize(activities, week);

    expect(digest.headline).toBe('Primary headline');
    expect(secondary.synthesize).not.toHaveBeenCalled();
  });

  it('falls back to the next provider when the free tier of the first one is exhausted', async () => {
    const geminiOutOfQuota = synthesizerThatFails('Gemini request failed with status 429');
    const groq = synthesizerThatResolves(fakeDigest('Groq headline'));

    const fallback = new FallbackSourceSynthesizer([geminiOutOfQuota, groq]);
    const digest = await fallback.synthesize(activities, week);

    expect(digest.headline).toBe('Groq headline');
    expect(geminiOutOfQuota.synthesize).toHaveBeenCalledTimes(1);
    expect(groq.synthesize).toHaveBeenCalledTimes(1);
  });

  it('tries every provider in order before giving up', async () => {
    const first = synthesizerThatFails('first down');
    const second = synthesizerThatFails('second down');
    const third = synthesizerThatResolves(fakeDigest('Third headline'));

    const fallback = new FallbackSourceSynthesizer([first, second, third]);
    const digest = await fallback.synthesize(activities, week);

    expect(digest.headline).toBe('Third headline');
  });

  it('throws when every provider fails, so the caller can decide how to degrade', async () => {
    const fallback = new FallbackSourceSynthesizer([
      synthesizerThatFails('gemini down'),
      synthesizerThatFails('groq down')
    ]);

    await expect(fallback.synthesize(activities, week)).rejects.toThrow('All source synthesizers failed');
  });
});
