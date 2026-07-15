import type { Activity } from '../../domain/Activity.js';
import { buildDigestPrompt } from '../../domain/buildDigestPrompt.js';
import { parseDigestResponse } from '../../domain/parseDigestResponse.js';
import type { SourceSynthesizer } from '../../domain/SourceSynthesizer.js';
import type { SynthesizedDigest } from '../../domain/SynthesizedDigest.js';

const DEFAULT_MODEL = 'mistral-small-latest';

export class MistralSourceSynthesizer implements SourceSynthesizer {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL
  ) {}

  async synthesize(activities: Activity[], week: string): Promise<SynthesizedDigest> {
    const prompt = buildDigestPrompt(activities, week);

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`Mistral request failed with status ${response.status}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== 'string') {
      throw new Error('Mistral response is missing the expected message content');
    }

    return parseDigestResponse(text);
  }
}
