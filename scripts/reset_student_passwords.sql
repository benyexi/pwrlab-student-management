-- 把所有学生账号密码重置为 88888888
-- 在 Supabase Dashboard → SQL Editor 中执行

UPDATE auth.users
SET encrypted_password = crypt('88888888', gen_salt('bf'))
WHERE email IN (
  'wangk@bjfu.edu.cn',
  'kx18238766961@bjfu.edu.cn',
  '807236365@qq.com',
  'youngwanyoungwan@163.com',
  '1319376254@qq.com',
  'lingyali@bjfu.edu.cn',
  'zn214496764@qq.com',
  'sisheng626@163.com',
  'yyhuu0012@bjfu.edu.cn',
  'hagumadaryl@gmail.com',
  'jdhag6@gmail.com',
  'hussainsajid@bjfu.edu.cn',
  'jyz1092752421@163.com',
  '1249823824@qq.com',
  '3143269970@qq.com',
  'mollyy0726@163.com',
  '774867068@qq.com',
  '1198364460@qq.com',
  '2522639550@qq.com',
  '1469509725@qq.com',
  '1642828612@qq.com'
);

-- 验证：显示已重置的账号数量
SELECT COUNT(*) AS reset_count FROM auth.users
WHERE email IN (
  'wangk@bjfu.edu.cn','kx18238766961@bjfu.edu.cn','807236365@qq.com',
  'youngwanyoungwan@163.com','1319376254@qq.com','lingyali@bjfu.edu.cn',
  'zn214496764@qq.com','sisheng626@163.com','yyhuu0012@bjfu.edu.cn',
  'hagumadaryl@gmail.com','jdhag6@gmail.com','hussainsajid@bjfu.edu.cn',
  'jyz1092752421@163.com','1249823824@qq.com','3143269970@qq.com',
  'mollyy0726@163.com','774867068@qq.com','1198364460@qq.com',
  '2522639550@qq.com','1469509725@qq.com','1642828612@qq.com'
);
