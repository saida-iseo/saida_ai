// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod processor;

use commands::{
    cancel_batch, pick_files, pick_folder, pick_output_folder, scan_images, start_batch_process,
    get_desktop_path,
};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            pick_files,
            pick_folder,
            pick_output_folder,
            scan_images,
            start_batch_process,
            cancel_batch,
            get_desktop_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
