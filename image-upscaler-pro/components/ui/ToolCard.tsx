'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ToolCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    gradient: string;
    badge?: string;
    onClick?: () => void;
    className?: string;
}

export function ToolCard({ title, description, icon: Icon, gradient, badge, onClick, className }: ToolCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex flex-col p-6 text-left rounded-[1.5rem] overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl",
                gradient,
                className
            )}
        >
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-4 bg-white/20 backdrop-blur-md text-white shadow-sm transition-transform group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-grow flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[17px] font-bold text-white tracking-tight">
                            {title}
                        </h3>
                        {badge && (
                            <span className="text-[9px] font-bold text-white bg-black/20 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                                {badge}
                            </span>
                        )}
                    </div>
                    <p className="text-[13px] font-medium text-white/80 leading-snug line-clamp-2">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
}

export function ToolCardWide({ title, description, icon: Icon, gradient, badge, onClick, className }: ToolCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex flex-col md:flex-row items-center gap-6 p-7 text-left rounded-[2rem] overflow-hidden transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-xl hover:shadow-2xl sm:col-span-2",
                gradient,
                className
            )}
        >
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-lg transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6" />
            </div>
            <div className="relative z-10 flex-grow">
                <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                    {badge && (
                        <span className="text-[10px] font-bold text-white bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-[14px] font-medium text-white/90 leading-relaxed max-w-2xl">
                    {description}
                </p>
            </div>
        </button>
    );
}
