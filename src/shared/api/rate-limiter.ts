// Rate limiter for the SpaceTraders API, which allows 2 requests per second with a burst of 2.
//
// It keeps one number: the time the next request may leave. Each caller claims that slot and
// pushes it back by one interval, so requests leave at most one every 500 ms, in the order they
// asked. The slot may lag one interval behind the clock, which is the burst: after a pause, two
// requests leave back-to-back before the spacing kicks in.

const REQUESTS_PER_SECOND = 2;
const INTERVAL_MS = 1000 / REQUESTS_PER_SECOND;

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type RateLimiter = {
  waitForSlot: () => Promise<void>;
};

export const createRateLimiter = (): RateLimiter => {
  let nextSlot = Date.now() - INTERVAL_MS;

  return {
    waitForSlot: async () => {
      const now = Date.now();
      nextSlot = Math.max(nextSlot, now - INTERVAL_MS);
      const mySlot = nextSlot;
      nextSlot += INTERVAL_MS;
      if (mySlot > now) await sleep(Math.ceil(mySlot - now));
    },
  };
};
