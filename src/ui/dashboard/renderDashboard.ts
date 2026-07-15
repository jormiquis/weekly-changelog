import type { DashboardData } from './DashboardData.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//.test(value)
}

function tagsMarkup(tags: string[]): string {
  if (tags.length === 0) return ''
  return `<div class="tags">${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>`
}

function digestSection(digest: DashboardData['digest']): string {
  if (!digest) return ''

  return `
    <section class="digest-hero accent-yellow">
      <p class="digest-eyebrow">This week</p>
      <h2 class="digest-headline">${escapeHtml(digest.headline)}</h2>
      <p class="digest-summary">${escapeHtml(digest.summary)}</p>
      ${tagsMarkup(digest.highlights)}
    </section>`
}

function repoSection(repos: DashboardData['repos']): string {
  if (repos.length === 0) return ''

  const repoCards = repos.map(repo => `
      <article class="entry-card accent-blue">
        <header class="entry-head">
          <a class="entry-title" href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a>
          <span class="pill">${repo.totalCommits} commit${repo.totalCommits === 1 ? '' : 's'}</span>
        </header>
        ${repo.evaluation ? `<p class="repo-evaluation"><span class="ai-badge">AI</span>${escapeHtml(repo.evaluation)}</p>` : ''}
        <ul class="commits">
          ${repo.commits.map(commit => `<li>${escapeHtml(commit)}</li>`).join('')}
        </ul>
        <a class="diff-link" href="${escapeHtml(repo.diffUrl)}" target="_blank" rel="noopener">View diff &rarr;</a>
      </article>`).join('')

  return `
    <section class="dashboard-section">
      <h2>Commits</h2>
      <div class="entry-grid">${repoCards}</div>
    </section>`
}

function createdReposSection(createdRepos: DashboardData['createdRepos']): string {
  if (createdRepos.length === 0) return ''

  const cards = createdRepos.map(repo => `
    <article class="entry-card accent-green">
      <header class="entry-head">
        <a class="entry-title" href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a>
      </header>
      ${repo.description ? `<p class="description">${escapeHtml(repo.description)}</p>` : ''}
    </article>`).join('')

  return `
    <section class="dashboard-section">
      <h2>New repositories</h2>
      <div class="entry-grid">${cards}</div>
    </section>`
}

function notesSection(notes: DashboardData['notes']): string {
  if (notes.length === 0) return ''

  const cards = notes.map(note => {
    const sources = note.sources.map(source => isHttpUrl(source)
      ? `<a href="${escapeHtml(source)}" target="_blank" rel="noopener">${escapeHtml(source)}</a>`
      : `<span>${escapeHtml(source)}</span>`
    ).join('')

    return `
      <article class="entry-card accent-magenta">
        <header class="entry-head">
          <span class="entry-title"><span class="emoji">${escapeHtml(note.emoji)}</span>${escapeHtml(note.title)}</span>
        </header>
        ${sources ? `<div class="sources">${sources}</div>` : ''}
      </article>`
  }).join('')

  return `
    <section class="dashboard-section">
      <h2>Knowledge gained</h2>
      <div class="entry-grid">${cards}</div>
    </section>`
}

export function renderDashboard(data: DashboardData): string {
  const hasActivity = data.repos.length > 0 || data.createdRepos.length > 0 || data.notes.length > 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Changelog</title>
  <meta property="og:title" content="Weekly Changelog">
  <meta property="og:image" content="card.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: light;
      --page-plane: #f9f9f7;
      --surface: #fcfcfb;
      --text-primary: #0b0b0b;
      --text-secondary: #52514e;
      --text-muted: #898781;
      --border: rgba(11, 11, 11, 0.10);
      --shadow: 0 1px 2px rgba(11, 11, 11, 0.04), 0 6px 16px rgba(11, 11, 11, 0.05);

      --accent-blue: #2a78d6;
      --accent-blue-bg: rgba(42, 120, 214, 0.10);
      --accent-green: #008300;
      --accent-green-bg: rgba(0, 131, 0, 0.10);
      --accent-magenta: #c2427a;
      --accent-magenta-bg: rgba(232, 123, 164, 0.16);
      --accent-yellow: #eda100;
      --accent-yellow-bg: rgba(237, 161, 0, 0.14);

      --tag-bg: rgba(11, 11, 11, 0.05);
    }

    @media (prefers-color-scheme: dark) {
      :root:where(:not([data-theme="light"])) {
        color-scheme: dark;
        --page-plane: #0d0d0d;
        --surface: #1a1a19;
        --text-primary: #ffffff;
        --text-secondary: #c3c2b7;
        --text-muted: #898781;
        --border: rgba(255, 255, 255, 0.10);
        --shadow: none;

        --accent-blue: #3987e5;
        --accent-blue-bg: rgba(57, 135, 229, 0.16);
        --accent-green: #2fae2f;
        --accent-green-bg: rgba(47, 174, 47, 0.16);
        --accent-magenta: #d55181;
        --accent-magenta-bg: rgba(213, 81, 129, 0.18);
        --accent-yellow: #c98500;
        --accent-yellow-bg: rgba(201, 133, 0, 0.18);

        --tag-bg: rgba(255, 255, 255, 0.06);
      }
    }

    :root[data-theme="dark"] {
      color-scheme: dark;
      --page-plane: #0d0d0d;
      --surface: #1a1a19;
      --text-primary: #ffffff;
      --text-secondary: #c3c2b7;
      --text-muted: #898781;
      --border: rgba(255, 255, 255, 0.10);
      --shadow: none;

      --accent-blue: #3987e5;
      --accent-blue-bg: rgba(57, 135, 229, 0.16);
      --accent-green: #2fae2f;
      --accent-green-bg: rgba(47, 174, 47, 0.16);
      --accent-magenta: #d55181;
      --accent-magenta-bg: rgba(213, 81, 129, 0.18);
      --accent-yellow: #c98500;
      --accent-yellow-bg: rgba(201, 133, 0, 0.18);

      --tag-bg: rgba(255, 255, 255, 0.06);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(24px, 4vw, 40px);
      padding: clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 48px;
      font-family: 'Poppins', sans-serif;
      background: var(--page-plane);
      color: var(--text-primary);
    }

    .page { width: 100%; max-width: 1160px; display: flex; flex-direction: column; gap: clamp(24px, 4vw, 40px); }

    .page-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
    .page-header h1 { font-size: clamp(22px, 3vw, 28px); font-weight: 600; margin: 0; }
    .week-pill { font-size: 14px; font-weight: 500; color: var(--text-secondary); background: var(--surface); border: 1px solid var(--border); padding: 6px 16px; border-radius: 999px; white-space: nowrap; }

    .dashboard-section h2 { font-size: 18px; font-weight: 600; margin: 0 0 14px; color: var(--text-primary); }

    .entry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr)); gap: 14px; }

    .entry-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      border-radius: 14px;
      box-shadow: var(--shadow);
      padding: 18px 20px;
    }
    .accent-blue { --accent: var(--accent-blue); --accent-bg: var(--accent-blue-bg); }
    .accent-green { --accent: var(--accent-green); --accent-bg: var(--accent-green-bg); }
    .accent-magenta { --accent: var(--accent-magenta); --accent-bg: var(--accent-magenta-bg); }
    .accent-yellow { --accent: var(--accent-yellow); --accent-bg: var(--accent-yellow-bg); }

    .digest-hero {
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 16px;
      box-shadow: var(--shadow);
      padding: 24px 28px;
    }
    .digest-eyebrow { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 8px; }
    .digest-headline { font-size: clamp(20px, 2.6vw, 26px); font-weight: 600; color: var(--text-primary); margin: 0 0 10px; }
    .digest-summary { font-size: 15px; line-height: 1.5; color: var(--text-secondary); margin: 0 0 14px; }
    .digest-hero .tags { margin-bottom: 0; }

    .entry-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .entry-title { font-size: 16px; font-weight: 600; color: var(--text-primary); text-decoration: none; display: flex; align-items: center; gap: 8px; word-break: break-word; }
    .entry-title:hover { text-decoration: underline; }
    .emoji { font-size: 17px; }

    .pill { font-size: 12px; font-weight: 600; color: var(--accent); background: var(--accent-bg); padding: 4px 12px; border-radius: 999px; white-space: nowrap; }

    .repo-evaluation { font-size: 13.5px; line-height: 1.5; color: var(--text-secondary); background: var(--tag-bg); border-radius: 8px; padding: 10px 12px; margin: 0 0 12px; }
    .ai-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted); background: var(--border); padding: 2px 6px; border-radius: 4px; margin-right: 8px; }

    .commits { list-style: none; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 5px; }
    .commits li { font-size: 13.5px; line-height: 1.5; color: var(--text-secondary); word-break: break-word; }
    .commits li::before { content: '– '; color: var(--text-muted); }

    .diff-link { font-size: 13px; font-weight: 500; color: var(--accent); text-decoration: none; }
    .diff-link:hover { text-decoration: underline; }

    .description { font-size: 14px; color: var(--text-secondary); margin: 0; }

    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .tag { font-size: 12px; font-weight: 500; color: var(--text-secondary); background: var(--tag-bg); border: 1px solid var(--border); padding: 3px 10px; border-radius: 999px; }

    .sources { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
    .sources a, .sources span { color: var(--text-secondary); word-break: break-all; }
    .sources a { color: var(--accent-blue); }

    .empty-state { text-align: center; color: var(--text-muted); font-size: 15px; padding: 20px 0; }

    footer { font-size: 13px; color: var(--text-muted); text-align: center; }
    footer a { color: var(--text-secondary); text-decoration: none; }
    footer a:hover { text-decoration: underline; }

    @media (max-width: 480px) {
      .entry-card { padding: 16px; }
      .entry-title { font-size: 15px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="page-header">
      <h1>Weekly Changelog</h1>
      <span class="week-pill">${escapeHtml(data.week)}</span>
    </header>
    ${digestSection(data.digest)}
    ${repoSection(data.repos)}
    ${createdReposSection(data.createdRepos)}
    ${notesSection(data.notes)}
    ${!hasActivity ? '<p class="empty-state">No activity recorded this week.</p>' : ''}
  </div>
  <footer>
    Generated ${escapeHtml(data.generatedAt)} &middot; <a href="https://github.com/jormiquis/weekly-changelog">weekly-changelog</a>
  </footer>
</body>
</html>
`
}
