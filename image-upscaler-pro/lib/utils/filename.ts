export function buildFilename(originalName: string, suffix: string, ext?: string) {
    const base = originalName.replace(/\.[^/.]+$/, '');
    const safeSuffix = suffix.replace(/\s+/g, '');
    const finalExt = ext || (originalName.split('.').pop() || 'png');
    return `${base}_${safeSuffix}.${finalExt}`;
}
