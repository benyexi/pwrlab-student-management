-- ================================================
-- PWRlab Student Management System - Supabase Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ================================================

-- 1. Profiles (用户角色信息，关联 Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students (学生信息)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  student_id TEXT UNIQUE,
  enrollment_year INTEGER,
  degree_type TEXT CHECK (degree_type IN ('硕士', '博士', '博后')),
  research_direction TEXT,
  expected_graduation TEXT,
  status TEXT DEFAULT '在读' CHECK (status IN ('在读', '已毕业', '已离组')),
  advisor TEXT DEFAULT '席本野',
  co_advisor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sites (监测站点)
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name_cn TEXT NOT NULL,
  name_en TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  elevation INTEGER,
  species_cn TEXT,
  species_en TEXT,
  established_year INTEGER,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Weather Records (天气记录)
CREATE TABLE IF NOT EXISTS weather_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT REFERENCES sites(id),
  date DATE NOT NULL,
  temperature DOUBLE PRECISION,
  temperature_min DOUBLE PRECISION,
  temperature_max DOUBLE PRECISION,
  rainfall DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  wind_speed DOUBLE PRECISION,
  weather_desc TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('auto', 'manual')),
  recorded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Field Observations (野外观测数据)
CREATE TABLE IF NOT EXISTS field_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id TEXT REFERENCES sites(id),
  student_name TEXT,
  date DATE NOT NULL,
  data_type TEXT CHECK (data_type IN ('soil_moisture', 'sap_flow', 'growth', 'irrigation', 'phenology', 'other')),
  value DOUBLE PRECISION,
  unit TEXT,
  dbh DOUBLE PRECISION,
  tree_height DOUBLE PRECISION,
  irrigation_amount DOUBLE PRECISION,
  phenology_stage TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Projects (研究课题)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  student_id TEXT,
  student_name TEXT,
  stage TEXT DEFAULT '选题' CHECK (stage IN ('选题', '文献综述', '实验设计', '数据采集', '数据分析', '论文写作', '投稿', '审稿修改', '接收/发表')),
  start_date DATE,
  expected_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Papers (论文)
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  authors TEXT,
  journal TEXT,
  journal_partition TEXT,
  corresponding_author TEXT,
  status TEXT DEFAULT '在写' CHECK (status IN ('在写', '投稿中', '审稿中', '修改中', '已接收', '已发表')),
  student_name TEXT,
  submit_date DATE,
  accept_date DATE,
  publish_date DATE,
  doi TEXT,
  impact_factor DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Paper Timeline (论文时间线)
CREATE TABLE IF NOT EXISTS paper_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Reports (周报/月报)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT,
  student_name TEXT,
  week_start DATE,
  week_end DATE,
  content TEXT,
  advisor_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Milestones (毕业节点)
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT,
  student_name TEXT,
  type TEXT CHECK (type IN ('开题', '中期', '预答辩', '答辩', '论文提交')),
  planned_date DATE,
  actual_date DATE,
  status TEXT DEFAULT '未开始' CHECK (status IN ('未开始', '进行中', '已完成')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Instruments (仪器设备)
CREATE TABLE IF NOT EXISTS instruments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  model TEXT,
  status TEXT DEFAULT '可用' CHECK (status IN ('可用', '使用中', '维修中', '报废')),
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Reservations (预约)
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id UUID REFERENCES instruments(id),
  instrument_name TEXT,
  student_id TEXT,
  student_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT '待审批' CHECK (status IN ('待审批', '已批准', '已拒绝', '已完成', '已取消')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Files (文件上传记录)
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  site_id TEXT,
  student_name TEXT,
  upload_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 插入22个CP-GPE监测站点初始数据
-- ================================================
INSERT INTO sites (id, name_cn, name_en, latitude, longitude, elevation, species_cn, species_en, established_year, region) VALUES
  ('s01', '美国爱达荷', 'Idaho, USA', 46.73, -116.78, 800, '毛果杨', 'Populus trichocarpa', 2019, 'International'),
  ('s02', '河南温县', 'Wen County, Henan', 34.90, 113.14, 110, '欧美杨', 'Populus × euramericana', 2012, 'Central China'),
  ('s03', '河北威县', 'Wei County, Hebei', 37.06, 115.27, 35, '欧美杨', 'Populus × euramericana', 2013, 'North China'),
  ('s04', '宁夏中卫', 'Zhongwei, Ningxia', 37.35, 105.50, 1250, '小叶杨', 'Populus simonii', 2016, 'Northwest'),
  ('s05', '青海西宁', 'Xining, Qinghai', 36.68, 101.62, 2260, '青杨', 'Populus cathayana', 2018, 'Northwest'),
  ('s06', '甘肃张掖', 'Zhangye, Gansu', 38.93, 100.58, 1480, '甘肃杨', 'Populus gansuensis', 2015, 'Northwest'),
  ('s07', '陕西杨凌', 'Yangling, Shaanxi', 34.19, 108.28, 520, '毛白杨', 'Populus × tomentosa', 2014, 'Northwest'),
  ('s08', '山东莘县', 'Shenxian, Shandong', 36.32, 115.50, 40, '欧美杨', 'Populus × euramericana', 2013, 'North China'),
  ('s09', '山东利津', 'Lijin, Shandong', 37.58, 118.29, 8, '欧美杨', 'Populus × euramericana', 2014, 'North China'),
  ('s10', '甘肃天水', 'Tianshui, Gansu', 34.55, 105.91, 1100, '毛白杨', 'Populus × tomentosa', 2017, 'Northwest'),
  ('s11', '山西祁县', 'Qi County, Shanxi', 37.26, 112.42, 780, '毛白杨', 'Populus × tomentosa', 2015, 'North China'),
  ('s12', '山东高唐', 'Gaotang, Shandong', 36.81, 116.10, 30, '欧美杨', 'Populus × euramericana', 2012, 'North China'),
  ('s13', '北京通州', 'Tongzhou, Beijing', 39.73, 116.75, 25, '毛白杨', 'Populus × tomentosa', 2010, 'North China'),
  ('s14', '辽宁新民', 'Xinmin, Liaoning', 42.01, 122.75, 45, '小黑杨', 'Populus × xiaohei', 2016, 'Northeast'),
  ('s15', '黑龙江齐齐哈尔', 'Qiqihar, Heilongjiang', 47.58, 124.22, 150, '小叶杨×黑杨', 'Populus simonii × P. nigra', 2017, 'Northeast'),
  ('s16', '吉林白城', 'Baicheng, Jilin', 45.81, 122.84, 160, '小钻杨', 'Populus × xiaozhannica', 2018, 'Northeast'),
  ('s17', '河南南阳', 'Nanyang, Henan', 33.05, 112.62, 130, '欧美杨', 'Populus × euramericana', 2019, 'Central China'),
  ('s18', '内蒙古达拉特', 'Dalate, Inner Mongolia', 40.37, 109.85, 1020, '小叶杨', 'Populus simonii', 2020, 'North China'),
  ('s19', '内蒙古磴口', 'Dengkou, Inner Mongolia', 40.48, 106.77, 1050, '甘肃杨', 'Populus × gansuensis', 2019, 'Northwest'),
  ('s20', '江苏宿迁', 'Suqian, Jiangsu', 33.33, 118.31, 20, '欧美杨', 'Populus × euramericana', 2020, 'Central China'),
  ('s21', '新疆伊犁', 'Ili, Xinjiang', 43.99, 80.84, 680, '胡杨', 'Populus euphratica', 2021, 'Northwest'),
  ('s22', '河南济源', 'Jiyuan, Henan', 35.04, 112.45, 250, '毛白杨', 'Populus × tomentosa', 2022, 'Central China')
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- Row Level Security (RLS) 策略
-- ================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 允许已登录用户读取所有数据
CREATE POLICY "Authenticated users can read all" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON sites FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON weather_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON field_observations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON papers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON paper_timeline FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON milestones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON instruments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON reservations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read all" ON files FOR SELECT USING (auth.role() = 'authenticated');

-- 允许已登录用户写入数据
CREATE POLICY "Authenticated users can insert" ON students FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON students FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON students FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert" ON weather_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON field_observations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON projects FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON papers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON papers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON papers FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON paper_timeline FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON reports FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON reports FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON milestones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON milestones FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON reservations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON reservations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON files FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated users can update own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 允许匿名访问站点数据（公开数据）
CREATE POLICY "Anyone can read sites" ON sites FOR SELECT USING (true);
