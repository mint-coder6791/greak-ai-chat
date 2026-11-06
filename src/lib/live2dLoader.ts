export const LIVE2D_MODEL_URL =
  'https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display@0.4.0/test/assets/shizuku/shizuku.model3.json';

type PixiModule = typeof import('pixi.js');

declare global {
  interface Window {
    PIXI?: PixiModule;
  }
}

export async function loadLive2D() {
  const PIXI = await import('pixi.js');
  window.PIXI = PIXI;
  const { Live2DModel } = await import('pixi-live2d-display');
  return { PIXI, Live2DModel };
}
