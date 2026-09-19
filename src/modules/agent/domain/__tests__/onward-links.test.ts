import { describe, expect, it } from 'vitest';

import { ONWARD_LINKS } from '@/modules/agent/domain/onward-links';

describe('the onward links', () => {
  it('lists Systems, Fleet and Markets, in order', () => {
    expect(ONWARD_LINKS.map((link) => link.label)).toEqual(['Systems', 'Fleet', 'Markets']);
    expect(ONWARD_LINKS.map((link) => link.to)).toEqual(['/systems', '/fleet', '/markets']);
  });

  it('gives every link a one-line description of what is there', () => {
    for (const link of ONWARD_LINKS) {
      expect(link.description.length).toBeGreaterThan(0);
      expect(link.description).not.toContain('\n');
    }
  });
});
