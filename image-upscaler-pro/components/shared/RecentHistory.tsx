'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { getRecentHistory, type RecentHistoryItem } from '@/lib/history/recentHistory';
import { cn } from '@/lib/utils/cn';

type RecentHistoryProps = {
    variant?: 'default' | 'sidebar';
};

export default function RecentHistory({ variant = 'default' }: RecentHistoryProps) {
    const router = useRouter();
    const setOriginalImage = useAppStore((state) => state.setOriginalImage);
    const [items, setItems] = useState<RecentHistoryItem[]>([]);

    useEffect(() => {
        const allItems = getRecentHistory();
        // 최대 5개만 표시
        setItems(allItems.slice(0, 5));
    }, []);

    if (items.length === 0) return null;

    const isSidebar = variant === 'sidebar';

    return (
        <div className={cn(
            "bg-card-bg/40 border border-card-border rounded-[2rem]",
            isSidebar ? "p-5" : "p-6"
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-text-primary">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">최근 작업</h3>
                </div>
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">최근 5개</span>
            </div>
            <div className={cn(
                "grid gap-4",
                isSidebar ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
            )}>
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setOriginalImage({
                                id: item.imageId,
                                name: item.name,
                                type: item.type,
                                size: item.size,
                                width: item.width,
                                height: item.height,
                            });
                            router.push(item.route);
                        }}
                        className={cn(
                            "flex items-center gap-4 rounded-2xl border border-card-border bg-background hover:bg-card-bg transition-all",
                            isSidebar ? "p-2.5" : "p-3"
                        )}
                    >
                        <div className={cn(
                            "rounded-xl bg-slate-900 overflow-hidden border border-card-border",
                            isSidebar ? "h-12 w-12" : "h-16 w-16"
                        )}>
                            {item.thumbUrl ? (
                                <img src={item.thumbUrl} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-slate-800" />
                            )}
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-xs font-bold text-text-primary truncate">{item.name}</p>
                            <p className="text-[10px] text-text-tertiary uppercase tracking-widest">{item.tool}</p>
                        </div>
                        {!isSidebar && (
                            <div className="flex items-center gap-2 text-text-tertiary text-[10px] font-bold uppercase tracking-widest">
                                다시 열기
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
