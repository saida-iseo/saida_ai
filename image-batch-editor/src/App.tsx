import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
  const [darkMode, setDarkMode] = useState(true); // 다크모드 기본값
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ImageFile | null>(null);
  const [outputFolder, setOutputFolder] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [options, setOptions] = useState<BatchOptions>({
    resize: {
      mode: 'longest-side',
      longestSide: 1920,
      keepAspect: true,
      upscaleMultiplier: 2,
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
      
      // 변환 완료된 파일이 현재 선택된 파일이면 자동으로 미리보기 새로고침
      if (selectedFile?.path === event.file) {
        setSelectedFile((prev) => 
          prev ? {
            ...prev,
            status: 'done',
            outputPath: event.outFile,
            outputSize: event.outSizeBytes,
            outputWidth: event.outWidth,
            outputHeight: event.outHeight,
            savedBytes: event.savedBytes,
          } : prev
        );
      }
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
      // 첫 번째 파일을 자동으로 선택하여 미리보기 표시
      if (files.length === 0 && newFiles.length > 0) {
        setSelectedFile(newFiles[0]);
      }
      addLog('info', `Added ${newFiles.length} file(s)`);
    }
  };

  const handleAddFolder = async () => {
    const newFiles = await pickFolder(options.flags.recursive);
    if (newFiles) {
      setFiles((prev) => [...prev, ...newFiles]);
      // 첫 번째 파일을 자동으로 선택하여 미리보기 표시
      if (files.length === 0 && newFiles.length > 0) {
        setSelectedFile(newFiles[0]);
      }
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
      addLog('error', '파일을 먼저 선택해주세요');
      return;
    }
    
    // 출력 폴더가 없으면 자동으로 바탕화면에 생성
    let finalOutputFolder = outputFolder;
    if (!finalOutputFolder && !options.flags.overwrite) {
      const desktopPath = await invoke<string>('get_desktop_path').catch(() => '');
      if (desktopPath) {
        finalOutputFolder = `${desktopPath}/ImageBatchEditor_Output`;
        setOutputFolder(finalOutputFolder);
        addLog('info', `출력 폴더 자동 생성: ${finalOutputFolder}`);
      } else {
        addLog('error', '출력 폴더를 선택해주세요');
        return;
      }
    }

    addLog('info', `${files.length}개 파일 처리 시작...`);
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'processing' as const })));
    await startBatch(files, finalOutputFolder || '', options);
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

  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) => {
      const newFiles = prev.filter((f) => f.id !== fileId);
      // 삭제 후 파일이 남아있고, 삭제된 파일이 선택되어 있었다면 첫 번째 파일 선택
      if (newFiles.length > 0 && selectedFile?.id === fileId) {
        setSelectedFile(newFiles[0]);
      } else if (newFiles.length === 0) {
        setSelectedFile(null);
      }
      return newFiles;
    });
    addLog('info', 'File deleted');
  };

  const handleFilesAdded = (newFiles: ImageFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    // 첫 번째 파일을 자동으로 선택
    if (files.length === 0 && newFiles.length > 0) {
      setSelectedFile(newFiles[0]);
    }
    addLog('info', `드래그로 ${newFiles.length}개 파일 추가됨`);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-lg">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Image Batch Editor
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 flex items-center gap-2">
            <span className="text-green-400">●</span>
            로컬 처리
          </span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Top Bar */}
      <TopBar
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
        <div className="w-80 border-r border-gray-800 flex flex-col">
          <FileList
            files={files}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onDeleteFile={handleDeleteFile}
            onAddFiles={handleAddFiles}
            onFilesAdded={handleFilesAdded}
          />
        </div>

        {/* Center: Preview */}
        <div className="flex-1 flex flex-col">
          <Preview file={selectedFile} options={options} />
        </div>

        {/* Right: Settings */}
        <div className="w-80 border-l border-gray-800 overflow-y-auto scrollbar-thin">
          <SettingsPanel options={options} onOptionsChange={setOptions} />
        </div>
      </div>

      {/* Bottom: Progress + Logs */}
      <div className="border-t border-gray-800 bg-gray-900">
        {isProcessing && <ProgressBar progress={progress} />}
        <LogPanel logs={logs} />
      </div>
    </div>
  );
}

export default App;
