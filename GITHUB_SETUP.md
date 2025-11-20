# GitHub連携とアクセス制御の設定ガイド

このガイドでは、クライアントがフロントエンドのみを変更でき、バックエンドは保護される環境を構築する方法を説明します。

## 🚀 ステップ1: GitHub連携の有効化

### Lovable側での設定

1. Lovableプロジェクトを開く
2. 右上の「**GitHub**」ボタンをクリック
3. 「**Connect to GitHub**」を選択
4. GitHubでLovable GitHub Appを承認
5. リポジトリを作成するGitHubアカウント/組織を選択
6. 「**Create Repository**」をクリック

これにより、プロジェクトコードがGitHubリポジトリに自動的にプッシュされます。

---

## 🔒 ステップ2: ブランチ保護ルールの設定

GitHubリポジトリで、バックエンドファイルへの直接変更を防ぐため、ブランチ保護を設定します。

### 設定手順

1. GitHubリポジトリのページを開く
2. **Settings** タブをクリック
3. 左側メニューから **Branches** を選択
4. **Add branch protection rule** をクリック

### 保護ルールの設定内容

**Branch name pattern:** `main`

以下の項目にチェックを入れます：

- ✅ **Require a pull request before merging**
  - ✅ **Require approvals** (最低1つの承認)
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from Code Owners**

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - ステータスチェック: `Frontend CI` を選択（初回PR後に表示されます）

- ✅ **Require conversation resolution before merging**

- ✅ **Do not allow bypassing the above settings**
  - ⚠️ **重要**: あなた自身も含めて、誰もこのルールをバイパスできないようにします

**Save changes** をクリック

---

## 👥 ステップ3: CODEOWNERSファイルの設定

`.github/CODEOWNERS` ファイルが既に作成されています。

### 必須の修正

ファイル内の `@YOUR_GITHUB_USERNAME` を**あなたの実際のGitHubユーザー名**に置き換えてください。

例：
```
/supabase/ @your-actual-username
```

この設定により、バックエンドファイルへの変更には必ずあなたの承認が必要になります。

---

## 🤝 ステップ4: クライアントの招待

### クライアントへの権限付与

1. GitHubリポジトリのページを開く
2. **Settings** > **Collaborators** をクリック
3. **Add people** をクリック
4. クライアントのGitHubユーザー名またはメールアドレスを入力
5. 権限を **Write** に設定（これによりプルリクエストの作成が可能）

### クライアントができること

✅ フロントエンドファイルの編集（`src/`、`public/`、`index.html`等）
✅ プルリクエストの作成
✅ コードの閲覧

### クライアントができないこと

❌ `main` ブランチへの直接プッシュ
❌ バックエンドファイルの変更（承認なし）
❌ ブランチ保護ルールの変更
❌ リポジトリ設定の変更

---

## 🔄 ステップ5: ワークフローの確認

### クライアントの作業フロー

1. **ブランチを作成**
   ```bash
   git checkout -b feature/update-ui
   ```

2. **フロントエンドファイルを編集**
   - `src/components/`、`src/pages/`等のファイルを変更
   - `public/`の画像やアセットを更新

3. **変更をコミット＆プッシュ**
   ```bash
   git add .
   git commit -m "UIの更新"
   git push origin feature/update-ui
   ```

4. **プルリクエストを作成**
   - GitHubでプルリクエストを開く
   - 自動的にCI/CDチェックが実行される

5. **あなたがレビュー＆承認**
   - 変更内容を確認
   - 承認してマージ、または修正を依頼

### バックエンドファイルを変更しようとした場合

- ❌ GitHub Actionsが自動的にエラーを検出
- ❌ CODEOWNERSによりあなたの承認が必須
- ❌ プルリクエストはマージ不可

---

## 📁 保護されるファイル

以下のファイル/フォルダはバックエンドとして保護されます：

- `supabase/` - Edge Functions、マイグレーション、設定
- `.env`、`.env.*` - 環境変数
- `package.json`、`package-lock.json`、`bun.lockb` - 依存関係
- `src/integrations/supabase/` - Supabase型定義
- `tsconfig*.json` - TypeScript設定
- `vite.config.ts` - Vite設定

---

## 🛡️ セキュリティのベストプラクティス

### シークレット管理

- `.env` ファイルは**絶対に**GitHubにプッシュしない
- `.gitignore` で `.env` が除外されていることを確認済み
- Supabaseのシークレットは Lovable Cloud の Secrets Management で管理

### 定期的な確認

- [ ] 月次でアクセス権限を確認
- [ ] 不要になったコラボレーターは削除
- [ ] プルリクエストは迅速にレビュー（48時間以内推奨）

---

## ❓ トラブルシューティング

### クライアントがプッシュできない

**原因**: `main` ブランチへの直接プッシュを試みている

**解決策**: 新しいブランチを作成してプルリクエストを使用するよう指示

```bash
git checkout -b feature/my-changes
git push origin feature/my-changes
```

### CODEOWNERSが機能しない

**原因**: GitHubユーザー名が間違っている

**解決策**: `.github/CODEOWNERS` ファイルで `@YOUR_GITHUB_USERNAME` を実際のユーザー名に変更

### GitHub ActionsのCI/CDが失敗する

**原因**: バックエンドファイルが誤って変更されている

**解決策**: プルリクエストでエラーメッセージを確認し、該当ファイルの変更を取り消す

---

## 📞 サポート

設定に問題がある場合は、このドキュメントを参照してください。
追加のサポートが必要な場合は、開発チームにお問い合わせください。

---

**設定完了後、このドキュメントはリポジトリに保存し、クライアントと共有してください。**
