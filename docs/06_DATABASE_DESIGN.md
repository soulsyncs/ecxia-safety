# 06. データベース設計

**最終更新：2026年2月12日（3-AIコンセンサス反映 v2）**

---

## 1. 設計原則

### 1.1 必須ルール

| # | ルール | 理由 |
|---|--------|------|
| 1 | 全テーブルに`organization_id`を追加 | マルチテナント分離 |
| 2 | 全テーブルにRLSを設定 | セキュリティ |
| 3 | 全テーブルに`id`, `created_at`, `updated_at`を追加 | 追跡可能性 |
| 4 | 外部キー制約を必ず設定 | データ整合性 |
| 5 | ENUM型は使わずTEXT + CHECK制約 | 変更容易性 |
| 6 | 日時は全てTIMESTAMPTZ（タイムゾーン付き） | タイムゾーン対応 |
| 7 | 法定項目はNOT NULL制約 | 法令準拠（空欄を許さない） |
| 8 | 報告テーブルのdriver_id/vehicle_idは複合FKでorganization_id整合を保証 | クロステナント汚染防止 |
| 9 | 条件必須フィールドはCHECK制約でDBレベルで強制 | 法令準拠のDB担保 |

### 1.2 命名規則

| 対象 | 規則 | 例 |
|-----|------|-----|
| テーブル名 | snake_case | `pre_work_reports` |
| カラム名 | snake_case | `organization_id` |
| 主キー | `id` | `id UUID PRIMARY KEY` |
| 外部キー | `[参照テーブル単数形]_id` | `driver_id`, `vehicle_id` |
| インデックス | `idx_[テーブル]_[カラム]` | `idx_drivers_organization_id` |
| チェック制約 | `chk_[テーブル]_[条件]` | `chk_drivers_status_valid` |

---

## 2. ER図

```
┌──────────────────────────────────────────────────────────────────────┐
│                           organizations                                │
│                                │                                       │
│         ┌──────────────────────┼─────────────────────┐                 │
│         │                      │                     │                 │
│    admin_users              drivers               vehicles             │
│                                │                                       │
│         ┌──────────────────────┼─────────────────────┐                 │
│         │                      │                     │                 │
│  pre_work_reports      post_work_reports      daily_inspections        │
│                                │                                       │
│                       accident_reports ── accident_photos               │
│                                │                                       │
│                  ┌─────────────┼──────────────┐                        │
│                  │             │              │                        │
│    driver_guidance_records  aptitude_tests  safety_manager_trainings   │
│                                                                        │
│    line_broadcasts ── line_broadcast_targets                            │
│                                                                        │
│    event_logs                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. テーブル詳細定義（17テーブル）

### 3.1 organizations（組織）

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                          -- 組織名
  postal_code TEXT,                            -- 郵便番号
  address TEXT,                                -- 住所
  phone TEXT,                                  -- 電話番号
  safety_manager_name TEXT,                    -- 貨物軽自動車安全管理者氏名
  safety_manager_birthdate DATE,               -- 安全管理者生年月日
  safety_manager_appointed_at DATE,            -- 安全管理者選任日
  safety_manager_training_completed_at DATE,   -- 講習修了日
  line_channel_id TEXT,                        -- LINE Channel ID
  line_channel_secret TEXT,                    -- LINE Channel Secret（Supabase Vault）
  line_channel_access_token TEXT,              -- LINE Channel Access Token（Supabase Vault）
  liff_id TEXT,                                -- テナント固有のLIFF ID
  settings JSONB NOT NULL DEFAULT '{}',        -- 各種設定（通知時刻等）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**備考：**
- 安全管理者情報は法令（貨物軽自動車安全管理者の選任・届出）で必要
- LINE認証情報はSupabase Vaultで暗号化管理、Edge Function(service_role)のみアクセス可
- `liff_id`はテナント別LIFF管理に使用

---

### 3.2 admin_users（管理者ユーザー）

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager'
    CHECK (role IN ('org_admin', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_users_organization_id ON admin_users(organization_id);
```

---

### 3.3 drivers（ドライバー）

```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  line_user_id TEXT,                           -- LINE User ID（友だち追加時に取得）
  name TEXT NOT NULL,                          -- 氏名
  name_kana TEXT,                              -- フリガナ
  phone TEXT,                                  -- 電話番号
  date_of_birth DATE,                          -- 生年月日
  hire_date DATE,                              -- 入社日
  license_number TEXT,                         -- 免許証番号
  license_expiry DATE,                         -- 免許有効期限
  health_check_date DATE,                      -- 直近の健康診断日
  is_senior BOOLEAN NOT NULL DEFAULT false,    -- 高齢者（65歳以上）フラグ
  is_new_hire BOOLEAN NOT NULL DEFAULT false,  -- 初任運転者フラグ
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended')),
  default_vehicle_id UUID REFERENCES vehicles(id),
  registration_token TEXT,                     -- LINE自動紐付け用トークン（一時的）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- クロステナント防止用の複合一意制約
  UNIQUE (id, organization_id)
);

CREATE INDEX idx_drivers_organization_id ON drivers(organization_id);
CREATE UNIQUE INDEX idx_drivers_line_user_id ON drivers(organization_id, line_user_id) WHERE line_user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_drivers_registration_token ON drivers(registration_token) WHERE registration_token IS NOT NULL;
```

**備考：**
- `UNIQUE (id, organization_id)` により、報告テーブルからの複合FK参照が可能
- `registration_token` はLINE自動紐付け用の一時トークン（使用後にNULLにする）
- 適性診断・特別指導の記録は`aptitude_tests`・`driver_guidance_records`テーブルで管理

---

### 3.4 vehicles（車両）

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,                  -- ナンバープレート（例：品川500あ1234）
  maker TEXT,                                  -- メーカー（例：ダイハツ）
  model TEXT,                                  -- 車種（例：ハイゼット）
  year INTEGER,                                -- 年式
  vehicle_inspection_date DATE,                -- 車検有効期限
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'maintenance', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- クロステナント防止用の複合一意制約
  UNIQUE (id, organization_id)
);

CREATE INDEX idx_vehicles_organization_id ON vehicles(organization_id);
CREATE UNIQUE INDEX idx_vehicles_plate ON vehicles(organization_id, plate_number);
```

---

### 3.5 pre_work_reports（業務前報告 - 点呼：乗務前）

```sql
CREATE TABLE pre_work_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  report_date DATE NOT NULL,

  -- ■ 法定：業務記録
  clock_in_at TIMESTAMPTZ NOT NULL,            -- 出勤日時（ボタンタップで自動記録）
  start_location TEXT NOT NULL,                -- 業務開始地点
  planned_destinations TEXT NOT NULL,          -- 配送先（予定）

  -- ■ 法定：点呼（乗務前）
  alcohol_check_result TEXT NOT NULL
    CHECK (alcohol_check_result IN ('negative', 'positive')),
  alcohol_check_value NUMERIC(4,3),            -- 測定値（mg/L）
  alcohol_checker_name TEXT NOT NULL,          -- アルコールチェック確認者氏名
  health_condition TEXT NOT NULL
    CHECK (health_condition IN ('good', 'fair', 'poor')),
  health_condition_note TEXT,                  -- 体調詳細（poorの場合必須）
  fatigue_level TEXT NOT NULL
    CHECK (fatigue_level IN ('none', 'mild', 'severe')),
  sleep_hours NUMERIC(3,1),                    -- 睡眠時間

  -- ■ 会社独自
  cargo_count INTEGER,                         -- 荷物積載数

  -- ■ 管理
  submitted_via TEXT NOT NULL DEFAULT 'liff'
    CHECK (submitted_via IN ('liff', 'web', 'manual')),
  expires_at DATE NOT NULL,                    -- 保存期限（report_date + 1年）

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ■ クロステナント防止: 複合FK
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id),
  FOREIGN KEY (vehicle_id, organization_id) REFERENCES vehicles(id, organization_id),

  -- ■ 条件必須: 体調不良時は詳細必須
  CONSTRAINT chk_pre_work_health_note
    CHECK (health_condition != 'poor' OR health_condition_note IS NOT NULL)
);

CREATE INDEX idx_pre_work_reports_org_date ON pre_work_reports(organization_id, report_date);
CREATE INDEX idx_pre_work_reports_driver ON pre_work_reports(driver_id, report_date);
CREATE INDEX idx_pre_work_reports_expires ON pre_work_reports(expires_at);
CREATE UNIQUE INDEX idx_pre_work_reports_unique ON pre_work_reports(driver_id, report_date);
```

**法令対応マッピング：**

| 法定項目 | カラム |
|---------|--------|
| 運転者等の氏名 | driver_id → drivers.name |
| 車両番号（ナンバープレート） | vehicle_id → vehicles.plate_number |
| 業務の開始の日時 | clock_in_at |
| 業務の開始の地点 | start_location |
| 運転者の酒気帯びの有無 | alcohol_check_result, alcohol_check_value |
| 疾病・疲労・睡眠不足の有無 | health_condition, fatigue_level, sleep_hours |

---

### 3.6 post_work_reports（業務後報告 - 点呼：乗務後）

```sql
CREATE TABLE post_work_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  report_date DATE NOT NULL,

  -- ■ 法定：業務記録
  clock_out_at TIMESTAMPTZ NOT NULL,           -- 退勤日時（ボタンタップで自動記録）
  end_location TEXT NOT NULL,                  -- 業務終了地点
  actual_destinations TEXT NOT NULL,           -- 実際の配送先詳細
  distance_km NUMERIC(7,1) NOT NULL,          -- 走行距離（km）
  rest_periods JSONB,                          -- 休憩記録 [{start:"HH:mm",end:"HH:mm",location:"..."}]

  -- ■ 法定：点呼（乗務後）
  alcohol_check_result TEXT NOT NULL
    CHECK (alcohol_check_result IN ('negative', 'positive')),
  alcohol_check_value NUMERIC(4,3),
  alcohol_checker_name TEXT NOT NULL,
  road_condition_note TEXT,                    -- 道路・運行状況の報告

  -- ■ 会社独自
  cargo_delivered_count INTEGER,               -- 配送荷物数

  -- ■ 管理
  submitted_via TEXT NOT NULL DEFAULT 'liff'
    CHECK (submitted_via IN ('liff', 'web', 'manual')),
  expires_at DATE NOT NULL,                    -- 保存期限（report_date + 1年）

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ■ クロステナント防止: 複合FK
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id),
  FOREIGN KEY (vehicle_id, organization_id) REFERENCES vehicles(id, organization_id)
);

CREATE INDEX idx_post_work_reports_org_date ON post_work_reports(organization_id, report_date);
CREATE INDEX idx_post_work_reports_driver ON post_work_reports(driver_id, report_date);
CREATE INDEX idx_post_work_reports_expires ON post_work_reports(expires_at);
CREATE UNIQUE INDEX idx_post_work_reports_unique ON post_work_reports(driver_id, report_date);
```

**法令対応マッピング：**

| 法定項目 | カラム |
|---------|--------|
| 業務の終了の日時 | clock_out_at |
| 業務の終了の地点 | end_location |
| 主な経過地点 | actual_destinations |
| 業務に従事した距離 | distance_km |
| 休憩の日時・地点 | rest_periods（JSONB: start/end/location） |
| 運転者の酒気帯びの有無 | alcohol_check_result, alcohol_check_value |
| 業務に係る道路及び運行の状況 | road_condition_note |

---

### 3.7 daily_inspections（日常点検記録）

```sql
CREATE TABLE daily_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_id UUID NOT NULL,
  inspection_date DATE NOT NULL,

  -- ■ 法定：エンジンルーム（3項目）
  engine_oil BOOLEAN NOT NULL,                 -- エンジンオイル量
  coolant_level BOOLEAN NOT NULL,              -- 冷却水量
  battery BOOLEAN NOT NULL,                    -- バッテリー液量

  -- ■ 法定：ライト類（3項目）
  headlights BOOLEAN NOT NULL,                 -- ヘッドライト
  turn_signals BOOLEAN NOT NULL,               -- ウインカー
  brake_lights BOOLEAN NOT NULL,               -- ブレーキランプ

  -- ■ 法定：タイヤ（3項目）
  tire_pressure BOOLEAN NOT NULL,              -- 空気圧
  tire_tread BOOLEAN NOT NULL,                 -- 溝の深さ
  tire_damage BOOLEAN NOT NULL,                -- 損傷の有無（true=異常なし）

  -- ■ 法定：運転席周り（4項目）
  mirrors BOOLEAN NOT NULL,                    -- ミラー
  seatbelt BOOLEAN NOT NULL,                   -- シートベルト
  brakes BOOLEAN NOT NULL,                     -- ブレーキ
  steering BOOLEAN NOT NULL,                   -- ステアリング

  -- ■ 総合
  all_passed BOOLEAN NOT NULL,                 -- 全項目合格
  abnormality_note TEXT,                       -- 異常箇所の詳細

  -- ■ 管理
  submitted_via TEXT NOT NULL DEFAULT 'liff'
    CHECK (submitted_via IN ('liff', 'web', 'manual')),
  expires_at DATE NOT NULL,                    -- 保存期限（inspection_date + 1年）

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ■ クロステナント防止: 複合FK
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id),
  FOREIGN KEY (vehicle_id, organization_id) REFERENCES vehicles(id, organization_id),

  -- ■ 条件必須: 不合格時は異常詳細必須
  CONSTRAINT chk_inspection_abnormality_note
    CHECK (all_passed = true OR abnormality_note IS NOT NULL)
);

CREATE INDEX idx_daily_inspections_org_date ON daily_inspections(organization_id, inspection_date);
CREATE INDEX idx_daily_inspections_driver ON daily_inspections(driver_id, inspection_date);
CREATE INDEX idx_daily_inspections_expires ON daily_inspections(expires_at);
CREATE UNIQUE INDEX idx_daily_inspections_unique ON daily_inspections(driver_id, inspection_date);
```

**備考：**
- BOOLEAN値は `true` = 正常（OK）、`false` = 異常（要整備）
- `all_passed` は全13項目がtrueの場合のみtrue（アプリ側で自動計算）

---

### 3.8 accident_reports（事故報告）

```sql
CREATE TABLE accident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  vehicle_id UUID,

  -- ■ 法定：事故記録（3年間保存）
  occurred_at TIMESTAMPTZ NOT NULL,            -- 発生日時
  location TEXT NOT NULL,                      -- 発生場所
  summary TEXT NOT NULL,                       -- 事故の概要
  cause TEXT NOT NULL,                         -- 事故の原因
  prevention_measures TEXT NOT NULL,           -- 再発防止対策
  has_injuries BOOLEAN NOT NULL DEFAULT false, -- 負傷者の有無
  injury_details TEXT,                         -- 負傷の詳細

  -- ■ 法定：国土交通大臣への事故報告（重大事故の場合）
  is_serious BOOLEAN NOT NULL DEFAULT false,   -- 重大事故フラグ
  reported_to_mlit BOOLEAN NOT NULL DEFAULT false, -- 国交省報告済みフラグ
  reported_to_mlit_at TIMESTAMPTZ,             -- 報告日時
  mlit_report_deadline DATE,                   -- 国交省報告期限（速報24h / 本報30日）

  -- ■ 管理
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'reviewed')),
  expires_at DATE NOT NULL,                    -- 保存期限（occurred_at + 3年）

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- ■ クロステナント防止: 複合FK
  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id),
  FOREIGN KEY (vehicle_id, organization_id) REFERENCES vehicles(id, organization_id),

  -- ■ 条件必須: 負傷者ありの場合は詳細必須
  CONSTRAINT chk_accident_injury_details
    CHECK (has_injuries = false OR injury_details IS NOT NULL),

  -- ■ 条件必須: 重大事故の場合は報告期限必須
  CONSTRAINT chk_accident_mlit_deadline
    CHECK (is_serious = false OR mlit_report_deadline IS NOT NULL)
);

CREATE INDEX idx_accident_reports_org ON accident_reports(organization_id);
CREATE INDEX idx_accident_reports_driver ON accident_reports(driver_id);
CREATE INDEX idx_accident_reports_expires ON accident_reports(expires_at);
-- 未報告の重大事故を素早く検出
CREATE INDEX idx_accident_reports_mlit_pending
  ON accident_reports(mlit_report_deadline)
  WHERE is_serious = true AND reported_to_mlit = false;
```

**法令対応マッピング：**

| 法定項目 | カラム |
|---------|--------|
| 乗務員等の氏名 | driver_id → drivers.name |
| 事故の発生日時 | occurred_at |
| 事故の発生場所 | location |
| 事故の概要 | summary |
| 事故の原因 | cause |
| 再発防止対策 | prevention_measures |
| 国交省報告期限 | mlit_report_deadline |

---

### 3.9 accident_photos（事故写真）

```sql
CREATE TABLE accident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  accident_report_id UUID NOT NULL REFERENCES accident_reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,                  -- Supabase Storage パス
  mime_type TEXT NOT NULL,                     -- image/jpeg, image/png等
  file_size_bytes INTEGER,                     -- ファイルサイズ
  file_hash TEXT,                              -- SHA-256ハッシュ（改ざん検知）
  uploaded_by TEXT NOT NULL,                   -- アップロード者（driver_id or admin_id）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accident_photos_report ON accident_photos(accident_report_id);
```

**備考：**
- `photo_urls TEXT[]` を廃止し、メタデータ付きの別テーブルに変更
- `file_hash` でファイルの改ざんを検知可能（監査対応）

---

### 3.10 driver_guidance_records（指導監督記録 — 3年保存）

```sql
CREATE TABLE driver_guidance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  guidance_type TEXT NOT NULL
    CHECK (guidance_type IN ('initial', 'accident', 'senior', 'regular')),
  -- initial=初任運転者, accident=事故惹起者, senior=高齢者, regular=一般
  guidance_date DATE NOT NULL,                 -- 実施日
  content TEXT NOT NULL,                       -- 指導内容
  instructor_name TEXT NOT NULL,               -- 指導者氏名
  duration_minutes INTEGER,                    -- 指導時間（分）
  expires_at DATE NOT NULL,                    -- 保存期限（guidance_date + 3年）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id)
);

CREATE INDEX idx_driver_guidance_org ON driver_guidance_records(organization_id);
CREATE INDEX idx_driver_guidance_driver ON driver_guidance_records(driver_id);
CREATE INDEX idx_driver_guidance_expires ON driver_guidance_records(expires_at);
```

**法令根拠：**
- 初任運転者：雇入れ後、乗務開始前に15時間以上の座学+20時間以上の実技指導
- 事故惹起者：事故後に特別指導+適性診断（事故後再発防止）
- 高齢者（65歳以上）：適性診断結果に基づく個別指導

---

### 3.11 aptitude_tests（適性診断記録 — 3年保存）

```sql
CREATE TABLE aptitude_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  test_type TEXT NOT NULL
    CHECK (test_type IN ('initial', 'periodic', 'specific', 'senior')),
  -- initial=初任, periodic=定期, specific=特定(事故後), senior=高齢者
  test_date DATE NOT NULL,                     -- 受診日
  testing_institution TEXT NOT NULL,           -- 受診機関名
  result_summary TEXT,                         -- 結果概要
  next_test_due DATE,                          -- 次回受診期限
  expires_at DATE NOT NULL,                    -- 保存期限（test_date + 3年）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  FOREIGN KEY (driver_id, organization_id) REFERENCES drivers(id, organization_id)
);

CREATE INDEX idx_aptitude_tests_org ON aptitude_tests(organization_id);
CREATE INDEX idx_aptitude_tests_driver ON aptitude_tests(driver_id);
CREATE INDEX idx_aptitude_tests_expires ON aptitude_tests(expires_at);
-- 次回受診期限切れを素早く検出
CREATE INDEX idx_aptitude_tests_due ON aptitude_tests(next_test_due) WHERE next_test_due IS NOT NULL;
```

---

### 3.12 safety_manager_trainings（安全管理者講習記録）

```sql
CREATE TABLE safety_manager_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL
    CHECK (training_type IN ('initial', 'periodic')),
  -- initial=選任時講習, periodic=定期講習
  training_date DATE NOT NULL,                 -- 受講日
  training_institution TEXT NOT NULL,          -- 受講機関名
  certificate_number TEXT,                     -- 修了証番号
  next_training_due DATE,                      -- 次回受講期限
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_safety_trainings_org ON safety_manager_trainings(organization_id);
```

**法令根拠：**
- 貨物軽自動車安全管理者は選任時に講習受講が必要
- 定期的に講習を受講する義務

---

### 3.13 line_broadcasts（LINE一斉配信記録）

```sql
CREATE TABLE line_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sent_by UUID NOT NULL REFERENCES admin_users(id),
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'template')),
  content TEXT NOT NULL,                       -- 配信内容
  target_type TEXT NOT NULL DEFAULT 'all'
    CHECK (target_type IN ('all', 'selected')),
  sent_count INTEGER NOT NULL DEFAULT 0,       -- 送信成功数
  failed_count INTEGER NOT NULL DEFAULT 0,     -- 送信失敗数
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_line_broadcasts_org ON line_broadcasts(organization_id);
```

**備考：**
- `target_driver_ids UUID[]` を廃止し、`line_broadcast_targets` テーブルに分離

---

### 3.14 line_broadcast_targets（配信対象ドライバー）

```sql
CREATE TABLE line_broadcast_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES line_broadcasts(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  error_code TEXT,                             -- 送信失敗時のエラーコード
  sent_at TIMESTAMPTZ,                         -- 個別送信完了日時
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broadcast_targets_broadcast ON line_broadcast_targets(broadcast_id);
CREATE INDEX idx_broadcast_targets_driver ON line_broadcast_targets(driver_id);
```

**備考：**
- 配信結果を個別ドライバー単位で追跡可能（監査対応）
- FK制約が効くため、存在しないドライバーへの配信が防止される

---

### 3.15 event_logs（監査ログ）

```sql
CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL
    CHECK (actor_type IN ('admin', 'driver', 'system')),
  actor_id TEXT NOT NULL,                      -- admin_users.id or drivers.id or 'system'
  action TEXT NOT NULL,                        -- 操作内容（例：'submit_pre_work_report'）
  resource_type TEXT NOT NULL,                 -- 対象テーブル名
  resource_id UUID,                            -- 対象レコードID
  details JSONB,                               -- 操作の詳細（※PIIマスキング必須）
  ip_address INET,                             -- IPアドレス
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- event_logsにはupdated_atは不要（追記のみ、更新不可）
CREATE INDEX idx_event_logs_org ON event_logs(organization_id);
CREATE INDEX idx_event_logs_created ON event_logs(created_at);
CREATE INDEX idx_event_logs_actor ON event_logs(actor_type, actor_id);
```

**備考：**
- event_logsはINSERTのみ（UPDATE/DELETE禁止 → RLSで制御）
- 改ざん防止のため、管理者でも削除不可
- **`details`にPIIを保存しないこと** — 共通関数でマスキング処理を必ず通す

---

## 4. RLSポリシー

### 4.1 基本パターン（管理者用テーブル）

```sql
-- 全テーブル共通
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- 管理者：自組織のデータのみ
CREATE POLICY "org_isolation_[table_name]"
ON [table_name]
FOR ALL
USING (
  organization_id = (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  )
);
```

### 4.2 ドライバー操作テーブル（LIFF経由）

```sql
-- ★ 重要：LIFFはLINE Loginであり、Supabase Authではない
-- ドライバーからの書き込みはクライアント直書き禁止
-- Edge Function(service_role)経由でのみINSERT/UPDATEする
-- RLSはservice_roleでバイパスされるため、Function内でorganization_id整合を検証

-- 管理者による閲覧のみRLSで制御
CREATE POLICY "admin_read_[table_name]"
ON [table_name]
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  )
);
```

### 4.3 event_logs（追記専用）

```sql
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: 管理者のみ自組織のログを閲覧
CREATE POLICY "select_event_logs"
ON event_logs
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM admin_users WHERE id = auth.uid()
  )
);

-- INSERT: Edge Function(service_role)経由のみ
-- クライアントからの直接INSERTは禁止
-- service_roleはRLSをバイパスするため、ポリシーは作成しない

-- UPDATE/DELETE: 誰も不可（改ざん防止）
-- ポリシーを作成しないことで暗黙的に拒否
```

---

## 5. 保存期間管理

### 5.1 自動計算ルール

| テーブル | `expires_at`の計算 |
|---------|-------------------|
| pre_work_reports | `report_date + INTERVAL '1 year'` |
| post_work_reports | `report_date + INTERVAL '1 year'` |
| daily_inspections | `inspection_date + INTERVAL '1 year'` |
| accident_reports | `occurred_at::date + INTERVAL '3 years'` |
| driver_guidance_records | `guidance_date + INTERVAL '3 years'` |
| aptitude_tests | `test_date + INTERVAL '3 years'` |

### 5.2 期限切れデータの処理

```
1. 月次バッチ（Edge Function）で expires_at < 現在日 のデータを検出
2. 管理者にLINE通知：「○件のデータが保存期限を超過しました」
3. 管理者がWeb管理画面でアーカイブ or 継続保存を選択
4. アーカイブ選択 → CSVエクスポート後に削除
※ 自動削除はしない（法令上のリスク回避）
```

### 5.3 外部バックアップ（BCP）

```
1. 週次バッチで全テーブルをJSON形式でエクスポート
2. Google Cloud Storage（Supabaseとは別のストレージ）に保管
3. 90日間保持（世代管理）
4. Supabase障害時でもデータ復旧可能
```

---

## 6. インデックス戦略

### 6.1 必須インデックス

全テーブルの `organization_id` に必ずインデックスを作成（RLSのパフォーマンス確保）。

### 6.2 検索パターン別インデックス

| 検索パターン | インデックス |
|------------|------------|
| ドライバー別・日付別の日報検索 | `(driver_id, report_date)` |
| 組織別・日付別の提出状況確認 | `(organization_id, report_date)` |
| 日付別の一括確認（ダッシュボード） | `(organization_id, report_date)` |
| ドライバーのLINE User ID検索 | `(organization_id, line_user_id)` UNIQUE |
| 車両のナンバープレート検索 | `(organization_id, plate_number)` UNIQUE |
| 保存期限切れデータ検索（月次バッチ） | `(expires_at)` 各報告テーブル |
| 未報告の重大事故検出 | 部分インデックス `WHERE is_serious AND NOT reported_to_mlit` |
| 次回受診期限切れ検出 | `(next_test_due)` WHERE NOT NULL |

### 6.3 ダッシュボード用RPC

```sql
-- N+1クエリ防止: 提出状況を1クエリで集計
CREATE OR REPLACE FUNCTION get_daily_submission_summary(
  p_org_id UUID,
  p_date DATE
) RETURNS JSON AS $$
  SELECT json_build_object(
    'total_drivers', (SELECT COUNT(*) FROM drivers WHERE organization_id = p_org_id AND status = 'active'),
    'pre_work_submitted', (SELECT COUNT(*) FROM pre_work_reports WHERE organization_id = p_org_id AND report_date = p_date),
    'post_work_submitted', (SELECT COUNT(*) FROM post_work_reports WHERE organization_id = p_org_id AND report_date = p_date),
    'inspection_submitted', (SELECT COUNT(*) FROM daily_inspections WHERE organization_id = p_org_id AND inspection_date = p_date),
    'pre_work_missing', (
      SELECT COALESCE(json_agg(d.name), '[]'::json)
      FROM drivers d
      WHERE d.organization_id = p_org_id AND d.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM pre_work_reports p WHERE p.driver_id = d.id AND p.report_date = p_date)
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 7. 初期マイグレーション

マイグレーションファイルは `supabase/migrations/` に以下の順序で作成：

```
20260212000001_create_organizations.sql
20260212000002_create_admin_users.sql
20260212000003_create_vehicles.sql
20260212000004_create_drivers.sql
20260212000005_create_pre_work_reports.sql
20260212000006_create_post_work_reports.sql
20260212000007_create_daily_inspections.sql
20260212000008_create_accident_reports.sql
20260212000009_create_accident_photos.sql
20260212000010_create_driver_guidance_records.sql
20260212000011_create_aptitude_tests.sql
20260212000012_create_safety_manager_trainings.sql
20260212000013_create_line_broadcasts.sql
20260212000014_create_line_broadcast_targets.sql
20260212000015_create_event_logs.sql
20260212000016_enable_rls.sql
20260212000017_create_updated_at_trigger.sql
20260212000018_create_rpc_functions.sql
```

**注意：** vehiclesをdriversの前に作成（drivers.default_vehicle_id が vehicles を参照するため）
