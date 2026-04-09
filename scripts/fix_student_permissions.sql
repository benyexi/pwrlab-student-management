-- 修复学生权限（2026-04-09）
-- 1. 给 projects 表加学生更新自己课题的 RLS 策略
-- 2. 修正 profiles.name 确保名字匹配正常
-- 在 Supabase Dashboard → SQL Editor 执行

-- ① 删除旧的 projects update 策略，添加允许学生更新自己课题的策略
DROP POLICY IF EXISTS rls_projects_update ON public.projects;

CREATE POLICY rls_projects_update
ON public.projects
FOR UPDATE
USING (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
)
WITH CHECK (
  public.is_admin()
  OR public.is_owner_by_student_ref(student_id, student_name)
);

-- ② 修正 profiles.name（按邮箱匹配）
-- 确保学生登录后能正确被 RLS 识别
UPDATE profiles SET name = '王凯'           WHERE email = 'wangk@bjfu.edu.cn'             AND (name IS NULL OR name = '');
UPDATE profiles SET name = '孔鑫'           WHERE email = 'kx18238766961@bjfu.edu.cn'     AND (name IS NULL OR name = '');
UPDATE profiles SET name = '赵小宁'         WHERE email = '807236365@qq.com'              AND (name IS NULL OR name = '');
UPDATE profiles SET name = '杨文涵'         WHERE email = 'youngwanyoungwan@163.com'      AND (name IS NULL OR name = '');
UPDATE profiles SET name = '王傲宇'         WHERE email = '1319376254@qq.com'             AND (name IS NULL OR name = '');
UPDATE profiles SET name = '李玲雅'         WHERE email = 'lingyali@bjfu.edu.cn'          AND (name IS NULL OR name = '');
UPDATE profiles SET name = '郑泥'           WHERE email = 'zn214496764@qq.com'            AND (name IS NULL OR name = '');
UPDATE profiles SET name = '毕思圣'         WHERE email = 'sisheng626@163.com'            AND (name IS NULL OR name = '');
UPDATE profiles SET name = '胡杨阳'         WHERE email = 'yyhuu0012@bjfu.edu.cn'         AND (name IS NULL OR name = '');
UPDATE profiles SET name = '海格(Fulgence)' WHERE email = 'hagumadaryl@gmail.com'         AND (name IS NULL OR name = '');
UPDATE profiles SET name = '西恩（Jean）'   WHERE email = 'jdhag6@gmail.com'              AND (name IS NULL OR name = '');
UPDATE profiles SET name = '萨伊德(Hussain)'WHERE email = 'hussainsajid@bjfu.edu.cn'      AND (name IS NULL OR name = '');
UPDATE profiles SET name = '焦玉章'         WHERE email = 'jyz1092752421@163.com'         AND (name IS NULL OR name = '');
UPDATE profiles SET name = '林樱'           WHERE email = '1249823824@qq.com'             AND (name IS NULL OR name = '');
UPDATE profiles SET name = '缪腾飞'         WHERE email = '3143269970@qq.com'             AND (name IS NULL OR name = '');
UPDATE profiles SET name = '袁梦'           WHERE email = 'mollyy0726@163.com'            AND (name IS NULL OR name = '');
UPDATE profiles SET name = '赵欣怡'         WHERE email = '774867068@qq.com'              AND (name IS NULL OR name = '');
UPDATE profiles SET name = '符国斌'         WHERE email = '1198364460@qq.com'             AND (name IS NULL OR name = '');
UPDATE profiles SET name = '吴俊蓉'         WHERE email = '2522639550@qq.com'             AND (name IS NULL OR name = '');
UPDATE profiles SET name = '李涵'           WHERE email = '1469509725@qq.com'             AND (name IS NULL OR name = '');
UPDATE profiles SET name = '安珊'           WHERE email = '1642828612@qq.com'             AND (name IS NULL OR name = '');

-- 强制覆盖（不管是否为空，确保名字正确）
UPDATE profiles SET name = '席本野' WHERE email IN ('benyexi@bjfu.edu.cn', 'benyexi@gmail.com');

-- 验证
SELECT email, name, role FROM profiles ORDER BY role, name;
