# GitHub Releases配布・アップデート設定

## 0. LLMファイルの管理

`src-tauri/binaries` はGit LFSで管理しています。GGUFモデル・llama-server・必要DLLは、通常のGit履歴を肥大化させずにGitHub Actionsへ取得されます。

ワークフローには、LLMファイルがない場合にリリースを止める検査を入れています。LLMファイルを更新する場合も、通常どおり `git add src-tauri/binaries` を実行してください。

## 1. GitHubリポジトリURLを設定

`src-tauri/tauri.conf.json` には、次のGitHub Releases取得先を設定済みです。

```text
https://github.com/jobrehearsal24riyou-alt/line-stamp/releases/latest/download/latest.json
```

リポジトリは、アプリから認証なしで更新情報と更新ファイルを取得できるよう、公開リポジトリまたは公開リリースアセットを使用してください。

## 2. GitHub Actions Secretを登録

署名鍵は `C:\Users\user\.tauri\prompt_make_projects.key` に作成済みです。秘密鍵の内容をGitHubリポジトリのActions Secretへ登録します。

- `TAURI_SIGNING_PRIVATE_KEY`: `prompt_make_projects.key` の内容
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: 空欄

秘密鍵ファイルと `.pub` ファイルはリポジトリへコミットしないでください。

## 3. リリース作成

`src-tauri/tauri.conf.json` と `Cargo.toml` のバージョンを更新してから、`app-v` 接頭辞のタグをpushします。

```powershell
git tag app-v0.1.1
git push origin app-v0.1.1
```

GitHub Actionsの `Release Tauri application` がWindows x64向けのNSIS/MSIインストーラー、署名済みUpdaterアーティファクト、`latest.json` を作成します。リリースはドラフトで作成されるため、確認後に公開してください。

## ローカルでインストーラーを作る場合

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "C:\Users\user\.tauri\prompt_make_projects.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
npm run build:installer
```

インストーラーには `llama-server`、必要DLL、Qwen GGUFモデルが含まれます。現在の同梱データは約1.08GBです。
