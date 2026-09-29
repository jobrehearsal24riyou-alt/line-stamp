import React, { useEffect, useMemo, useRef, useState } from "react";
import Database from "@tauri-apps/plugin-sql";
import { initDatabase } from "../lib/initDatabase";

const PAGE_SIZE = 10;

const TABLES = [
  {
    key: "categories", label: "カテゴリ", title: "Categories", importKey: "category_id", columns: [
      ["category_id", "カテゴリID", "required"], ["category_name_en", "英語名", "required"], ["category_code_en", "英語コード", "required"], ["category_name_ja", "日本語名", "required"],
      ["display_name_ja", "表示名（日本語）"], ["display_name_en", "表示名（英語）"], ["sort_order", "並び順", "number"], ["is_enabled", "状態", "boolean"],
    ],
  },
  {
    key: "subcategories", label: "サブカテゴリ", title: "Subcategories", importKey: "subcategory_id", columns: [
      ["category_id", "親カテゴリ", "select", "categories"], ["subcategory_id", "サブカテゴリID", "required"], ["subcategory_name_ja", "サブカテゴリ名", "required"],
      ["item_name_en", "項目名（英語）", "required"], ["item_name_ja", "項目名（日本語）", "required"], ["display_name_ja", "表示名（日本語）"], ["display_name_en", "表示名（英語）"], ["sort_order", "並び順", "number"], ["is_enabled", "状態", "boolean"],
    ],
  },
  {
    key: "styles", label: "スタイル", title: "Styles", importKey: "style_id", columns: [
      ["style_id", "スタイルID", "required"], ["style_name_en", "英語名", "required"], ["style_name_ja", "日本語名", "required"],
      ["display_name_ja", "表示名（日本語）"], ["display_name_en", "表示名（英語）"], ["sort_order", "並び順", "number"], ["is_enabled", "状態", "boolean"],
    ],
  },
  {
    key: "style_prompts", label: "サブスタイル", title: "Style Prompts", importKey: "prompt_id", columns: [
      ["style_id", "親スタイル", "select", "styles"], ["prompt_id", "プロンプトID", "required"], ["display_name_ja", "表示名（日本語）"], ["display_name_en", "表示名（英語）"], ["prompt_text", "プロンプト本文", "required", "textarea"], ["sort_order", "並び順", "number"], ["is_enabled", "状態", "boolean"],
    ],
  },
  {
    key: "line_subjects", label: "LINE主役", title: "Line Subjects", importKey: "subject_id", columns: [
      ["subject_id", "主役ID", "required"], ["animal_type", "動物タイプ", "required"], ["name_ja", "日本語名", "required"], ["name_en", "英語名", "required"], ["display_name_ja", "表示名（日本語）"], ["display_name_en", "表示名（英語）"], ["sort_order", "並び順", "number"], ["is_enabled", "状態", "boolean"],
    ],
  },
  {
    key: "line_combination_categories", label: "掛け合わせカテゴリ", title: "Combination Categories", importKey: "category_id", columns: [
      ["category_id", "カテゴリID", "required"], ["name_ja", "日本語名", "required"], ["display_name_ja", "表示名（日本語）"], ["display_name_en", "表示名（英語）"], ["sort_order", "並び順", "number"], ["is_enabled", "状態", "boolean"],
    ],
  },
  {
    key: "line_combinations", label: "掛け合わせ", title: "Line Combinations", importKey: "combination_id", columns: [
      ["category_id", "親カテゴリ", "select", "line_combination_categories"], ["combination_id", "掛け合わせID", "required"], ["name_ja", "日本語名", "required"], ["name_en", "英語名", "required"], ["display_name_ja", "表示名（日本語）"], ["display_name_en", "表示名（英語）"], ["sort_order", "並び順", "number"], ["is_enabled", "状態", "boolean"],
    ],
  },
  {
    key: "line_phrases", label: "セリフ", title: "Line Phrases", importKey: "phrase_id", columns: [
      ["phrase_id", "セリフID", "required"], ["phrase_category", "カテゴリ", "required"], ["text_ja", "セリフ（日本語）", "required", "textarea"], ["prompt_hint_en", "プロンプト補助（英語）", "textarea"], ["display_name_ja", "表示名（日本語）"], ["display_name_en", "表示名（英語）"], ["sort_order", "並び順", "number"], ["is_enabled", "状態", "boolean"],
    ],
  },
];

const TABLE_MAP = Object.fromEntries(TABLES.map((table) => [table.key, table]));
const labelFor = (table, row) => row?.display_name_ja || row?.name_ja || row?.category_name_ja || row?.style_name_ja || row?.title || row?.name_en || row?.category_id || row?.style_id || row?.id;
const emptyValue = (column) => column[2] === "number" ? 0 : column[2] === "boolean" ? 1 : "";
const csvEscape = (value) => {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (columns, rows) => {
  const header = columns.map(([key]) => csvEscape(key)).join(",");
  const body = rows.map((row) => columns.map(([key]) => csvEscape(row[key])).join(","));
  return `\uFEFF${[header, ...body].join("\r\n")}\r\n`;
};

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value === "") {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.endsWith("\r") ? value.slice(0, -1) : value);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value !== "" || row.length > 0) {
    row.push(value.endsWith("\r") ? value.slice(0, -1) : value);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }
  return rows;
};

const decodeCsvFile = async (file) => {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("shift_jis").decode(buffer).replace(/^\uFEFF/, "");
  }
};

const normalizeImportValue = (column, value) => {
  const [, , type] = column;
  if (type === "number") {
    const normalized = String(value ?? "").trim();
    return normalized === "" ? 0 : Number(normalized);
  }
  if (type === "boolean") {
    return ["0", "false", "no", "off", "無効", "無"].includes(String(value ?? "").trim().toLowerCase()) ? 0 : 1;
  }
  return value ?? "";
};

const headerAliases = (table) => Object.fromEntries(
  table.columns.flatMap((column) => [[column[0], column[0]], [column[1], column[0]]]).concat([["id", "id"]])
);

function DataForm({ table, initial, tables, nextPrimaryKey, onCancel, onSave, busy }) {
  const [form, setForm] = useState(() => Object.fromEntries(table.columns.map((column) => [column[0], initial?.[column[0]] ?? emptyValue(column)])));
  const [error, setError] = useState("");
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const subcategoryReference = useMemo(() => {
    if (table.key !== "subcategories" || initial || !form.category_id) return null;
    const matchingRows = (tables.subcategories || []).filter((row) => row.category_id === form.category_id);
    if (!matchingRows.length) return { row: null };
    const row = [...matchingRows].sort((left, right) =>
      String(left.subcategory_id).localeCompare(String(right.subcategory_id), "en") || Number(left.id) - Number(right.id)
    ).at(-1);
    return { row };
  }, [form.category_id, initial, table.key, tables.subcategories]);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try { await onSave(form); } catch (e) { setError(e?.message || String(e)); }
  };
  return <form onSubmit={submit} style={{ padding: 16, marginBottom: 16, background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 10 }}>
    <h3 style={{ marginBottom: 14 }}>{initial ? `${table.label}を編集` : `${table.label}を追加`}</h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {table.columns.map((column) => {
        const [key, label, type, source, control] = column;
        if (type === "boolean") return <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}><input type="checkbox" checked={Boolean(Number(form[key]))} onChange={(e) => setValue(key, e.target.checked ? 1 : 0)} />{label}</label>;
        const common = { value: form[key] ?? "", required: type === "required", onChange: (e) => setValue(key, type === "number" ? Number(e.target.value) : e.target.value), style: { width: "100%", padding: "8px", border: "1px solid var(--border-color)", borderRadius: 5, background: "var(--bg-main)", color: "var(--text-main)" } };
        return <label key={key} style={{ display: "grid", gap: 5, color: "var(--text-main)" }}><span>{label}{type === "required" || type === "select" ? " *" : ""}</span>{type === "select" ? <select {...common} required><option value="">選択してください</option>{(tables[source] || []).filter((row) => Number(row.is_enabled) !== 0 || row[key] === form[key]).map((row) => <option key={row.id} value={row[source === "categories" || source === "line_combination_categories" ? "category_id" : "style_id"]}>{labelFor(TABLE_MAP[source], row)}</option>)}</select> : control === "textarea" ? <textarea {...common} rows={3} /> : <input {...common} type={type === "number" ? "number" : "text"} />}</label>;
      })}
    </div>
    {subcategoryReference && <div style={{ marginTop: 14, padding: 12, background: "var(--bg-main)", border: "1px solid var(--border-color)", borderRadius: 7, color: "var(--text-main)" }}>
      <b>参考データ（選択した親カテゴリ内・サブカテゴリID昇順の最終行）</b>
      {subcategoryReference.row ? <div style={{ display: "grid", gap: 4, marginTop: 8, fontSize: ".9rem" }}>
        <div>直前のPK（id）: <b>{subcategoryReference.row.id}</b>　→　次に自動採番されるPK（id）: <b>{nextPrimaryKey}</b></div>
        <div>サブカテゴリID: {subcategoryReference.row.subcategory_id} ／ サブカテゴリ名: {subcategoryReference.row.subcategory_name_ja}</div>
        <div>項目名: {subcategoryReference.row.item_name_ja}（{subcategoryReference.row.item_name_en}）</div>
      </div> : <div style={{ marginTop: 8, fontSize: ".9rem" }}>この親カテゴリには既存データがありません。次に自動採番されるPK（id）: <b>{nextPrimaryKey}</b></div>}
    </div>}
    {error && <p style={{ marginTop: 12, color: "#dc2626" }}>{error}</p>}
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}><button type="button" onClick={onCancel} disabled={busy} className="theme-toggle-btn" style={{ background: "var(--bg-card-hover)", color: "var(--text-main)" }}>キャンセル</button><button type="submit" disabled={busy} className="theme-toggle-btn">{busy ? "保存中…" : "保存"}</button></div>
  </form>;
}

export default function DataManagement({ theme, onDataChanged }) {
  const [activeKey, setActiveKey] = useState(TABLES[0].key);
  const [tables, setTables] = useState({});
  const [nextPrimaryKeys, setNextPrimaryKeys] = useState({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const table = TABLE_MAP[activeKey];
  const fileInputRef = useRef(null);

  const load = async () => {
    await initDatabase();
    const db = await Database.load("sqlite:app.db");
    const entries = await Promise.all(TABLES.map(async (item) => [item.key, await db.select(`SELECT * FROM ${item.key} ORDER BY id ASC;`)]));
    const loadedTables = Object.fromEntries(entries);
    const nextIds = Object.fromEntries(TABLES.map((item) => [item.key, Math.max(0, ...(loadedTables[item.key] || []).map((row) => Number(row.id) || 0)) + 1]));
    try {
      const sequences = await db.select("SELECT name, seq FROM sqlite_sequence;");
      sequences.forEach((sequence) => {
        if (Object.prototype.hasOwnProperty.call(nextIds, sequence.name)) nextIds[sequence.name] = Math.max(nextIds[sequence.name], Number(sequence.seq) + 1);
      });
    } catch {
      // 初回作成直後などsqlite_sequenceを参照できない場合は、既存PKの最大値から算出する。
    }
    setTables(loadedTables);
    setNextPrimaryKeys(nextIds);
  };
  useEffect(() => { load().catch((e) => setError(e?.message || String(e))); }, []);
  useEffect(() => { setPage(1); setEditing(null); setAdding(false); }, [activeKey, query, status, subcategoryFilter]);
  useEffect(() => { if (activeKey !== "subcategories") setSubcategoryFilter(""); }, [activeKey]);

  const subcategoryFilterOptions = useMemo(() => {
    const options = new Map();
    (tables.subcategories || []).forEach((row) => {
      if (!options.has(row.subcategory_id)) options.set(row.subcategory_id, row.subcategory_name_ja);
    });
    return [...options.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, "ja"));
  }, [tables.subcategories]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (tables[activeKey] || []).filter((row) => {
      const statusMatch = status === "all" || (status === "enabled" ? Number(row.is_enabled) !== 0 : Number(row.is_enabled) === 0);
      const textMatch = !text || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(text));
      const subcategoryMatch = activeKey !== "subcategories" || !subcategoryFilter || row.subcategory_id === subcategoryFilter;
      return statusMatch && textMatch && subcategoryMatch;
    });
  }, [activeKey, query, status, subcategoryFilter, tables]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const parentName = (column, row) => {
    const source = column[3];
    if (!source) return row[column[0]];
    const parent = (tables[source] || []).find((candidate) => candidate[column[0]] === row[column[0]] || candidate.id === row[column[0]]);
    return parent ? labelFor(TABLE_MAP[source], parent) : row[column[0]];
  };
  const save = async (values) => {
    setBusy(true); setError("");
    try {
      const db = await Database.load("sqlite:app.db");
      const columns = table.columns.map((column) => column[0]);
      const params = columns.map((column) => values[column] ?? "");
      if (editing) {
        await db.execute(`UPDATE ${activeKey} SET ${columns.map((column) => `${column} = ?`).join(", ")} WHERE id = ?`, [...params, editing.id]);
        setNotice("データを更新しました。");
      } else {
        await db.execute(`INSERT INTO ${activeKey} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`, params);
        setNotice("データを追加しました。");
      }
      setAdding(false); setEditing(null); await load(); await onDataChanged?.();
    } finally { setBusy(false); }
  };
  const disable = async (row) => {
    if (!window.confirm("本当に削除しますか？")) return;
    setBusy(true); setError("");
    try {
      const db = await Database.load("sqlite:app.db");
      await db.execute(`UPDATE ${activeKey} SET is_enabled = 0 WHERE id = ?`, [row.id]);
      setNotice("データを無効化しました。"); await load(); await onDataChanged?.();
    } catch (e) { setError(e?.message || String(e)); } finally { setBusy(false); }
  };
  const startEdit = (row) => { setAdding(false); setEditing(row); setNotice(""); };
  const startAdd = () => { setEditing(null); setAdding(true); setNotice(""); };
  const exportCsv = () => {
    const rows = tables[activeKey] || [];
    const csv = toCsv(table.columns, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeKey}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setError("");
    setNotice(`${table.label}を${rows.length}件エクスポートしました。`);
  };

  const importCsv = async (file) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setNotice("");
    let transactionStarted = false;
    let db = null;
    try {
      const rows = parseCsv(await decodeCsvFile(file));
      if (rows.length < 2) throw new Error("CSVにヘッダーとデータ行が必要です。");

      const aliases = headerAliases(table);
      const headers = rows[0].map((header) => String(header ?? "").trim());
      const fields = headers.map((header) => aliases[header] || null);
      if (!fields.some(Boolean)) throw new Error("このテーブルで使用できるCSVヘッダーがありません。");

      const records = rows.slice(1).map((cells, rowIndex) => {
        const values = {};
        fields.forEach((field, columnIndex) => {
          if (field) values[field] = cells[columnIndex] ?? "";
        });
        const suppliedColumns = table.columns.filter(([key]) => Object.prototype.hasOwnProperty.call(values, key));
        const normalized = Object.fromEntries(suppliedColumns.map((column) => [column[0], normalizeImportValue(column, values[column[0]])]));
        const missingRequired = table.columns.find(([key, label, type]) =>
          (type === "required" || type === "select") &&
          Object.prototype.hasOwnProperty.call(normalized, key) &&
          String(normalized[key]).trim() === ""
        );
        if (missingRequired) throw new Error(`${rowIndex + 2}行目の「${missingRequired[1]}」が空です。`);
        const invalidNumber = suppliedColumns.find((column) => column[2] === "number" && !Number.isFinite(normalized[column[0]]));
        if (invalidNumber) throw new Error(`${rowIndex + 2}行目の「${invalidNumber[1]}」は数値で指定してください。`);
        return { values: normalized, id: Number.isInteger(Number(values.id)) && Number(values.id) > 0 ? Number(values.id) : null, rowIndex };
      });

      db = await Database.load("sqlite:app.db");
      await db.execute("BEGIN TRANSACTION");
      transactionStarted = true;
      let inserted = 0;
      let updated = 0;
      const columns = table.columns.map(([key]) => key);

      for (const record of records) {
        const suppliedColumns = Object.keys(record.values);
        if (suppliedColumns.length === 0) continue;
        const missingForInsert = table.columns.find(([key, label, type]) =>
          (type === "required" || type === "select") && !Object.prototype.hasOwnProperty.call(record.values, key)
        );
        if (missingForInsert) throw new Error(`${record.rowIndex + 2}行目に「${missingForInsert[1]}」がありません。`);

        let existing;
        if (record.id) {
          [existing] = await db.select(`SELECT id FROM ${activeKey} WHERE id = ? LIMIT 1`, [record.id]);
        } else if (record.values[table.importKey]) {
          [existing] = await db.select(`SELECT id FROM ${activeKey} WHERE ${table.importKey} = ? LIMIT 1`, [record.values[table.importKey]]);
        }

        if (existing) {
          const updateColumns = suppliedColumns;
          await db.execute(
            `UPDATE ${activeKey} SET ${updateColumns.map((column) => `${column} = ?`).join(", ")} WHERE id = ?`,
            [...updateColumns.map((column) => record.values[column]), existing.id]
          );
          updated += 1;
        } else {
          const values = columns.map((column) => Object.prototype.hasOwnProperty.call(record.values, column) ? record.values[column] : emptyValue(table.columns.find((item) => item[0] === column)));
          await db.execute(`INSERT INTO ${activeKey} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`, values);
          inserted += 1;
        }
      }

      await db.execute("COMMIT");
      transactionStarted = false;
      setNotice(`${table.label}のCSVを読み込みました（追加 ${inserted}件、更新 ${updated}件）。`);
      setAdding(false);
      setEditing(null);
      await load();
      await onDataChanged?.();
    } catch (e) {
      if (transactionStarted && db) {
        try {
          await db.execute("ROLLBACK");
        } catch {
          // ロールバックに失敗した場合は元のエラーを表示する。
        }
      }
      setError(e?.message || String(e));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setBusy(false);
    }
  };

  return <div style={{ marginTop: 16 }}>
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <h2 style={{ color: theme.lineColor, margin: 0 }}>データ追加</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginLeft: "auto" }}>
        <button className="theme-toggle-btn" onClick={exportCsv} disabled={busy} style={{ background: theme.lineColor }}>CSVエクスポート</button>
        <button className="theme-toggle-btn" onClick={() => fileInputRef.current?.click()} disabled={busy} style={{ background: "#0f766e" }}>CSVインポート</button>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={(event) => importCsv(event.target.files?.[0])} style={{ display: "none" }} />
      </div>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>{TABLES.map((item) => <button key={item.key} onClick={() => setActiveKey(item.key)} className="tab-button" style={{ color: activeKey === item.key ? "#ffffff" : theme.lineColor, border: `1px solid ${theme.lineColor}`, background: activeKey === item.key ? theme.lineColor : "transparent", padding: "8px 12px" }}>{item.label}</button>)}</div>
    <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${table.label}を検索`} style={{ flex: "1 1 240px", padding: 9, border: `1px solid ${theme.cardBorder}`, borderRadius: 6, background: theme.inputBg, color: theme.textMain }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 9, border: `1px solid ${theme.cardBorder}`, borderRadius: 6, background: theme.inputBg, color: theme.textMain }}><option value="all">すべて</option><option value="enabled">有効のみ</option><option value="disabled">無効のみ</option></select>
        <button className="theme-toggle-btn" onClick={startAdd} disabled={busy}>＋追加</button>
      </div>
      {activeKey === "subcategories" && <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <label style={{ color: theme.textMain, fontWeight: 700 }}>サブカテゴリフィルター</label>
        <select value={subcategoryFilter} onChange={(e) => setSubcategoryFilter(e.target.value)} style={{ minWidth: 220, padding: 9, border: `1px solid ${theme.cardBorder}`, borderRadius: 6, background: theme.inputBg, color: theme.textMain }}><option value="">すべてのサブカテゴリ</option>{subcategoryFilterOptions.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select>
      </div>}
    </div>
    {notice && <p style={{ marginBottom: 12, color: "#16a34a" }}>{notice}</p>}
    {error && <p style={{ marginBottom: 12, color: "#dc2626" }}>{error}</p>}
    {(adding || editing) && <DataForm table={table} initial={editing} tables={tables} nextPrimaryKey={nextPrimaryKeys[activeKey]} onCancel={() => { setAdding(false); setEditing(null); }} onSave={save} busy={busy} />}
    <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: 8 }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}><thead><tr>{table.columns.filter((column) => column[0] !== "is_enabled").map((column) => <th key={column[0]} style={{ textAlign: "left", padding: 9, borderBottom: "1px solid var(--border-color)", whiteSpace: "nowrap" }}>{column[1]}</th>)}<th style={{ padding: 9, borderBottom: "1px solid var(--border-color)" }}>状態</th><th style={{ padding: 9, borderBottom: "1px solid var(--border-color)" }}>操作</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} style={{ opacity: Number(row.is_enabled) === 0 ? 0.55 : 1 }}>{table.columns.filter((column) => column[0] !== "is_enabled").map((column) => <td key={column[0]} style={{ padding: 9, borderBottom: "1px solid var(--border-color)", whiteSpace: "pre-wrap", maxWidth: 300 }}>{parentName(column, row)}</td>)}<td style={{ padding: 9, borderBottom: "1px solid var(--border-color)" }}>{Number(row.is_enabled) === 0 ? "無効" : "有効"}</td><td style={{ padding: 9, borderBottom: "1px solid var(--border-color)", whiteSpace: "nowrap" }}><button onClick={() => startEdit(row)} disabled={busy} style={{ marginRight: 6 }}>編集</button><button onClick={() => disable(row)} disabled={busy || Number(row.is_enabled) === 0} style={{ color: "#dc2626" }}>削除</button></td></tr>)}{visibleRows.length === 0 && <tr><td colSpan={table.columns.length + 1} style={{ padding: 24, textAlign: "center", color: theme.textMuted }}>データがありません。</td></tr>}</tbody></table></div>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 14 }}><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>前へ</button><span>{page} / {pageCount}ページ（{filtered.length}件）</span><button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount}>次へ</button></div>
  </div>;
}
