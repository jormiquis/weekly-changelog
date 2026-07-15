import type { Activity } from './Activity.js';
import type { SourceSynthesizer } from './SourceSynthesizer.js';
import type { SynthesizedDigest } from './SynthesizedDigest.js';

export class FallbackSourceSynthesizer implements SourceSynthesizer {
  constructor(private readonly synthesizers: SourceSynthesizer[]) {}

  async synthesize(activities: Activity[], week: string): Promise<SynthesizedDigest> {
    const errors: unknown[] = [];

    for (const synthesizer of this.synthesizers) {
      try {
        return await synthesizer.synthesize(activities, week);
      } catch (error) {
        errors.push(error);
      }
    }

    throw new AggregateError(errors, 'All source synthesizers failed');
  }
}
