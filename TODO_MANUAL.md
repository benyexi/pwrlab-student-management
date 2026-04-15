# 需手动在 Supabase 执行的操作

## ⚠️ GT1：高唐主站点数据库表（待执行）

**脚本**：`scripts/gaotang_schema.sql`

**执行步骤**：
1. 登录 https://supabase.com
2. 进入项目 `yyqkagljovzhcebtncik`
3. 打开 **SQL Editor**
4. 粘贴 `scripts/gaotang_schema.sql` 全文
5. 点击 **Run**

**创建的表**（10张）：
| 表名 | 内容 |
|------|------|
| `gaotang_stands` | 10个林分基本信息（已含初始数据） |
| `gaotang_forest_mgmt` | 林地管理（灌溉/修枝/施肥等） |
| `gaotang_soil_moisture` | 土壤水分（TRIME/FDR/维护） |
| `gaotang_sapflow` | 树干液流（安装/数采/维护） |
| `gaotang_tree_growth` | 树木生长（每木检尺/茎干传感器） |
| `gaotang_meteo` | 气象与地下水 |
| `gaotang_experiment` | 实验设计 |
| `gaotang_roots` | 根系数据 |
| `gaotang_photosynthesis` | 光合生理 |
| `gaotang_hydraulics` | 植物水力性状 |

所有表已启用 RLS：admin 全权限，student 可读写自己提交的记录。
