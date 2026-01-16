import type { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

export default function LogPanel({ logs }: LogPanelProps) {
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR');
  };

  return (
    <div className="h-32 bg-gray-900 overflow-y-auto border-t border-gray-800">
      <div className="px-4 py-2 border-b border-gray-800">
        <h3 className="font-semibold text-sm text-white">로그</h3>
      </div>

      <div className="px-4 py-2 space-y-1 font-mono">
        {logs.length === 0 ? (
          <div className="text-xs text-gray-600">로그가 없습니다</div>
        ) : (
          logs.slice(0, 10).map((log) => (
            <div key={log.id} className="text-xs flex gap-2">
              <span className="text-gray-600 flex-shrink-0">
                {formatTime(log.timestamp)}
              </span>
              <span className={`flex-1 ${getLogColor(log.type)}`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
