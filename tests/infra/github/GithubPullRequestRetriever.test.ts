import { describe, it, expect, vi } from 'vitest';
import { Octokit } from 'octokit';
import { GithubPullRequestRetriever } from '../../../src/infra/github/GithubPullRequestRetriever.js';
import { GithubPullRequestEventMapper } from '../../../src/infra/github/GithubPullRequestEventMapper.js';

function octokitWith(items: any[]) {
  const issuesAndPullRequests = vi.fn().mockResolvedValue({ data: { items } });
  return {
    octokit: { rest: { search: { issuesAndPullRequests } } } as unknown as Octokit,
    issuesAndPullRequests,
  };
}

describe('GithubPullRequestRetriever', () => {
  const today = new Date('2026-07-18T10:00:00Z');

  it('queries the search API for the user\'s PRs in third-party public repos', async () => {
    const { octokit, issuesAndPullRequests } = octokitWith([]);

    await new GithubPullRequestRetriever(octokit, 'jormiquis', [new GithubPullRequestEventMapper()]).retrieve(today);

    const q = issuesAndPullRequests.mock.calls[0]![0]!.q as string;
    expect(q).toContain('type:pr');
    expect(q).toContain('author:jormiquis');
    expect(q).toContain('-user:jormiquis');
    expect(q).toContain('is:public');
  });

  it('maps opened and merged PRs from the last week and drops older ones', async () => {
    const { octokit } = octokitWith([
      { number: 1, title: 'Recent open PR', html_url: 'https://github.com/vercel/next.js/pull/1', state: 'open', created_at: '2026-07-15T10:00:00Z', repository_url: 'https://api.github.com/repos/vercel/next.js', pull_request: { merged_at: null } },
      { number: 2, title: 'Recently merged PR', html_url: 'https://github.com/vercel/next.js/pull/2', state: 'closed', created_at: '2026-06-01T10:00:00Z', repository_url: 'https://api.github.com/repos/vercel/next.js', pull_request: { merged_at: '2026-07-16T09:00:00Z' } },
      { number: 3, title: 'Old open PR', html_url: 'https://github.com/vercel/next.js/pull/3', state: 'open', created_at: '2026-05-01T10:00:00Z', repository_url: 'https://api.github.com/repos/vercel/next.js', pull_request: { merged_at: null } },
    ]);

    const activities = await new GithubPullRequestRetriever(octokit, 'jormiquis', [new GithubPullRequestEventMapper()]).retrieve(today);

    expect(activities.map(a => a.metaData)).toEqual([
      { source: 'github', type: 'PullRequestEvent', state: 'opened', repo: 'vercel/next.js', number: 1, title: 'Recent open PR', url: 'https://github.com/vercel/next.js/pull/1' },
      { source: 'github', type: 'PullRequestEvent', state: 'merged', repo: 'vercel/next.js', number: 2, title: 'Recently merged PR', url: 'https://github.com/vercel/next.js/pull/2' },
    ]);
  });
});
