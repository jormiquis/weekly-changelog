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

function repoSection(repos: DashboardData['repos']): string {
  if (repos.length === 0) return ''

  const repoCards = repos.map(repo => {
    const pushes = repo.pushes.map(push => `
      <li class="push">
        <div class="push-head">
          <a class="diff-link" href="${escapeHtml(push.diffUrl)}" target="_blank" rel="noopener">View diff &rarr;</a>
        </div>
        <ul class="commits">
          ${push.commits.map(commit => `<li>${escapeHtml(commit)}</li>`).join('')}
        </ul>
      </li>`).join('')

    return `
      <article class="entry-card accent-teal">
        <header class="entry-head">
          <a class="entry-title" href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a>
          <span class="pill">${repo.totalCommits} commit${repo.totalCommits === 1 ? '' : 's'}</span>
        </header>
        <ul class="pushes">${pushes}</ul>
      </article>`
  }).join('')

  return `
    <section class="dashboard-section">
      <h2>Commits</h2>
      <div class="entry-grid">${repoCards}</div>
    </section>`
}

function createdReposSection(createdRepos: DashboardData['createdRepos']): string {
  if (createdRepos.length === 0) return ''

  const cards = createdRepos.map(repo => `
    <article class="entry-card accent-pink">
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
      <article class="entry-card accent-amber">
        <header class="entry-head">
          <span class="entry-title"><span class="emoji">${escapeHtml(note.emoji)}</span>${escapeHtml(note.title)}</span>
        </header>
        ${tagsMarkup(note.tags)}
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
    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 40px;
      padding: 40px 20px 60px;
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 45%, #6d28d9 100%);
      background-attachment: fixed;
      color: #ffffff;
    }

    .page { width: 100%; max-width: 1200px; display: flex; flex-direction: column; gap: 40px; }

    .card { border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.14); }
    .card img { display: block; width: 100%; height: auto; }

    .dashboard-section h2 { font-size: 22px; font-weight: 600; margin: 0 0 16px; }

    .entry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

    .entry-card {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-left: 3px solid var(--accent);
      border-radius: 16px;
      padding: 20px;
    }
    .accent-teal { --accent: #2dd4bf; --accent-bg: rgba(45, 212, 191, 0.16); }
    .accent-pink { --accent: #f472b6; --accent-bg: rgba(244, 114, 182, 0.16); }
    .accent-amber { --accent: #fbbf24; --accent-bg: rgba(251, 191, 36, 0.16); }

    .entry-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
    .entry-title { font-size: 17px; font-weight: 600; color: #ffffff; text-decoration: none; display: flex; align-items: center; gap: 8px; }
    .entry-title:hover { text-decoration: underline; }
    .emoji { font-size: 18px; }

    .pill { font-size: 13px; font-weight: 600; color: var(--accent); background: var(--accent-bg); padding: 4px 12px; border-radius: 999px; white-space: nowrap; }

    .pushes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
    .push { background: rgba(255, 255, 255, 0.04); border-radius: 10px; padding: 12px 14px; }
    .push-head { display: flex; justify-content: flex-end; margin-bottom: 6px; }
    .diff-link { font-size: 13px; font-weight: 500; color: var(--accent); text-decoration: none; }
    .diff-link:hover { text-decoration: underline; }

    .commits { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .commits li { font-size: 14px; color: rgba(255, 255, 255, 0.85); }
    .commits li::before { content: '– '; color: rgba(255, 255, 255, 0.4); }

    .description { font-size: 14px; color: rgba(255, 255, 255, 0.75); margin: 0; }

    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .tag { font-size: 12px; font-weight: 500; color: #fbbf24; background: rgba(251, 191, 36, 0.16); padding: 3px 10px; border-radius: 999px; }

    .sources { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
    .sources a, .sources span { color: rgba(255, 255, 255, 0.7); word-break: break-all; }
    .sources a { color: #93c5fd; }

    .empty-state { text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 15px; padding: 20px 0; }

    footer { font-size: 14px; color: rgba(255, 255, 255, 0.6); text-align: center; }
    footer a { color: rgba(255, 255, 255, 0.85); text-decoration: none; }
    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">
      <img src="card.png" alt="Weekly changelog card">
    </div>
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
