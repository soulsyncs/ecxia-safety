-- ECXIA Safety Management System - 初期データ投入
-- 使用方法: supabase db reset (seed.sql自動実行) or psql -f seed.sql

-- 1. 組織
INSERT INTO organizations (id, name, postal_code, address, phone, safety_manager_name)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '株式会社ECXIA',
  '272-0023',
  '千葉県市川市南八幡5-10-1 ピエール本八幡502',
  '047-702-8267',
  '管理者'
) ON CONFLICT (id) DO NOTHING;

-- 2. 管理者ユーザー
-- NOTE: idはSupabase Auth作成後に実際のUIDに更新する必要がある
-- 現在のAuth UID: 4dda33e6-d7a0-4c7f-a441-e5ed9f2eea63
INSERT INTO admin_users (id, organization_id, email, name, role)
VALUES (
  '4dda33e6-d7a0-4c7f-a441-e5ed9f2eea63',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'admin@ecxia.co.jp',
  '管理者',
  'org_admin'
) ON CONFLICT (id) DO NOTHING;

-- 3. ドライバー（3名）
INSERT INTO drivers (id, organization_id, name, name_kana, phone, status, is_senior, is_new_hire) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '佐藤 太郎', 'サトウ タロウ', '090-1234-5678', 'active', false, false),
  ('d0000002-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '鈴木 花子', 'スズキ ハナコ', '090-2345-6789', 'active', false, true),
  ('d0000003-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '田中 一郎', 'タナカ イチロウ', '090-3456-7890', 'active', true, false)
ON CONFLICT (id) DO NOTHING;

-- 4. 車両（5台）— UUIDは16進数のみ（a-f, 0-9）
INSERT INTO vehicles (id, organization_id, plate_number, maker, model, year, status) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '千葉 480 あ 1234', 'ダイハツ', 'ハイゼットカーゴ', 2023, 'active'),
  ('a0000002-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '千葉 480 い 5678', 'スズキ', 'エブリイ', 2022, 'active'),
  ('a0000003-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '千葉 480 う 9012', 'ホンダ', 'N-VAN', 2024, 'active'),
  ('a0000004-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '千葉 480 え 3456', 'ダイハツ', 'ハイゼットカーゴ', 2021, 'maintenance'),
  ('a0000005-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '千葉 480 お 7890', 'スズキ', 'エブリイ', 2020, 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. デフォルト車両の紐付け
UPDATE drivers SET default_vehicle_id = 'a0000001-0000-0000-0000-000000000001' WHERE id = 'd0000001-0000-0000-0000-000000000001';
UPDATE drivers SET default_vehicle_id = 'a0000002-0000-0000-0000-000000000002' WHERE id = 'd0000002-0000-0000-0000-000000000002';
UPDATE drivers SET default_vehicle_id = 'a0000003-0000-0000-0000-000000000003' WHERE id = 'd0000003-0000-0000-0000-000000000003';
