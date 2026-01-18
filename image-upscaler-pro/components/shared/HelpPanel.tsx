'use client';

import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface HelpPanelProps {
    title: string;
    guidelines: string[];
    className?: string;
}

export default function HelpPanel({ title, guidelines, className }: HelpPanelProps) {
    return (
        <div className={cn(
            "bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden relative group",
            className
        )}>
            {/* Background patterns */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />

            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                        <HelpCircle className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h4 className="text-lg font-bold tracking-tight">{title} 가이드</h4>
                </div>

                <ul className="space-y-4">
                    {guidelines.map((text, i) => (
                        <li key={i} className="flex gap-3 items-start group/item">
                            <div className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-indigo-500 transition-colors">
                                <span className="text-[10px] font-black">{i + 1}</span>
                            </div>
                            <p className="text-sm text-slate-400 group-hover/item:text-slate-200 transition-colors leading-relaxed">
                                {text}
                            </p>
                        </li>
                    ))}
                </ul>

                <div className="mt-4 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold uppercase tracking-widest">
                        <Info className="h-3.5 w-3.5" />
                        도움이 필요하신가요?
                    </div>
                </div>
            </div>
        </div>
    );
}
