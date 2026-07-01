# 三日boze static prototype

三日bozeは、習慣が途切れた後に自己否定せず小さく戻るための、無料プラン範囲の静的Webプロトタイプです。

## URLをクリックするだけで見る方法

このリポジトリをGitHubの `main` ブランチへマージすると、GitHub Actionsが自動でGitHub Pagesへ公開します。
公開後は、GitHubのPull RequestまたはActions画面に表示される `github-pages` のURLをクリックするだけでアプリを見られます。

URLの形は通常、次のどちらかです。

```text
https://<GitHubユーザー名>.github.io/<リポジトリ名>/
https://<GitHub組織名>.github.io/<リポジトリ名>/
```

## Codex上で一時的に見る方法

Codex上で動作確認する場合は、次のコマンドで一時サーバーを起動します。

```bash
npm run dev
```

起動後、CodexのPorts / Preview / Open in Browser から `3000` 番ポートを開くと表示できます。

## 仕組み

- `index.html`: アプリを開く入口です。
- `src/main.js`: 画面切り替え、記録、リスタートチェック、ローカル保存などの動きを担当します。
- `src/styles.css`: 見た目を担当します。
- `.github/workflows/pages.yml`: `main` ブランチに入った内容をGitHub Pagesへ公開します。
- `server.js`: Codex上や手元で一時的に確認するための簡易サーバーです。

## 確認コマンド

```bash
npm run build
```

必要なファイルが揃っているか確認します。
