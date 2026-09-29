use serde::{Deserialize, Serialize};
use std::{collections::{HashMap, HashSet}, fs, path::{Path, PathBuf}, time::{SystemTime, UNIX_EPOCH}};
use tauri::Manager;
const STORE_FILE: &str = "line-stamp-gallery.json";
const EXTENSIONS: [&str; 5] = ["png", "jpg", "jpeg", "jpe", "webp"];
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StampSet { pub id: String, pub name: String, pub target_count: u32, #[serde(default)] pub image_paths: Vec<String>, pub created_at: String }
#[derive(Serialize, Deserialize)]
struct Store { #[serde(default = "version")] version: u8, #[serde(default)] sets: Vec<StampSet>, #[serde(default)] imported_at: HashMap<String, String> }
fn version() -> u8 { 1 }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Image { path: String, file_name: String, set_id: Option<String>, metadata_set_id: Option<String>, imported_at: Option<String> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Gallery { gallery_path: String, images: Vec<Image>, sets: Vec<StampSet> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportItem { source: String, destination: Option<String>, error: Option<String> }
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult { gallery_path: String, imported: Vec<ImportItem>, skipped: Vec<ImportItem> }
fn is_image(p: &Path) -> bool { p.extension().and_then(|e| e.to_str()).map(|e| EXTENSIONS.iter().any(|x| e.eq_ignore_ascii_case(x))).unwrap_or(false) }
fn gallery_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> { app.path().picture_dir().map(|p| p.join("Line_stamps")).map_err(|e| format!("Pictures folder unavailable: {e}")) }
fn ensure_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> { let p = gallery_dir(app)?; fs::create_dir_all(&p).map_err(|e| format!("Cannot create gallery: {e}"))?; Ok(p) }
fn store_path(app: &tauri::AppHandle) -> Result<PathBuf, String> { app.path().app_data_dir().map(|p| p.join(STORE_FILE)).map_err(|e| format!("App data unavailable: {e}")) }
fn read_store(app: &tauri::AppHandle) -> Result<Store, String> { let p = store_path(app)?; if !p.exists() { return Ok(Store { version: 1, sets: vec![], imported_at: HashMap::new() }); } serde_json::from_slice(&fs::read(p).map_err(|e| format!("Cannot read gallery data: {e}"))?).map_err(|e| format!("Invalid gallery data: {e}")) }
fn save_store(app: &tauri::AppHandle, s: &Store) -> Result<(), String> { let p = store_path(app)?; if let Some(parent) = p.parent() { fs::create_dir_all(parent).map_err(|e| e.to_string())?; } fs::write(p, serde_json::to_vec_pretty(s).map_err(|e| e.to_string())?).map_err(|e| format!("Cannot save gallery data: {e}")) }
fn ads(p: &Path) -> PathBuf { PathBuf::from(format!("{}:line_stamp_set_id", p.display())) }
fn read_id(p: &Path) -> Option<String> { fs::read_to_string(ads(p)).ok().filter(|x| !x.trim().is_empty()) }
fn write_id(p: &Path, id: Option<&str>) -> Result<(), String> { match id { Some(x) => fs::write(ads(p), x).map_err(|e| e.to_string()), None => { let _ = fs::remove_file(ads(p)); Ok(()) } } }
fn target_ok(n: u32) -> Result<(), String> { if [8,16,24,32,40].contains(&n) { Ok(()) } else { Err("Target must be 8, 16, 24, 32, or 40".into()) } }
fn set_id() -> String { let t = SystemTime::now().duration_since(UNIX_EPOCH).map(|x| x.as_nanos()).unwrap_or_default(); format!("line-stamp-{:x}-{:x}", t, std::process::id()) }
fn timestamp() -> String { SystemTime::now().duration_since(UNIX_EPOCH).map(|x| x.as_secs().to_string()).unwrap_or_default() }
fn file_modified_timestamp(p: &Path) -> Option<String> { fs::metadata(p).ok()?.modified().ok()?.duration_since(UNIX_EPOCH).ok().map(|x| x.as_secs().to_string()) }
fn valid_paths(app: &tauri::AppHandle, paths: Vec<String>) -> Vec<String> { let root = gallery_dir(app).unwrap_or_default(); let mut seen = HashSet::new(); paths.into_iter().filter(|p| { let x = Path::new(p); x.is_file() && x.starts_with(&root) && is_image(x) && seen.insert(p.clone()) }).collect() }
fn assign(app: &tauri::AppHandle, store: &mut Store, id: &str, paths: Vec<String>) -> Vec<String> { let paths = valid_paths(app, paths); let selected: HashSet<_> = paths.iter().cloned().collect(); for set in &mut store.sets { if set.id != id { set.image_paths.retain(|p| !selected.contains(p)); } } if let Some(set) = store.sets.iter_mut().find(|x| x.id == id) { set.image_paths = paths.clone(); } paths }
fn clean_missing(app: &tauri::AppHandle, store: &mut Store) { let root = gallery_dir(app).unwrap_or_default(); for set in &mut store.sets { let mut seen = HashSet::new(); set.image_paths.retain(|p| { let x = Path::new(p); x.is_file() && x.starts_with(&root) && is_image(x) && seen.insert(p.clone()) }); } }
#[tauri::command] pub fn initialize_stamp_gallery(app: tauri::AppHandle) -> Result<String, String> { Ok(ensure_dir(&app)?.to_string_lossy().into_owned()) }
#[tauri::command] pub fn import_download_images(app: tauri::AppHandle) -> Result<ImportResult, String> { let gallery = ensure_dir(&app)?; let downloads = app.path().download_dir().map_err(|e| format!("Downloads folder unavailable: {e}"))?; let mut store = read_store(&app)?; let mut imported = vec![]; let mut skipped = vec![]; for entry in fs::read_dir(&downloads).map_err(|e| format!("Cannot read Downloads: {e}"))? { let entry = match entry { Ok(x) => x, Err(e) => { skipped.push(ImportItem { source: "unknown".into(), destination: None, error: Some(e.to_string()) }); continue; } }; let source = entry.path(); if !source.is_file() || !is_image(&source) { continue; } let filename = match source.file_name().and_then(|x| x.to_str()) { Some(x) => x, None => { skipped.push(ImportItem { source: source.to_string_lossy().into_owned(), destination: None, error: Some("Unreadable file name".into()) }); continue; } }; let stem = source.file_stem().and_then(|x| x.to_str()).unwrap_or("image"); let ext = source.extension().and_then(|x| x.to_str()).unwrap_or("png"); let mut destination = gallery.join(filename); let mut index = 1; while destination.exists() { destination = gallery.join(format!("{stem}_{index}.{ext}")); index += 1; } let result = fs::rename(&source, &destination).or_else(|_| fs::copy(&source, &destination).map(|_| ()).and_then(|_| fs::remove_file(&source))); match result { Ok(()) => { store.imported_at.insert(destination.to_string_lossy().into_owned(), timestamp()); imported.push(ImportItem { source: source.to_string_lossy().into_owned(), destination: Some(destination.to_string_lossy().into_owned()), error: None }); }, Err(e) => skipped.push(ImportItem { source: source.to_string_lossy().into_owned(), destination: None, error: Some(e.to_string()) }) }; } save_store(&app, &store)?; Ok(ImportResult { gallery_path: gallery.to_string_lossy().into_owned(), imported, skipped }) }
#[tauri::command] pub fn load_stamp_gallery(app: tauri::AppHandle) -> Result<Gallery, String> { let dir = ensure_dir(&app)?; let mut store = read_store(&app)?; clean_missing(&app, &mut store); let mut assignments = HashMap::new(); for set in &store.sets { for p in &set.image_paths { assignments.insert(p.clone(), set.id.clone()); } } let mut files: Vec<_> = fs::read_dir(&dir).map_err(|e| e.to_string())?.filter_map(|x| x.ok().map(|x| x.path())).filter(|p| p.is_file() && is_image(p)).collect(); files.sort_by(|a, b| { let a_path = a.to_string_lossy(); let b_path = b.to_string_lossy(); let a_time = store.imported_at.get(a_path.as_ref()).and_then(|x| x.parse::<u64>().ok()).or_else(|| file_modified_timestamp(a).and_then(|x| x.parse::<u64>().ok())).unwrap_or(0); let b_time = store.imported_at.get(b_path.as_ref()).and_then(|x| x.parse::<u64>().ok()).or_else(|| file_modified_timestamp(b).and_then(|x| x.parse::<u64>().ok())).unwrap_or(0); a_time.cmp(&b_time).then_with(|| a_path.cmp(&b_path)) }); let images = files.into_iter().map(|p| { let raw = p.to_string_lossy().into_owned(); Image { file_name: p.file_name().and_then(|x| x.to_str()).unwrap_or_default().into(), set_id: assignments.get(&raw).cloned(), metadata_set_id: read_id(&p), imported_at: store.imported_at.get(&raw).cloned().or_else(|| file_modified_timestamp(&p)), path: raw } }).collect(); save_store(&app, &store)?; Ok(Gallery { gallery_path: dir.to_string_lossy().into_owned(), images, sets: store.sets }) }
#[tauri::command] pub fn create_stamp_set(app: tauri::AppHandle, name: String, target_count: u32, image_paths: Vec<String>) -> Result<StampSet, String> { target_ok(target_count)?; if name.trim().is_empty() { return Err("Enter a set name".into()); } ensure_dir(&app)?; let mut store = read_store(&app)?; let id = set_id(); store.sets.push(StampSet { id: id.clone(), name: name.trim().into(), target_count, image_paths: vec![], created_at: timestamp() }); let paths = assign(&app, &mut store, &id, image_paths); for p in paths { let _ = write_id(Path::new(&p), Some(&id)); } let created = store.sets.iter().find(|x| x.id == id).unwrap().clone(); save_store(&app, &store)?; Ok(created) }
#[tauri::command] pub fn update_stamp_set(app: tauri::AppHandle, set_id: String, name: String, target_count: u32) -> Result<StampSet, String> { target_ok(target_count)?; if name.trim().is_empty() { return Err("Enter a set name".into()); } let mut store = read_store(&app)?; let set = store.sets.iter_mut().find(|x| x.id == set_id).ok_or("Set not found")?; set.name = name.trim().into(); set.target_count = target_count; let result = set.clone(); save_store(&app, &store)?; Ok(result) }
#[tauri::command] pub fn delete_stamp_set(app: tauri::AppHandle, set_id: String) -> Result<(), String> { let mut store = read_store(&app)?; let paths = store.sets.iter().find(|x| x.id == set_id).ok_or("Set not found")?.image_paths.clone(); store.sets.retain(|x| x.id != set_id); for p in paths { let _ = write_id(Path::new(&p), None); } save_store(&app, &store) }
#[tauri::command] pub fn delete_stamp_image(app: tauri::AppHandle, image_path: String) -> Result<(), String> { let path = Path::new(&image_path); let root = gallery_dir(&app)?; if !path.is_file() || !path.starts_with(&root) || !is_image(path) { return Err("Image must be inside the gallery".into()); } fs::remove_file(path).map_err(|e| format!("Cannot delete image: {e}"))?; let mut store = read_store(&app)?; for set in &mut store.sets { set.image_paths.retain(|p| p != &image_path); } store.imported_at.remove(&image_path); save_store(&app, &store) }
#[tauri::command] pub fn add_images_to_stamp_set(app: tauri::AppHandle, set_id: String, image_paths: Vec<String>) -> Result<(), String> { let mut store = read_store(&app)?; let mut paths = store.sets.iter().find(|x| x.id == set_id).ok_or("Set not found")?.image_paths.clone(); paths.extend(image_paths); let assigned = assign(&app, &mut store, &set_id, paths); for p in assigned { let _ = write_id(Path::new(&p), Some(&set_id)); } save_store(&app, &store) }
#[tauri::command] pub fn remove_images_from_stamp_set(app: tauri::AppHandle, set_id: String, image_paths: Vec<String>) -> Result<(), String> { let mut store = read_store(&app)?; let removed: HashSet<_> = image_paths.into_iter().collect(); let set = store.sets.iter_mut().find(|x| x.id == set_id).ok_or("Set not found")?; set.image_paths.retain(|x| !removed.contains(x)); for p in removed { let _ = write_id(Path::new(&p), None); } save_store(&app, &store) }

#[tauri::command]
pub fn read_stamp_image_metadata(app: tauri::AppHandle, image_path: String) -> Result<Option<String>, String> {
    let path = Path::new(&image_path);
    let root = gallery_dir(&app)?;
    if !path.is_file() || !path.starts_with(root) || !is_image(path) { return Err("Image must be inside the gallery".into()); }
    Ok(read_id(path))
}
#[tauri::command]
pub fn write_stamp_image_metadata(app: tauri::AppHandle, image_path: String, set_id: Option<String>) -> Result<(), String> {
    let path = Path::new(&image_path);
    let root = gallery_dir(&app)?;
    if !path.is_file() || !path.starts_with(root) || !is_image(path) { return Err("Image must be inside the gallery".into()); }
    write_id(path, set_id.as_deref())
}