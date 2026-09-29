mod stamp_gallery;

use std::path::PathBuf;

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn resolve_llm_file(app: &tauri::AppHandle, file_name: &str) -> Result<PathBuf, String> {
    let bundled_path = app
        .path()
        .resource_dir()
        .map_err(|error| format!("LLMリソースフォルダを取得できません: {error}"))?
        .join("binaries")
        .join(file_name);

    if bundled_path.is_file() {
        return Ok(bundled_path);
    }

    let development_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("binaries")
        .join(file_name);
    if development_path.is_file() {
        return Ok(development_path);
    }

    Err(format!("LLMリソースが見つかりません: {file_name}"))
}

fn spawn_llm_server(app: &tauri::AppHandle) {
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let model_path = match resolve_llm_file(
            &app_handle,
            "qwen2.5-1.5b-instruct-q4_k_m.gguf",
        ) {
            Ok(path) => path,
            Err(error) => {
                println!("[llama-server] {error}");
                return;
            }
        };

        let Some(model_directory) = model_path.parent() else {
            println!("[llama-server] モデルの配置フォルダを取得できません");
            return;
        };
        let model_argument = model_path.to_string_lossy().into_owned();

        let sidecar = match app_handle.shell().sidecar("llama-server") {
            Ok(s) => s,
            Err(e) => {
                println!("[llama-server] sidecar作成エラー: {}", e);
                return;
            }
        };

        let sidecar = sidecar
            .current_dir(model_directory)
            .args([
                "-m", model_argument.as_str(),
                "--port", "8080",
                "-c", "2048",
                "-t", "4",
            ]);

        let (mut rx, _child) = match sidecar.spawn() {
            Ok(r) => r,
            Err(e) => {
                println!("[llama-server] 起動エラー: {}", e);
                return;
            }
        };

        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    println!("[llama-server stdout] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Stderr(line) => {
                    println!("[llama-server stderr] {}", String::from_utf8_lossy(&line));
                }
                CommandEvent::Error(err) => {
                    println!("[llama-server error] {}", err);
                }
                CommandEvent::Terminated(payload) => {
                    println!("[llama-server terminated] {:?}", payload);
                }
                _ => {}
            }
        }
    });
}

#[tauri::command]
async fn start_llm_server(app: tauri::AppHandle) -> Result<(), String> {
    spawn_llm_server(&app);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, start_llm_server, stamp_gallery::initialize_stamp_gallery, stamp_gallery::import_download_images, stamp_gallery::load_stamp_gallery, stamp_gallery::create_stamp_set, stamp_gallery::update_stamp_set, stamp_gallery::delete_stamp_set, stamp_gallery::delete_stamp_image, stamp_gallery::add_images_to_stamp_set, stamp_gallery::remove_images_from_stamp_set, stamp_gallery::read_stamp_image_metadata, stamp_gallery::write_stamp_image_metadata])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
