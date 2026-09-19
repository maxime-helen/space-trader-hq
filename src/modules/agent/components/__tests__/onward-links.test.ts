import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import OnwardLinks from '@/modules/agent/components/onward-links.vue';

const mountLinks = () => mount(OnwardLinks, { global: { stubs: { RouterLink: RouterLinkStub } } });

describe('OnwardLinks', () => {
  it('links to Systems, Fleet and Markets, in that order', () => {
    const links = mountLinks().findAllComponents(RouterLinkStub);

    expect(links.map((link) => link.props('to'))).toEqual(['/systems', '/fleet', '/markets']);
    expect(links.map((link) => link.text())).toEqual([
      expect.stringContaining('Systems'),
      expect.stringContaining('Fleet'),
      expect.stringContaining('Markets'),
    ]);
  });

  it('gives each link a one-line description of what is there', () => {
    const descriptions = mountLinks().findAll('.onward-link-description');

    expect(descriptions).toHaveLength(3);
    for (const description of descriptions) expect(description.text().length).toBeGreaterThan(0);
  });
});
