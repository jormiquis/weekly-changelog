import type { Activity } from './Activity.js';
import { isPushEvent, isCreateRepoEvent, isNotionEntry } from './ActivityMeta.js';

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

function otherActivityLines(activities: Activity[]): string[] {
  const lines: string[] = [];

  for (const activity of activities) {
    const meta = activity.metaData;

    if (isCreateRepoEvent(meta)) {
      lines.push(`New repository ${repoShortName(meta.repo)}${meta.description ? ` — ${meta.description}` : ''}`);
    } else if (isNotionEntry(meta)) {
      lines.push(`Note captured: "${meta.title}"${meta.tags.length > 0 ? ` (tags: ${meta.tags.join(', ')})` : ''}`);
    }
  }

  return lines
}

export function buildDigestPrompt(activities: Activity[], week: string): string {
  const commitsByRepo = groupCommitsByRepo(activities);
  const repoLines = [...commitsByRepo.entries()].map(([repo, messages]) => `${repo}: ${messages.length} commit(s) — ${messages.join('; ')}`);
  const activityLines = [...repoLines, ...otherActivityLines(activities)];
  const repoNames = [...commitsByRepo.keys()];

  return [
    `Write a short, impersonal weekly engineering changelog digest for ${week}.`,
    'Raw activity log:',
    activityLines.length > 0 ? activityLines.map(line => `- ${line}`).join('\n') : '- No activity recorded this week.',
    '',
    'Respond with ONLY strict JSON (no markdown fences, no commentary) matching exactly this shape:',
    '{"headline": string, "summary": string, "highlights": [{"text": string, "evidence": string[]}], "commitEvaluations": [{"repo": string, "evaluation": string}]}',
    '',
    'Tone constraints, apply to every field (headline, summary, highlight text, evaluation):',
    '- Impersonal. Use nominal phrases or neutral/passive constructions.',
    '- Never use "you", "I", "we", or any first/second person pronoun or verb conjugated for a person (no "worked on", "shipped", "you added").',
    '- Prefer nouns over personal verbs where natural, e.g. "Refactor of the notifier" instead of "Refactored the notifier" or "You refactored the notifier".',
    '',
    'Field constraints:',
    '- headline: max 70 characters, punchy, no trailing period.',
    '- summary: 1-2 sentences.',
    '- highlights: 2 to 4 items. Each "text" is a short noun phrase (max 8 words), no leading dashes or bullets. Each "evidence" is 1 to 3 items copied VERBATIM from the raw activity log above (exact commit messages or note titles) that justify the highlight — never invent evidence.',
    repoNames.length > 0
      ? `- commitEvaluations: exactly one entry per repository listed above with commits (${repoNames.join(', ')}). Each evaluation is 1 sentence (max 25 words) assessing what the commits accomplish for that repository — the actual change, not who made it.`
      : '- commitEvaluations: empty array, since no repository had commits this week.'
  ].join('\n')
}
