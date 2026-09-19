<script setup lang="ts">
import { useDocumentVisibility, useEventListener } from '@vueuse/core';
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';

const STAR_DENSITY_PER_SQUARE_PX = 0.00032;

const DRIFT_PX_PER_MS = 0.012;

const MAX_PIXEL_RATIO = 2;

const MAX_FRAME_MS = 64;

const TWINKLE_RATE = 0.0022;

const DEPTH_MIN = 0.3;
const DEPTH_RANGE = 0.7;
const RADIUS_MIN = 0.4;
const RADIUS_RANGE = 1.8;

const STAR_COLOR_TOKENS = ['--sky-star-1', '--sky-star-2', '--sky-star-3', '--sky-star-4'];

const FALLBACK_STAR_COLOR = '#ffffff';

type Star = {
  x: number;
  y: number;
  depth: number;
  radius: number;
  color: string;
  phase: number;
};

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');
const visibility = useDocumentVisibility();

let context: CanvasRenderingContext2D | null = null;
let stars: Star[] = [];
let width = 0;
let height = 0;
let frame = 0;
let lastTime = 0;

const readPalette = (canvas: HTMLCanvasElement): string[] => {
  const styles = window.getComputedStyle(canvas);
  const palette = STAR_COLOR_TOKENS.map((token) => styles.getPropertyValue(token).trim()).filter(
    (color) => color !== '',
  );
  return palette.length > 0 ? palette : [FALLBACK_STAR_COLOR];
};

const createStar = (palette: string[]): Star => ({
  x: Math.random() * width,
  y: Math.random() * height,
  depth: DEPTH_MIN + Math.random() * DEPTH_RANGE,
  radius: RADIUS_MIN + Math.random() * RADIUS_RANGE,
  color: palette[Math.floor(Math.random() * palette.length)] ?? FALLBACK_STAR_COLOR,
  phase: Math.random() * Math.PI * 2,
});

const measure = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const rect = canvas.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const palette = readPalette(canvas);
  stars = Array.from({ length: Math.round(width * height * STAR_DENSITY_PER_SQUARE_PX) }, () => createStar(palette));
};

const draw = (ctx: CanvasRenderingContext2D, time: number) => {
  ctx.clearRect(0, 0, width, height);
  for (const star of stars) {
    const twinkle = 0.6 + 0.4 * Math.sin(star.phase + time * TWINKLE_RATE);
    ctx.globalAlpha = Math.min(1, Math.max(0.15, twinkle * star.depth));
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius * star.depth, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const step = (time: number) => {
  const ctx = context;
  if (!ctx) return;
  const elapsed = lastTime === 0 ? 16 : Math.min(time - lastTime, MAX_FRAME_MS);
  lastTime = time;
  for (const star of stars) {
    star.x -= DRIFT_PX_PER_MS * elapsed * star.depth;
    if (star.x < -star.radius) {
      star.x = width + star.radius;
      star.y = Math.random() * height;
    }
  }
  draw(ctx, time);
  frame = requestAnimationFrame(step);
};

const startLoop = () => {
  if (frame !== 0 || !context) return;
  lastTime = 0; // The next frame is treated as the first: no jump after a pause.
  frame = requestAnimationFrame(step);
};

const stopLoop = () => {
  if (frame === 0) return;
  cancelAnimationFrame(frame);
  frame = 0;
};

watch(visibility, (state) => {
  if (state === 'hidden') stopLoop();
  else startLoop();
});

useEventListener(window, 'resize', () => {
  const canvas = canvasRef.value;
  const ctx = context;
  if (!canvas || !ctx) return;
  measure(canvas, ctx);
  draw(ctx, lastTime);
});

onMounted(() => {
  const canvas = canvasRef.value;
  context = canvas?.getContext('2d') ?? null;
  if (!canvas || !context) return;
  measure(canvas, context);
  draw(context, 0);
  if (visibility.value !== 'hidden') startLoop();
});

onBeforeUnmount(() => {
  stopLoop();
  context = null;
  stars = [];
});
</script>

<template>
  <div class="star-field" aria-hidden="true">
    <div class="star-field-clouds"></div>
    <canvas ref="canvas" class="star-field-canvas"></canvas>
  </div>
</template>

<style scoped>
.star-field {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.star-field-clouds {
  position: absolute;
  inset: 0;
  filter: blur(8px);
  background:
    radial-gradient(40% 55% at 22% 30%, var(--sky-cloud-pink), transparent 70%),
    radial-gradient(35% 45% at 78% 65%, var(--sky-cloud-teal), transparent 70%),
    radial-gradient(50% 60% at 60% 10%, var(--sky-cloud-violet), transparent 70%);
}

.star-field-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
