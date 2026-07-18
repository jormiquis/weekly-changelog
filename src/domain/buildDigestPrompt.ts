import type { Activity } from './Activity.js';
import { isPushEvent, isCreateRepoEvent, isForkEvent, isPullRequestEvent, isNotionEntry } from './ActivityMeta.js';

function repoShortName(fullName: string): string {
  return fullName.split('/').pop() ?? fullName
}

function groupCommitsByRepo(activities: Activity[]): Map<string, string[]> {
  const commitsByRepo = new Map<string, string[]>();

  for (const activity of activities) {
    const meta = activity.metaData;
    if (!isPushEvent(meta)) continue;

    const repoName = repoShortName(meta.repo.name);
    const messages = meta.commitMessages.map(commit => (commit.message.split('\n')[0] ?? commit.message).trim());

    commitsByRepo.set(repoName, [...(commitsByRepo.get(repoName) ?? []), ...messages]);
  }

  return commitsByRepo
}

function noteTitles(activities: Activity[]): string[] {
  return activities
    .map(activity => activity.metaData)
    .filter(isNotionEntry)
    .map(note => note.title)
}

function createdRepoLines(activities: Activity[]): string[] {
  return activities
    .map(activity => activity.metaData)
    .filter(isCreateRepoEvent)
    .map(meta => `New repository ${repoShortName(meta.repo)}${meta.description ? ` — ${meta.description}` : ''}`)
}

function forkLines(activities: Activity[]): string[] {
  return activities
    .map(activity => activity.metaData)
    .filter(isForkEvent)
    .map(meta => `Fork of ${meta.sourceRepo} as ${repoShortName(meta.fork)}`)
}

function pullRequestLines(activities: Activity[]): string[] {
  return activities
    .map(activity => activity.metaData)
    .filter(isPullRequestEvent)
    .map(meta => `Pull request ${meta.state} in third-party repo ${meta.repo} (#${meta.number}): "${meta.title}"`)
}

export function buildDigestPrompt(activities: Activity[], week: string): string {
  const commitsByRepo = groupCommitsByRepo(activities);
  const repoNames = [...commitsByRepo.keys()];
  const titles = noteTitles(activities);

  const repoLines = [...commitsByRepo.entries()].map(([repo, messages]) => `${repo}: ${messages.length} commit(s) — ${messages.join('; ')}`);
  const noteLines = titles.map(title => `Note: "${title}"`);
  const activityLines = [...repoLines, ...createdRepoLines(activities), ...forkLines(activities), ...pullRequestLines(activities), ...noteLines];

  return [
    `Write a short, impersonal weekly engineering changelog digest for ${week}.`,
    'Raw activity log:',
    activityLines.length > 0 ? activityLines.map(line => `- ${line}`).join('\n') : '- No activity recorded this week.',
    '',
    'Respond with ONLY strict JSON (no markdown fences, no commentary) matching exactly this shape:',
    '{"headline": string, "summary": string, "workedOn": [string], "decisions": [string], "repos": [{"repo": string, "summary": string}], "notes": [{"title": string, "summary": string}]}',
    '',
    'Tone constraints, apply to every field (headline, summary, workedOn, decisions, repo summary, note summary):',
    '- Impersonal. Use nominal phrases or neutral/passive constructions.',
    '- Never use "you", "I", "we", or any first/second person pronoun or verb conjugated for a person (no "shipped", "you added").',
    '- Prefer nouns over personal verbs where natural, e.g. "Refactor of the notifier" instead of "Refactored the notifier" or "You refactored the notifier".',
    '',
    'Field constraints:',
    '- headline: max 70 characters, punchy, no trailing period.',
    '- summary: 1-2 sentences giving an overall picture of the week.',
    '- workedOn: 1 to 2 bullets synthesizing the concrete work delivered this week (commits, pushes, forks, new repos, PRs). Group by outcome, not by repository. Each bullet is a nominal phrase, max 14 words. Empty array only if there was no code activity at all.',
    '- decisions: 0 to 2 bullets surfacing architectural or product decisions that would be interesting, inferred from the activity above. EVIDENCE the decision, do NOT explain it: state what was decided as a fact (e.g. "Ports & adapters boundary between domain and infra", "Provider-agnostic LLM fallback chain"), never the rationale, never "because", never "in order to". Each bullet max 12 words. Empty array if no decision is clearly evidenced.',
    repoNames.length > 0
      ? `- repos: exactly one entry per repository listed above with commits (${repoNames.join(', ')}). "repo" is the repository name copied VERBATIM, and "summary" is 1 sentence (max 25 words) assessing what the commits accomplished for that repository — the actual change, not who made it.`
      : '- repos: empty array, since no repository had commits this week.',
    titles.length > 0
      ? `- notes: exactly one entry per note listed above (${titles.length} note(s)). "title" is the note title copied VERBATIM, and "summary" is 1 sentence (max 25 words) summarizing what the note is about.`
      : '- notes: empty array, since no notes were captured this week.'
  ].join('\n')
}
