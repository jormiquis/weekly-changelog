import type { Activity } from './Activity.js';
import type { SynthesizedDigest } from './SynthesizedDigest.js';

export interface SourceSynthesizer {
  synthesize(activities: Activity[], week: string): Promise<SynthesizedDigest>
}
