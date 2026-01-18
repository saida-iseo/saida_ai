import { resolveModel } from './modelRegistry';
import type { UpscaleMode, UpscalePreset } from './types';

export async function loadModel(mode: UpscaleMode, preset: UpscalePreset, scale: 2 | 4) {
    const model = resolveModel(mode, preset, scale);
    if (!model.url || model.runtime === 'classic') {
        return model;
    }

    if (typeof caches !== 'undefined') {
        const cache = await caches.open('saida-models-v1');
        const cached = await cache.match(model.url);
        if (!cached) {
            const res = await fetch(model.url);
            if (!res.ok) throw new Error(`Model download failed (${res.status})`);
            await cache.put(model.url, res.clone());
        }
    } else {
        const res = await fetch(model.url);
        if (!res.ok) throw new Error(`Model download failed (${res.status})`);
    }

    return model;
}
