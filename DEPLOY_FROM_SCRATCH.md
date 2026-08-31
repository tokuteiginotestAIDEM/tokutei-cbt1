# GitHub Pages 再構築ガイド

このZIPをPCで解凍し、ZIP自体ではなく「中身」を新しいGitHubリポジトリのルート直下にアップロードしてください。

## 手順
1. 新しいGitHubリポジトリを作成（例: `tokutei-cbt-new`）。
2. このZIPを解凍。
3. 解凍した中身をすべてアップロード。
4. GitHub上で `config.js` を開き、
   `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`
   を、すでにコピーしたGoogle Apps Script Web App URL（末尾 `/exec`）に置き換える。
5. Settings → Pages:
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /(root)
   - Save
6. Actionsで `pages build and deployment` が緑のチェックになれば公開完了。

## 公開URL
`https://<GitHubユーザー名またはOrganization名>.github.io/<Repository名>/`

## 管理画面
`https://<GitHubユーザー名またはOrganization名>.github.io/<Repository名>/admin.html`

## 注意
- `/docs` は選ばず `/(root)` を選択。
- `assets` フォルダも必ずアップロード。
- Google Sheet / Apps Script側がすでに設定済みなら、`apps-script.gs` は再設定不要。バックアップとして同梱。
