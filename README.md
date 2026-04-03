# PWRlab 学生管理系统

北京林业大学人工林水分关系实验室（PWRlab）学生综合管理平台，用于管理学生科研进展、论文、周报、野外观测数据及仪器预约。

线上地址：[https://benyexi.github.io/pwrlab-student-management/](https://benyexi.github.io/pwrlab-student-management/)

## 功能模块

| 模块 | 说明 |
|------|------|
| 仪表盘 | 实验室整体概况统计 |
| 学生管理 | 学生信息档案（仅 admin） |
| 研究进展 | 看板式课题进度管理 |
| 论文管理 | 论文状态追踪与时间线 |
| 周报 | 学生周报提交与导师点评 |
| 毕业节点 | 开题/中期/答辩节点跟踪 |
| 仪器预约 | 实验仪器日历预约管理 |
| 站点管理 | 22 个 CP-GPE 监测站点（仅 admin） |
| 数据采集 | 野外观测数据录入与查询（仅 admin） |
| 提问答疑 | 师生异步交流 |

## 技术栈

- **前端**：React 18 + TypeScript + Vite + TailwindCSS
- **后端**：Supabase（PostgreSQL + Auth + Storage）
- **部署**：GitHub Pages（GitHub Actions 自动部署）
- **路由**：HashRouter（兼容 GitHub Pages 静态托管）

## 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/benyexi/pwrlab-student-management.git
cd pwrlab-student-management

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 用编辑器打开 .env，填入 Supabase 项目信息

# 4. 启动开发服务器
npm run dev
```

浏览器访问 `http://localhost:5173`

## 环境变量说明

复制 `.env.example` 为 `.env`，填入以下变量：

| 变量名 | 说明 | 获取位置 |
|--------|------|----------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | Supabase 控制台 → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名公钥 | Supabase 控制台 → Settings → API → anon public key |

> `.env` 文件已加入 `.gitignore`，请勿提交到版本库。

## 数据库初始化

在 Supabase SQL Editor 中执行项目根目录的 `supabase_schema.sql`，将创建全部 13 张数据表、RLS 策略和 22 个监测站点初始数据。

## 部署说明

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages，无需手动操作。

```bash
git add .
git commit -m "your changes"
git push
```

部署完成后约 1-2 分钟即可在线上地址看到更新。

## 权限说明

- **admin（导师）**：可访问所有模块，可管理学生信息、审批仪器预约
- **student（学生）**：可访问科研、周报、仪器预约、提问答疑等模块，仅可查看/编辑自己的数据
