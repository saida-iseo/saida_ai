import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  ImageFile,
  BatchOptions,
  ProgressEvent,
  ItemDoneEvent,
  ItemErrorEvent,
  BatchDoneEvent,
} from '../types';

interface UseImageProcessorOptions {
  onProgress?: (progress: ProgressEvent) => void;
  onItemDone?: (event: ItemDoneEvent) => void;
  onItemError?: (event: ItemErrorEvent) => void;
  onBatchDone?: (event: BatchDoneEvent) => void;
}

export function useImageProcessor(options: UseImageProcessorOptions = {}) {
  const [progress, setProgress] = useState<ProgressEvent>({
    total: 0,
    done: 0,
    currentFile: '',
    percent: 0,
    currentFilePercent: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Listen to progress events
    const unlistenProgress = listen<ProgressEvent>('progress', (event) => {
      setProgress(event.payload);
      options.onProgress?.(event.payload);
    });

    const unlistenItemDone = listen<ItemDoneEvent>('item_done', (event) => {
      options.onItemDone?.(event.payload);
    });

    const unlistenItemError = listen<ItemErrorEvent>('item_error', (event) => {
      options.onItemError?.(event.payload);
    });

    const unlistenBatchDone = listen<BatchDoneEvent>('batch_done', (event) => {
      setIsProcessing(false);
      options.onBatchDone?.(event.payload);
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenItemDone.then((fn) => fn());
      unlistenItemError.then((fn) => fn());
      unlistenBatchDone.then((fn) => fn());
    };
  }, [options]);

  const pickFiles = async (): Promise<ImageFile[] | null> => {
    try {
      const files = await invoke<any[]>('pick_files');
      if (!files || files.length === 0) return null;
      return files.map((f) => ({
        ...f,
        status: 'pending' as const,
      }));
    } catch (error) {
      console.error('Failed to pick files:', error);
      return null;
    }
  };

  const pickFolder = async (recursive: boolean): Promise<ImageFile[] | null> => {
    try {
      const files = await invoke<any[]>('pick_folder', { recursive });
      return files.map((f) => ({
        ...f,
        status: 'pending' as const,
      }));
    } catch (error) {
      console.error('Failed to pick folder:', error);
      return null;
    }
  };

  const pickOutputFolder = async (): Promise<string | null> => {
    try {
      const folder = await invoke<string | null>('pick_output_folder');
      return folder;
    } catch (error) {
      console.error('Failed to pick output folder:', error);
      return null;
    }
  };

  const startBatch = async (
    files: ImageFile[],
    outputDir: string,
    batchOptions: BatchOptions
  ): Promise<void> => {
    try {
      setIsProcessing(true);
      await invoke('start_batch_process', {
        files: files.map((f) => ({
          id: f.id,
          path: f.path,
          name: f.name,
          size: f.size,
          width: f.width,
          height: f.height,
          format: f.format,
        })),
        outputDir,
        options: batchOptions,
      });
    } catch (error) {
      console.error('Failed to start batch process:', error);
      setIsProcessing(false);
      throw error;
    }
  };

  const cancelBatch = async (): Promise<void> => {
    try {
      await invoke('cancel_batch');
      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to cancel batch:', error);
    }
  };

  return {
    progress,
    isProcessing,
    pickFiles,
    pickFolder,
    pickOutputFolder,
    startBatch,
    cancelBatch,
  };
}
