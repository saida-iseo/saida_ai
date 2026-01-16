import { FolderOutput, Play, X, Trash2, Sparkles } from 'lucide-react';

interface TopBarProps {
  onPickOutputFolder: () => void;
  onStart: () => void;
  onCancel: () => void;
  onClear: () => void;
  outputFolder: string;
  isProcessing: boolean;
  filesCount: number;
}

export default function TopBar({
  onPickOutputFolder,
  onStart,
  onCancel,
  onClear,
  outputFolder,
  isProcessing,
  filesCount,
}: TopBarProps) {
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          {outputFolder && (
            <div className="text-sm text-gray-300 truncate">
              📁 변환된 이미지 저장소: <span className="font-semibold text-blue-400">{outputFolder}</span>
            </div>
          )}
        </div>

        {/* 파일 개수 */}
        {filesCount > 0 && (
          <div className="px-4 py-2 bg-gray-700/50 rounded-lg">
            <span className="text-gray-300 text-sm font-medium">
              {filesCount}개 파일
            </span>
          </div>
        )}

        {/* 초기화 */}
        {filesCount > 0 && !isProcessing && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-red-600 hover:text-white disabled:opacity-50 transition-all"
          >
            <Trash2 size={18} />
            <span className="text-sm">초기화</span>
          </button>
        )}

        {/* 변환된 이미지 저장소 버튼 */}
        {filesCount > 0 && (
          <button
            onClick={onPickOutputFolder}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <FolderOutput size={20} />
            <span className="font-semibold">변환된 이미지 저장소</span>
          </button>
        )}

        {/* 시작/취소 */}
        {filesCount > 0 && (
          <>
            {!isProcessing ? (
              <button
                onClick={onStart}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold shadow-lg transition-all transform hover:scale-105"
              >
                <Sparkles size={20} />
                변환 시작
              </button>
            ) : (
              <button
                onClick={onCancel}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-lg transition-all"
              >
                <X size={18} />
                취소
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
