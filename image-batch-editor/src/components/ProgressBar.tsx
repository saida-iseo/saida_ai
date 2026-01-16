import type { ProgressEvent } from '../types';

interface ProgressBarProps {
  progress: ProgressEvent;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="px-6 py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="font-medium text-white">
          처리 중: {progress.done} / {progress.total}
        </span>
        <span className="text-blue-400 font-bold">
          {Math.round(progress.percent)}%
        </span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 ease-out rounded-full shadow-lg"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {progress.currentFile && (
        <div className="mt-2 text-xs text-gray-400 truncate">
          현재: {progress.currentFile}
        </div>
      )}
    </div>
  );
}
