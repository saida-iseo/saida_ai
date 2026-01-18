export type RecentHistoryItem = {
    id: string;
    tool: string;
    route: string;
    imageId: string;
    name: string;
    type: string;
    size: number;
    width: number;
    height: number;
    thumbUrl: string;
    createdAt: number;
};

const STORAGE_KEY = 'saida_recent_history';
const MAX_ITEMS = 5;

export function getRecentHistory(): RecentHistoryItem[] {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as RecentHistoryItem[];
    } catch {
        return [];
    }
}

export function addRecentHistory(item: RecentHistoryItem) {
    if (typeof window === 'undefined') return;
    const current = getRecentHistory();
    const next = [item, ...current.filter((h) => h.imageId !== item.imageId)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function createThumbnail(file: Blob, maxSize: number = 160) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    await img.decode();

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    return canvas.toDataURL('image/jpeg', 0.7);
}
