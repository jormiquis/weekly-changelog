import type { DashboardData } from './DashboardData.js';
import type { Metrics } from '../../domain/computeMetrics.js';

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

const TIMELINE_ICON = { push: '💻', repo: '🆕', note: '📝' } as const

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

function digestSection(digest: DashboardData['digest']): string {
  if (!digest) return ''

  const highlights = digest.highlights.map(highlight => {
    const evidence = highlight.evidence.length > 0
      ? `<ul class="evidence">${highlight.evidence.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : ''
    return `
      <li class="highlight">
        <p class="highlight-text">${escapeHtml(highlight.text)}</p>
        ${evidence}
      </li>`
  }).join('')

  return `
    <section class="digest-hero accent-yellow">
      <p class="digest-eyebrow"><span class="ai-badge">AI</span>This week</p>
      <h2 class="digest-headline">${escapeHtml(digest.headline)}</h2>
      <p class="digest-summary">${escapeHtml(digest.summary)}</p>
      <ul class="highlights">${highlights}</ul>
    </section>`
}

function barList(items: { label: string; value: number }[], suffix = ''): string {
  if (items.length === 0) return '<p class="muted">No data</p>'
  const max = Math.max(...items.map(item => item.value), 1)
  return `<div class="bars">${items.map(item => `
    <div class="bar-row">
      <span class="bar-label">${escapeHtml(item.label)}</span>
      <span class="bar-track"><span class="bar-fill" style="width: ${(item.value / max) * 100}%"></span></span>
      <span class="bar-value">${item.value}${suffix}</span>
    </div>`).join('')}</div>`
}

function metricsSection(metrics: Metrics): string {
  if (metrics.totalCommits === 0 && metrics.notesTaken === 0) return ''

  const tile = (value: string, label: string) => `
    <div class="metric-tile">
      <span class="metric-value">${escapeHtml(value)}</span>
      <span class="metric-label">${escapeHtml(label)}</span>
    </div>`

  const tiles = [
    tile(pct(metrics.atomicCommitRatio), 'Atomic commits'),
    tile(`${metrics.averageCommitSize}`, 'Avg commit size (lines)'),
    tile(pct(metrics.testRatio), 'Test ratio'),
    tile(pct(metrics.refactorRatio), 'Refactor ratio'),
    tile(pct(metrics.documentationRatio), 'Documentation ratio'),
    tile(`${metrics.repositories}`, metrics.repositories === 1 ? 'Repository' : 'Repositories'),
  ].join('')

  return `
    <section class="dashboard-section">
      <h2>Metrics</h2>
      <div class="metric-grid">${tiles}</div>
      <div class="chart-grid">
        <div class="chart-card">
          <h3>Commits by type</h3>
          ${barList(metrics.commitsByType.map(item => ({ label: item.type, value: item.count })))}
        </div>
        <div class="chart-card">
          <h3>Languages</h3>
          ${barList(metrics.languages.map(item => ({ label: item.language, value: item.files })))}
        </div>
      </div>
    </section>`
}

function timelineSection(timeline: DashboardData['timeline']): string {
  if (timeline.length === 0) return ''

  const items = timeline.map(event => `
    <li class="timeline-item type-${event.type}">
      <span class="timeline-dot">${TIMELINE_ICON[event.type]}</span>
      <div class="timeline-body">
        <div class="timeline-head">
          <span class="timeline-title">${escapeHtml(event.title)}</span>
          <span class="timeline-when">${escapeHtml(event.when)}</span>
        </div>
        <p class="timeline-meta">${escapeHtml(event.meta)}</p>
      </div>
    </li>`).join('')

  return `
    <section class="dashboard-section">
      <h2>Weekly timeline</h2>
      <ul class="timeline">${items}</ul>
    </section>`
}

function repoSection(repos: DashboardData['repos']): string {
  if (repos.length === 0) return ''

  const repoCards = repos.map(repo => `
      <article class="entry-card accent-blue">
        <header class="entry-head">
          <a class="entry-title" href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.name)}</a>
          <span class="head-meta">
            <span class="diffstat"><span class="add">+${repo.additions}</span> <span class="del">−${repo.deletions}</span></span>
            <span class="pill">${repo.totalCommits} commit${repo.totalCommits === 1 ? '' : 's'}</span>
          </span>
        </header>
        ${repo.evaluation ? `<p class="repo-evaluation"><span class="ai-badge">AI</span>${escapeHtml(repo.evaluation)}</p>` : ''}
        <ul class="commits">
          ${repo.commits.map(commit => `<li>${escapeHtml(commit)}</li>`).join('')}
        </ul>
        <a class="diff-link" href="${escapeHtml(repo.diffUrl)}" target="_blank" rel="noopener">View full diff &rarr;</a>
      </article>`).join('')

  return `
    <section class="dashboard-section">
      <h2>Commits by repository</h2>
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
    const tags = note.tags.length > 0
      ? `<div class="tags">${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>`
      : ''
    const sources = note.sources.map(source => isHttpUrl(source)
      ? `<a href="${escapeHtml(source)}" target="_blank" rel="noopener">${escapeHtml(source)}</a>`
      : `<span>${escapeHtml(source)}</span>`
    ).join('')

    return `
      <article class="entry-card accent-magenta">
        <header class="entry-head">
          <span class="entry-title"><span class="emoji">${escapeHtml(note.emoji)}</span>${escapeHtml(note.title)}</span>
        </header>
        ${tags}
        ${sources ? `<div class="sources"><span class="sources-label">Sources</span>${sources}</div>` : ''}
      </article>`
  }).join('')

  return `
    <section class="dashboard-section">
      <h2>Learnings</h2>
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

      --add-color: #0a7f28;
      --del-color: #c0392f;
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

        --add-color: #3fb950;
        --del-color: #f85149;
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

      --add-color: #3fb950;
      --del-color: #f85149;
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
    .muted { color: var(--text-muted); font-size: 14px; margin: 0; }

    .entry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 14px; }

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

    /* Digest hero */
    .digest-hero {
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 16px;
      box-shadow: var(--shadow);
      padding: 24px 28px;
    }
    .digest-eyebrow { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 10px; }
    .digest-headline { font-size: clamp(20px, 2.6vw, 26px); font-weight: 600; color: var(--text-primary); margin: 0 0 10px; }
    .digest-summary { font-size: 15px; line-height: 1.5; color: var(--text-secondary); margin: 0 0 16px; }
    .highlights { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr)); gap: 12px; }
    .highlight { background: var(--tag-bg); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
    .highlight-text { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
    .evidence { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .evidence li { font-size: 12.5px; line-height: 1.45; color: var(--text-muted); padding-left: 12px; border-left: 2px solid var(--border); word-break: break-word; }

    .ai-badge { font-size: 10px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted); background: var(--border); padding: 2px 6px; border-radius: 4px; }

    /* Metrics */
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr)); gap: 12px; margin-bottom: 16px; }
    .metric-tile { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow); padding: 18px 16px; display: flex; flex-direction: column; gap: 4px; }
    .metric-value { font-size: 26px; font-weight: 700; color: var(--text-primary); font-variant-numeric: tabular-nums; }
    .metric-label { font-size: 12px; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted); }

    .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 14px; }
    .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow); padding: 18px 20px; }
    .chart-card h3 { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 14px; }
    .bars { display: flex; flex-direction: column; gap: 10px; }
    .bar-row { display: grid; grid-template-columns: 92px 1fr auto; align-items: center; gap: 10px; }
    .bar-label { font-size: 13px; color: var(--text-secondary); text-transform: capitalize; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { height: 8px; background: var(--tag-bg); border-radius: 999px; overflow: hidden; }
    .bar-fill { display: block; height: 100%; background: var(--accent-blue); border-radius: 999px; }
    .bar-value { font-size: 13px; font-weight: 600; color: var(--text-primary); font-variant-numeric: tabular-nums; }

    /* Timeline */
    .timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    .timeline-item { display: grid; grid-template-columns: 40px 1fr; gap: 14px; padding-bottom: 18px; position: relative; }
    .timeline-item:not(:last-child)::before { content: ''; position: absolute; left: 19px; top: 34px; bottom: 0; width: 2px; background: var(--border); }
    .timeline-dot { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 50%; box-shadow: var(--shadow); z-index: 1; }
    .timeline-body { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow); padding: 12px 16px; }
    .timeline-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; }
    .timeline-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .timeline-when { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
    .timeline-meta { font-size: 13.5px; color: var(--text-secondary); margin: 4px 0 0; word-break: break-word; }
    .type-note .timeline-dot { border-color: var(--accent-magenta); }
    .type-repo .timeline-dot { border-color: var(--accent-green); }
    .type-push .timeline-dot { border-color: var(--accent-blue); }

    /* Repo cards */
    .entry-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
    .entry-title { font-size: 16px; font-weight: 600; color: var(--text-primary); text-decoration: none; display: flex; align-items: center; gap: 8px; word-break: break-word; }
    .entry-title:hover { text-decoration: underline; }
    .emoji { font-size: 17px; }
    .head-meta { display: flex; align-items: center; gap: 10px; }
    .diffstat { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .diffstat .add { color: var(--add-color); }
    .diffstat .del { color: var(--del-color); }

    .pill { font-size: 12px; font-weight: 600; color: var(--accent); background: var(--accent-bg); padding: 4px 12px; border-radius: 999px; white-space: nowrap; }

    .repo-evaluation { display: flex; gap: 8px; align-items: baseline; font-size: 13.5px; line-height: 1.5; color: var(--text-secondary); background: var(--tag-bg); border-radius: 8px; padding: 10px 12px; margin: 0 0 12px; }

    .commits { list-style: none; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 5px; }
    .commits li { font-size: 13.5px; line-height: 1.5; color: var(--text-secondary); word-break: break-word; }
    .commits li::before { content: '– '; color: var(--text-muted); }

    .diff-link { font-size: 13px; font-weight: 500; color: var(--accent); text-decoration: none; }
    .diff-link:hover { text-decoration: underline; }

    .description { font-size: 14px; color: var(--text-secondary); margin: 0; }

    .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .tag { font-size: 12px; font-weight: 500; color: var(--text-secondary); background: var(--tag-bg); border: 1px solid var(--border); padding: 3px 10px; border-radius: 999px; }

    .sources { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
    .sources-label { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 2px; }
    .sources a, .sources span { color: var(--text-secondary); word-break: break-all; }
    .sources a { color: var(--accent-blue); }

    .empty-state { text-align: center; color: var(--text-muted); font-size: 15px; padding: 20px 0; }

    footer { font-size: 13px; color: var(--text-muted); text-align: center; }
    footer a { color: var(--text-secondary); text-decoration: none; }
    footer a:hover { text-decoration: underline; }

    @media (max-width: 480px) {
      .entry-card { padding: 16px; }
      .entry-title { font-size: 15px; }
      .bar-row { grid-template-columns: 76px 1fr auto; }
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
    ${metricsSection(data.metrics)}
    ${timelineSection(data.timeline)}
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
