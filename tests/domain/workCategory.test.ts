import { describe, it, expect } from 'vitest';
import { fileArea, areaFromFiles, describeWork } from '../../src/domain/workCategory.js';

describe('workCategory', () => {
  it('buckets file paths into work areas', () => {
    expect(fileArea('src/ui/Button.tsx')).toBe('visual');
    expect(fileArea('styles/app.css')).toBe('visual');
    expect(fileArea('src/api/users.py')).toBe('backend');
    expect(fileArea('server/routes/auth.go')).toBe('backend');
    expect(fileArea('tests/foo.test.ts')).toBe('tests');
    expect(fileArea('README.md')).toBe('docs');
    expect(fileArea('.github/workflows/ci.yml')).toBe('infra');
    expect(fileArea('db/migrations/001.sql')).toBe('data');
    expect(fileArea('src/domain/mapper.ts')).toBe('code');
  });

  it('picks the dominant area across a set of files', () => {
    expect(areaFromFiles([
      { filename: 'src/ui/A.tsx', additions: 1, deletions: 0 },
      { filename: 'src/ui/B.tsx', additions: 1, deletions: 0 },
      { filename: 'src/domain/x.ts', additions: 1, deletions: 0 },
    ])).toBe('visual');
    expect(areaFromFiles([])).toBe('code');
  });

  it('describes work generically by type and area', () => {
    expect(describeWork('feat', 'visual')).toBe('Created a visual component');
    expect(describeWork('feat', 'backend')).toBe('New backend development');
    expect(describeWork('refactor', 'code')).toBe('Refactored code');
    expect(describeWork('fix', 'backend')).toBe('Fixed backend issues');
    expect(describeWork('perf', 'code')).toBe('Improved performance');
    expect(describeWork('other', 'code')).toBeNull();
  });
});
