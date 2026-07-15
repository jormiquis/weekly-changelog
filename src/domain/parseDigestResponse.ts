import { isSynthesizedDigest, type SynthesizedDigest } from './SynthesizedDigest.js';

export function parseDigestResponse(text: string): SynthesizedDigest {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!isSynthesizedDigest(parsed)) {
    throw new Error('Response did not match the expected digest shape');
  }

  return parsed
}
