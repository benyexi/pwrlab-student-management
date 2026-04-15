-- ============================================================
-- 高唐主站点数据库表 (10张)
-- 执行前提：已有 profiles 表，is_admin() 函数已存在
-- 执行方式：Supabase SQL Editor → 粘贴全文 → Run
-- ============================================================

-- Helper：判断是否为 admin（如已存在可忽略）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ──────────────────────────────────────────────────────────────
-- 1. gaotang_stands  林分基本信息
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_stands (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_id        TEXT NOT NULL UNIQUE,           -- 林分编号 1-10
  stand_name      TEXT NOT NULL,                  -- 林分名称
  area_ha         NUMERIC(8,2),                   -- 面积(ha)
  tree_species    TEXT,                           -- 树种
  plant_year      INTEGER,                        -- 种植年份
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_stands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_stands"    ON gaotang_stands FOR ALL USING (is_admin());
CREATE POLICY "student_read_stands" ON gaotang_stands FOR SELECT USING (auth.uid() IS NOT NULL);

-- ──────────────────────────────────────────────────────────────
-- 2. gaotang_forest_mgmt  林地管理
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_forest_mgmt (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL,
  op_type         TEXT NOT NULL CHECK (op_type IN ('灌溉','修枝','施肥','除草','打药','其他')),
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,
  water_meter     NUMERIC(10,2),                  -- 水表读数(仅灌溉)
  operator        TEXT NOT NULL,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_forest_mgmt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_fmgmt"   ON gaotang_forest_mgmt FOR ALL USING (is_admin());
CREATE POLICY "student_read_fmgmt" ON gaotang_forest_mgmt FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_fmgmt" ON gaotang_forest_mgmt FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_fmgmt" ON gaotang_forest_mgmt FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 3. gaotang_soil_moisture  土壤水分
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_soil_moisture (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL,
  record_type     TEXT NOT NULL CHECK (record_type IN ('手动TRIME','FDR自动','仪器维护')),
  record_date     DATE NOT NULL,
  operator        TEXT NOT NULL,
  -- 手动TRIME / FDR自动
  location        TEXT,                           -- 测定点位 / 数据时间范围
  jianguoyun_path TEXT,                           -- 坚果云路径
  -- 仪器维护
  maintenance_type TEXT CHECK (maintenance_type IN ('日常','故障')),
  instrument_name  TEXT,
  description      TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_soil_moisture ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_sm"     ON gaotang_soil_moisture FOR ALL USING (is_admin());
CREATE POLICY "student_read_sm"  ON gaotang_soil_moisture FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_sm" ON gaotang_soil_moisture FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_sm" ON gaotang_soil_moisture FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 4. gaotang_sapflow  树干液流
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_sapflow (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL,
  record_type     TEXT NOT NULL CHECK (record_type IN ('探针安装','数据采集','仪器维护')),
  record_date     DATE NOT NULL,
  operator        TEXT NOT NULL,
  -- 探针安装
  probe_id        TEXT,                           -- 探针编号
  direction       TEXT CHECK (direction IN ('N','S','E','W')),
  install_height_cm NUMERIC(8,2),
  install_diameter_mm NUMERIC(8,2),
  tree_id         TEXT,                           -- 样树编号
  dbh_cm          NUMERIC(8,2),                   -- 胸径
  tree_height_m   NUMERIC(8,2),
  crown_width_m   NUMERIC(8,2),
  branch_height_m NUMERIC(8,2),                   -- 枝下高
  -- 数据采集
  time_range      TEXT,
  jianguoyun_path TEXT,
  -- 仪器维护
  maintenance_type TEXT CHECK (maintenance_type IN ('日常','故障')),
  description     TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_sapflow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_sf"     ON gaotang_sapflow FOR ALL USING (is_admin());
CREATE POLICY "student_read_sf"  ON gaotang_sapflow FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_sf" ON gaotang_sapflow FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_sf" ON gaotang_sapflow FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 5. gaotang_tree_growth  树木生长
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_tree_growth (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL,
  record_type     TEXT NOT NULL CHECK (record_type IN ('每木检尺','茎干传感器安装','茎干传感器数采','茎干传感器维护')),
  record_date     DATE NOT NULL,
  operator        TEXT NOT NULL,
  -- 每木检尺
  tree_id         TEXT,
  dbh_cm          NUMERIC(8,2),
  tree_height_m   NUMERIC(8,2),
  branch_height_m NUMERIC(8,2),
  crown_width_m   NUMERIC(8,2),
  -- 茎干传感器（复用 sapflow 字段）
  probe_id        TEXT,
  direction       TEXT CHECK (direction IN ('N','S','E','W','',NULL)),
  install_height_cm NUMERIC(8,2),
  install_diameter_mm NUMERIC(8,2),
  time_range      TEXT,
  jianguoyun_path TEXT,
  maintenance_type TEXT CHECK (maintenance_type IN ('日常','故障',NULL)),
  description     TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_tree_growth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_tg"     ON gaotang_tree_growth FOR ALL USING (is_admin());
CREATE POLICY "student_read_tg"  ON gaotang_tree_growth FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_tg" ON gaotang_tree_growth FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_tg" ON gaotang_tree_growth FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 6. gaotang_meteo  气象与地下水
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_meteo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL DEFAULT '全站',
  record_type     TEXT NOT NULL CHECK (record_type IN ('气象站采集','气象站维护','手动地下水位')),
  record_date     DATE NOT NULL,
  operator        TEXT NOT NULL,
  -- 气象站采集
  time_range      TEXT,
  jianguoyun_path TEXT,
  -- 气象站维护
  description     TEXT,
  -- 手动地下水位
  measurement_point TEXT,
  water_level_m   NUMERIC(8,3),
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_meteo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_meteo"     ON gaotang_meteo FOR ALL USING (is_admin());
CREATE POLICY "student_read_meteo"  ON gaotang_meteo FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_meteo" ON gaotang_meteo FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_meteo" ON gaotang_meteo FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 7. gaotang_experiment  实验设计
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_experiment (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL,
  treatment_count INTEGER,                        -- 处理数
  replicate_count INTEGER,                        -- 重复数
  treatment_id    TEXT,                           -- 处理编号
  treatment_name  TEXT,                           -- 处理名称
  measures        TEXT,                           -- 具体措施
  design_image_path TEXT,                         -- 设计图片（坚果云路径或Storage路径）
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_experiment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_exp"     ON gaotang_experiment FOR ALL USING (is_admin());
CREATE POLICY "student_read_exp"  ON gaotang_experiment FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_exp" ON gaotang_experiment FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_exp" ON gaotang_experiment FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 8. gaotang_roots  根系数据
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_roots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL,
  measure_type    TEXT NOT NULL CHECK (measure_type IN ('微根管','土钻挖根')),
  measure_date    DATE NOT NULL,
  operator        TEXT NOT NULL,
  indicator       TEXT,  -- 根长密度/根生物量/根直径等
  jianguoyun_path TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_roots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_roots"     ON gaotang_roots FOR ALL USING (is_admin());
CREATE POLICY "student_read_roots"  ON gaotang_roots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_roots" ON gaotang_roots FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_roots" ON gaotang_roots FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 9. gaotang_photosynthesis  光合生理
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_photosynthesis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL,
  measure_date    DATE NOT NULL,
  operator        TEXT NOT NULL,
  instrument      TEXT,                           -- 测定仪器
  indicator       TEXT,                           -- 净光合/气孔导度/蒸腾/WUE等
  measure_condition TEXT,                         -- 测定条件
  jianguoyun_path TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_photosynthesis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_photo"     ON gaotang_photosynthesis FOR ALL USING (is_admin());
CREATE POLICY "student_read_photo"  ON gaotang_photosynthesis FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_photo" ON gaotang_photosynthesis FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_photo" ON gaotang_photosynthesis FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 10. gaotang_hydraulics  植物水力性状
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gaotang_hydraulics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stand_name      TEXT NOT NULL,
  measure_date    DATE NOT NULL,
  operator        TEXT NOT NULL,
  organ_type      TEXT CHECK (organ_type IN ('根系','枝条','叶片')),
  indicator       TEXT,                           -- 导水率/P50/P88/TLP等
  measure_method  TEXT,                           -- 测定方法
  jianguoyun_path TEXT,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE gaotang_hydraulics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_hyd"     ON gaotang_hydraulics FOR ALL USING (is_admin());
CREATE POLICY "student_read_hyd"  ON gaotang_hydraulics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "student_insert_hyd" ON gaotang_hydraulics FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "student_update_hyd" ON gaotang_hydraulics FOR UPDATE USING (created_by = auth.uid());

-- ──────────────────────────────────────────────────────────────
-- 初始化10个林分数据
-- ──────────────────────────────────────────────────────────────
INSERT INTO gaotang_stands (stand_id, stand_name) VALUES
  ('GT01', '灌溉管理试验林'),
  ('GT02', '水肥耦合与间伐试验林'),
  ('GT03', '除草试验林'),
  ('GT04', '抹芽试验林'),
  ('GT05', '修枝试验林'),
  ('GT06', '结构调控与水分调控试验林'),
  ('GT07', '减雨控制试验林'),
  ('GT08', '纸浆林经营示范林'),
  ('GT09', '大径材林经营示范林'),
  ('GT10', '多树种灌溉响应试验林')
ON CONFLICT (stand_id) DO NOTHING;
