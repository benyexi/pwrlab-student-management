-- 把 auth.users 里所有还没有 profiles 记录的用户批量插入
-- 席老师的两个邮箱设为 admin，其余全部设为 student

INSERT INTO profiles (id, email, name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  CASE
    WHEN u.email IN ('benyexi@bjfu.edu.cn', 'benyexi@gmail.com') THEN 'admin'
    ELSE 'student'
  END
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 验证
SELECT p.email, p.name, p.role
FROM profiles p
ORDER BY p.role, p.email;
