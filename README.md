# DEKISUGIKUN - 商談議事録管理システム

## プロジェクト概要

商談の議事録を効率的に管理するためのWebアプリケーションです。

## 開発環境のセットアップ

### 必要な環境

- Node.js & npm - [nvmでインストール](https://github.com/nvm-sh/nvm#installing-and-updating)

### セットアップ手順

```sh
# ステップ1: リポジトリをクローン
git clone <YOUR_GIT_URL>

# ステップ2: プロジェクトディレクトリに移動
cd <YOUR_PROJECT_NAME>

# ステップ3: 依存関係をインストール
npm i

# ステップ4: 開発サーバーを起動
npm run dev
```

## 使用技術

このプロジェクトは以下の技術で構築されています：

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase（バックエンド）
- Stripe（決済）

## ファイルの編集方法

### GitHubで直接編集

- 編集したいファイルに移動
- 右上の「Edit」ボタン（鉛筆アイコン）をクリック
- 変更を加えてコミット

### GitHub Codespacesを使用

- リポジトリのメインページに移動
- 右上の「Code」ボタン（緑色）をクリック
- 「Codespaces」タブを選択
- 「New codespace」をクリックして新しい環境を起動
- Codespace内で直接ファイルを編集し、変更をコミット＆プッシュ

## デプロイ

### フロントエンド

Vercel、Netlify、またはその他のホスティングサービスを使用してデプロイできます。

```sh
# ビルド
npm run build

# プレビュー
npm run preview
```

### バックエンド

Supabase Edge Functionsは、Supabase CLIを使用してデプロイします。

```sh
# Edge Functionsをデプロイ
npx supabase functions deploy
```

## 環境変数

以下の環境変数を設定してください：

- `VITE_SUPABASE_URL`: SupabaseプロジェクトのURL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabaseの公開鍵
- `STRIPE_SECRET_KEY`: Stripeのシークレットキー（バックエンド用）
- `OPENAI_API_KEY`: OpenAI APIキー（文字起こし機能用）
- `RESEND_API_KEY`: Resend APIキー（メール送信用）

## ライセンスとサポート

本プロジェクトは商用利用を目的としています。技術的なサポートが必要な場合は、開発チームにお問い合わせください。
