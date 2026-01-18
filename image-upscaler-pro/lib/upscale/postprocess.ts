export function applyUnsharpMask(
    imageData: ImageData,
    amount: number,
    radius: number
): ImageData {
    if (amount <= 0) return imageData;
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data.length);
    const kernelSize = Math.max(1, Math.floor(radius));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0;
            let g = 0;
            let b = 0;
            let count = 0;
            for (let ky = -kernelSize; ky <= kernelSize; ky++) {
                const ny = Math.min(height - 1, Math.max(0, y + ky));
                for (let kx = -kernelSize; kx <= kernelSize; kx++) {
                    const nx = Math.min(width - 1, Math.max(0, x + kx));
                    const idx = (ny * width + nx) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    count++;
                }
            }
            const idx = (y * width + x) * 4;
            const avgR = r / count;
            const avgG = g / count;
            const avgB = b / count;
            const origR = data[idx];
            const origG = data[idx + 1];
            const origB = data[idx + 2];

            output[idx] = clamp(origR + (origR - avgR) * amount);
            output[idx + 1] = clamp(origG + (origG - avgG) * amount);
            output[idx + 2] = clamp(origB + (origB - avgB) * amount);
            output[idx + 3] = data[idx + 3];
        }
    }

    return new ImageData(output, width, height);
}

function clamp(value: number) {
    return Math.max(0, Math.min(255, Math.round(value)));
}
