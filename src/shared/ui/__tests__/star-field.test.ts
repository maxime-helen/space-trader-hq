import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import StarField from '@/shared/ui/star-field.vue';

const setVisibility = async (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
  await nextTick();
};

let frames: Map<number, FrameRequestCallback>;
let requestFrame: ReturnType<typeof vi.fn>;
let cancelFrame: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  const context = { setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as RenderingContext);
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 1280, 720));

  frames = new Map();
  let nextHandle = 1;
  requestFrame = vi.fn((callback: FrameRequestCallback) => {
    const handle = nextHandle;
    nextHandle += 1;
    frames.set(handle, callback);
    return handle;
  });
  cancelFrame = vi.fn((handle: number) => {
    frames.delete(handle);
  });
  vi.stubGlobal('requestAnimationFrame', requestFrame);
  vi.stubGlobal('cancelAnimationFrame', cancelFrame);
  await setVisibility('visible');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('StarField', () => {
  it('draws a decorative canvas and keeps one frame in flight', () => {
    const wrapper = mount(StarField);

    expect(wrapper.find('canvas').exists()).toBe(true);
    expect(wrapper.find('.star-field').attributes('aria-hidden')).toBe('true');
    expect(frames.size).toBe(1);
    wrapper.unmount();
  });

  it('stops the loop while the tab is hidden and on unmount', async () => {
    const wrapper = mount(StarField);

    await setVisibility('hidden');
    expect(frames.size).toBe(0);

    await setVisibility('visible');
    expect(frames.size).toBe(1);

    wrapper.unmount();
    await nextTick();
    expect(frames.size).toBe(0);
  });

  it('mounts without a 2D context and schedules nothing', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    const wrapper = mount(StarField);

    expect(wrapper.find('canvas').exists()).toBe(true);
    expect(requestFrame).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
