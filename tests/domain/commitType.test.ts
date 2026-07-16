import { describe, it, expect } from 'vitest';
import { classifyCommit, isConventional } from '../../src/domain/commitType.js';

describe('commitType', () => {
  it('classifies conventional commits by their type prefix', () => {
    expect(classifyCommit('feat: add x')).toBe('feat');
    expect(classifyCommit('fix(scope): y')).toBe('fix');
    expect(classifyCommit('refactor!: breaking')).toBe('refactor');
    expect(classifyCommit('docs: readme')).toBe('docs');
  });

  it('falls back to "other" for non-conventional messages', () => {
    expect(classifyCommit('just some work')).toBe('other');
    expect(classifyCommit('WIP')).toBe('other');
  });

  it('uses the first line of a multi-line message', () => {
    expect(classifyCommit('feat: add x\n\nlong body here')).toBe('feat');
  });

  it('flags conventional-format commits as atomic', () => {
    expect(isConventional('feat: add x')).toBe(true);
    expect(isConventional('chore(deps): bump')).toBe(true);
    expect(isConventional('random commit')).toBe(false);
  });
});
