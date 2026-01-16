#!/bin/bash

# App.tsx 생성
cat > src/App.tsx << 'EOF'
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import TopBar from './components/TopBar';
import FileList from './components/FileList';
import Preview from './components/Preview';
import SettingsPanel from './components/SettingsPanel';
import ProgressBar from './components/ProgressBar';
import LogPanel from './components/LogPanel';
import { useImageProcessor } from './hooks/useImageProcessor';
import type { ImageFile, BatchOptions, LogEntry } from './types';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ImageFile | null>(null);
  const [outputFolder, setOutputFolder] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [options, setOptions] = useState<BatchOptions>({
    resize: {
      mode: 'longest-side',
      longestSide: 1920,
      keepAspect: true,
    },
    crop: {
      enabled: false,
      aspect: 'free',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },
    rotate: {
      degrees: 0,
    },
    output: {
      format: 'jpeg',
      quality: 85,
      background: '#FFFFFF',
    },
    flags: {
      stripMetadata: true,
      overwrite: false,
      recursive: true,
    },
    naming: {
      prefix: '',
      suffix: '',
      startIndex: 1,
      pad: 3,
      keepOriginal: true,
    },
  });

  const {
    progress,
    isProcessing,
    startBatch,
    cancelBatch,
    pickFiles,
    pickFolder,
    pickOutputFolder,
  } = useImageProcessor({
    onProgress: (prog) => {
      addLog('info', `Processing: ${prog.currentFile} (${prog.done}/${prog.total})`);
    },
    onItemDone: (event) => {
      addLog('success', `✓ ${event.file} → ${event.outFile} (saved ${formatBytes(event.savedBytes)})`);
      setFiles((prev) =>
        prev.map((f) =>
          f.path === event.file
            ? {
                ...f,
                status: 'done',
                outputPath: event.outFile,
                outputSize: event.outSizeBytes,
                outputWidth: event.outWidth,
                outputHeight: event.outHeight,
                savedBytes: event.savedBytes,
              }
            : f
        )
      );
    },
    onItemError: (event) => {
      addLog('error', `✗ ${event.file}: ${event.message}`);
      setFiles((prev) =>
        prev.map((f) =>
          f.path === event.file ? { ...f, status: 'error', error: event.message } : f
        )
      );
    },
    onBatchDone: (event) => {
      addLog(
        'success',
        `✓ Batch complete! ${event.success}/${event.total} success, ${event.failed} failed. Total saved: ${formatBytes(event.totalSavedBytes)}`
      );
    },
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    const log: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      type,
      message,
    };
    setLogs((prev) => [log, ...prev].slice(0, 50));
  };

  const handleAddFiles = async () => {
    const newFiles = await pickFiles();
    if (newFiles) {
      setFiles((prev) => [...prev, ...newFiles]);
      addLog('info', `Added ${newFiles.length} file(s)`);
    }
  };

  const handleAddFolder = async () => {
    const newFiles = await pickFolder(options.flags.recursive);
    if (newFiles) {
      setFiles((prev) => [...prev, ...newFiles]);
      addLog('info', `Added ${newFiles.length} file(s) from folder`);
    }
  };

  const handlePickOutputFolder = async () => {
    const folder = await pickOutputFolder();
    if (folder) {
      setOutputFolder(folder);
      addLog('info', `Output folder: ${folder}`);
    }
  };

  const handleStart = async () => {
    if (files.length === 0) {
      addLog('error', 'No files selected');
      return;
    }
    if (!outputFolder && !options.flags.overwrite) {
      addLog('error', 'Please select output folder');
      return;
    }

    addLog('info', `Starting batch process for ${files.length} file(s)...`);
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'processing' as const })));
    await startBatch(files, outputFolder || '', options);
  };

  const handleCancel = () => {
    cancelBatch();
    addLog('info', 'Cancelled by user');
  };

  const handleClearFiles = () => {
    setFiles([]);
    setSelectedFile(null);
    addLog('info', 'Cleared all files');
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold">Image Batch Editor</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            🔒 All processing happens locally
          </span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Top Bar */}
      <TopBar
        onAddFiles={handleAddFiles}
        onAddFolder={handleAddFolder}
        onPickOutputFolder={handlePickOutputFolder}
        onStart={handleStart}
        onCancel={handleCancel}
        onClear={handleClearFiles}
        outputFolder={outputFolder}
        isProcessing={isProcessing}
        filesCount={files.length}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: File List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <FileList
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
          />
        </div>

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col">
          <Preview file={selectedFile} options={options} />
        </div>

        {/* Right: Settings */}
        <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-thin">
          <SettingsPanel options={options} onOptionsChange={setOptions} />
        </div>
      </div>

      {/* Bottom: Progress + Logs */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        {isProcessing && <ProgressBar progress={progress} />}
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}

export default App;
EOF

echo "✓ App.tsx created"
