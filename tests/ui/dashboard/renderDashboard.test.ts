import { describe, it, expect } from 'vitest';
import { renderDashboard } from '../../../src/ui/dashboard/renderDashboard.js';
import type { DashboardData } from '../../../src/ui/dashboard/DashboardData.js';

const empty: DashboardData = {
  week: 'Week of Aug 12',
  generatedAt: '2026-08-16',
  repos: [],
  createdRepos: [],
  forks: [],
  pullRequests: [],
  notes: [],
  work: { items: [] },
}

describe('renderDashboard — how this works', () => {
  it('offers the explanation from the header of every published dashboard', () => {
    const html = renderDashboard(empty)

    expect(html).toContain('<a class="how-link" href="#how-it-works">How this works?</a>')
    expect(html).toContain('id="how-it-works"')
    expect(html).toContain('<svg')
  })

  it('keeps the diagram hidden until the link is followed', () => {
    const html = renderDashboard(empty)

    expect(html).toContain('.how-modal { display: none; }')
    expect(html).toContain('.how-modal:target { display: flex;')
  })
})
