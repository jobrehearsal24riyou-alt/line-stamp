import React from "react";
import ReactDOM from "react-dom/client";

import CategorySelector from "./components/CategorySelector";
import SubcategorySelector from "./components/SubcategorySelector";
import SelectorCard from "./components/SelectorCard";
import SubstyleSelector from "./components/SubstyleSelector";
import PromptPreview from "./components/PromptPreview";
import LineStampMaker from "./components/LineStampMaker";
import LinePromptSet from "./components/LinePromptSet";
import StampGallery from "./components/StampGallery";
import DataManagement from "./components/DataManagement";

import { usePromptData } from "./hooks/usePromptData";
import { createTheme } from "./constants/theme";
import "./App.css";
// 以下テスト用import
import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";


function MainApp() {
  const {
    // アイコン用
    categories, styles, substyles,
    middleCategoryList, filteredItems,
    selectedCategory, setSelectedCategory,
    selectedSubCategoryName,
    selectedItemId, setSelectedItemId,
    selectedStyle, setSelectedStyle,
    selectedPromptParts,
    editablePrompt, setEditablePrompt,
    isCopied,
    handleMiddleCategoryChange,
    handleCheckboxChange,
    handleCopy,

    // LINE用
    lineSubjects, lineCombinationCategories, lineCombinations,
    filteredSubjects,
    selectedAnimalType, setSelectedAnimalType,
    selectedSubjectId, setSelectedSubjectId,
    selectedCombinationCategoryId, setSelectedCombinationCategoryId,
    selectedCombinationId, setSelectedCombinationId,
    lineSelectedStyle, setLineSelectedStyle,
    lineSubstyles,
    lineSelectedPromptParts,
    lineEditablePrompt, setLineEditablePrompt,
    lineIsCopied,
    handleLineCheckboxChange,
    handleLineCopy,
    reloadMasterData,

    // テーマ
    isDarkMode, setIsDarkMode,
  } = usePromptData();

  const theme = createTheme(isDarkMode);
  const [activeTab, setActiveTab] = React.useState("stamps");
  const [lineBubbleSettings, setLineBubbleSettings] = React.useState({
    enabled: false,
    bubbleId: "none",
    sizeId: "medium",
    colorId: "none",
  });
  const [isIconTabVisible, setIsIconTabVisible] = React.useState(() => {
    const savedValue = window.localStorage.getItem("icon-tab-visible");
    return savedValue === "true";
  });
  const [isCheckingForUpdates, setIsCheckingForUpdates] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState("");
  const inactiveTabBackground = isDarkMode ? "#475569" : "#e5e7eb";
  const inactiveTabText = isDarkMode ? "#e2e8f0" : "#475569";
  const topTabStyle = (tabKey, activeColor = theme.activeBg) => ({
    color: activeTab === tabKey ? "#ffffff" : inactiveTabText,
    background: activeTab === tabKey ? activeColor : inactiveTabBackground,
  });

  React.useEffect(() => {
    window.localStorage.setItem("icon-tab-visible", String(isIconTabVisible));
    if (!isIconTabVisible && activeTab === "icons") {
      setActiveTab("stamps");
    }
  }, [activeTab, isIconTabVisible]);


  // ↓↓↓ test用 ↓↓↓
  async function handleStartLLM() {
    try {
      await invoke("start_llm_server");
      alert("LLMサーバー起動リクエストを送信しました");
    } catch (e) {
      console.error("LLMサーバー起動エラー:", e);
      alert("エラー: " + e);
    }
  }

  async function handleCheckForUpdates() {
    if (isCheckingForUpdates) return;

    setIsCheckingForUpdates(true);
    setUpdateStatus("更新を確認しています…");

    try {
      const update = await check();
      if (!update) {
        setUpdateStatus("現在、利用可能な更新はありません。");
        return;
      }

      const notes = update.body ? `\n\n${update.body}` : "";
      if (!window.confirm(`バージョン ${update.version} に更新できます。ダウンロードしてインストールしますか？${notes}`)) {
        setUpdateStatus("更新をキャンセルしました。");
        return;
      }

      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setUpdateStatus("更新ファイルをダウンロードしています…");
        } else if (event.event === "Progress") {
          setUpdateStatus("更新ファイルをダウンロードしています…");
        } else if (event.event === "Finished") {
          setUpdateStatus("更新をインストールしています…");
        }
      });
      setUpdateStatus("更新をインストールしました。アプリを再起動してください。");
    } catch (error) {
      console.error("アプリ更新エラー:", error);
      setUpdateStatus(`更新の確認に失敗しました: ${error}`);
    } finally {
      setIsCheckingForUpdates(false);
    }
  }
  // ↑↑↑ ここまで ↑↑↑
  return (
    <main className={`container ${isDarkMode ? "" : "light-mode"}`} style={{ color: theme.textMain }}>

      <div className="tab-menu">
        {isIconTabVisible && <button className={`tab-button ${activeTab === "icons" ? "active" : ""}`} onClick={() => setActiveTab("icons")} style={topTabStyle("icons")}>アイコン</button>}
        <button
          className={`tab-button ${activeTab === "stamps" ? "active" : ""}`}
          onClick={() => setActiveTab("stamps")}
          style={topTabStyle("stamps", theme.lineColor)}

        >LINEスタンプ</button>
        <button className={`tab-button ${activeTab === "set" ? "active" : ""}`} onClick={() => setActiveTab("set")} style={topTabStyle("set", theme.lineColor)}>8枚セット</button>
        <button className={`tab-button ${activeTab === "gallery" ? "active" : ""}`} onClick={() => setActiveTab("gallery")} style={topTabStyle("gallery", theme.lineColor)}>ギャラリー</button>
        <button className={`tab-button ${activeTab === "data" ? "active" : ""}`} onClick={() => setActiveTab("data")} style={topTabStyle("data", theme.lineColor)}>データ追加</button>
        <button className={`tab-button ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")} style={topTabStyle("settings")}>設定</button>
      </div>

      {/* アイコンタブ */}
      <div className={`tab-content ${activeTab === "icons" ? "active" : ""}`}>
        <h2>アイコン制作</h2>

        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          theme={theme}
        />

        <SubcategorySelector
          selectedCategory={selectedCategory}
          middleCategoryList={middleCategoryList}
          filteredItems={filteredItems}
          selectedSubCategoryName={selectedSubCategoryName}
          selectedItemId={selectedItemId}
          handleMiddleCategoryChange={handleMiddleCategoryChange}
          setSelectedItemId={setSelectedItemId}
          theme={theme}
        />

        <SelectorCard
          label="■ 2. 画風スタイルを選択してください"
          items={styles}
          idKey="style_id"
          nameKey="style_name_ja"
          icon="✨"
          selectedId={selectedStyle}
          setSelectedId={setSelectedStyle}
          theme={theme}
        />

        <SubstyleSelector
          selectedStyle={selectedStyle}
          substyles={substyles}
          selectedPromptParts={selectedPromptParts}
          handleCheckboxChange={handleCheckboxChange}
          theme={theme}
        />

        <PromptPreview
          editablePrompt={editablePrompt}
          setEditablePrompt={setEditablePrompt}
          handleCopy={handleCopy}
          isCopied={isCopied}
          theme={theme}
        />
      </div>

      {/* LINEスタンプタブ */}
      <div className={`tab-content ${activeTab === "stamps" ? "active" : ""}`}>
        <h2 style={{ color: theme.lineColor }}>LINEスタンプ制作</h2>
        <LineStampMaker
          lineSubjects={lineSubjects}
          lineCombinationCategories={lineCombinationCategories}
          lineCombinations={lineCombinations}
          filteredSubjects={filteredSubjects}
          selectedAnimalType={selectedAnimalType}
          setSelectedAnimalType={setSelectedAnimalType}
          selectedSubjectId={selectedSubjectId}
          setSelectedSubjectId={setSelectedSubjectId}
          selectedCombinationCategoryId={selectedCombinationCategoryId}
          setSelectedCombinationCategoryId={setSelectedCombinationCategoryId}
          selectedCombinationId={selectedCombinationId}
          setSelectedCombinationId={setSelectedCombinationId}
          styles={styles}
          lineSelectedStyle={lineSelectedStyle}
          setLineSelectedStyle={setLineSelectedStyle}
          lineSubstyles={lineSubstyles}
          lineSelectedPromptParts={lineSelectedPromptParts}
          handleLineCheckboxChange={handleLineCheckboxChange}
          lineEditablePrompt={lineEditablePrompt}
          setLineEditablePrompt={setLineEditablePrompt}
          lineIsCopied={lineIsCopied}
          handleLineCopy={handleLineCopy}
          onBubbleSettingsChange={setLineBubbleSettings}
          theme={theme}
        />
      </div>

      {/* 8枚セットタブ */}
      <div className={`tab-content ${activeTab === "set" ? "active" : ""}`}>
        <h2 style={{ color: theme.lineColor }}>8枚セット用プロンプト</h2>
        <LinePromptSet
          basePrompt={lineEditablePrompt}
          lineSubjects={lineSubjects}
          lineCombinations={lineCombinations}
          selectedSubjectId={selectedSubjectId}
          selectedAnimalType={selectedAnimalType}
          selectedCombinationCategoryId={selectedCombinationCategoryId}
          selectedCombinationId={selectedCombinationId}
          bubbleSettings={lineBubbleSettings}
          theme={theme}
        />
      </div>

      {/* ギャラリータブ */}
      <div className={`tab-content ${activeTab === "gallery" ? "active" : ""}`}>
        <StampGallery theme={theme} />
      </div>

      {/* データ追加タブ */}
      <div className={`tab-content ${activeTab === "data" ? "active" : ""}`}>
        <DataManagement theme={theme} onDataChanged={reloadMasterData} />
      </div>

      {/* 設定タブ */}
      <div className={`tab-content ${activeTab === "settings" ? "active" : ""}`}>
        <h2>設定</h2>
        <p className="setting-description">アプリの表示モードや全体設定を変更できます。</p>
        <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? "☀️ ライトモードにする" : "🌙 ダークモードにする"}
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", color: theme.textMain, fontWeight: 600, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={isIconTabVisible}
            onChange={(event) => setIsIconTabVisible(event.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: theme.activeColor, cursor: "pointer" }}
          />
          <span>アイコンタブボタンを表示する</span>
        </label>
        <p className="setting-description">オフにすると、上部の「アイコン」メニューボタンを非表示にします。</p>
        <button className="theme-toggle-btn" onClick={handleCheckForUpdates} disabled={isCheckingForUpdates}>
          {isCheckingForUpdates ? "更新を確認中…" : "アプリの更新を確認"}
        </button>
        {updateStatus && <p className="setting-description">{updateStatus}</p>}
        {/* ↓↓↓ ここから追加(テスト用、後で消す) ↓↓↓ */}
        <button className="theme-toggle-btn" onClick={handleStartLLM}>
          🤖 LLMサーバーを起動（テスト用）
        </button>
        {/* ↑↑↑ ここまで追加 ↑↑↑ */}
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
