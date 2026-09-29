import React, { useCallback, useEffect, useMemo, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

const TARGETS = [8, 16, 24, 32, 40];

export default function StampGallery({ theme }) {
  const [gallery, setGallery] = useState({ images: [], sets: [], galleryPath: "" });
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [target, setTarget] = useState(8);
  const [editing, setEditing] = useState(null);
  const [viewingSetId, setViewingSetId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState([]);

  const reload = useCallback(async () => {
    try { setGallery(await invoke("load_stamp_gallery")); }
    catch (error) { setErrors([String(error)]); }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const visible = useMemo(() => gallery.images
    .filter((image) => filter === "all" || (filter === "unassigned" ? !image.setId : image.setId === filter))
    .slice()
    .sort((a, b) => Number(a.importedAt || 0) - Number(b.importedAt || 0) || a.fileName.localeCompare(b.fileName)),
    [gallery.images, filter]);

  const groups = useMemo(() => {
    const map = new Map();
    visible.forEach((image) => {
      const time = Number(image.importedAt);
      const label = Number.isFinite(time) && time > 0
        ? new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date(time * 1000))
        : "取り込み日不明";
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(image);
    });
    return Array.from(map, ([label, images]) => ({ label, images }));
  }, [visible]);

  const selectedSet = editing ? gallery.sets.find((set) => set.id === editing) : null;
  const viewingSet = viewingSetId ? gallery.sets.find((set) => set.id === viewingSetId) : null;
  const viewingImages = viewingSet ? viewingSet.imagePaths.map((path) => gallery.images.find((image) => image.path === path)).filter(Boolean) : [];
  const button = { border: "none", borderRadius: 6, padding: "9px 13px", color: "#fff", background: theme.lineColor, cursor: busy ? "default" : "pointer", fontWeight: 700, opacity: busy ? .65 : 1 };
  const outline = { ...button, background: theme.cardBg, color: theme.textMain, border: "1px solid " + theme.cardBorder };
  const toggle = (path) => setSelected((current) => current.includes(path) ? current.filter((item) => item !== path) : [...current, path]);

  async function reloadAfter(action, message) {
    setBusy(true); setErrors([]);
    try { await action(); if (message) setNotice(message); await reload(); }
    catch (error) { setErrors([String(error)]); }
    finally { setBusy(false); }
  }
  async function importDownloads() {
    setBusy(true); setErrors([]); setNotice("");
    try {
      const result = await invoke("import_download_images");
      setNotice("取り込み完了: " + result.imported.length + " 件");
      setErrors(result.skipped.map((item) => item.source + ": " + item.error));
      await reload();
    } catch (error) { setErrors([String(error)]); }
    finally { setBusy(false); }
  }
  async function createSet() {
    if (!selected.length) { setErrors(["セットに入れる画像を選択してください。"]); return; }
    await reloadAfter(() => invoke("create_stamp_set", { name, targetCount: Number(target), imagePaths: selected }), "セットを作成しました。");
    setName(""); setTarget(8); setSelected([]);
  }
  async function updateSet(set) {
    const nextName = window.prompt("セット名", set.name);
    if (nextName === null) return;
    const nextTarget = window.prompt("目標枚数（8 / 16 / 24 / 32 / 40）", String(set.targetCount));
    if (nextTarget === null) return;
    await reloadAfter(() => invoke("update_stamp_set", { setId: set.id, name: nextName, targetCount: Number(nextTarget) }), "セットを更新しました。");
  }
  async function deleteSet(set) {
    if (!window.confirm("「" + set.name + "」を削除しますか？画像ファイルは削除されません。")) return;
    await reloadAfter(() => invoke("delete_stamp_set", { setId: set.id }), "セットを削除しました。");
    if (editing === set.id) setEditing(null);
    if (viewingSetId === set.id) setViewingSetId(null);
    setFilter("all"); setSelected([]);
  }
  async function deleteImage() {
    if (!deleteTarget) return;
    await reloadAfter(() => invoke("delete_stamp_image", { imagePath: deleteTarget.path }), "画像を削除しました。");
    setSelected((current) => current.filter((path) => path !== deleteTarget.path));
    setDeleteTarget(null);
  }
  async function addToSet() {
    await reloadAfter(() => invoke("add_images_to_stamp_set", { setId: editing, imagePaths: selected }), "画像を追加しました。");
    setSelected([]);
  }
  async function removeFromSet() {
    await reloadAfter(() => invoke("remove_images_from_stamp_set", { setId: editing, imagePaths: selected }), "画像を除外しました。");
    setSelected([]);
  }

  return <div>
    <h2 style={{ color: theme.lineColor, marginBottom: 8 }}>LINEスタンプ・ギャラリー</h2>
    <p style={{ color: theme.textMuted, marginBottom: 16 }}>Downloads の画像を Pictures\\Line_stamps に移動し、取り込み日ごとに整理します。</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
      <button style={outline} disabled={busy} onClick={() => reloadAfter(() => invoke("initialize_stamp_gallery"), "保管先を準備しました。")}>保管先を初期化</button>
      <button style={button} disabled={busy} onClick={importDownloads}>Downloadsから一括取り込み</button>
      <button style={outline} disabled={busy} onClick={reload}>再読み込み</button>
    </div>
    {gallery.galleryPath && <p style={{ fontSize: ".8rem", color: theme.textMuted }}>保管先: {gallery.galleryPath}</p>}
    {notice && <p style={{ color: theme.successColor || "#16a34a" }}>✓ {notice}</p>}
    {errors.length > 0 && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: 10, borderRadius: 6 }}>{errors.map((error, index) => <div key={index}>{error}</div>)}</div>}

    <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) 1fr", gap: 18, alignItems: "start" }}>
      <aside style={{ background: theme.cardBg, border: "1px solid " + theme.cardBorder, borderRadius: 8, padding: 14 }}>
        <b>セット一覧</b>
        <button style={{ ...outline, display: "block", width: "100%", marginTop: 10, textAlign: "left" }} onClick={() => { setFilter("all"); setEditing(null); setSelected([]); }}>全画像 ({gallery.images.length})</button>
        <button style={{ ...outline, display: "block", width: "100%", marginTop: 6, textAlign: "left" }} onClick={() => { setFilter("unassigned"); setEditing(null); setSelected([]); }}>未分類 ({gallery.images.filter((image) => !image.setId).length})</button>
        {gallery.sets.map((set) => <div key={set.id} style={{ marginTop: 8, border: "1px solid " + theme.cardBorder, padding: 8, borderRadius: 6 }}>
          <button style={{ background: "none", border: 0, padding: 0, color: theme.textMain, cursor: "pointer", fontWeight: 700 }} onClick={() => { setEditing(set.id); setFilter(set.id); setSelected([]); }}>{set.name}</button>
          <div style={{ fontSize: ".8rem", color: theme.textMuted, marginTop: 4 }}>{set.imagePaths.length} / {set.targetCount}枚</div>
          <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
            <button style={{ ...outline, padding: "4px 7px", fontSize: ".75rem" }} onClick={() => updateSet(set)}>名前変更</button>
            <button style={{ ...outline, padding: "4px 7px", fontSize: ".75rem" }} onClick={() => setViewingSetId(set.id)}>閲覧</button>
            <button style={{ ...outline, padding: "4px 7px", fontSize: ".75rem", color: "#dc2626" }} onClick={() => deleteSet(set)}>削除</button>
          </div>
        </div>)}
      </aside>

      <section>
        {!editing ? <div style={{ background: theme.cardBg, border: "1px solid " + theme.cardBorder, borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <b>選択した画像からセットを作成</b>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="セット名" style={{ flex: "1 1 160px", padding: 8 }} />
            <select value={target} onChange={(event) => setTarget(event.target.value)} style={{ padding: 8 }}>{TARGETS.map((number) => <option key={number} value={number}>{number}枚</option>)}</select>
            <button style={button} disabled={busy} onClick={createSet}>セットを作成 ({selected.length})</button>
          </div>
        </div> : <div style={{ background: theme.cardBg, border: "1px solid " + theme.lineColor, borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <b>「{selectedSet?.name}」を編集中</b>
          <button style={{ ...button, marginLeft: 12 }} disabled={busy || !selected.length} onClick={addToSet}>選択画像を追加</button>
          <button style={{ ...outline, marginLeft: 8 }} disabled={busy || !selected.length} onClick={removeFromSet}>選択画像を除外</button>
          <button style={{ ...outline, marginLeft: 8 }} onClick={() => { setEditing(null); setFilter("all"); setSelected([]); }}>閉じる</button>
        </div>}

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}><b>{filter === "all" ? "全画像" : filter === "unassigned" ? "未分類画像" : selectedSet?.name || "セット画像"}</b><span style={{ color: theme.textMuted }}>{visible.length} 件 / 選択 {selected.length} 件</span></div>
        {visible.length === 0 ? <div style={{ padding: 24, border: "1px dashed " + theme.cardBorder, color: theme.textMuted }}>表示する画像はありません。</div> :
          <div>{groups.map((group) => <section key={group.label} style={{ marginBottom: 18 }}>
            <h3 style={{ margin: "0 0 8px", color: theme.textMain, fontSize: "1rem" }}>{group.label}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {group.images.map((image) => <div
                key={image.path}
                role="button"
                tabIndex={0}
                onClick={() => toggle(image.path)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(image.path); } }}
                title={image.fileName}
                style={{ position: "relative", padding: 5, background: selected.includes(image.path) ? theme.previewBg : theme.cardBg, border: "2px solid " + (selected.includes(image.path) ? theme.lineColor : theme.cardBorder), borderRadius: 7, color: theme.textMain, textAlign: "left", cursor: "pointer" }}
              >
                <img src={convertFileSrc(image.path)} alt={image.fileName} style={{ width: "100%", height: 110, objectFit: "contain", display: "block", background: "#f8fafc" }} />
                <div style={{ marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: ".75rem" }}>{image.fileName}</div>
                {image.setId && <div style={{ fontSize: ".68rem", color: theme.lineColor }}>セット済み</div>}
                <button type="button" onClick={(event) => { event.stopPropagation(); setDeleteTarget(image); }} aria-label={image.fileName + "を削除"} style={{ position: "absolute", left: 8, bottom: 8, border: "none", borderRadius: 4, padding: "3px 6px", background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: ".7rem" }}>削除</button>
                {selected.includes(image.path) && <span style={{ position: "absolute", top: 8, right: 8, background: theme.lineColor, color: "#fff", borderRadius: "50%", width: 22, height: 22, textAlign: "center" }}>✓</span>}
              </div>)}
            </div>
          </section>)}</div>}
      </section>
    </div>

    {viewingSet && <div role="presentation" onClick={() => setViewingSetId(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(15,23,42,.62)" }}>
      <div role="dialog" onClick={(event) => event.stopPropagation()} style={{ width: "min(860px, 100%)", maxHeight: "90vh", overflow: "auto", background: theme.cardBg, padding: 18, borderRadius: 12 }}>
        <h3>{viewingSet.name}</h3>
        <button style={outline} onClick={() => setViewingSetId(null)}>閉じる</button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginTop: 12 }}>
          {viewingImages.map((image, index) => <div key={image.path}><img src={convertFileSrc(image.path)} alt={viewingSet.name + " " + (index + 1) + "枚目"} style={{ width: "100%", height: 120, objectFit: "contain" }} /><div>{index + 1}. {image.fileName}</div><button style={{ ...outline, color: "#dc2626" }} onClick={() => setDeleteTarget(image)}>削除</button></div>)}
        </div>
      </div>
    </div>}

    {deleteTarget && <div role="presentation" onClick={() => setDeleteTarget(null)} style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,.62)" }}>
      <div role="dialog" onClick={(event) => event.stopPropagation()} style={{ background: theme.cardBg, padding: 18, borderRadius: 12, width: "min(440px, 100%)" }}>
        <h3>画像を削除しますか？</h3>
        <p>「{deleteTarget.fileName}」を削除します。元に戻せません。</p>
        <button style={outline} onClick={() => setDeleteTarget(null)}>キャンセル</button>
        <button style={{ ...button, background: "#dc2626", marginLeft: 8 }} disabled={busy} onClick={deleteImage}>削除する</button>
      </div>
    </div>}
  </div>;
}
