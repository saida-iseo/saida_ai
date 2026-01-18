export type Tile = { x: number; y: number; w: number; h: number };

export function makeTiles(width: number, height: number, tileSize: number, overlap: number): Tile[] {
    const stride = Math.max(1, tileSize - overlap * 2);
    const tiles: Tile[] = [];
    for (let y = 0; y < height; y += stride) {
        for (let x = 0; x < width; x += stride) {
            const w = Math.min(tileSize, width - x);
            const h = Math.min(tileSize, height - y);
            tiles.push({ x, y, w, h });
        }
    }
    return tiles;
}

export function resolveTileSize(
    width: number,
    height: number,
    scale: number,
    requested: number,
    maxPixels: number
) {
    const maxSide = Math.floor(Math.sqrt(maxPixels / Math.max(1, scale * scale)));
    const safeMax = Math.max(256, Math.min(1024, maxSide));
    const base = scale >= 4 ? 384 : 512;
    return Math.min(requested || base, safeMax);
}

export function createFeatherMask(
    width: number,
    height: number,
    overlap: number,
    edges: { left: boolean; right: boolean; top: boolean; bottom: boolean }
) {
    const mask = new OffscreenCanvas(width, height);
    const ctx = mask.getContext('2d');
    if (!ctx) return mask;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    if (overlap <= 0) return mask;

    if (edges.left) {
        const grad = ctx.createLinearGradient(0, 0, overlap, 0);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'white');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, overlap, height);
    }

    if (edges.right) {
        const grad = ctx.createLinearGradient(width - overlap, 0, width, 0);
        grad.addColorStop(0, 'white');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(width - overlap, 0, overlap, height);
    }

    if (edges.top) {
        const grad = ctx.createLinearGradient(0, 0, 0, overlap);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, 'white');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, overlap);
    }

    if (edges.bottom) {
        const grad = ctx.createLinearGradient(0, height - overlap, 0, height);
        grad.addColorStop(0, 'white');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, height - overlap, width, overlap);
    }

    return mask;
}

export function blendTile(
    ctx: OffscreenCanvasRenderingContext2D,
    tileBitmap: ImageBitmap,
    tile: Tile,
    overlap: number,
    edges: { left: boolean; right: boolean; top: boolean; bottom: boolean }
) {
    const mask = createFeatherMask(tile.w, tile.h, overlap, edges);
    const temp = new OffscreenCanvas(tile.w, tile.h);
    const tctx = temp.getContext('2d');
    if (!tctx) return;

    tctx.drawImage(tileBitmap, 0, 0, tile.w, tile.h);
    tctx.globalCompositeOperation = 'destination-in';
    tctx.drawImage(mask, 0, 0);

    ctx.drawImage(temp, tile.x, tile.y, tile.w, tile.h);
}
