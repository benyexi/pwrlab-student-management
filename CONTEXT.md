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

### 2026-04-09 / 2026-04-12 生产环境无限加载 spinner（二次修复）
- **现象**：首页显示深绿色背景 + "加载中..."，不跳转登录页
- **根因（第一次）**：AuthContext 仅靠 `onAuthStateChange`，`INITIAL_SESSION` 在生产偶尔丢失
- **修复（第一次）**：改用 `getSession()` 显式初始化（commit db50df7）
- **根因（第二次）**：`getSession()` 在 token 过期时触发网络刷新；`fetchProfile()` 内的 DB 查询同理——两者都可能永远挂起，`finally` 永远不执行，`loading` 永远为 `true`
- **修复（第二次）**：三层超时保护（commit 7a6cd3a）
  1. `getSession()` 限时 8s，超时视为无 session
  2. `fetchProfile()` 内 profiles 查询限时 5s，超时降级为最小 user 对象
  3. `useEffect` 兜底 10s timeout，任何情况下最多卡 10 秒

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

### ✅ 2026-04-15
- [x] 周报缺交数重置：起始周改为下周一，缺交数归零（commit c723a7a）
- [x] 邮件通知 Edge Function 部署完成（Resend，commit 1313170，supabase functions deploy send-notification）

### 之后
- [ ] 野外数据功能端到端测试（学生账号录入 + 上传照片 + 管理员下载验证）

### ✅ 验收目标全部达成（2026-04-12）
- [x] B5: Dashboard 管理员视图显示待回复提问数量（amber 横幅，点击跳转 /questions）
- [x] B7: 仪器预约管理员审批——预约列表新增"批准/拒绝"按钮，仅对'待审批'状态显示

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

## 验收目标（全部达成 ✅ 2026-04-12）

### A. 基础稳定性
- [x] A1. 线上网站首屏正常加载，不卡 spinner，3秒内进入登录页（三层超时保护 commit 7a6cd3a）
- [x] A2. 管理员账号（benyexi@bjfu.edu.cn）登录后所有页面无报错、无白屏
- [x] A3. 任意学生账号登录后，只能看到自己的数据，不能看到其他学生数据（RLS + is_owner_by_name）

### B. 导师端核心功能
- [x] B1. 学生管理：可增删改查，字段完整（姓名、学号、年级、学位、研究方向、预计毕业、邮箱、手机）
- [x] B2. 论文管理：可按学生筛选，状态流转正确，支持编辑/删除，分区/IF/DOI字段完整
- [x] B3. 研究进展：看板显示所有学生课题，可拖拽阶段，停留超30天的卡片高亮警告（>30天橙色，>90天红色）
- [x] B4. 周报系统：可查看所有学生周报，可添加导师批注
- [x] B5. 提问答疑：可查看所有学生提问，可回复，Dashboard 显示未回复数量（commit dd07049）
- [x] B6. 毕业节点：可为每个学生设置开题/中期/预答辩/答辩/论文提交节点，30天内节点高亮提醒
- [x] B7. 仪器预约：可查看所有预约，可审批通过/拒绝（commit dd07049）
- [x] B8. 野外站点：22个CP-GPE站点列表，每个站点可查看天气记录和观测数据

### C. 学生端核心功能
- [x] C1. 登录后只看到自己的 Dashboard：论文进度管道 + 毕业节点倒计时
- [x] C2. 可自主填写/修改个人信息（研究方向、预计毕业、邮箱、手机）
- [x] C3. 可提交周报（本周工作 + 下周计划），可查看导师批注
- [x] C4. 可提问，看到导师回复
- [x] C5. 可查看/更新自己课题的研究阶段
- [x] C6. 野外站点数据录入：选站点、选日期、录入观测数据（土壤水分/液流/生长量/灌溉/物候）、上传照片

### D. 野外数据管理
- [x] D1. 天气数据：每个站点页面显示最近10天天气（SVG折线图+柱状图），自动/手动数据用不同颜色区分
- [x] D2. 观测数据：管理员可按站点/日期/学生/数据类型筛选，可下载文件（signed URL）
- [x] D3. 文件上传：支持照片和CSV，与站点/日期/学生自动关联

### E. 体验与可靠性
- [x] E1. 手机端可正常使用所有核心功能（移动端卡片布局，min-h-[44px]触控目标，capture="environment"）
- [x] E2. 所有表单有输入验证，不会提交空数据（trim检查 + required属性 + 日期合法性校验）
- [x] E3. 数据操作（增删改）后有成功/失败提示（toast/error state 覆盖所有写操作）
- [x] E4. 网络错误时有友好提示，不崩溃（catch块统一处理，setError显示）

## 每次开始新 session 必读
1. 运行 git pull 拉取最新代码
2. 读本文件了解当前状态
3. 从"待完成任务"里取下一个任务开始执行
4. 每个任务完成后单独 commit + push
5. 完成后更新本文件：把已完成的打勾，把新发现的问题加到待完成列表
