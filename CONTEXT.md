# PWRlab 学生管理系统 - 开发上下文

## 项目信息
- 本地路径：/Users/sekimotono/Desktop/pwrlab-student-management
- GitHub：https://github.com/benyexi/pwrlab-student-management
- 线上地址：https://benyexi.github.io/pwrlab-student-management/
- 技术栈：React 18 + TypeScript + Vite + TailwindCSS + Supabase
- 部署：push 到 main 后 GitHub Actions 自动部署到 GitHub Pages

## 架构要点
- 路由：HashRouter（GitHub Pages 不支持 BrowserRouter）
- 认证：Supabase Auth + profiles 表，两种角色：admin（导师）/ student
- 权限：src/components/RoleGuard.tsx + src/lib/studentOwnership.ts
- 数据库：Supabase PostgreSQL，13张表，RLS 已配置并执行
- vite.config.ts 的 base 设为 './'

## 数据库表
profiles, students, sites(22个CP-GPE杨树站点),
weather_records, field_observations, projects, papers,
paper_timeline, reports, milestones, instruments, reservations, files

## 已完成功能
- [x] 登录认证（Supabase Auth）
- [x] 管理员 Dashboard + 通知铃铛
- [x] 学生管理（增删改查、详情页）
- [x] 论文管理（状态、时间线、分区、IF、DOI）
- [x] 研究进展看板（9个阶段 + 拖拽）
- [x] 周报系统（提交、导师批注）
- [x] 提问答疑模块
- [x] 野外站点（22个CP-GPE站点）
- [x] 天气数据（OpenWeatherMap API自动 + 手动录入）
- [x] 毕业节点提醒
- [x] 仪器预约
- [x] RLS 权限硬化
- [x] GitHub Actions CI/CD
- [x] 移动端适配
- [x] 首屏加载优化（React.lazy + Suspense + manualChunks）
- [x] 学生端：改密码、退出登录修复、登录提速
- [x] 学生端：个人基本信息编辑（研究方向、预计毕业、邮箱、手机、备注）
- [x] 学生端：论文全状态管理（毕业论文/期刊/会议，6步进度管道，自主增删改）
- [x] 学生端：研究进展（自己课题拖拽阶段、填写进展说明）
- [x] 学生端：毕业节点时间线（倒计时/逾期天数、填写备注）
- [x] Dashboard：学生视图论文进度管道 + 毕业节点倒计时
- [x] 野外数据采集：学生端（移动端卡片、相机直拍、localStorage草稿、真实Storage上传、进度条）
- [x] 野外数据采集：管理员端（4格统计、多维筛选、signed URL文件下载）
- [x] 生产环境无限加载 spinner 修复（AuthContext getSession 初始化）

## 已知 Bug 与修复记录

### 2026-04-09 生产环境无限加载 spinner
- **现象**：首页显示深绿色背景 + "加载中..."，不跳转登录页
- **根因**：AuthContext 仅靠 `onAuthStateChange` 初始化，Supabase v2 某些版本 `INITIAL_SESSION` 事件在生产环境延迟/丢失，`loading` 永远为 `true`
- **修复**：AuthContext 改为 `getSession()` 显式初始化 + `onAuthStateChange` 跳过 `INITIAL_SESSION`（commit db50df7）

### 2026-04-09 paper_timeline INSERT 被 RLS 拒绝
- **现象**：论文保存成功但 `paper_timeline` 写入失败："new row violates row-level security policy"
- **根因**：`paper_timeline` 表没有给学生开 INSERT/SELECT 权限
- **修复**：前端已推送；**需执行** `scripts/fix_paper_timeline_rls.sql`

### 2026-04-09 学生自己论文不显示（旧数据）
- **现象**：管理员录入的旧论文有学生名，但学生登录后看不到
- **根因**：旧论文 `student_name` 字段为空，前端过滤逻辑依赖该字段
- **修复**：Papers.tsx 改为 `student_name` 为空时回退到 `authors` 字段匹配（commit fc9709a）；SQL 脚本也会补填 `student_name`

## 待完成任务（按优先级）

### ✅ 已在 Supabase SQL Editor 执行（2026-04-09）
- [x] `scripts/student_feature_upgrade.sql`：papers.paper_type 字段 + 学生论文/毕业节点 RLS 写权限
- [x] `scripts/fix_student_permissions.sql`：projects UPDATE 学生 RLS + profiles.name 批量修正
- [x] `scripts/fix_paper_timeline_rls.sql`：paper_timeline INSERT/SELECT 学生权限 + 旧论文 student_name 补填

### ✅ 野外数据采集功能完成（2026-04-11）
- [x] `scripts/field_data_upgrade.sql`：field_observations/files 补字段 + 修 RLS + Storage RLS
- [x] Storage bucket `field-observations` 已在 Supabase Dashboard 建好（私有，50MB）
- [x] App.tsx 去掉 /field-data 的 RoleGuard，学生可访问
- [x] FieldData.tsx 重写：StudentView（移动端卡片/相机直拍/草稿/上传进度）+ AdminView（统计/筛选/下载）

### 之后
- [ ] 野外数据功能端到端测试（学生账号录入 + 上传照片 + 管理员下载验证）
- [ ] 通知邮件提醒（Supabase Edge Function）

## 数据操作日志

### 2026-04-09 学生信息批量导入
- **来源**：`学生信息(1).xlsx`，共21条记录
- **操作**：生成 `scripts/import_students.sql`，需在 Supabase SQL Editor 手动执行
- **原因**：RLS策略限制了anon key的写权限，必须用 service_role 或 SQL Editor（超级用户）才能绕过
- **字段映射**：
  - Excel 姓名→name，学号→student_id，入学年份→enrollment_year，学位→degree_type，研究方向→research_direction，预计毕业时间→expected_graduation
  - 邮箱/手机号未存入students表（该表无这两列）；如需录入可在profiles表补充
- **执行方法**：登录 https://supabase.com → 项目yyqkagljovzhcebtncik → SQL Editor → 粘贴 scripts/import_students.sql → Run
- **学生列表**（21人）：王凯、孔鑫、赵小宁、杨文涵、王傲宇、李玲雅、郑泥、毕思圣、胡杨阳、海格(Fulgence)、西恩（Jean)、萨伊德(Hussain)、焦玉章、林樱、缪腾飞、袁梦、赵欣怡、符国斌、吴俊蓉、李涵、安珊

## 每次开始新 session 必读
1. 运行 git pull 拉取最新代码
2. 读本文件了解当前状态
3. 从"待完成任务"里取下一个任务开始执行
4. 每个任务完成后单独 commit + push
5. 完成后更新本文件：把已完成的打勾，把新发现的问题加到待完成列表
