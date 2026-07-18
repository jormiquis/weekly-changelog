import { describe, it, expect } from 'vitest';
import { GithubPullRequestEventMapper } from '../../../src/infra/github/GithubPullRequestEventMapper.js';

function searchItem(overrides: Record<string, any> = {}) {
  return {
    number: 42,
    title: 'Fix flaky test',
    html_url: 'https://github.com/vercel/next.js/pull/42',
    state: 'open',
    created_at: '2026-07-15T10:00:00Z',
    repository_url: 'https://api.github.com/repos/vercel/next.js',
    pull_request: { merged_at: null },
    ...overrides,
  };
}

describe('GithubPullRequestEventMapper', () => {
  const mapper = new GithubPullRequestEventMapper();

  it('handles open PR search items and closed-merged ones, but not closed-unmerged', () => {
    expect(mapper.canHandle(searchItem())).toBe(true);
    expect(mapper.canHandle(searchItem({ state: 'closed', pull_request: { merged_at: '2026-07-16T09:00:00Z' } }))).toBe(true);
    expect(mapper.canHandle(searchItem({ state: 'closed', pull_request: { merged_at: null } }))).toBe(false);
  });

  it('ignores items that are not pull requests', () => {
    expect(mapper.canHandle({ number: 1, title: 'An issue', state: 'open' })).toBe(false);
  });

  it('maps an open PR to an "opened" activity dated at creation', () => {
    const activity = mapper.map(searchItem());

    expect(activity.occurredAt.toISOString()).toBe('2026-07-15T10:00:00.000Z');
    expect(activity.metaData).toEqual({
      source: 'github',
      type: 'PullRequestEvent',
      state: 'opened',
      repo: 'vercel/next.js',
      number: 42,
      title: 'Fix flaky test',
      url: 'https://github.com/vercel/next.js/pull/42',
    });
  });

  it('maps a merged PR to a "merged" activity dated at merge time', () => {
    const activity = mapper.map(searchItem({ state: 'closed', pull_request: { merged_at: '2026-07-16T09:00:00Z' } }));

    expect(activity.occurredAt.toISOString()).toBe('2026-07-16T09:00:00.000Z');
    expect(activity.metaData).toMatchObject({ state: 'merged', repo: 'vercel/next.js', number: 42 });
  });
});
