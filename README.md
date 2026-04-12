# PWRlab 学生管理系统

北京林业大学人工林水分关系实验室（PWRlab）学生综合管理平台，用于管理学生科研进展、论文、周报、野外观测数据及仪器预约。

线上地址：[https://benyexi.github.io/pwrlab-student-management/](https://benyexi.github.io/pwrlab-student-management/)

## 功能模块

| 模块 | 说明 | 学生可用 |
|------|------|----------|
| 仪表盘 | 实验室概况统计 / 学生个人科研概览 | ✅ |
| 学生管理 | 学生信息档案增删改查 | 仅 admin |
| 研究进展 | 看板式课题阶段管理，学生可拖拽推进并填写进展说明 | ✅ |
| 论文管理 | 全状态论文追踪（在写→已发表），支持毕业论文/期刊/会议分类，6步进度管道 | ✅ |
| 周报 | 学生周报提交与导师点评 | ✅ |
| 毕业节点 | 开题/中期/预答辩/答辩/论文提交节点跟踪，倒计时显示，学生可填备注 | ✅ |
| 仪器预约 | 实验仪器日历预约管理 | ✅ |
| 站点管理 | 22 个 CP-GPE 监测站点详情 | 仅 admin |
| 野外数据采集 | 学生移动端录入观测数据/上传照片；管理员多维筛选/文件下载 | ✅ |
| 提问答疑 | 师生异步交流 | ✅ |

## 技术栈

- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **后端**：Supabase（PostgreSQL + Auth + Storage）
- **部署**：GitHub Pages（GitHub Actions 自动部署）
- **路由**：HashRouter（兼容 GitHub Pages 静态托管）
- **拖拽**：@dnd-kit/core（研究进展看板）

## 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/benyexi/pwrlab-student-management.git
cd pwrlab-student-management

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 填入 Supabase 项目 URL 和 anon key

# 4. 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173`

## 环境变量说明

| 变量名 | 说明 | 获取位置 |
|--------|------|----------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名公钥 | Settings → API → anon public key |

> `.env` 文件已加入 `.gitignore`，请勿提交到版本库。

## 数据库初始化

在 Supabase SQL Editor 中执行 `supabase_schema.sql`，创建全部数据表、RLS 策略和初始数据。

按需执行 `scripts/` 目录下的升级脚本：

| 脚本 | 作用 |
|------|------|
| `student_feature_upgrade.sql` | papers.paper_type 字段 + 学生论文/毕业节点 RLS |
| `fix_student_permissions.sql` | projects UPDATE 学生 RLS + profiles.name 批量修正 |
| `fix_paper_timeline_rls.sql` | paper_timeline 学生 RLS + 旧论文 student_name 补填 |
| `field_data_upgrade.sql` | field_observations/files 补字段 + 修 RLS + Storage RLS |

## 部署说明

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages，约 1-2 分钟生效。

## 权限说明

| 角色 | 权限 |
|------|------|
| **admin（导师）** | 所有模块读写；可管理学生信息、审批仪器预约、查看全部野外数据并下载文件 |
| **student（学生）** | 科研/论文/周报/节点/野外数据/仪器预约/提问答疑；仅能查看和编辑自己的数据 |

学生默认登录密码：`88888888`（首次登录后请修改）
