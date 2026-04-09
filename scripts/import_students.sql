-- 批量导入学生信息（2026-04-09）
-- 在 Supabase Dashboard → SQL Editor 中执行
-- 使用 ON CONFLICT 避免重复插入，有则更新

INSERT INTO students (name, student_id, enrollment_year, degree_type, research_direction, expected_graduation, advisor, status)
VALUES
  ('王凯',           '2220003', 2022, '博士', '人工林土壤养分、物理性质和微生物研究',                                                                                                                                    '2026', '席本野', '在读'),
  ('孔鑫',           '2220041', 2022, '博士', '气候变化对杨树人工林生理生态机制影响研究',                                                                                                                                '2026', '席本野', '在读'),
  ('赵小宁',         '2230037', 2023, '博士', '人工林耗水精准估算研究',                                                                                                                                                  '2027', '席本野', '在读'),
  ('杨文涵',         '2230005', 2021, '博士', '人工林土壤干层发育动态及其与林木互馈',                                                                                                                                    '2027', '席本野', '在读'),
  ('王傲宇',         '2240083', 2024, '博士', '树木生长动态和水分关系及环境调控机制研究',                                                                                                                                '2028', '席本野', '在读'),
  ('李玲雅',         '2240165', 2024, '博士', '根系结构与功能，杨树菌根',                                                                                                                                                '2028', '席本野', '在读'),
  ('郑泥',           '1250915', 2025, '硕士', '树木健康机制检测和预警研究',                                                                                                                                              '2029', '席本野', '在读'),
  ('毕思圣',         '1250895', 2025, '硕士', '林木水分利用策略与机制研究',                                                                                                                                              '2029', '席本野', '在读'),
  ('胡杨阳',         '2250152', 2023, '博士', '杨树人工林碳水通量模拟',                                                                                                                                                  '2029', '席本野', '在读'),
  ('海格(Fulgence)', '2230509', 2023, '博士', 'Integrating Global Synthesis and Empirical Data: Effects of Silvicultural Practices on Timber Quality Across Forest Types and within Poplar Species Plantation.', '2027', '席本野', '在读'),
  ('西恩（Jean)',    '2250614', 2025, '博士', 'Effects of Environmental Water Change on Carbon Sequestration of Poplar Plantations and Its Underlying Mechanisms in the North China Plain',                        '2029', '席本野', '在读'),
  ('萨伊德(Hussain)','2210408', 2021, '博士', 'urban forestry cultivation and climate smart ecosystem services management',                                                                                           '2026', '席本野', '在读'),
  ('焦玉章',         '7230082', 2023, '硕士', '减雨对不同杨树品种根系形态特征和生物量分配的影响',                                                                                                                        '2026', '席本野', '在读'),
  ('林樱',           '7230093', 2023, '硕士', '蒸发驱动型水力再分配机制的验证与完善',                                                                                                                                    '2026', '席本野', '在读'),
  ('缪腾飞',         '3240040', 2024, '硕士', '土壤干层恢复措施',                                                                                                                                                        '2027', '席本野', '在读'),
  ('袁梦',           '7240063', 2024, '硕士', '毛白杨液流的干旱胁迫预警',                                                                                                                                                '2027', '席本野', '在读'),
  ('赵欣怡',         '7240058', 2024, '硕士', '基于毛白杨茎干直径微变化的干旱预警及响应',                                                                                                                                '2027', '席本野', '在读'),
  ('符国斌',         '3250033', 2025, '硕士', '林业智能灌溉系统',                                                                                                                                                        '2028', '席本野', '在读'),
  ('吴俊蓉',         '7250047', 2025, '硕士', '包裹式液流传感器应用',                                                                                                                                                    '2028', '席本野', '在读'),
  ('李涵',           '7250123', 2025, '硕士', '不同灌溉林分生长及蒸腾对根区水分的动态定量响应及其变化机制',                                                                                                              '2028', '席本野', '在读'),
  ('安珊',           '3250041', 2025, '硕士', '不同区域EDHR的发生特征和差异',                                                                                                                                            '2028', '席本野', '在读')
ON CONFLICT (student_id) DO UPDATE SET
  name               = EXCLUDED.name,
  enrollment_year    = EXCLUDED.enrollment_year,
  degree_type        = EXCLUDED.degree_type,
  research_direction = EXCLUDED.research_direction,
  expected_graduation= EXCLUDED.expected_graduation,
  advisor            = EXCLUDED.advisor,
  updated_at         = NOW();

-- 验证结果
SELECT name, student_id, degree_type, enrollment_year, expected_graduation FROM students ORDER BY enrollment_year, student_id;
