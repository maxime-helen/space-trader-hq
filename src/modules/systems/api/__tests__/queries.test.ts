import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { systemKeys } from '@/modules/systems/api/keys';
import { useShipyardQuery, useWaypointQuery } from '@/modules/systems/api/queries';
import { buildPage, buildWaypoint } from '@/shared/api/__tests__/fixtures';
import { createRequestCounter } from '@/shared/api/__tests__/handlers';
import { setupApiMocks } from '@/shared/api/__tests__/server';
import { createTestQueryClient, WAIT, withSetup } from '@/shared/api/__tests__/test-support';

const server = setupApiMocks();

const SYSTEM = 'X1-AB12';
const WAYPOINT = 'X1-AB12-A1';

afterEach(() => {
  server.events.removeAllListeners();
});

describe('useWaypointQuery', () => {
  it('renders instantly from a filtered list the user already loaded', () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      systemKeys.waypoints(SYSTEM, { page: 1, traits: ['MARKETPLACE'] }),
      buildPage([buildWaypoint({ symbol: WAYPOINT, type: 'MOON' })]),
    );

    const { result, app } = withSetup(() => useWaypointQuery(SYSTEM, WAYPOINT), queryClient);

    expect(result.data.value?.symbol).toBe(WAYPOINT);
    expect(result.data.value?.type).toBe('MOON');
    expect(result.isPlaceholderData.value).toBe(true);
    app.unmount();
  });

  it('has nothing to show first when no list carries that waypoint', () => {
    const { result, app } = withSetup(() => useWaypointQuery(SYSTEM, 'X1-AB12-NOPE'), createTestQueryClient());

    expect(result.data.value).toBeUndefined();
    app.unmount();
  });
});

describe('a switched-off query', () => {
  it('makes no request while it is disabled, and exactly one when it is enabled', async () => {
    const counter = createRequestCounter();
    server.use(counter.handler);
    const enabled = ref(false);

    const { result, app } = withSetup(() => useShipyardQuery(SYSTEM, WAYPOINT, { enabled }), createTestQueryClient());

    await vi.waitFor(() => {
      expect(result.fetchStatus.value).toBe('idle');
    }, WAIT);
    expect(counter.count()).toBe(0);

    enabled.value = true;
    await vi.waitFor(() => {
      expect(counter.count()).toBe(1);
    }, WAIT);
    app.unmount();
  });
});
