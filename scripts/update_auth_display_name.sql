-- 按邮箱匹配，更新 Auth 用户的 display name（raw_user_meta_data.full_name）
-- 同时更新 profiles.name
-- 在 Supabase Dashboard → SQL Editor 中执行

UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"王凯"}'      WHERE email = 'wangk@bjfu.edu.cn';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"孔鑫"}'      WHERE email = 'kx18238766961@bjfu.edu.cn';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"赵小宁"}'    WHERE email = '807236365@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"杨文涵"}'    WHERE email = 'youngwanyoungwan@163.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"王傲宇"}'    WHERE email = '1319376254@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"李玲雅"}'    WHERE email = 'lingyali@bjfu.edu.cn';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"郑泥"}'      WHERE email = 'zn214496764@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"毕思圣"}'    WHERE email = 'sisheng626@163.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"胡杨阳"}'    WHERE email = 'yyhuu0012@bjfu.edu.cn';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"海格(Fulgence)"}' WHERE email = 'hagumadaryl@gmail.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"西恩（Jean）"}' WHERE email = 'jdhag6@gmail.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"萨伊德(Hussain)"}' WHERE email = 'hussainsajid@bjfu.edu.cn';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"焦玉章"}'    WHERE email = 'jyz1092752421@163.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"林樱"}'      WHERE email = '1249823824@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"缪腾飞"}'    WHERE email = '3143269970@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"袁梦"}'      WHERE email = 'mollyy0726@163.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"赵欣怡"}'    WHERE email = '774867068@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"符国斌"}'    WHERE email = '1198364460@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"吴俊蓉"}'    WHERE email = '2522639550@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"李涵"}'      WHERE email = '1469509725@qq.com';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"安珊"}'      WHERE email = '1642828612@qq.com';

-- 同步更新 profiles.name（如果该用户已有 profile 记录）
UPDATE profiles SET name = '王凯'           WHERE email = 'wangk@bjfu.edu.cn';
UPDATE profiles SET name = '孔鑫'           WHERE email = 'kx18238766961@bjfu.edu.cn';
UPDATE profiles SET name = '赵小宁'         WHERE email = '807236365@qq.com';
UPDATE profiles SET name = '杨文涵'         WHERE email = 'youngwanyoungwan@163.com';
UPDATE profiles SET name = '王傲宇'         WHERE email = '1319376254@qq.com';
UPDATE profiles SET name = '李玲雅'         WHERE email = 'lingyali@bjfu.edu.cn';
UPDATE profiles SET name = '郑泥'           WHERE email = 'zn214496764@qq.com';
UPDATE profiles SET name = '毕思圣'         WHERE email = 'sisheng626@163.com';
UPDATE profiles SET name = '胡杨阳'         WHERE email = 'yyhuu0012@bjfu.edu.cn';
UPDATE profiles SET name = '海格(Fulgence)' WHERE email = 'hagumadaryl@gmail.com';
UPDATE profiles SET name = '西恩（Jean）'   WHERE email = 'jdhag6@gmail.com';
UPDATE profiles SET name = '萨伊德(Hussain)'WHERE email = 'hussainsajid@bjfu.edu.cn';
UPDATE profiles SET name = '焦玉章'         WHERE email = 'jyz1092752421@163.com';
UPDATE profiles SET name = '林樱'           WHERE email = '1249823824@qq.com';
UPDATE profiles SET name = '缪腾飞'         WHERE email = '3143269970@qq.com';
UPDATE profiles SET name = '袁梦'           WHERE email = 'mollyy0726@163.com';
UPDATE profiles SET name = '赵欣怡'         WHERE email = '774867068@qq.com';
UPDATE profiles SET name = '符国斌'         WHERE email = '1198364460@qq.com';
UPDATE profiles SET name = '吴俊蓉'         WHERE email = '2522639550@qq.com';
UPDATE profiles SET name = '李涵'           WHERE email = '1469509725@qq.com';
UPDATE profiles SET name = '安珊'           WHERE email = '1642828612@qq.com';

-- 验证：查看匹配上的用户
SELECT u.email, u.raw_user_meta_data->>'full_name' AS display_name, p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email IN (
  'wangk@bjfu.edu.cn','kx18238766961@bjfu.edu.cn','807236365@qq.com',
  'youngwanyoungwan@163.com','1319376254@qq.com','lingyali@bjfu.edu.cn',
  'zn214496764@qq.com','sisheng626@163.com','yyhuu0012@bjfu.edu.cn',
  'hagumadaryl@gmail.com','jdhag6@gmail.com','hussainsajid@bjfu.edu.cn',
  'jyz1092752421@163.com','1249823824@qq.com','3143269970@qq.com',
  'mollyy0726@163.com','774867068@qq.com','1198364460@qq.com',
  '2522639550@qq.com','1469509725@qq.com','1642828612@qq.com'
)
ORDER BY u.email;
