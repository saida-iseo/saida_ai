import type { UpscaleOptions, UpscaleDiagnostics } from './types';
import { applyUnsharpMask } from './postprocess';
import { resolveModel } from './modelRegistry';
import { loadModel } from './modelLoader';

type Ortx = typeof import('onnxruntime-web');

let ortPromise: Promise<Ortx> | null = null;
type SessionRecord = {
    session: any;
    inputName: string;
    outputName: string;
    channels: number;
    modelId: string;
    provider: 'webgpu' | 'wasm';
    cacheKey: string;
};

const sessionCache = new Map<string, SessionRecord>();
const failedSessions = new Set<string>();
const lastDiagnostics: UpscaleDiagnostics = {};
const ORT_WASM_CDN = 'https://unpkg.com/onnxruntime-web@1.23.2/dist/';

function updateDiagnostics(partial: UpscaleDiagnostics) {
    Object.assign(lastDiagnostics, partial);
}

function setFallbackOnce(fallback: string, error: string) {
    if (!lastDiagnostics.fallback) {
        lastDiagnostics.fallback = fallback;
    }
    if (!lastDiagnostics.lastError) {
        lastDiagnostics.lastError = error;
    }
}

export function resetDiagnostics() {
    lastDiagnostics.runtime = undefined;
    lastDiagnostics.provider = undefined;
    lastDiagnostics.modelId = undefined;
    lastDiagnostics.modelUrl = undefined;
    lastDiagnostics.path = undefined;
    lastDiagnostics.lastError = undefined;
    lastDiagnostics.fallback = undefined;
}

export function getDiagnosticsSnapshot() {
    return { ...lastDiagnostics };
}

function supportsWebGPU(options: UpscaleOptions) {
    return options.useGPU
        && typeof navigator !== 'undefined'
        && 'gpu' in navigator;
}

function resolveOutputTransform(minVal: number, maxVal: number) {
    if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
        return { scale: 255, offset: 0, mode: 'invalid' as const };
    }
    if (minVal < -0.05 && maxVal <= 1.5) {
        return { scale: 127.5, offset: 127.5, mode: 'neg1to1' as const };
    }
    if (maxVal <= 1.5) {
        return { scale: 255, offset: 0, mode: 'norm' as const };
    }
    if (maxVal <= 255) {
        return { scale: 1, offset: 0, mode: '0to255' as const };
    }
    return { scale: 255 / maxVal, offset: 0, mode: 'auto' as const };
}

async function getOrt() {
    if (!ortPromise) {
        ortPromise = import('onnxruntime-web');
    }
    return ortPromise;
}

function getSharpenSettings(
    mode: UpscaleOptions['mode'],
    fidelity: number,
    preset: UpscaleOptions['preset'],
    boost: number = 1
) {
    const base = preset === 'high' ? 1.2 : preset === 'fast' ? 0.6 : 0.9;
    const modeScale = mode === 'text' ? 0.6 : mode === 'anime' ? 0.8 : 1.0;
    const amount = Math.max(0, Math.min(1, base * (0.35 + fidelity * 0.65) * modeScale * boost));
    return { amount, radius: mode === 'text' ? 1 : 2 };
}

export async function upscaleTileClassic(
    imageBitmap: ImageBitmap,
    targetWidth: number,
    targetHeight: number,
    options: UpscaleOptions
) {
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Could not get 2D context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    const { amount, radius } = getSharpenSettings(options.mode, options.fidelity, options.preset);
    if (amount > 0) {
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const sharpened = applyUnsharpMask(imageData, amount, radius);
        ctx.putImageData(sharpened, 0, 0);
    }

    return canvas.transferToImageBitmap();
}

export async function upscaleTileWebGL(
    imageBitmap: ImageBitmap,
    targetWidth: number,
    targetHeight: number
) {
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const gl = canvas.getContext('webgl', {
        antialias: false,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false
    });

    if (!gl) throw new Error('WebGL not supported');

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) throw new Error('Failed to create shaders');

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) throw new Error('Failed to create program');

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageBitmap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 1, 1, 1, 0, 0,
        0, 0, 1, 1, 1, 0
    ]), gl.STATIC_DRAW);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const imageLocation = gl.getUniformLocation(program, 'u_image');
    gl.uniform2f(resolutionLocation, imageBitmap.width, imageBitmap.height);
    gl.uniform1i(imageLocation, 0);

    gl.viewport(0, 0, targetWidth, targetHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    return canvas.transferToImageBitmap();
}

async function resizeBitmap(
    imageBitmap: ImageBitmap,
    targetWidth: number,
    targetHeight: number
) {
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Could not get 2D context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    return canvas.transferToImageBitmap();
}

async function getOnnxSession(
    options: UpscaleOptions,
    scale: 2 | 4,
    providerOverride?: 'webgpu' | 'wasm'
) {
    const canUseWebGPU = supportsWebGPU(options);
    const provider = providerOverride ?? (canUseWebGPU ? 'webgpu' : 'wasm');
    const modelScale = scale === 2 && provider === 'wasm' ? 4 : scale;
    const model = resolveModel(options.mode, options.preset, modelScale);
    if (!model || model.runtime !== 'onnx' || !model.url) return null;
    const cacheKey = `${model.id}:${provider}`;
    if (failedSessions.has(cacheKey)) return null;

    updateDiagnostics({
        runtime: 'onnx',
        modelId: model.id,
        modelUrl: model.url,
        provider
    });

    const cached = sessionCache.get(cacheKey);
    if (cached) return cached;

    try {
        await loadModel(model.mode, model.preset, model.scale);
        const ort = await getOrt();
        ort.env.wasm.wasmPaths = ORT_WASM_CDN;
        ort.env.wasm.numThreads = 1;

        const providers = provider === 'webgpu' ? ['wasm'] : ['wasm'];
        const sessionOptions: any = { 
            executionProviders: providers,
            graphOptimizationLevel: 'all'
        };
        
        // WebGPU는 현재 비활성화 (안정성 문제)
        const session = await ort.InferenceSession.create(model.url, sessionOptions);
        const inputName = session.inputNames[0];
        const outputName = session.outputNames[0];
        const meta = session.inputMetadata[inputName];
        const channelDim = meta?.dimensions?.[1];
        const channels = Number.isFinite(Number(channelDim)) ? Number(channelDim) : 3;

        const record = { session, inputName, outputName, channels, modelId: model.id, provider: 'wasm', cacheKey };
        sessionCache.set(cacheKey, record);
        return record;
    } catch (error) {
        failedSessions.add(cacheKey);
        setFallbackOnce(
            'onnx-session-failed',
            error instanceof Error ? error.message : String(error)
        );
        console.warn(`ONNX session failed (${model.id})`, error);
        return null;
    }
}

async function runOnnxModel(
    imageBitmap: ImageBitmap,
    options: UpscaleOptions,
    scale: 2 | 4,
    providerOverride?: 'webgpu' | 'wasm'
) {
    try {
        const session = await getOnnxSession(options, scale, providerOverride);
        if (!session) {
            setFallbackOnce('onnx-session-unavailable', 'ONNX session unavailable');
            return null;
        }
        const { session: ortSession, inputName, outputName, channels, provider } = session;
        const ort = await getOrt();

        const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(imageBitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
        const { width, height, data } = imageData;

        if (channels === 1) {
            const y = new Float32Array(width * height);
            const cb = new Float32Array(width * height);
            const cr = new Float32Array(width * height);
            for (let i = 0, p = 0; i < data.length; i += 4, p++) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                y[p] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                cb[p] = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
                cr[p] = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
            }

            const tensor = new ort.Tensor('float32', y, [1, 1, height, width]);
            const feeds: Record<string, any> = {};
            feeds[inputName] = tensor;
            const results = await ortSession.run(feeds);
            const out = results[outputName];
            const outData = out.data as Float32Array;
            const outH = out.dims[2];
            const outW = out.dims[3];
            const scaleX = outW / width;
            const scaleY = outH / height;

            let outImage = new ImageData(outW, outH);
            for (let oy = 0; oy < outH; oy++) {
                const sy = oy / scaleY;
                const y0 = Math.min(height - 1, Math.floor(sy));
                const y1 = Math.min(height - 1, Math.ceil(sy));
                const wy = sy - y0;
                for (let ox = 0; ox < outW; ox++) {
                    const sx = ox / scaleX;
                    const x0 = Math.min(width - 1, Math.floor(sx));
                    const x1 = Math.min(width - 1, Math.ceil(sx));
                    const wx = sx - x0;
                    const idx00 = y0 * width + x0;
                    const idx10 = y0 * width + x1;
                    const idx01 = y1 * width + x0;
                    const idx11 = y1 * width + x1;
                    const cbVal =
                        cb[idx00] * (1 - wx) * (1 - wy) +
                        cb[idx10] * wx * (1 - wy) +
                        cb[idx01] * (1 - wx) * wy +
                        cb[idx11] * wx * wy;
                    const crVal =
                        cr[idx00] * (1 - wx) * (1 - wy) +
                        cr[idx10] * wx * (1 - wy) +
                        cr[idx01] * (1 - wx) * wy +
                        cr[idx11] * wx * wy;

                    const yVal = outData[oy * outW + ox] * 255;
                    const r = yVal + 1.402 * (crVal - 128);
                    const g = yVal - 0.344136 * (cbVal - 128) - 0.714136 * (crVal - 128);
                    const b = yVal + 1.772 * (cbVal - 128);
                    const outIdx = (oy * outW + ox) * 4;
                    outImage.data[outIdx] = clamp(r);
                    outImage.data[outIdx + 1] = clamp(g);
                    outImage.data[outIdx + 2] = clamp(b);
                    outImage.data[outIdx + 3] = 255;
                }
            }

            const sharpen = getSharpenSettings(options.mode, options.fidelity, options.preset, 0.5);
            if (sharpen.amount > 0) {
                outImage = applyUnsharpMask(outImage, sharpen.amount, sharpen.radius);
            }

            const outCanvas = new OffscreenCanvas(outW, outH);
            const outCtx = outCanvas.getContext('2d');
            if (!outCtx) return null;
            outCtx.putImageData(outImage, 0, 0);
            return outCanvas.transferToImageBitmap();
        }

        const input = new Float32Array(3 * width * height);
        for (let yPos = 0; yPos < height; yPos++) {
            for (let xPos = 0; xPos < width; xPos++) {
                const idx = (yPos * width + xPos) * 4;
                const base = yPos * width + xPos;
                input[base] = data[idx] / 255;
                input[base + width * height] = data[idx + 1] / 255;
                input[base + width * height * 2] = data[idx + 2] / 255;
            }
        }

        const tensor = new ort.Tensor('float32', input, [1, 3, height, width]);
        const feeds: Record<string, any> = {};
        feeds[inputName] = tensor;
        const results = await ortSession.run(feeds);
        const out = results[outputName];
        const outData = out.data as Float32Array;
        const outH = out.dims[2];
        const outW = out.dims[3];
        let minVal = Number.POSITIVE_INFINITY;
        let maxVal = Number.NEGATIVE_INFINITY;

        for (let yPos = 0; yPos < outH; yPos++) {
            for (let xPos = 0; xPos < outW; xPos++) {
                const base = yPos * outW + xPos;
                const r = outData[base];
                const g = outData[base + outW * outH];
                const b = outData[base + outW * outH * 2];
                minVal = Math.min(minVal, r, g, b);
                maxVal = Math.max(maxVal, r, g, b);
            }
        }

        const { scale: outScale, offset: outOffset, mode: outputMode } = resolveOutputTransform(minVal, maxVal);
        if (outputMode === 'neg1to1') {
            updateDiagnostics({ path: 'onnx-output-neg1to1' });
        }

        let outImage = new ImageData(outW, outH);
        let sum = 0;

        for (let yPos = 0; yPos < outH; yPos++) {
            for (let xPos = 0; xPos < outW; xPos++) {
                const base = yPos * outW + xPos;
                const outIdx = base * 4;
                const r = outData[base] * outScale + outOffset;
                const g = outData[base + outW * outH] * outScale + outOffset;
                const b = outData[base + outW * outH * 2] * outScale + outOffset;
                const rr = clamp(r);
                const gg = clamp(g);
                const bb = clamp(b);
                outImage.data[outIdx] = rr;
                outImage.data[outIdx + 1] = gg;
                outImage.data[outIdx + 2] = bb;
                outImage.data[outIdx + 3] = 255;
                sum += rr + gg + bb;
            }
        }

        if (provider === 'webgpu' && Number.isFinite(minVal) && Number.isFinite(maxVal) && maxVal <= 1e-6) {
            setFallbackOnce('webgpu-output-invalid', 'WebGPU returned empty output. Retrying with WASM.');
            updateDiagnostics({ provider: 'wasm' });
            return runOnnxModel(imageBitmap, options, scale, 'wasm');
        }

        const avg = sum / Math.max(1, outW * outH * 3);
        if (avg <= 2) {
            if (provider !== 'wasm') {
                setFallbackOnce('onnx-output-invalid', 'Output too dark. Retrying with WASM.');
                updateDiagnostics({ provider: 'wasm' });
                return runOnnxModel(imageBitmap, options, scale, 'wasm');
            }
            setFallbackOnce('onnx-output-invalid', 'Output too dark.');
            return null;
        }

        const sharpen = getSharpenSettings(options.mode, options.fidelity, options.preset, 0.5);
        if (sharpen.amount > 0) {
            outImage = applyUnsharpMask(outImage, sharpen.amount, sharpen.radius);
        }

        const outCanvas = new OffscreenCanvas(outW, outH);
        const outCtx = outCanvas.getContext('2d');
        if (!outCtx) return null;
        outCtx.putImageData(outImage, 0, 0);
        return outCanvas.transferToImageBitmap();
    } catch (error) {
        setFallbackOnce(
            'onnx-inference-failed',
            error instanceof Error ? error.message : String(error)
        );
        console.warn(`ONNX inference failed (x${scale})`, error);
        return null;
    }
}

export async function runSR(
    imageBitmap: ImageBitmap,
    targetWidth: number,
    targetHeight: number,
    options: UpscaleOptions
) {
    const scaleRatio = targetWidth / imageBitmap.width;
    const useOnnx = scaleRatio >= 1.9;
    const preferHigh = options.preset === 'high';

    if (useOnnx) {
        try {
            if (scaleRatio >= 3.5 || preferHigh) {
                updateDiagnostics({ runtime: 'onnx', path: 'onnx-4x-direct' });
                const direct4 = await runOnnxModel(imageBitmap, options, 4);
                if (direct4) {
                    if (direct4.width !== targetWidth || direct4.height !== targetHeight) {
                        updateDiagnostics({ path: 'onnx-4x-downscale' });
                        const resized = await resizeBitmap(direct4, targetWidth, targetHeight);
                        if ('close' in direct4) direct4.close();
                        return resized;
                    }
                    return direct4;
                }

                if (scaleRatio >= 3.5) {
                    updateDiagnostics({ runtime: 'onnx', path: 'onnx-2x-step' });
                    const step1 = await runOnnxModel(imageBitmap, options, 2);
                    if (step1) {
                        updateDiagnostics({ runtime: 'onnx', path: 'onnx-2x-step-2' });
                        const step2 = await runOnnxModel(step1, options, 2);
                        if ('close' in step1) step1.close();
                        if (step2) {
                            if (step2.width !== targetWidth || step2.height !== targetHeight) {
                                updateDiagnostics({ path: 'onnx-4x-downscale' });
                                const resized = await resizeBitmap(step2, targetWidth, targetHeight);
                                if ('close' in step2) step2.close();
                                return resized;
                            }
                            return step2;
                        }
                    }
                } else {
                    updateDiagnostics({ runtime: 'onnx', path: 'onnx-2x-direct' });
                    const direct2 = await runOnnxModel(imageBitmap, options, 2);
                    if (direct2) {
                        if (direct2.width !== targetWidth || direct2.height !== targetHeight) {
                            updateDiagnostics({ path: 'onnx-2x-resize' });
                            const resized = await resizeBitmap(direct2, targetWidth, targetHeight);
                            if ('close' in direct2) direct2.close();
                            return resized;
                        }
                        return direct2;
                    }
                }
            } else {
                updateDiagnostics({ runtime: 'onnx', path: 'onnx-2x-direct' });
                const direct2 = await runOnnxModel(imageBitmap, options, 2);
                if (direct2) {
                    if (direct2.width !== targetWidth || direct2.height !== targetHeight) {
                        updateDiagnostics({ path: 'onnx-2x-resize' });
                        const resized = await resizeBitmap(direct2, targetWidth, targetHeight);
                        if ('close' in direct2) direct2.close();
                        return resized;
                    }
                    return direct2;
                }

                updateDiagnostics({ runtime: 'onnx', path: 'onnx-4x-downscale' });
                const fallback4 = await runOnnxModel(imageBitmap, options, 4);
                if (fallback4) {
                    const resized = await resizeBitmap(fallback4, targetWidth, targetHeight);
                    if ('close' in fallback4) fallback4.close();
                    return resized;
                }
            }
        } catch (error) {
            setFallbackOnce(
                'onnx-failed',
                error instanceof Error ? error.message : String(error)
            );
            console.warn('ONNX upscale failed, falling back to classic:', error);
        }
    }

    if (options.useGPU) {
        try {
            const result = await upscaleTileWebGL(imageBitmap, targetWidth, targetHeight);
            updateDiagnostics({ runtime: 'classic', provider: 'webgl', path: 'classic-webgl' });
            return result;
        } catch (error) {
            updateDiagnostics({
                lastError: error instanceof Error ? error.message : 'WebGL upscale failed',
                fallback: 'webgl-failed'
            });
            console.warn('WebGL upscale failed, falling back to CPU:', error);
        }
    }

    updateDiagnostics({ runtime: 'classic', provider: 'cpu', path: 'classic-cpu' });
    return upscaleTileClassic(imageBitmap, targetWidth, targetHeight, options);
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

const fragmentShaderSource = `
precision highp float;
uniform sampler2D u_image;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    vec2 pixelSize = 1.0 / u_resolution;
    vec2 texel = v_texCoord * u_resolution;
    vec2 texelFloor = floor(texel - 0.5) + 0.5;
    vec2 f = texel - texelFloor;

    vec2 w0 = f * (f * (f * -0.5 + 1.0) - 0.5);
    vec2 w1 = f * f * (f * 1.5 - 2.5) + 1.0;
    vec2 w2 = f * (f * (f * -1.5 + 2.0) + 0.5);
    vec2 w3 = f * f * (f * 0.5 - 0.5);

    vec2 g0 = w0 + w1;
    vec2 g1 = w2 + w3;
    vec2 h0 = w1 / g0 - 1.0;
    vec2 h1 = w3 / g1 + 1.0;

    vec2 texCoord0 = (texelFloor + h0) * pixelSize;
    vec2 texCoord1 = (texelFloor + h1) * pixelSize;

    vec4 color = texture2D(u_image, vec2(texCoord0.x, texCoord0.y)) * g0.x * g0.y +
                 texture2D(u_image, vec2(texCoord1.x, texCoord0.y)) * g1.x * g0.y +
                 texture2D(u_image, vec2(texCoord0.x, texCoord1.y)) * g0.x * g1.y +
                 texture2D(u_image, vec2(texCoord1.x, texCoord1.y)) * g1.x * g1.y;

    gl_FragColor = color;
}
`;

function clamp(value: number) {
    return Math.max(0, Math.min(255, Math.round(value)));
}
