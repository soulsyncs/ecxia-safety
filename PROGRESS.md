# ECXIA安全管理システム - 進捗管理

**最終更新：2026年2月12日**

---

## 現在のステータス

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   Phase 0（設計・基盤構築）: 100% 完了                        │
│   Phase 0.5（デモUI実装）: 100% 完了                          │
│   Phase 1〜4（実装 12ステップ）: 100% 完了                    │
│                                                               │
│   ✅ ビルド: PASS (1976 modules, 624KB JS)                   │
│   ✅ 型チェック: PASS (0 errors)                              │
│   ✅ ユニットテスト: 34/34 PASS                               │
│                                                               │
│   次のアクション（ユーザー手動）:                             │
│      1. Supabaseプロジェクト作成 → URL + anon key取得         │
│      2. supabase db push（マイグレーション実行）              │
│      3. seed.sql実行（初期データ投入）                        │
│      4. LINE Developers設定（LIFF ID取得）                    │
│      5. .env.local にクレデンシャル設定                       │
│      6. Vercelデプロイ                                        │
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
| **リリース** | 本番運用開始 | 外部設定待ち | - |

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

### デモデータ層
- [x] demo-store.ts（localStorage擬似バックエンド）
- [x] demo-data.ts（3ドライバー、5車両のサンプルデータ）

### レイアウト・デザイン
- [x] AdminLayout.tsx（サイドバー + ヘッダー）
- [x] LiffLayout.tsx（モバイルヘッダー + コンテンツ）
- [x] ECXIAブランドカラー統一（#49b93d）
- [x] Tailwindカスタムカラー（ecxia-green, ecxia-green-dark等）
- [x] CSSカスタムプロパティ（HSL形式）
- [x] ECXIAロゴ組み込み（カラー版 + 白版）
- [x] 日本語フォント設定（Noto Sans JP）

### 3-AIデザインレビュー [完了]
- [x] Claude Code: アーキテクチャ9項目レビュー → PASS
- [x] Codex: 18項目3パスレビュー → PASS
- [x] Gemini: セキュリティ・パフォーマンスレビュー → PASS
- [x] 3者コンセンサス反映（16箇所修正）
- [x] 残存する汎用色（text-green-*等）の完全排除確認
- [x] TSC PASS / Viteビルド PASS

---

## Phase 1〜4: 実装（12ステップ計画） [完了]

### Step 1: RLS追加マイグレーション + seed.sql [完了]
- [x] `supabase/migrations/20260212000019_add_admin_crud_policies.sql` — admin CRUD RLSポリシー
- [x] `supabase/seed.sql` — ECXIA初期データ（組織、管理者、ドライバー3名、車両5台）

### Step 2: Supabaseクライアント強化 [完了]
- [x] `src/lib/supabase.ts` — isDemoMode判定、snake/camelCase変換、エラーハンドリング

### Step 3: Zodバリデーションスキーマ [完了]
- [x] `src/lib/validations/` — 7スキーマ + barrel export (auth, driver, vehicle, pre/post-work, inspection, accident)

### Step 4: Supabaseサービス層 [完了]
- [x] `src/services/auth.service.ts` — Supabase Auth (login, logout, getSession, onAuthStateChange)
- [x] `src/services/drivers.service.ts` — CRUD (list, getById, create, update)
- [x] `src/services/vehicles.service.ts` — CRUD (list, getById, create, update)
- [x] `src/services/reports.service.ts` — 4テーブルのget/submit (8メソッド)
- [x] `src/services/dashboard.service.ts` — RPC get_daily_submission_summary
- [x] `src/services/index.ts` — barrel export
- [x] 全クエリにorganization_id、snake↔camelCase変換、デモモードフォールバック

### Step 5: TanStack Queryフック [完了]
- [x] `src/hooks/use-auth.ts` — useLogin, useLogout, useSession
- [x] `src/hooks/use-drivers.ts` — useDrivers, useDriver, useCreateDriver, useUpdateDriver
- [x] `src/hooks/use-vehicles.ts` — useVehicles, useVehicle, useCreateVehicle, useUpdateVehicle
- [x] `src/hooks/use-reports.ts` — 4種類のレポートフック
- [x] `src/hooks/use-dashboard.ts` — useDailySummary

### Step 6: Auth統合 + ルーター修正 [完了]
- [x] `src/contexts/auth-context.tsx` — Auth状態管理Context
- [x] `src/router.tsx` — Supabase Auth認証ガード
- [x] `src/app/layouts/RootLayout.tsx` — QueryClientProvider + AuthProvider
- [x] `src/main.tsx` — QueryClient初期化

### Step 7: 管理画面ページ更新（6画面） [完了]
- [x] LoginPage.tsx — React Hook Form + Zod + Supabase Auth
- [x] DashboardPage.tsx — useDailySummary hook
- [x] ReportsPage.tsx — useReports hooks + フィルタ
- [x] DriversPage.tsx — React Hook Form + useDrivers/useCreateDriver
- [x] VehiclesPage.tsx — React Hook Form + useVehicles/useCreateVehicle
- [x] ExportPage.tsx — TanStack Queryフック + CSVエクスポート

### Step 8: LIFFフォーム更新（4画面） [完了]
- [x] `src/liff/lib/liff-init.ts` — LIFF SDK初期化（デモモードフォールバック）
- [x] `src/liff/hooks/use-liff-auth.ts` — LIFF認証フック + Edge Function送信
- [x] LiffLayout.tsx — useLiffAuth統合
- [x] PreWorkFormPage.tsx — React Hook Form + デモ/実接続分岐
- [x] InspectionFormPage.tsx — 同上
- [x] PostWorkFormPage.tsx — 同上
- [x] AccidentFormPage.tsx — 同上 + 写真アップロード

### Step 9: Edge Functions（5関数） [完了]
- [x] `supabase/functions/submit-report/index.ts` — 統合報告受信（LINE IDトークン検証 + Zodバリデーション）
- [x] `supabase/functions/link-driver/index.ts` — ドライバーLINE連携（registration_token）
- [x] `supabase/functions/line-webhook/index.ts` — LINE Webhook受信（HMAC-SHA256検証）
- [x] `supabase/functions/morning-reminder/index.ts` — 朝リマインド（08:00）
- [x] `supabase/functions/check-submissions/index.ts` — 未提出アラート + 管理者サマリー

### Step 10: PII masking + 監査ログ [完了]
- [x] `src/lib/pii-mask.ts` — PIIマスキング（名前、電話、メール、免許番号、UUID）
- [x] `src/lib/audit-log.ts` — 監査ログユーティリティ（デモモード対応）

### Step 11: テスト [完了]
- [x] `tests/unit/validations.test.ts` — Zodスキーマテスト（19テスト）
- [x] `tests/unit/pii-mask.test.ts` — PIIマスキングテスト（10テスト）
- [x] `tests/unit/services.test.ts` — snake↔camelCase変換テスト（5テスト）
- [x] `tests/e2e/login.spec.ts` — ログインフローE2E
- [x] `tests/e2e/dashboard.spec.ts` — ダッシュボードE2E
- [x] `tests/e2e/drivers.spec.ts` — ドライバー管理E2E
- [x] `tests/e2e/liff-forms.spec.ts` — LIFFフォームE2E
- [x] `vitest.config.ts` — Vitest設定
- [x] `playwright.config.ts` — Playwright設定

### Step 12: CI/CD + デプロイ設定 [完了]
- [x] `.github/workflows/ci.yml` — lint + type-check + test + build
- [x] `.github/workflows/e2e.yml` — Playwright E2E + artifact upload
- [x] `vercel.json` — Vercel SPA設定
- [x] `scripts/deploy-edge-functions.sh` — Edge Functionsデプロイスクリプト

---

## 検証結果（2026-02-12）

| チェック | 結果 |
|---------|------|
| `pnpm type-check` | ✅ 0 errors |
| `pnpm build` | ✅ 成功（1976 modules, 624KB JS, 28KB CSS, 1.60s） |
| `pnpm test` | ✅ 34/34 passed（3ファイル） |
| デモモード | ✅ 環境変数未設定でも全画面動作 |

---

## 本番稼働に必要な外部設定（ユーザー手動）

1. **Supabaseプロジェクト作成** → URL + anon key + service role key取得
2. **`supabase db push`** でマイグレーション実行（18ファイル → 17テーブル + RLS）
3. **`supabase/seed.sql`実行** で初期データ投入
4. **Supabase Auth** で管理者ユーザー作成
5. **LINE Developers** でチャネル作成 → Messaging API有効化 → LIFF ID取得
6. **`.env.local`** にクレデンシャル設定:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_LIFF_ID=xxxx-xxxx
   ```
7. **Edge Functions secrets**:
   ```
   supabase secrets set LINE_CHANNEL_ID=xxx LINE_CHANNEL_SECRET=xxx LINE_CHANNEL_ACCESS_TOKEN=xxx
   ```
8. **Cron設定**（Supabase Dashboard）:
   - morning-reminder: `0 23 * * *` (UTC = JST 08:00)
   - check-submissions(pre_work): `30 0 * * *` (UTC = JST 09:30)
   - check-submissions(post_work): `0 10 * * *` (UTC = JST 19:00)
   - check-submissions(admin_summary): `0 1 * * *` (UTC = JST 10:00)
9. **Vercel** にデプロイ（vercel.json設定済み）

---

## ファイル構成（最終）

```
ecxia-safety/
├── CLAUDE.md                              # マスターコンテキスト
├── PROGRESS.md                            # この進捗ファイル
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.js
├── vercel.json
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml                         # lint + type-check + test + build
│       └── e2e.yml                        # Playwright E2E
├── docs/                                  # 設計書
├── public/                                # ロゴ等
├── scripts/
│   └── deploy-edge-functions.sh           # Edge Functionsデプロイ
├── src/
│   ├── vite-env.d.ts                      # Vite型定義
│   ├── main.tsx                           # エントリポイント
│   ├── router.tsx                         # TanStack Router
│   ├── contexts/
│   │   └── auth-context.tsx               # Auth状態管理
│   ├── app/
│   │   ├── layouts/RootLayout.tsx         # 管理画面レイアウト
│   │   ├── routes/                        # 管理画面6ページ
│   │   └── components/                    # 管理画面コンポーネント
│   ├── liff/
│   │   ├── lib/liff-init.ts              # LIFF SDK初期化
│   │   ├── hooks/use-liff-auth.ts        # LIFF認証フック
│   │   ├── layouts/LiffLayout.tsx        # LIFFレイアウト
│   │   └── pages/                        # LIFFフォーム4ページ
│   ├── lib/
│   │   ├── supabase.ts                   # Supabaseクライアント + 変換
│   │   ├── pii-mask.ts                   # PIIマスキング
│   │   ├── audit-log.ts                  # 監査ログ
│   │   ├── demo-store.ts                 # デモバックエンド
│   │   ├── demo-data.ts                  # デモデータ
│   │   └── validations/                  # Zodスキーマ（7ファイル）
│   ├── services/                          # Supabaseサービス層（6ファイル）
│   ├── hooks/                             # TanStack Queryフック（5ファイル）
│   ├── types/
│   │   └── database.ts                   # DB型定義
│   └── components/ui/                     # shadcn/ui（17コンポーネント）
├── supabase/
│   ├── seed.sql                          # 初期データ
│   ├── migrations/                       # 19マイグレーション
│   └── functions/                        # Edge Functions（5関数）
│       ├── submit-report/
│       ├── link-driver/
│       ├── line-webhook/
│       ├── morning-reminder/
│       └── check-submissions/
└── tests/
    ├── unit/                             # ユニットテスト（3ファイル, 34テスト）
    └── e2e/                              # E2Eテスト（4ファイル）
```

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

## 技術スタック（確定済み）

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 18.x | UI |
| TypeScript | 5.x (Strict) | 型安全 |
| Vite | 5.x | ビルド |
| Tailwind CSS | 3.x | スタイリング |
| shadcn/ui | 最新 | UIコンポーネント（17個） |
| TanStack Router | 1.x | ルーティング（code-based） |
| TanStack Query | 5.x | サーバー状態管理 |
| React Hook Form | 7.x | フォーム |
| Zod | 3.x | バリデーション |
| @supabase/supabase-js | 2.x | バックエンド |
| @line/liff | 2.x | LINE連携 |
| Lucide React | 最新 | アイコン |
| date-fns | 3.x | 日付処理 |
| Vitest | 3.x | ユニットテスト |
| Playwright | 最新 | E2Eテスト |

---

## ロゴ・ブランド素材

| ファイル | 用途 | サイズ |
|---------|------|--------|
| public/ecxia-logo.png | カラーロゴ（ログイン画面等） | 49KB |
| public/ecxia-logo-footer.png | 白ロゴ（サイドバー・ヘッダー） | 6.7KB |

### ブランドカラー

| 名前 | HEX | Tailwindクラス |
|------|-----|----------------|
| Primary | #49b93d | ecxia-green |
| Dark | #3a9430 | ecxia-green-dark |
| Vivid | #50cb43 | ecxia-green-vivid |
| Light | #eef6ed | ecxia-green-light |

---

**このファイルは毎回の作業開始時・終了時に更新してください。**
