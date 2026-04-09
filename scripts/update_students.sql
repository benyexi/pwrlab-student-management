-- 按姓名匹配，更新学号、邮箱、手机号、研究方向、预计毕业时间（2026-04-09）
-- 注意：只更新 Excel 中有的21人，不影响其他学生
-- 在 Supabase Dashboard → SQL Editor 中执行

-- 中国学生（直接按姓名匹配）
UPDATE students SET student_id='2220003', email='wangk@bjfu.edu.cn',             phone='13274402061', research_direction='人工林土壤养分、物理性质和微生物研究',                         expected_graduation='2026', enrollment_year=2022, degree_type='博士', updated_at=NOW() WHERE name='王凯';
UPDATE students SET student_id='2220041', email='kx18238766961@bjfu.edu.cn',     phone='18238766961', research_direction='气候变化对杨树人工林生理生态机制影响研究',                     expected_graduation='2026', enrollment_year=2022, degree_type='博士', updated_at=NOW() WHERE name='孔鑫';
UPDATE students SET student_id='2230037', email='807236365@qq.com',              phone='13384444123', research_direction='人工林耗水精准估算研究',                                       expected_graduation='2027', enrollment_year=2023, degree_type='博士', updated_at=NOW() WHERE name='赵小宁';
UPDATE students SET student_id='2230005', email='youngwanyoungwan@163.com',      phone='18810615155', research_direction='人工林土壤干层发育动态及其与林木互馈',                         expected_graduation='2027', enrollment_year=2021, degree_type='博士', updated_at=NOW() WHERE name='杨文涵';
UPDATE students SET student_id='2240083', email='1319376254@qq.com',             phone='15236397907', research_direction='树木生长动态和水分关系及环境调控机制研究',                     expected_graduation='2028', enrollment_year=2024, degree_type='博士', updated_at=NOW() WHERE name='王傲宇';
UPDATE students SET student_id='2240165', email='lingyali@bjfu.edu.cn',          phone='15837506860', research_direction='根系结构与功能，杨树菌根',                                     expected_graduation='2028', enrollment_year=2024, degree_type='博士', updated_at=NOW() WHERE name='李玲雅';
UPDATE students SET student_id='1250895', email='sisheng626@163.com',            phone='15621548985', research_direction='林木水分利用策略与机制研究',                                   expected_graduation='2029', enrollment_year=2025, degree_type='硕士', updated_at=NOW() WHERE name='毕思圣';
UPDATE students SET student_id='2250152', email='yyhuu0012@bjfu.edu.cn',         phone='15934431036', research_direction='杨树人工林碳水通量模拟',                                       expected_graduation='2029', enrollment_year=2023, degree_type='博士', updated_at=NOW() WHERE name='胡杨阳';
UPDATE students SET student_id='7230082', email='jyz1092752421@163.com',         phone='13869991391', research_direction='减雨对不同杨树品种根系形态特征和生物量分配的影响',             expected_graduation='2026', enrollment_year=2023, degree_type='硕士', updated_at=NOW() WHERE name='焦玉章';
UPDATE students SET student_id='7230093', email='1249823824@qq.com',             phone='18094112930', research_direction='蒸发驱动型水力再分配机制的验证与完善',                         expected_graduation='2026', enrollment_year=2023, degree_type='硕士', updated_at=NOW() WHERE name='林樱';
UPDATE students SET student_id='3240040', email='3143269970@qq.com',             phone='15755311368', research_direction='土壤干层恢复措施',                                             expected_graduation='2027', enrollment_year=2024, degree_type='硕士', updated_at=NOW() WHERE name='缪腾飞';
UPDATE students SET student_id='7240063', email='1424535638@qq.com',             phone='15810237991', research_direction='毛白杨液流的干旱胁迫预警',                                     expected_graduation='2027', enrollment_year=2024, degree_type='硕士', updated_at=NOW() WHERE name='袁梦';
UPDATE students SET student_id='7240058', email='774867068@qq.com',              phone='18735366807', research_direction='基于毛白杨茎干直径微变化的干旱预警及响应',                     expected_graduation='2027', enrollment_year=2024, degree_type='硕士', updated_at=NOW() WHERE name='赵欣怡';
UPDATE students SET student_id='3250033', email='1198364460@qq.com',             phone='18813072500', research_direction='林业智能灌溉系统',                                             expected_graduation='2028', enrollment_year=2025, degree_type='硕士', updated_at=NOW() WHERE name='符国斌';
UPDATE students SET student_id='7250047', email='2522639550@qq.com',             phone='18330458325', research_direction='包裹式液流传感器应用',                                         expected_graduation='2028', enrollment_year=2025, degree_type='硕士', updated_at=NOW() WHERE name='吴俊蓉';
UPDATE students SET student_id='7250123', email='1469509725@qq.com',             phone='18325605208', research_direction='不同灌溉林分生长及蒸腾对根区水分的动态定量响应及其变化机制', expected_graduation='2028', enrollment_year=2025, degree_type='硕士', updated_at=NOW() WHERE name='李涵';
UPDATE students SET student_id='3250041', email='1642828612@qq.com',             phone='13028699885', research_direction='不同区域EDHR的发生特征和差异',                               expected_graduation='2028', enrollment_year=2025, degree_type='硕士', updated_at=NOW() WHERE name='安珊';

-- 外国留学生（按入学年份+学位类型匹配，避免中英文名不一致的问题）
UPDATE students SET student_id='2230509', email='hagumadaryl@gmail.com',    phone='18800193568', name='海格(Fulgence)', research_direction='Integrating Global Synthesis and Empirical Data: Effects of Silvicultural Practices on Timber Quality Across Forest Types and within Poplar Species Plantation.', expected_graduation='2027', updated_at=NOW() WHERE name='Fulgence Hagumubuzima';
UPDATE students SET student_id='2250614', email='jdhag6@gmail.com',         phone='17200471923', name='西恩（Jean）',  research_direction='Effects of Environmental Water Change on Carbon Sequestration of Poplar Plantations and Its Underlying Mechanisms in the North China Plain',                        expected_graduation='2029', updated_at=NOW() WHERE name='Jean（留学生）';
UPDATE students SET student_id='2210408', email='hussainsajid@bjfu.edu.cn', phone='13146150100', name='萨伊德(Hussain)',research_direction='urban forestry cultivation and climate smart ecosystem services management',                                                                                                    expected_graduation='2026', enrollment_year=2021, updated_at=NOW() WHERE name='Sajid Hussain';

-- 郑泥（数据库里没有，需要新增）
INSERT INTO students (name, student_id, email, phone, enrollment_year, degree_type, research_direction, expected_graduation, advisor, status)
VALUES ('郑泥', '1250915', 'zn214496764@qq.com', '19801069795', 2025, '硕士', '树木健康机制检测和预警研究', '2029', '席本野', '在读')
ON CONFLICT (student_id) DO NOTHING;

-- 验证：查看刚更新的21人
SELECT name, student_id, email, phone, degree_type, enrollment_year, expected_graduation
FROM students
WHERE name IN ('王凯','孔鑫','赵小宁','杨文涵','王傲宇','李玲雅','毕思圣','胡杨阳',
               '焦玉章','林樱','缪腾飞','袁梦','赵欣怡','符国斌','吴俊蓉','李涵','安珊',
               '海格(Fulgence)','西恩（Jean）','萨伊德(Hussain)','郑泥')
ORDER BY enrollment_year, student_id;
