import type { Activity } from './Activity.js';
import { isPushEvent, isCreateRepoEvent, isForkEvent, isPullRequestEvent, isLearningEntry, isWorkEntry } from './ActivityMeta.js';

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
    .filter(isLearningEntry)
    .map(note => note.title)
}

function workTitles(activities: Activity[]): string[] {
  return activities
    .map(activity => activity.metaData)
    .filter(isWorkEntry)
    .map(entry => entry.title)
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
  const work = workTitles(activities);

  const repoLines = [...commitsByRepo.entries()].map(([repo, messages]) => `${repo}: ${messages.length} commit(s) — ${messages.join('; ')}`);
  const noteLines = titles.map(title => `Note: "${title}"`);
  const workLines = work.map(title => `Work log (day job): "${title}"`);
  const activityLines = [...repoLines, ...createdRepoLines(activities), ...forkLines(activities), ...pullRequestLines(activities), ...noteLines, ...workLines];
  const codeDiffs = buildCodeDiffs(activities);

  return [
    `Write a short, impersonal, PRODUCT-oriented weekly changelog for ${week}.`,
    'Frame everything as changes to a product a user experiences, not as git/engineering activity.',
    '',
    'Raw activity log:',
    activityLines.length > 0 ? activityLines.map(line => `- ${line}`).join('\n') : '- No activity recorded this week.',
    '',
    'Code diffs from this week (unified diff, truncated). Infer, per repository, WHAT PRODUCT it is (from paths, names, symbols, strings) and WHAT CHANGED in that product this week. Also spot genuinely noteworthy engineering — design patterns, architectural boundaries, clever abstractions:',
    codeDiffs.length > 0 ? codeDiffs : '(no code diffs available)',
    '',
    'Respond with ONLY strict JSON (no markdown fences, no commentary) matching exactly this shape:',
    '{"headline": string, "summary": string, "repos": [{"repo": string, "product": string, "summary": string, "productChanges": [string], "highlights": [{"title": string, "alternative": string, "code": string, "language": string, "diagram": string}]}], "sideProjects": {"bullets": [{"project": string, "text": string}]}, "notes": [{"title": string, "summary": string}], "work": {"summary": string, "bullets": [string]}}',
    '',
    'Tone constraints, apply to every prose field:',
    '- Impersonal. Use nominal phrases or neutral/passive constructions.',
    '- Never use "you", "I", "we", or any first/second person pronoun or verb conjugated for a person (no "we shipped", "you added").',
    '- Product-oriented: describe user-facing capability and outcomes, not commit mechanics. Avoid words like "commit", "diff", "push", "PR".',
    '',
    'Field constraints:',
    '- headline: max 70 characters, punchy, no trailing period.',
    '- summary: 1-2 sentences giving an overall product picture of the week.',
    repoNames.length > 0
      ? `- repos: exactly one entry per repository listed above with commits (${repoNames.join(', ')}). "repo" is the repository name copied VERBATIM. For each:`
      : '- repos: empty array, since no repository had commits this week.',
    '  · "product": a short noun phrase for what the repo IS, product-oriented, inferred from the code, e.g. "a work diary project", "a personal finance API". Max 8 words. No repo name, no leading article beyond "a/an".',
    '  · "summary": 2-3 sentences describing what was done this week for that product. Product outcomes, grounded in the diffs.',
    '  · "productChanges": 1 to 4 bullets, each a concrete user-facing change to the product this week (a capability added, changed, or fixed). Nominal phrase, max 14 words. Never mention where in the code it lives.',
    '  · "highlights": 0 to 3 entries, ONLY for genuinely worthwhile engineering in this repo\'s diffs. Skip trivial changes (renames, config, formatting). Empty array if nothing is worthwhile — do NOT invent.',
    '      "title": the design pattern or architectural decision, ENUNCIATED as a bare fact, e.g. "Composition over inheritance", "Provider fallback chain", "Refactor to aggregate pattern". Max 8 words. No rationale, no "because", no file/location.',
    '      "alternative": the specific alternative that was DISCARDED in favour of this decision, as a bare noun phrase, e.g. "class inheritance", "a single hardcoded provider", "an anemic data model". Max 8 words. Must be a real, plausible option for THIS decision, not a restatement of the title.',
    '      "code": a SHORT (max ~14 lines), self-contained, attractive snippet distilled from that diff that best evidences the pattern. Real code from the diff, cleaned of diff +/- markers. Preserve newlines as \\n.',
    '      "language": the source language, lowercase (e.g. "typescript").',
    '      "diagram": a SIMPLE, valid mermaid diagram (flowchart, e.g. "flowchart LR\\n  A[Domain] --> B[Port] --> C[Adapter]") illustrating the pattern with 3-6 nodes. Use "" only if a diagram truly does not fit.',
    repoNames.length > 0
      ? `- sideProjects.bullets: the 3 to 4 MOST IMPORTANT personal side-project items this week, selected across ALL repos, MERGING product changes and technical decisions into short card bullets. Most impactful first. This is the summarized view of the per-repo detail above. For each:
  · "project": the repository the bullet applies to, copied VERBATIM from the list above (${repoNames.join(', ')}). Every bullet belongs to exactly one repository — never merge two repos into one bullet.
  · "text": the bullet itself, ≤8 words, nominal phrase, no trailing period. The project name is shown separately on the card, so never repeat it (nor any file/location) inside the text.`
      : '- sideProjects.bullets: [] — empty array, since no repository had commits this week.',
    titles.length > 0
      ? `- notes: exactly one entry per note listed above (${titles.length} note(s)). "title" is the note title copied VERBATIM, and "summary" is 1 sentence (max 25 words) summarizing what the note is about.`
      : '- notes: empty array, since no notes were captured this week.',
    work.length > 0
      ? `- work.summary: 2-3 sentences summarizing the day-job work from the ${work.length} "Work log (day job)" item(s) above. Same impersonal, outcome-oriented tone as the rest; describe what was accomplished at work, not who did it. Do NOT invent details beyond the item titles.`
      : '- work.summary: "" — empty, since there was no day-job work logged this week.',
    work.length > 0
      ? `- work.bullets: the 1 to 3 MOST IMPORTANT day-job items, each rewritten as ONE short, self-contained bullet that fits on a small card (max ~9 words, nominal phrase, no trailing period). If there are more than 3 items, select the most impactful; if fewer, summarize each. Same impersonal tone.`
      : '- work.bullets: [] — empty array, since there was no day-job work logged this week.'
  ].join('\n')
}
