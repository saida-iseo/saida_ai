'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Cloud, FileImage, Upload, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface UnifiedUploadZoneProps {
    onUpload: (files: File[]) => void;
    title?: string;
    className?: string;
}

export default function UnifiedUploadZone({ onUpload, title, className }: UnifiedUploadZoneProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onUpload(acceptedFiles);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        multiple: true
    });

    const handleDriveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        alert('준비 중인 기능입니다. (Google Drive 연결)');
    };

    return (
        <div className={cn("w-full max-w-4xl mx-auto", className)}>
            <div
                {...getRootProps()}
                className={cn(
                    "relative group cursor-pointer transition-all duration-500 rounded-[3rem] border-4 border-dashed overflow-hidden min-h-[500px] flex flex-col items-center justify-center p-12 text-center",
                    isDragActive
                        ? "border-red-500 bg-red-500/5 scale-[0.98]"
                        : "border-card-border bg-card-bg/60 hover:bg-card-bg hover:border-card-border"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex flex-col items-center mb-16">
                    <div className={cn(
                        "mb-8 h-24 w-24 rounded-3xl flex items-center justify-center transition-all duration-500",
                        isDragActive ? "bg-red-500 text-white scale-110 rotate-12" : "bg-card-bg text-text-tertiary group-hover:bg-red-500 group-hover:text-white group-hover:rotate-6"
                    )}>
                        {isDragActive ? <Upload className="h-10 w-10" /> : <FileImage className="h-10 w-10" />}
                    </div>

                    <h3 className="text-4xl font-black text-text-primary tracking-tighter mb-4 leading-tight whitespace-pre-line">
                        {title || '이미지를 드래그하여\n바로 시작하세요'}
                    </h3>
                    <p className="text-text-secondary font-bold mb-10 max-w-sm">
                        여러 장의 이미지를 동시에 업로드할 수 있습니다. <br />
                        PNG, JPG, JPEG, WebP 지원 (최대 10MB)
                    </p>

                    <button className="bg-red-500 hover:bg-red-600 text-white font-black px-10 py-5 rounded-[2rem] text-xl transition-all shadow-2xl hover:scale-105 active:scale-95">
                        내 컴퓨터에서 선택
                    </button>

                    <input {...getInputProps()} />
                </div>

                {/* Google Drive Mock Area */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 py-3 px-6 rounded-2xl bg-card-bg/60 backdrop-blur-md border border-card-border group/drive w-max">
                    <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest hidden sm:block">또는 외부 연동</span>
                    <div className="h-4 w-px bg-card-border hidden sm:block" />
                    <button
                        onClick={handleDriveClick}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-all hover:scale-105"
                    >
                        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                            <Cloud className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap">Google Drive</span>
                    </button>
                    <button
                        onClick={handleDriveClick}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-all hover:scale-105"
                    >
                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                            <HardDrive className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold whitespace-nowrap">Dropbox</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
