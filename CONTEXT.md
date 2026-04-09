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

## 待完成任务（按优先级）

### 需要席老师在 Supabase SQL Editor 执行（必须！）
- [ ] 执行 `scripts/student_feature_upgrade.sql`：papers 表加 paper_type 字段 + 学生 RLS 写权限
- [ ] 执行 `scripts/fix_student_permissions.sql`：projects UPDATE 学生 RLS + profiles.name 批量修正

### 之后
- [ ] 学生端完整体验测试（用学生账号实际登录验证各功能）
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
