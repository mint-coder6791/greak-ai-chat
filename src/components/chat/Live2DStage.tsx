import { useEffect, useRef } from 'react';
import type { Application } from 'pixi.js';
import type { Live2DModel } from 'pixi-live2d-display';
import { loadLive2D } from '@/lib/live2dLoader';

export type Live2DStatus = 'loading' | 'ready' | 'error';

interface Live2DStageProps {
  modelUrl: string;
  onStatusChange: (status: Live2DStatus) => void;
}

export function Live2DStage({ modelUrl, onStatusChange }: Live2DStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let app: Application | null = null;
    let model: Live2DModel | null = null;

    const fitModel = () => {
      if (!app || !model) return;
      const { width, height } = app.screen;
      model.scale.set(1);
      model.scale.set(Math.min(width / model.width, height / model.height));
      model.position.set(width / 2, height / 2);
    };

    const init = async () => {
      const { PIXI, Live2DModel: Model } = await loadLive2D();
      if (disposed) return;

      app = new PIXI.Application({
        resizeTo: container,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });
      container.appendChild(app.view as HTMLCanvasElement);

      const loaded = await Model.from(modelUrl);
      if (disposed) {
        loaded.destroy();
        return;
      }
      model = loaded;
      model.anchor.set(0.5);
      app.stage.addChild(model);
      app.renderer.on('resize', fitModel);
      fitModel();
      void model.motion('Idle');
      onStatusChange('ready');
    };

    init().catch((err: unknown) => {
      console.error('Live2D 模型加载失败', err);
      if (!disposed) onStatusChange('error');
    });

    return () => {
      disposed = true;
      app?.destroy(true, { children: true });
      app = null;
      model = null;
    };
  }, [modelUrl, onStatusChange]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
