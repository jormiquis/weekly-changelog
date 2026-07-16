const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript',
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
  py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java', kt: 'Kotlin',
  swift: 'Swift', c: 'C', h: 'C', cpp: 'C++', cc: 'C++', hpp: 'C++', cs: 'C#',
  php: 'PHP', scala: 'Scala', ex: 'Elixir', exs: 'Elixir', clj: 'Clojure',
  sh: 'Shell', bash: 'Shell', zsh: 'Shell',
  html: 'HTML', css: 'CSS', scss: 'SCSS', sass: 'SCSS', less: 'Less',
  vue: 'Vue', svelte: 'Svelte',
  json: 'JSON', yml: 'YAML', yaml: 'YAML', toml: 'TOML', xml: 'XML',
  md: 'Markdown', mdx: 'Markdown', sql: 'SQL', graphql: 'GraphQL', gql: 'GraphQL',
  dockerfile: 'Docker',
}

/** Maps a file path to a display language, or null when unknown. */
export function languageFromPath(path: string): string | null {
  const base = path.split('/').pop() ?? path

  if (base.toLowerCase() === 'dockerfile') return 'Docker'

  const ext = base.includes('.') ? base.split('.').pop()!.toLowerCase() : ''
  return EXTENSION_TO_LANGUAGE[ext] ?? null
}
