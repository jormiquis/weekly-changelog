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

// Generated / vendored / binary paths carry no design signal — never send them to the model.
const NOISE_PATH = /(^|\/)(dist|node_modules)\/|package-lock\.json$|\.(png|jpe?g|gif|svg|ico|ttf|woff2?|lock|snap|map)$/i

const MAX_PATCH_CHARS_PER_FILE = 1600
const MAX_FILES = 14
const MAX_DIFF_CHARS = 9000

/**
 * Collects the week's real code diffs (per repo, per file) into a compact block
 * the model can reason about, dropping generated/binary noise and truncating
 * aggressively so free-tier context limits are respected.
 */
function buildCodeDiffs(activities: Activity[]): string {
  const blocks: string[] = []
  let fileCount = 0
  let totalChars = 0

  for (const activity of activities) {
    const meta = activity.metaData
    if (!isPushEvent(meta)) continue

    const repo = repoShortName(meta.repo.name)

    for (const file of meta.files ?? []) {
      if (!file.patch || NOISE_PATH.test(file.filename)) continue
      if (fileCount >= MAX_FILES || totalChars >= MAX_DIFF_CHARS) break

      const patch = file.patch.length > MAX_PATCH_CHARS_PER_FILE
        ? `${file.patch.slice(0, MAX_PATCH_CHARS_PER_FILE)}\n… (truncated)`
        : file.patch

      const block = `# repo: ${repo}\n# file: ${file.filename}\n${patch}`
      blocks.push(block)
      fileCount++
      totalChars += block.length
    }
  }

  return blocks.join('\n\n')
}

export function buildDigestPrompt(activities: Activity[], week: string): string {
  const commitsByRepo = groupCommitsByRepo(activities);
  const repoNames = [...commitsByRepo.keys()];
  const titles = noteTitles(activities);

  const repoLines = [...commitsByRepo.entries()].map(([repo, messages]) => `${repo}: ${messages.length} commit(s) — ${messages.join('; ')}`);
  const noteLines = titles.map(title => `Note: "${title}"`);
  const activityLines = [...repoLines, ...createdRepoLines(activities), ...forkLines(activities), ...pullRequestLines(activities), ...noteLines];
  const codeDiffs = buildCodeDiffs(activities);

  return [
    `Write a short, impersonal weekly engineering changelog digest for ${week}.`,
    'Raw activity log:',
    activityLines.length > 0 ? activityLines.map(line => `- ${line}`).join('\n') : '- No activity recorded this week.',
    '',
    'Code diffs from this week (unified diff, truncated). Use these to find genuinely noteworthy engineering — design patterns, architectural boundaries, clever abstractions:',
    codeDiffs.length > 0 ? codeDiffs : '(no code diffs available)',
    '',
    'Respond with ONLY strict JSON (no markdown fences, no commentary) matching exactly this shape:',
    '{"headline": string, "summary": string, "workedOn": [string], "highlights": [{"title": string, "repo": string, "code": string, "language": string, "diagram": string}], "repos": [{"repo": string, "summary": string}], "notes": [{"title": string, "summary": string}]}',
    '',
    'Tone constraints, apply to every prose field (headline, summary, workedOn, highlight title, repo summary, note summary):',
    '- Impersonal. Use nominal phrases or neutral/passive constructions.',
    '- Never use "you", "I", "we", or any first/second person pronoun or verb conjugated for a person (no "shipped", "you added").',
    '- Prefer nouns over personal verbs where natural, e.g. "Refactor of the notifier" instead of "Refactored the notifier" or "You refactored the notifier".',
    '',
    'Field constraints:',
    '- headline: max 70 characters, punchy, no trailing period.',
    '- summary: 1-2 sentences giving an overall picture of the week.',
    '- workedOn: 1 to 2 bullets synthesizing the concrete work delivered this week (commits, pushes, forks, new repos, PRs). Group by outcome, not by repository. Each bullet is a nominal phrase, max 14 words. Empty array only if there was no code activity at all.',
    '- highlights: 0 to 3 entries, ONLY for genuinely worthwhile engineering found in the code diffs above. Skip trivial changes (renames, config, formatting). If nothing is worthwhile, return an empty array — do NOT invent highlights.',
    '  · "title": the design pattern or architectural decision, ENUNCIATED not explained (e.g. "Ports & adapters boundary", "Provider fallback chain", "Discriminated union for event metadata"). Max 8 words. No rationale, no "because".',
    '  · "repo": the short repo name copied VERBATIM from the "# repo:" line of the diff the highlight comes from.',
    '  · "code": a SHORT (max ~14 lines), self-contained, attractive snippet distilled from that diff that best evidences the pattern. Real code from the diff, cleaned of diff +/- markers. Preserve newlines as \\n.',
    '  · "language": the source language, lowercase (e.g. "typescript").',
    '  · "diagram": a SIMPLE, valid mermaid diagram (flowchart, e.g. "flowchart LR\\n  A[Domain] --> B[Port] --> C[Adapter]") illustrating the pattern with 3-6 nodes. Keep it minimal. Use "" only if a diagram truly does not fit.',
    repoNames.length > 0
      ? `- repos: exactly one entry per repository listed above with commits (${repoNames.join(', ')}). "repo" is the repository name copied VERBATIM, and "summary" is 1 sentence (max 25 words) assessing what the commits accomplished for that repository — the actual change, not who made it.`
      : '- repos: empty array, since no repository had commits this week.',
    titles.length > 0
      ? `- notes: exactly one entry per note listed above (${titles.length} note(s)). "title" is the note title copied VERBATIM, and "summary" is 1 sentence (max 25 words) summarizing what the note is about.`
      : '- notes: empty array, since no notes were captured this week.'
  ].join('\n')
}
