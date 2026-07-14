import React from "react";
import ReactDOM from "react-dom/client";

import CategorySelector from "./components/CategorySelector";
import SubcategorySelector from "./components/SubcategorySelector";
import SelectorCard from "./components/SelectorCard";
import SubstyleSelector from "./components/SubstyleSelector";
import PromptPreview from "./components/PromptPreview";
import LineStampMaker from "./components/LineStampMaker";

import { usePromptData } from "./hooks/usePromptData";
import { createTheme } from "./constants/theme";
import "./App.css";

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

    // テーマ
    isDarkMode, setIsDarkMode,
  } = usePromptData();

  const theme = createTheme(isDarkMode);
  const [activeTab, setActiveTab] = React.useState("icons");

  return (
    <main className={`container ${isDarkMode ? "" : "light-mode"}`} style={{ color: theme.textMain }}>

      <div className="tab-menu">
        <button className={`tab-button ${activeTab === "icons" ? "active" : ""}`} onClick={() => setActiveTab("icons")}>アイコン</button>
        <button
          className={`tab-button ${activeTab === "stamps" ? "active" : ""}`}
          onClick={() => setActiveTab("stamps")}
          style={{
            color: activeTab === "stamps" ? "#ffffff" : theme.lineColor,
            borderColor: theme.lineColor,
            background: activeTab === "stamps" ? theme.lineColor : "transparent"
          }}
        >LINEスタンプ</button>
        <button className={`tab-button ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>設定</button>
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
          theme={theme}
        />
      </div>

      {/* 設定タブ */}
      <div className={`tab-content ${activeTab === "settings" ? "active" : ""}`}>
        <h2>設定</h2>
        <p className="setting-description">アプリの表示モードや全体設定を変更できます。</p>
        <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? "☀️ ライトモードにする" : "🌙 ダークモードにする"}
        </button>
      </div>

    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
