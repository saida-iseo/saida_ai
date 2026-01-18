'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DetailFeature {
    label: string;
    description: string;
}

interface FeatureBoxProps {
    title: string;
    icon: React.ReactNode;
    features: DetailFeature[];
    className?: string;
}

export default function FeatureBox({ title, icon, features, className }: FeatureBoxProps) {
    return (
        <div className={cn(
            "p-8 rounded-[2rem] bg-card-bg/50 border border-card-border backdrop-blur-sm shadow-xl transition-colors duration-300",
            className
        )}>
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-2xl bg-accent/10 text-accent border border-accent/20">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">{title}</h3>
            </div>

            <div className="space-y-6">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex gap-4 group">
                        <div className="mt-1 h-5 w-5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-bold text-text-primary mb-1 tracking-tight group-hover:text-accent transition-colors">{feature.label}</h4>
                            <p className="text-[11px] text-text-tertiary font-medium leading-relaxed transition-colors">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
