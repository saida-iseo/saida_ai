import { get, set, del, keys } from 'idb-keyval';

export const imageDb = {
    saveImage: async (id: string, blob: Blob) => {
        await set(`img_${id}`, blob);
    },
    getImage: async (id: string): Promise<Blob | undefined> => {
        return await get(`img_${id}`);
    },
    deleteImage: async (id: string) => {
        await del(`img_${id}`);
    },
    clearOldImages: async () => {
        const allKeys = await keys();
        for (const key of allKeys) {
            if (typeof key === 'string' && key.startsWith('img_')) {
                await del(key);
            }
        }
    }
};
