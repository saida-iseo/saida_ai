import { Check, X, Clock, AlertCircle, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { ImageFile } from '../types';

interface FileListProps {
  files: ImageFile[];
  selectedFile: ImageFile | null;
  onSelectFile: (file: ImageFile) => void;
  onDeleteFile: (fileId: string) => void;
  onAddFiles: () => void;
  onFilesAdded: (files: ImageFile[]) => void;
}

export default function FileList({ 
  files, 
  selectedFile, 
  onSelectFile, 
  onDeleteFile,
  onAddFiles,
  onFilesAdded
}: FileListProps) {
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Tauri 파일 드롭 이벤트 리스너
  useEffect(() => {
    console.log('Setting up file drop listeners...');
    let unlisten: any;

    const setupListener = async () => {
      try {
        unlisten = await listen<string[]>('tauri://file-drop', async (event) => {
          console.log('✅ File drop event received!', event.payload);
          const droppedPaths = event.payload;
          
          const imagePaths = droppedPaths.filter((path) => {
            const ext = path.toLowerCase();
            const isImage = (
              ext.endsWith('.jpg') ||
              ext.endsWith('.jpeg') ||
              ext.endsWith('.png') ||
              ext.endsWith('.webp') ||
              ext.endsWith('.gif') ||
              ext.endsWith('.bmp')
            );
            console.log(`File ${path}: ${isImage ? 'VALID' : 'INVALID'}`);
            return isImage;
          });

          console.log(`Found ${imagePaths.length} valid image(s)`);

          if (imagePaths.length > 0) {
            const scannedFiles: ImageFile[] = [];
            for (const path of imagePaths) {
              try {
                console.log('Scanning:', path);
                const fileInfos = await invoke<any[]>('scan_images', {
                  path,
                  recursive: false,
                });
                console.log('Scan result:', fileInfos);
                scannedFiles.push(
                  ...fileInfos.map((f: any) => ({
                    ...f,
                    status: 'pending' as const,
                  }))
                );
              } catch (error) {
                console.error('❌ Failed to scan dropped file:', path, error);
              }
            }

            if (scannedFiles.length > 0) {
              console.log(`✅ Adding ${scannedFiles.length} files`);
              onFilesAdded(scannedFiles);
            }
          }
        });

        // 드래그 오버 이벤트
        const unlistenDragOver = await listen('tauri://file-drop-hover', () => {
          console.log('🔵 Drag over detected');
          setIsDragOver(true);
        });

        // 드래그 취소 이벤트
        const unlistenDragCancelled = await listen('tauri://file-drop-cancelled', () => {
          console.log('⚪ Drag cancelled');
          setIsDragOver(false);
        });

        console.log('✅ All listeners set up successfully');

        return () => {
          if (unlisten) unlisten();
          if (unlistenDragOver) unlistenDragOver();
          if (unlistenDragCancelled) unlistenDragCancelled();
        };
      } catch (error) {
        console.error('❌ Failed to setup listeners:', error);
      }
    };

    setupListener();

    return () => {
      console.log('Cleaning up listeners...');
      if (unlisten) unlisten();
    };
  }, [onFilesAdded]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'done':
        return <Check size={16} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'processing':
        return <Clock size={16} className="text-blue-400 animate-spin" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 relative">
      {/* 드래그 오버 전체 화면 오버레이 */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-600/30 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-blue-400 rounded-xl animate-pulse">
          <div className="text-center bg-gray-900/90 px-8 py-6 rounded-2xl shadow-2xl">
            <Upload size={64} className="mx-auto mb-4 text-blue-400 animate-bounce" />
            <p className="text-2xl font-bold text-blue-400 mb-2">이미지 드롭!</p>
            <p className="text-sm text-blue-300">JPG, PNG, WebP, GIF 지원</p>
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <ImageIcon size={18} className="text-blue-400" />
          파일 목록 ({files.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm px-4 py-8">
            <Upload size={64} className="mb-4 text-gray-700" />
            <div className="text-center space-y-3">
              <p className="font-medium text-gray-400 text-lg">파일이 없습니다</p>
              
              <button
                onClick={onAddFiles}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 font-semibold flex items-center gap-2 mx-auto"
              >
                <Upload size={20} />
                이미지 선택
              </button>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-500">또는</p>
                <p className="text-xs text-blue-400 mt-2 font-semibold">📁 Finder에서 이미지를 여기로 드래그하세요</p>
                <p className="text-xs text-gray-600 mt-1">앱 창의 아무 곳이나 드롭하면 됩니다</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {files.map((file) => (
              <div
                key={file.id}
                className={`relative group ${
                  selectedFile?.id === file.id
                    ? 'bg-blue-900/30 border-l-4 border-blue-500'
                    : 'hover:bg-gray-800'
                }`}
                onMouseEnter={() => setHoveredFile(file.id)}
                onMouseLeave={() => setHoveredFile(null)}
              >
                <button
                  onClick={() => onSelectFile(file)}
                  className="w-full px-4 py-3 text-left transition-colors"
                >
                  <div className="flex items-start gap-3 pr-8">
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(file.status)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate text-white">{file.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {file.width} × {file.height} • {formatBytes(file.size)}
                      </div>

                      {file.status === 'done' && file.outputSize && (
                        <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                          <Check size={12} />
                          {file.outputWidth} × {file.outputHeight} •{' '}
                          {formatBytes(file.outputSize)}
                          {file.savedBytes && file.savedBytes > 0 && (
                            <span className="ml-1">
                              (-{formatBytes(file.savedBytes)})
                            </span>
                          )}
                        </div>
                      )}

                      {file.status === 'error' && file.error && (
                        <div className="text-xs text-red-400 mt-1">
                          ✗ {file.error}
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-600/80 hover:bg-red-600 transition-all ${
                    hoveredFile === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="파일 삭제"
                >
                  <Trash2 size={16} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
