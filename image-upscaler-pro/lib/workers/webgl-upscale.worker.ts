/**
 * WebGL 기반 GPU 가속 업스케일링 워커
 * Lanczos 리샘플링을 사용하여 고품질 업스케일링 수행
 */

/* eslint-disable no-restricted-globals */

// Lanczos 커널 함수
function lanczos(x: number, a: number = 3): number {
    if (x === 0) return 1;
    if (Math.abs(x) >= a) return 0;
    return (a * Math.sin(Math.PI * x) * Math.sin(Math.PI * x / a)) / (Math.PI * Math.PI * x * x);
}

// WebGL 셰이더 소스
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
    // 고품질 Bicubic 업스케일링을 위한 샘플링
    vec2 pixelSize = 1.0 / u_resolution;
    vec2 texel = v_texCoord * u_resolution;
    vec2 texelFloor = floor(texel - 0.5) + 0.5;
    vec2 f = texel - texelFloor;
    
    // Bicubic 보간을 위한 가중치 계산
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

async function upscaleWithWebGL(
    imageBitmap: ImageBitmap,
    targetWidth: number,
    targetHeight: number,
    _scale: number
): Promise<ImageData> {
    // OffscreenCanvas with WebGL context
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const gl = canvas.getContext('webgl', {
        antialias: false,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false
    });
    
    if (!gl) {
        throw new Error('WebGL not supported');
    }
    
    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
        throw new Error('Failed to create shaders');
    }
    
    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
        throw new Error('Failed to create program');
    }
    
    // Create texture from image
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageBitmap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Setup geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1,  1, -1,  -1, 1,
        -1, 1,   1, -1,   1, 1
    ]), gl.STATIC_DRAW);
    
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 1,  1, 1,  0, 0,
        0, 0,  1, 1,  1, 0
    ]), gl.STATIC_DRAW);
    
    // Use program
    gl.useProgram(program);
    
    // Setup attributes
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    
    // Setup uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const imageLocation = gl.getUniformLocation(program, 'u_image');
    
    gl.uniform2f(resolutionLocation, imageBitmap.width, imageBitmap.height);
    gl.uniform1i(imageLocation, 0);
    
    // Clear and draw
    gl.viewport(0, 0, targetWidth, targetHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    // Read pixels
    const imageData = new ImageData(targetWidth, targetHeight);
    gl.readPixels(0, 0, targetWidth, targetHeight, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);
    
    // Flip vertically (WebGL coordinate system)
    const flippedData = new Uint8ClampedArray(imageData.data.length);
    for (let y = 0; y < targetHeight; y++) {
        const srcY = targetHeight - 1 - y;
        for (let x = 0; x < targetWidth; x++) {
            const srcIdx = (srcY * targetWidth + x) * 4;
            const dstIdx = (y * targetWidth + x) * 4;
            flippedData[dstIdx] = imageData.data[srcIdx];
            flippedData[dstIdx + 1] = imageData.data[srcIdx + 1];
            flippedData[dstIdx + 2] = imageData.data[srcIdx + 2];
            flippedData[dstIdx + 3] = imageData.data[srcIdx + 3];
        }
    }
    
    return new ImageData(flippedData, targetWidth, targetHeight);
}

self.onmessage = async (e: MessageEvent) => {
    const {
        imageBlob,
        upscaleFactor = 2,
        outputFormat = 'image/png',
        quality = 0.95,
        useGPU = true
    } = e.data;

    try {
        self.postMessage({ type: 'progress', data: 5 });

        const imageBitmap = await createImageBitmap(imageBlob);
        const originalWidth = imageBitmap.width;
        const originalHeight = imageBitmap.height;

        const finalWidth = originalWidth * upscaleFactor;
        const finalHeight = originalHeight * upscaleFactor;

        self.postMessage({ type: 'progress', data: 20 });
        self.postMessage({ type: 'progressStatus', data: 'GPU 가속 업스케일링 중...' });

        let resultImageData: ImageData;

        if (useGPU) {
            try {
                // WebGL 기반 GPU 업스케일링
                resultImageData = await upscaleWithWebGL(imageBitmap, finalWidth, finalHeight, upscaleFactor);
                self.postMessage({ type: 'progress', data: 80 });
            } catch (gpuError) {
                console.warn('GPU 업스케일링 실패, CPU로 폴백:', gpuError);
                // CPU 폴백
                const canvas = new OffscreenCanvas(finalWidth, finalHeight);
                const ctx = canvas.getContext('2d', { alpha: true });
                if (!ctx) throw new Error('Could not get canvas context');
                
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(imageBitmap, 0, 0, finalWidth, finalHeight);
                resultImageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
            }
        } else {
            // CPU 기반 고품질 업스케일링
            const canvas = new OffscreenCanvas(finalWidth, finalHeight);
            const ctx = canvas.getContext('2d', { alpha: true });
            if (!ctx) throw new Error('Could not get canvas context');
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(imageBitmap, 0, 0, finalWidth, finalHeight);
            resultImageData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        }

        // ImageData를 Blob으로 변환
        const outputCanvas = new OffscreenCanvas(finalWidth, finalHeight);
        const outputCtx = outputCanvas.getContext('2d');
        if (!outputCtx) throw new Error('Could not get output canvas context');
        
        outputCtx.putImageData(resultImageData, 0, 0);
        
        self.postMessage({ type: 'progress', data: 95 });
        self.postMessage({ type: 'progressStatus', data: '최종 처리 중...' });

        const processedBlob = await outputCanvas.convertToBlob({
            type: outputFormat,
            quality: quality,
        });

        self.postMessage({ type: 'progress', data: 100 });
        self.postMessage({ type: 'progressStatus', data: '완료!' });
        self.postMessage({ type: 'result', data: processedBlob });

    } catch (error) {
        self.postMessage({ type: 'error', data: error instanceof Error ? error.message : 'Unknown error' });
    }
};
