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
- [x] 研究进展看板（9个阶段）
- [x] 周报系统（提交、导师批注）
- [x] 提问答疑模块
- [x] 野外站点（22个CP-GPE站点）
- [x] 天气数据（OpenWeatherMap API自动 + 手动录入）
- [x] 毕业节点提醒
- [x] 仪器预约
- [x] RLS 权限硬化（supabase_rls_hardening.sql 已在 Supabase 执行）
- [x] GitHub Actions CI/CD
- [x] README.md 重写
- [x] Projects.tsx 空状态提示
- [x] 表单字段与 schema 对齐
- [x] 移动端适配（表格横滚、弹窗高度）
- [x] 各页面 document.title

## 待完成任务（按优先级）

### 下一批（可无人值守执行）
- [x] Reports.tsx 空状态提示
- [x] Reservations.tsx 空状态提示
- [x] FieldData.tsx 空状态提示
- [x] Layout.tsx 侧边栏手机端点击菜单后自动收起（NavLink onClick 已实现）

### 之后（需要席老师在场）
- [ ] 学生端完整体验测试与修复（需要学生账号实际登录验证）
- [x] 天气数据折线图（站点详情页10天天气可视化，SVG 实现温度折线+降雨柱状）
- [x] 研究进展看板拖拽（@dnd-kit/core，GripVertical 把手，5px 激活阈值，拖入列高亮，复用 changeStage）
- [x] 首屏加载优化（React.lazy + Suspense 懒加载所有页面，manualChunks 拆分 vendor-react/vendor-supabase/vendor-icons）
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
