import { useState, useEffect, useRef } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Eye, EyeOff, RefreshCw, GitCompare, ArrowLeftRight, ArrowUpDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { ImageFile, BatchOptions } from '../types';

interface PreviewProps {
  file: ImageFile | null;
  options: BatchOptions;
}

export default function Preview({ file, options }: PreviewProps) {
  const [viewMode, setViewMode] = useState<'before' | 'after' | 'compare'>('before');
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [comparePosition, setComparePosition] = useState(50);
  const [compareDirection, setCompareDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showZoomHint, setShowZoomHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (file) {
      setImageLoading(true);
      setImageError(false);
      try {
        const src = convertFileSrc(file.path);
        console.log('Converting image source:', src);
        setImageSrc(src);
      } catch (error) {
        console.error('Failed to convert file source:', error);
        setImageError(true);
        setImageLoading(false);
      }
    } else {
      setImageSrc('');
      setImageError(false);
      setImageLoading(false);
    }
  }, [file]);

  useEffect(() => {
    // 업스케일 모드이고 변환 완료되면 줌 힌트 표시
    if (options.resize.mode === 'upscale' && file?.status === 'done' && viewMode === 'compare') {
      setShowZoomHint(true);
      const timer = setTimeout(() => setShowZoomHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [options.resize.mode, file?.status, viewMode]);

  const handleRetry = () => {
    setImageError(false);
    const src = convertFileSrc(file!.path);
    setImageSrc(src + '?t=' + Date.now());
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    if (compareDirection === 'horizontal') {
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      setComparePosition(Math.max(0, Math.min(100, percentage)));
    } else {
      const y = e.clientY - rect.top;
      const percentage = (y / rect.height) * 100;
      setComparePosition(Math.max(0, Math.min(100, percentage)));
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const canCompare = file?.status === 'done' && file?.outputPath;
  const isUpscaleMode = options.resize.mode === 'upscale';

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-950 text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🖼️</div>
          <div className="text-gray-400">파일을 선택하면 미리보기가 표시됩니다</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Preview Controls */}
      <div className="px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-semibold text-white">미리보기</h2>
            <p className="text-xs text-gray-500 mt-1">{file.name}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setViewMode('before');
                setImageError(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'before'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye size={16} />
                원본
              </div>
            </button>

            {canCompare && (
              <>
                <button
                  onClick={() => {
                    setViewMode('compare');
                    if (isUpscaleMode) setZoomLevel(200); // 업스케일 모드면 자동 확대
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'compare'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GitCompare size={16} />
                    비교
                  </div>
                </button>

                <button
                  onClick={() => {
                    setViewMode('after');
                    setImageError(false);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'after'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <EyeOff size={16} />
                    결과
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 비교 모드 컨트롤 */}
        {viewMode === 'compare' && canCompare && (
          <div className="mt-3 space-y-3">
            {/* 방향 전환 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareDirection('horizontal')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  compareDirection === 'horizontal'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <ArrowLeftRight size={14} />
                좌우 비교
              </button>
              <button
                onClick={() => setCompareDirection('vertical')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                  compareDirection === 'vertical'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <ArrowUpDown size={14} />
                상하 비교
              </button>
            </div>

            {/* 줌 컨트롤 (업스케일 모드에서 강조) */}
            {isUpscaleMode && (
              <div className="bg-gradient-to-r from-yellow-900/30 to-purple-900/30 p-3 rounded-lg border border-yellow-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-yellow-400 flex items-center gap-2">
                    🔍 화질 디테일 비교
                  </span>
                  <span className="text-xs text-purple-300 font-bold">{zoomLevel}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomLevel(Math.max(100, zoomLevel - 50))}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
                    disabled={zoomLevel <= 100}
                  >
                    <ZoomOut size={16} className="text-gray-400" />
                  </button>
                  <input
                    type="range"
                    min="100"
                    max="400"
                    step="50"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <button
                    onClick={() => setZoomLevel(Math.min(400, zoomLevel + 50))}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all"
                    disabled={zoomLevel >= 400}
                  >
                    <ZoomIn size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(200)}
                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-all text-xs font-bold text-white"
                  >
                    200%
                  </button>
                </div>
                <p className="text-xs text-purple-200 mt-2 text-center">
                  💡 확대해서 화질 개선을 확인하세요!
                </p>
              </div>
            )}

            {/* 위치 슬라이더 */}
            <div>
              <input
                type="range"
                min="0"
                max="100"
                value={comparePosition}
                onChange={(e) => setComparePosition(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>원본</span>
                <span>{comparePosition.toFixed(0)}%</span>
                <span>업스케일</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-950 relative">
        {/* 줌 힌트 */}
        {showZoomHint && viewMode === 'compare' && isUpscaleMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-gray-900 px-6 py-3 rounded-full shadow-2xl font-bold text-sm animate-bounce flex items-center gap-2">
            <ZoomIn size={18} />
            슬라이더를 움직여 화질 디테일을 확인하세요! 🔍
          </div>
        )}

        {imageError ? (
          <div className="text-center p-8 bg-gray-900 rounded-xl">
            <div className="text-red-400 mb-4">
              <p className="text-lg font-semibold mb-2">이미지 로드 실패</p>
              <p className="text-sm text-gray-500">파일 권한을 확인해주세요</p>
            </div>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              다시 시도
            </button>
          </div>
        ) : viewMode === 'compare' && canCompare ? (
          /* 비교 뷰 - 드래그 가능 + 줌 */
          <div 
            ref={containerRef}
            className={`relative w-full h-full flex items-center justify-center ${
              compareDirection === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize'
            } overflow-auto`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: compareDirection === 'horizontal' ? 'col-resize' : 'row-resize'
            }}
          >
            <div 
              className="relative inline-block"
              style={{
                width: `${zoomLevel}%`,
                maxWidth: 'none',
              }}
            >
              {/* 변환 후 이미지 (배경) */}
              <img
                src={convertFileSrc(file.outputPath!)}
                alt="After"
                className="w-full h-auto object-contain rounded-lg shadow-2xl pointer-events-none"
                crossOrigin="anonymous"
                draggable={false}
                style={{
                  imageRendering: zoomLevel > 150 ? 'pixelated' : 'auto'
                }}
              />
              
              {/* 원본 이미지 (오버레이, 클립됨) */}
              {compareDirection === 'horizontal' ? (
                <div 
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${comparePosition}%`, height: '100%' }}
                >
                  <img
                    src={imageSrc}
                    alt="Before"
                    className="w-full h-auto object-contain rounded-lg shadow-2xl pointer-events-none"
                    style={{ 
                      width: `${100 / comparePosition * 100}%`,
                      imageRendering: zoomLevel > 150 ? 'pixelated' : 'auto'
                    }}
                    crossOrigin="anonymous"
                    draggable={false}
                  />
                </div>
              ) : (
                <div 
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ height: `${comparePosition}%`, width: '100%' }}
                >
                  <img
                    src={imageSrc}
                    alt="Before"
                    className="w-full h-auto object-contain rounded-lg shadow-2xl pointer-events-none"
                    style={{ 
                      height: `${100 / comparePosition * 100}%`,
                      imageRendering: zoomLevel > 150 ? 'pixelated' : 'auto'
                    }}
                    crossOrigin="anonymous"
                    draggable={false}
                  />
                </div>
              )}

              {/* 분할선 */}
              <div 
                className={`absolute bg-gradient-to-r from-yellow-500 to-purple-500 shadow-2xl ${
                  compareDirection === 'horizontal' 
                    ? 'top-0 bottom-0 w-1 cursor-col-resize' 
                    : 'left-0 right-0 h-1 cursor-row-resize'
                }`}
                style={
                  compareDirection === 'horizontal'
                    ? { left: `${comparePosition}%` }
                    : { top: `${comparePosition}%` }
                }
                onMouseDown={handleMouseDown}
              >
                <div className={`absolute ${
                  compareDirection === 'horizontal'
                    ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                    : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                } w-12 h-12 bg-gradient-to-br from-yellow-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white hover:scale-110 transition-transform`}>
                  {compareDirection === 'horizontal' ? (
                    <ArrowLeftRight size={24} className="text-white" />
                  ) : (
                    <ArrowUpDown size={24} className="text-white" />
                  )}
                </div>
              </div>

              {/* 좌우 라벨 (업스케일 모드에서만) */}
              {isUpscaleMode && (
                <>
                  <div className="absolute top-4 left-4 bg-gray-900/90 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span className="text-sm font-bold text-gray-400">원본 ({file.width}×{file.height})</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-purple-600 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span className="text-sm font-bold text-white">
                      업스케일 {options.resize.upscaleMultiplier || 2}x ({file.outputWidth}×{file.outputHeight})
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* 비교 정보 */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900/95 px-6 py-3 rounded-full backdrop-blur-sm border-2 border-purple-500/30">
              <div className="text-center">
                <div className="text-xs text-gray-400">원본</div>
                <div className="text-sm font-bold text-white">{file.width} × {file.height}</div>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="text-center">
                <div className="text-xs text-yellow-400">업스케일 {options.resize.upscaleMultiplier || 2}x</div>
                <div className="text-sm font-bold text-green-400">{file.outputWidth} × {file.outputHeight}</div>
              </div>
              {isUpscaleMode && zoomLevel > 100 && (
                <>
                  <div className="w-px bg-gray-700" />
                  <div className="text-center">
                    <div className="text-xs text-purple-400">줌</div>
                    <div className="text-sm font-bold text-purple-300">{zoomLevel}%</div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : viewMode === 'before' ? (
          /* 원본 뷰 */
          <div className="text-center max-w-full">
            {imageLoading && !imageError && (
              <div className="text-gray-500 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p>이미지 로딩 중...</p>
              </div>
            )}
            <img
              src={imageSrc}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              onLoad={() => {
                console.log('Image loaded successfully');
                setImageLoading(false);
                setImageError(false);
              }}
              onError={(e) => {
                console.error('Image load error:', e);
                setImageLoading(false);
                setImageError(true);
              }}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
            {!imageLoading && !imageError && (
              <div className="mt-4 text-sm text-gray-400">
                원본: {file.width} × {file.height} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>
        ) : canCompare ? (
          /* 변환 후 뷰 */
          <div className="text-center max-w-full">
            <img
              src={convertFileSrc(file.outputPath!)}
              alt={`${file.name} (processed)`}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              onError={() => setImageError(true)}
              crossOrigin="anonymous"
            />
            <div className="mt-4 space-y-2">
              <div className="text-sm text-green-400 font-semibold">
                ✓ 변환 완료: {file.outputWidth} × {file.outputHeight}
                {file.outputSize && ` • ${(file.outputSize / 1024 / 1024).toFixed(2)} MB`}
              </div>
              {file.outputWidth && file.width && file.outputWidth > file.width && (
                <div className="text-xs text-purple-400 font-bold">
                  📈 해상도 {options.resize.upscaleMultiplier || 2}배 향상 ({file.width}×{file.height} → {file.outputWidth}×{file.outputHeight})
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            <div className="text-4xl mb-2">⏳</div>
            <div>처리가 완료되지 않았습니다</div>
          </div>
        )}
      </div>

      {/* Settings Preview */}
      <div className="px-4 py-3 bg-gray-900 border-t border-gray-800">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">•</span>
            <strong>크기:</strong> {
              options.resize.mode === 'longest-side' 
                ? `최대 ${options.resize.longestSide}px` 
                : options.resize.mode === 'upscale' 
                ? `${options.resize.upscaleMultiplier || 2}배 업스케일 (AI 화질 개선)` 
                : `고정 ${options.resize.width}×${options.resize.height}`
            }
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">•</span>
            <strong>포맷:</strong> {options.output.format.toUpperCase()} @ {options.output.quality}% 품질
          </div>
        </div>
      </div>
    </div>
  );
}
