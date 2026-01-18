'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose?: () => void;
    className?: string;
}

export default function Toast({ message, type, onClose, className }: ToastProps) {
    const icons = {
        success: <CheckCircle2 className="h-5 w-5" />,
        error: <XCircle className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
        warning: <AlertCircle className="h-5 w-5" />,
    };

    const styles = {
        success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30",
        error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/30",
        info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/30",
        warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30",
    };

    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-in fade-in slide-in-from-top-4 duration-300",
            styles[type],
            className
        )}>
            <div className="shrink-0">{icons[type]}</div>
            <p className="text-sm font-bold tracking-tight">{message}</p>
            {onClose && (
                <button
                    onClick={onClose}
                    className="ml-auto p-1 rounded-full hover:bg-black/5 transition-colors"
                >
                    <X className="h-4 w-4 opacity-50" />
                </button>
            )}
        </div>
    );
}
