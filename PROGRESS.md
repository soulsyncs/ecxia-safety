# ECXIA安全管理システム - 進捗管理

**最終更新：2026年2月14日 JST**

---

## 現在のステータス

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   Phase 0（設計・基盤構築）:      100% 完了                  │
│   Phase 0.5（デモUI実装）:        100% 完了                  │
│   Phase 1〜4（実装 12ステップ）:  100% 完了                  │
│   外部設定（Supabase/LINE/Vercel）: 100% 完了                │
│   3-AI最終レビュー + 修正:        100% 完了                  │
│   E2Eスモークテスト（10項目）:    10/10 PASS                 │
│                                                               │
│   ✅ ビルド: PASS (1976 modules, 624KB JS)                   │
│   ✅ 型チェック: PASS (0 errors)                              │
│   ✅ ユニットテスト: 34/34 PASS                               │
│   ✅ Supabase: 本番接続済み（30マイグレーション適用済み）    │
│   ✅ LINE: チャネル作成・LIFF・Webhook 全設定完了            │
│   ✅ LINE Login: 公開済み（全ユーザー利用可能）              │
│   ✅ リッチメニュー: 4分割メニュー作成・有効化済み           │
│   ✅ Vercel: 本番デプロイ済み                                │
│   ✅ Edge Functions: 5関数デプロイ済み（セキュリティ修正済） │
│   ✅ Cron: 4スケジュール設定済み（pg_cron + pg_net）         │
│   ✅ 3-AIセキュリティレビュー: 3ラウンド全修正適用済み       │
│   ✅ CRON_SECRET timing-safe比較 適用済み                     │
│   ✅ accident_reports 不足カラム6列 追加済み                  │
│                                                               │
│   >> Phase 1 本番運用可能状態 <<                              │
│                                                               │
│   次フェーズ改善（P1/P2、非ブロッキング）:                   │
│      → 詳細は「次フェーズ改善タスク」セクション参照          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## フェーズ進捗

| Phase | 名称 | 状態 | 進捗 |
|-------|------|------|------|
| **Phase 0** | 設計・基盤構築 | 完了 | 100% |
| **Phase 0.5** | デモUI実装 + 3-AIレビュー | 完了 | 100% |
| **Phase 1** | Supabase実接続 | 完了 | 100% |
| **Phase 2** | LINE連携・通知 | 完了 | 100% |
| **Phase 3** | テスト | 完了 | 100% |
| **Phase 4** | CI/CD・デプロイ設定 | 完了 | 100% |
| **外部設定** | Supabase/LINE/Vercel | 完了 | 100% |
| **3-AIレビュー** | セキュリティ修正 | 完了 | 100% |
| **リリース** | 本番運用開始 | 残り1項目（実運用テスト） | - |

---

## 本番環境情報（確定値）

### Supabase
| 項目 | 値 |
|------|-----|
| Project ref | `dirbmretnocymuttrlrc` |
| URL | `https://dirbmretnocymuttrlrc.supabase.co` |
| DB | PostgreSQL 15, 22マイグレーション適用済み |
| Auth | 管理者ユーザー作成済み (admin@ecxia.co.jp / パスワードはSupabase Auth管理) |
| Org ID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| Edge Functions | 5関数デプロイ済み (line-webhook, submit-report, link-driver, morning-reminder, check-submissions) |
| Secrets | LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_ID 設定済み |

### LINE Developers
| 項目 | 値 |
|------|-----|
| プロバイダー | 株式会社ECXIA (ID: 2004856831) |
| LINE公式アカウント | ECXIA安全管理 (@119oghsk) |
| Messaging APIチャネル | ID: 2009117085 |
| Channel Secret | (Supabase Secretsに保存) |
| Channel Access Token | (長期トークン発行済み、Supabase Secretsに保存) |
| LINE Loginチャネル | ID: 2009117128 (ECXIA安全管理 LIFF) — **状態: 公開済み** |
| LIFFアプリ | ID: `2009117128-QkmP07AJ`, URL: `https://liff.line.me/2009117128-QkmP07AJ` |
| LIFF設定 | サイズ: Full, Scope: openid+profile, 友だち追加: On(normal) |
| Webhook URL | `https://dirbmretnocymuttrlrc.supabase.co/functions/v1/line-webhook` |
| Webhook利用 | ON |
| 応答メッセージ | OFF（Webhook優先） |
| あいさつメッセージ | OFF（Webhook follow handler優先） |
| リッチメニュー | richmenu-e00f04f248e91d8e676e8cca060b81e9（4分割、全ユーザーデフォルト） |
| Cron | pg_cron + pg_net有効、4スケジュール設定済み |

### Vercel
| 項目 | 値 |
|------|-----|
| URL | `https://ecxia-safety.vercel.app` |
| Framework | Vite |
| 環境変数 | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_LIFF_ID (production+preview) |

### GitHub
| 項目 | 値 |
|------|-----|
| リポジトリ | `https://github.com/soulsyncs/ecxia-safety` (private) |
| ブランチ | main |
| コミット数 | 13+ |
| 最新コミット | `3f31f22` fix(security): CRON_SECRET timing-safe比較 + エラーメッセージ汎用化 |

---

## 完了済み作業（外部設定）

### Supabase設定 [完了]
- [x] プロジェクト作成
- [x] マイグレーション実行（21ファイル → 17テーブル + RLS + SECURITY DEFINER関数）
- [x] seed.sql実行（初期データ: 1組織、1管理者、3ドライバー、5車両）
- [x] 管理者ユーザー作成（admin@ecxia.co.jp / パスワードはSupabase Auth管理）
- [x] Edge Functions 5関数デプロイ
- [x] Secrets設定（LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_ID）

### LINE Developers設定 [完了]
- [x] プロバイダー作成（株式会社ECXIA）
- [x] LINE公式アカウント作成（ECXIA安全管理 @119oghsk）
- [x] Messaging API有効化
- [x] Webhook URL設定 + 有効化
- [x] チャネルアクセストークン（長期）発行
- [x] LINE Loginチャネル作成（ECXIA安全管理 LIFF）
- [x] LINE公式アカウントとLINE Loginチャネルのリンク
- [x] LIFFアプリ作成（Full, openid+profile）
- [x] 応答メッセージOFF（Webhook優先）
- [x] LINE Loginチャネル「公開」に変更（全ユーザー利用可能）
- [x] リッチメニュー作成（4分割: 出勤/日常点検/退勤/事故報告）
- [x] あいさつメッセージOFF（Webhook follow handler優先）

### 3-AIセキュリティレビュー修正 [完了]
- [x] check-submissions JST日付バグ修正（UTC→JST+9）
- [x] Bearer認証強化（morning-reminder + check-submissions）
- [x] PROGRESS.mdからSecrets除去
- [x] organizations テーブルにLINE情報設定
- [x] pg_cron + pg_net有効化 + 4 Cronスケジュール設定
- [x] Edge Functions 5関数再デプロイ

### Vercel設定 [完了]
- [x] デプロイ（ecxia-safety.vercel.app）
- [x] 環境変数設定（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_LIFF_ID）
- [x] セキュリティヘッダー設定（vercel.json）

### 3-AIセキュリティレビュー [完了]
- [x] RLSポリシー全テーブル検証
- [x] RLS循環参照修正（get_my_org_id() SECURITY DEFINER関数）
- [x] event_logs INSERT policy追加
- [x] RPC関数 auth.uid()検証追加

---

## 残り作業（リリース前に必要）

### ~~1. Cron設定~~ [完了]
pg_cron + pg_net有効化済み。4スケジュール設定済み。

### ~~2. LINE Loginチャネルを「公開」~~ [完了]
2026-02-13 公開済み。全LINEユーザーが利用可能。

### ~~3. リッチメニュー作成~~ [完了]
Messaging API経由で4分割メニュー作成・画像アップロード・デフォルト設定済み。

### ~~4. あいさつメッセージ~~ [完了]
OFF設定済み（Webhook follow handlerで対応、重複防止）。

### 5. ドライバーのLINE友だち追加テスト [完了]
- [x] 友だち追加済み
- [x] LIFF ID改行バグ修正（Vercel環境変数に`\n`混入 → 再設定済み）
- [x] LIFF Scope修正（profile → openid+profile）
- [x] E2Eスモークテスト 10/10 PASS

### 6. 3-AI最終レビュー + セキュリティ修正 [完了]
- [x] Code Reviewer: 17項目チェック → H1修正（accident_reports不足カラム）
- [x] Security Reviewer: CRON_SECRET timing-safe比較 + エラーメッセージ汎用化
- [x] Architecture Reviewer: 4.0/5.0 PASS
- [x] 4 Edge Functions再デプロイ
- [x] マイグレーション000030適用

---

## 次フェーズ改善タスク（P1/P2、非ブロッキング）

### P1（推奨）
| # | タスク | 詳細 |
|---|--------|------|
| 1 | 管理者サマリーLINE通知 | check-submissions の admin_summary が現在 console.log のみ。管理者の LINE User ID を取得して pushMessage する |
| 2 | ドライバー操作監査ログ | submit-report Edge Function で event_logs テーブルに INSERT する |
| 3 | reports.service.ts 整理 | submit系関数はdemoモード用。本番はEdge Function経由のためdemo-only明示 |

### P2（将来）
| # | タスク | 詳細 |
|---|--------|------|
| 1 | CSPヘッダー追加 | Content-Security-Policy を vercel.json に追加 |
| 2 | localStorage組織スコープ化 | autosaveキーに organizationId を含める |
| 3 | LINE multicast対応 | 50名超のドライバーにはmulticast APIを使用 |
| 4 | React Error Boundary | エラー時のフォールバックUI |
| 5 | 事故報告二重送信防止 | サーバー側冪等性チェック |
| 6 | 保存期間自動クリーンアップ | expires_at < now() のレコードを月次バッチで削除 |
| 7 | 外部バックアップ自動化 | GCS等へ定期エクスポート |

### 運用開始前（ECXIAさん側作業）
| # | タスク | 詳細 |
|---|--------|------|
| 1 | 実ドライバーのデータ登録 | 管理画面からドライバー・車両を登録 |
| 2 | ドライバーのLINE友だち追加 | QRコード配布 → 登録URL → LINE連携 |
| 3 | 受入テスト | ECXIAさんが実際に操作して確認 |
| 4 | 運用マニュアル作成 | 点呼の法的位置づけ説明を含む |

---

## Phase 0: 設計・基盤構築 [完了]

- [x] クライアント情報整理（ekutora.com, 議事録, 国交省PDF）
- [x] 市場価格調査・価格戦略策定
- [x] CLAUDE.md 作成（マスターコンテキスト）
- [x] DB設計書作成（docs/06_DATABASE_DESIGN.md - 17テーブル）
- [x] PROGRESS.md 作成
- [x] プロジェクト初期化（React + TypeScript + Vite + Tailwind + pnpm）
- [x] shadcn/ui セットアップ（17コンポーネント）
- [x] TanStack Router セットアップ（code-based routing）
- [x] 型定義作成（src/types/database.ts - 17テーブル）
- [x] ESLint + Prettier 設定
- [x] GitHub リポジトリ作成
- [x] SQLマイグレーション作成（18ファイル、supabase/migrations/）

---

## Phase 0.5: デモUI実装 + 3-AIレビュー [完了]

### 実装済み画面（10画面）

#### 管理画面（Web UI）- 6画面
| # | 画面 | ファイル | 状態 |
|---|------|---------|------|
| 1 | ログイン | src/app/routes/LoginPage.tsx | 完了 |
| 2 | ダッシュボード | src/app/routes/DashboardPage.tsx | 完了 |
| 3 | 日報一覧 | src/app/routes/ReportsPage.tsx | 完了 |
| 4 | ドライバー管理 | src/app/routes/DriversPage.tsx | 完了 |
| 5 | 車両管理 | src/app/routes/VehiclesPage.tsx | 完了 |
| 6 | データエクスポート | src/app/routes/ExportPage.tsx | 完了 |

#### LIFFフォーム（ドライバーUI）- 4画面
| # | 画面 | ファイル | 状態 |
|---|------|---------|------|
| 7 | 業務前報告 | src/liff/pages/PreWorkFormPage.tsx | 完了 |
| 8 | 日常点検 | src/liff/pages/InspectionFormPage.tsx | 完了 |
| 9 | 業務後報告 | src/liff/pages/PostWorkFormPage.tsx | 完了 |
| 10 | 事故報告 | src/liff/pages/AccidentFormPage.tsx | 完了 |

---

## Phase 1〜4: 実装（12ステップ計画） [完了]

### Step 1: RLS追加マイグレーション + seed.sql [完了]
### Step 2: Supabaseクライアント強化 [完了]
### Step 3: Zodバリデーションスキーマ [完了]
### Step 4: Supabaseサービス層 [完了]
### Step 5: TanStack Queryフック [完了]
### Step 6: Auth統合 + ルーター修正 [完了]
### Step 7: 管理画面ページ更新（6画面） [完了]
### Step 8: LIFFフォーム更新（4画面） [完了]
### Step 9: Edge Functions（5関数） [完了]
### Step 10: PII masking + 監査ログ [完了]
### Step 11: テスト [完了]
### Step 12: CI/CD + デプロイ設定 [完了]

---

## マイグレーション一覧（30ファイル）

| # | ファイル | 内容 |
|---|---------|------|
| 1-18 | 000001〜000018 | テーブル作成、RLS、インデックス |
| 19 | 000019 | admin CRUD RLSポリシー追加 |
| 20 | 000020 | セキュリティ強化（event_logs INSERT + RPC auth検証） |
| 21 | 000021 | RLS循環参照修正（get_my_org_id() SECURITY DEFINER） |
| 22 | 000022 | pg_cron + pg_net拡張有効化 |
| 23 | 000023 | JST日付バグ修正 + Bearer認証 |
| 24 | 000024 | admin_users RLSブートストラップ修正 |
| 25 | 000025 | accident_photos Storage bucket作成 |
| 26 | 000026 | 複合インデックス追加 |
| 27 | 000027 | セキュリティ強化（RPC auth検証追加） |
| 28 | 000028 | 追加セキュリティ修正（ラウンド2） |
| 29 | 000029 | LINE連携カラム追加（organizations/drivers） |
| 30 | 000030 | accident_reports不足カラム6列追加 |

---

## 検証結果（2026-02-12）

| チェック | 結果 |
|---------|------|
| `pnpm type-check` | ✅ 0 errors |
| `pnpm build` | ✅ 成功（1976 modules, 624KB JS, 28KB CSS） |
| `pnpm test` | ✅ 34/34 passed |
| デモモード | ✅ 全画面動作確認 |
| 本番ログイン | ✅ admin@ecxia.co.jp で正常ログイン |
| ダッシュボード | ✅ 3ドライバー、0/3提出表示 |
| ドライバー管理 | ✅ 佐藤太郎、田中一郎、鈴木花子 表示 |
| 車両管理 | ✅ 5台表示 |
| 日報一覧 | ✅ 4タブ表示 |
| エクスポート | ✅ CSV出力4種、日付範囲ピッカー |
| コンソールエラー | ✅ 0件 |

---

## ビルド・実行コマンド

```bash
cd /Users/kikubookair/ecxia-safety
pnpm dev          # 開発サーバー起動（localhost:5173）
pnpm build        # プロダクションビルド
pnpm type-check   # TypeScript型チェック
pnpm test         # ユニットテスト（Vitest）
pnpm test:e2e     # E2Eテスト（Playwright）
pnpm lint         # ESLint
```

---

**このファイルは毎回の作業開始時・終了時に更新してください。**
