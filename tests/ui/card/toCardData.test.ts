import { describe, it, expect } from 'vitest';
import { Activity } from '../../../src/domain/Activity.js';
import type { SynthesizedDigest } from '../../../src/domain/SynthesizedDigest.js';
import { buildCardData } from '../../../src/ui/card/toCardData.js';

function note(title: string) {
  return Activity.create(new Date(), { source: 'notion', entry_emoji: '📝', tags: [], sources: [], title });
}

function work(title: string, tags = ['work']) {
  return Activity.create(new Date(), { source: 'notion', entry_emoji: '💼', tags, sources: [], title });
}

function createdRepo(repo: string, description = '') {
  return Activity.create(new Date(), {
    source: 'github',
    type: 'CreateEvent',
    entityCreated: 'repository',
    repo,
    description,
  });
}

function fork(sourceRepo: string, forkName: string) {
  return Activity.create(new Date(), {
    source: 'github',
    type: 'ForkEvent',
    sourceRepo,
    fork: forkName,
    forkUrl: `https://github.com/${forkName}`,
  });
}

const digest: SynthesizedDigest = {
  headline: 'A focused week',
  summary: 'Steady progress across a few products.',
  repos: [
    {
      repo: 'app',
      product: 'a web app',
      summary: 'The web app gained a new login flow and a dropdown fix.',
      productChanges: ['New login flow', 'Dropdown bug fixed'],
      highlights: [{ title: 'Composition over inheritance', alternative: 'class inheritance', code: 'interface Sender {}', language: 'typescript' }],
    },
    {
      repo: 'api',
      product: 'a REST API',
      summary: 'The API now exposes a users endpoint.',
      productChanges: ['Users endpoint'],
      highlights: [{ title: 'Provider fallback chain', alternative: 'a single hardcoded provider', code: 'class Fallback {}', language: 'typescript', diagram: 'flowchart LR\n A --> B' }],
    },
  ],
  sideProjects: {
    bullets: [
      { project: 'app', text: 'New login flow' },
      { project: 'api', text: 'Users endpoint' },
      { project: 'app', text: 'Composition over inheritance' },
    ],
  },
  notes: [
    { title: 'Ports & adapters', summary: 'Boundaries between domain and infra' },
  ],
  work: {
    summary: 'Led the billing migration and mentored a new hire.',
    bullets: ['Led the billing migration', 'Mentored a new hire'],
  },
};

describe('buildCardData', () => {
  it('builds "sideProjects" from the AI bullets, keeping the project each one applies to', () => {
    const card = buildCardData([], { week: 'Week of Jul 15', digest });

    expect(card.sideProjects).toEqual([
      { project: 'app', text: 'New login flow' },
      { project: 'api', text: 'Users endpoint' },
      { project: 'app', text: 'Composition over inheritance' },
    ]);
  });

  it('builds "learnings" from raw note titles, without AI, even when a digest exists', () => {
    const activities = [note('Ports & adapters'), note('Free-tier LLMs')];

    const card = buildCardData(activities, { week: 'Week of Jul 15', digest });

    expect(card.learnings).toEqual(['Ports & adapters', 'Free-tier LLMs']);
  });

  it('adds a bullet per fork, without AI, so a fork-only week still fills the column', () => {
    const activities = [fork('jmiquis/pokedex', 'jormiquis/pokedex')];

    const card = buildCardData(activities, { week: 'Week of Sep 1' });

    expect(card.sideProjects).toEqual([
      { project: 'pokedex', text: 'forked from jmiquis/pokedex' },
    ]);
  });

  it('adds a bullet per new repository, without AI, even when it carries no commits', () => {
    const activities = [createdRepo('jormiquis/budget-api', 'A personal finance API')];

    const card = buildCardData(activities, { week: 'Week of Sep 1' });

    expect(card.sideProjects).toEqual([
      { project: 'budget-api', text: 'new repository' },
    ]);
  });

  it('groups a new repository under the same project label as its AI bullets', () => {
    const activities = [createdRepo('jormiquis/app')];

    const card = buildCardData(activities, { week: 'Week of Sep 1', digest });

    expect(card.sideProjects).toEqual([
      { project: 'app', text: 'New login flow' },
      { project: 'api', text: 'Users endpoint' },
      { project: 'app', text: 'Composition over inheritance' },
      { project: 'app', text: 'new repository' },
    ]);
  });

  it('keeps the milestone bullets when the AI already filled the column', () => {
    const activities = [fork('jmiquis/pokedex', 'jormiquis/pokedex')];
    const wideDigest: SynthesizedDigest = {
      ...digest,
      sideProjects: { bullets: ['s1', 's2', 's3', 's4'].map(text => ({ project: 'app', text })) },
    };

    const card = buildCardData(activities, { week: 'Week of Sep 1', digest: wideDigest });

    expect(card.sideProjects).toEqual([
      { project: 'app', text: 's1' },
      { project: 'app', text: 's2' },
      { project: 'app', text: 's3' },
      { project: 'pokedex', text: 'forked from jmiquis/pokedex' },
    ]);
  });

  it('caps new repos and forks at two between them, so they never crowd out the AI', () => {
    const activities = [
      createdRepo('jormiquis/a'),
      createdRepo('jormiquis/b'),
      fork('upstream/c', 'jormiquis/c'),
    ];

    const card = buildCardData(activities, { week: 'Week of Sep 1', digest });

    expect(card.sideProjects).toEqual([
      { project: 'app', text: 'New login flow' },
      { project: 'api', text: 'Users endpoint' },
      { project: 'a', text: 'new repository' },
      { project: 'b', text: 'new repository' },
    ]);
  });

  it('caps sideProjects at four and learnings at two', () => {
    const wideDigest: SynthesizedDigest = {
      ...digest,
      sideProjects: { bullets: ['s1', 's2', 's3', 's4', 's5'].map(text => ({ project: 'app', text })) },
    };
    const activities = [note('n1'), note('n2'), note('n3')];

    const card = buildCardData(activities, { week: 'Week of Jul 15', digest: wideDigest });

    expect(card.sideProjects).toEqual(['s1', 's2', 's3', 's4'].map(text => ({ project: 'app', text })));
    expect(card.learnings).toEqual(['n1', 'n2']);
  });

  it('leaves AI-driven topics empty when no digest was produced', () => {
    const activities = [note('A note')];

    const card = buildCardData(activities, { week: 'Week of Jul 15', version: 'v2026.W29' });

    expect(card.version).toBe('v2026.W29');
    expect(card.sideProjects).toEqual([]);
    // Learnings never depend on the digest.
    expect(card.learnings).toEqual(['A note']);
    expect(card.atWork).toEqual([]);
  });

  it('builds "atWork" from the AI work bullets, not the raw entry titles', () => {
    const card = buildCardData([], { week: 'Week of Jul 15', digest });

    expect(card.atWork).toEqual(['Led the billing migration', 'Mentored a new hire']);
  });

  it('keeps work/brag entries out of learnings', () => {
    const activities = [note('A learning'), work('A long day-job title that would overflow the card')];

    const card = buildCardData(activities, { week: 'Week of Jul 15', digest });

    expect(card.learnings).toEqual(['A learning']);
  });

  it('caps atWork at three', () => {
    const wideDigest: SynthesizedDigest = {
      ...digest,
      work: { summary: 's', bullets: ['w1', 'w2', 'w3', 'w4'] },
    };

    const card = buildCardData([], { week: 'Week of Jul 15', digest: wideDigest });

    expect(card.atWork).toEqual(['w1', 'w2', 'w3']);
  });
});
