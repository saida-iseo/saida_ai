use crate::processor::{BatchOptions, ImageFileInfo, ImageProcessor};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use once_cell::sync::Lazy;

static PROCESSOR: Lazy<Arc<Mutex<Option<ImageProcessor>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

#[derive(Debug, Serialize, Deserialize)]
pub struct FileInfo {
    pub id: String,
    pub path: String,
    pub name: String,
    pub size: u64,
    pub width: u32,
    pub height: u32,
    pub format: String,
}

#[tauri::command]
pub async fn pick_files(app: AppHandle) -> Result<Vec<FileInfo>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let files = app.dialog()
        .file()
        .add_filter("Images", &["jpg", "jpeg", "png", "webp", "gif", "bmp"])
        .blocking_pick_files();
    
    let mut result = Vec::new();
    
    if let Some(file_paths) = files {
        for file_path in file_paths {
            let path = PathBuf::from(file_path.to_string());
            if let Some(info) = get_image_info(&path) {
                result.push(info);
            }
        }
    }
    
    Ok(result)
}

#[tauri::command]
pub async fn pick_folder(app: AppHandle, recursive: bool) -> Result<Vec<FileInfo>, String> {
    use tauri_plugin_dialog::{DialogExt};
    
    let folder = app.dialog()
        .file()
        .blocking_pick_folder();
    
    if let Some(folder_path) = folder {
        let path_str = folder_path.to_string();
        scan_images(path_str, recursive).await
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub async fn pick_output_folder(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt};
    
    let folder = app.dialog()
        .file()
        .blocking_pick_folder();
    
    Ok(folder.map(|p| p.to_string()))
}

#[tauri::command]
pub async fn scan_images(path: String, recursive: bool) -> Result<Vec<FileInfo>, String> {
    let path_buf = PathBuf::from(&path);
    
    if !path_buf.exists() {
        return Err("Path does not exist".to_string());
    }
    
    let mut files = Vec::new();
    
    if path_buf.is_file() {
        if let Some(info) = get_image_info(&path_buf) {
            files.push(info);
        }
    } else if path_buf.is_dir() {
        if recursive {
            use walkdir::WalkDir;
            for entry in WalkDir::new(&path_buf).follow_links(true) {
                if let Ok(entry) = entry {
                    if entry.file_type().is_file() {
                        if let Some(info) = get_image_info(&entry.path().to_path_buf()) {
                            files.push(info);
                        }
                    }
                }
            }
        } else {
            if let Ok(entries) = std::fs::read_dir(&path_buf) {
                for entry in entries.flatten() {
                    if entry.file_type().map(|t| t.is_file()).unwrap_or(false) {
                        if let Some(info) = get_image_info(&entry.path()) {
                            files.push(info);
                        }
                    }
                }
            }
        }
    }
    
    Ok(files)
}

#[tauri::command]
pub async fn start_batch_process(
    app: AppHandle,
    files: Vec<FileInfo>,
    output_dir: String,
    options: BatchOptions,
) -> Result<(), String> {
    let file_infos: Vec<ImageFileInfo> = files
        .into_iter()
        .map(|f| ImageFileInfo {
            path: f.path,
            name: f.name,
            width: f.width,
            height: f.height,
        })
        .collect();
    
    let processor = ImageProcessor::new(app.clone());
    
    // Store processor for cancellation
    {
        let mut proc = PROCESSOR.lock().unwrap();
        *proc = Some(processor.clone());
    }
    
    // Spawn processing task
    tauri::async_runtime::spawn(async move {
        let _ = processor.process_batch(file_infos, output_dir, options).await;
        
        // Clear processor after completion
        let mut proc = PROCESSOR.lock().unwrap();
        *proc = None;
    });
    
    Ok(())
}

#[tauri::command]
pub fn cancel_batch() -> Result<(), String> {
    let proc = PROCESSOR.lock().unwrap();
    if let Some(processor) = proc.as_ref() {
        processor.cancel();
    }
    Ok(())
}

#[tauri::command]
pub fn get_desktop_path() -> Result<String, String> {
    let home = std::env::var("HOME").or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|e| e.to_string())?;
    
    #[cfg(target_os = "macos")]
    let desktop = format!("{}/Desktop", home);
    
    #[cfg(target_os = "windows")]
    let desktop = format!("{}\\Desktop", home);
    
    #[cfg(target_os = "linux")]
    let desktop = format!("{}/Desktop", home);
    
    Ok(desktop)
}

fn get_image_info(path: &PathBuf) -> Option<FileInfo> {
    let ext = path.extension()?.to_str()?.to_lowercase();
    
    // Only process image files
    if !matches!(ext.as_str(), "jpg" | "jpeg" | "png" | "webp" | "bmp" | "gif") {
        return None;
    }
    
    let metadata = std::fs::metadata(path).ok()?;
    let size = metadata.len();
    
    // Try to get dimensions
    let (width, height, format) = if let Ok(reader) = image::ImageReader::open(path) {
        if let Ok(dimensions) = reader.into_dimensions() {
            let format = path.extension()?.to_str()?.to_uppercase();
            (dimensions.0, dimensions.1, format)
        } else {
            return None;
        }
    } else {
        return None;
    };
    
    let name = path.file_name()?.to_str()?.to_string();
    let path_str = path.to_str()?.to_string();
    let id = format!("{}-{}", name, size);
    
    Some(FileInfo {
        id,
        path: path_str,
        name,
        size,
        width,
        height,
        format,
    })
}
