-- 更新席老师两个账号的 display name 和 profiles.name
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"full_name":"席本野"}'
WHERE email IN ('benyexi@bjfu.edu.cn', 'benyexi@gmail.com');

UPDATE profiles SET name = '席本野'
WHERE email IN ('benyexi@bjfu.edu.cn', 'benyexi@gmail.com');

-- 验证
SELECT u.email, u.raw_user_meta_data->>'full_name' AS display_name, p.role, p.name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email IN ('benyexi@bjfu.edu.cn', 'benyexi@gmail.com');
