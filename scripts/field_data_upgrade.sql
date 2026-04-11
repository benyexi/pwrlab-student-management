-- 野外数据录入功能升级（2026-04-11）
-- Phase 1: 补字段 + 修复 RLS
-- 在 Supabase Dashboard → SQL Editor 执行

-- =============================================
-- Step 1: 补字段
-- =============================================

-- field_observations 补 submitted_by（UUID 锚点，比字符串匹配更可靠）
ALTER TABLE public.field_observations
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

-- files 补 uploaded_by、observation_id、storage_path
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS uploaded_by   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS observation_id UUID REFERENCES field_observations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS storage_path  TEXT;

-- =============================================
-- Step 2: 修复 RLS
-- =============================================

BEGIN;

-- 删旧策略
DROP POLICY IF EXISTS rls_observations_insert ON public.field_observations;
DROP POLICY IF EXISTS rls_observations_update ON public.field_observations;
DROP POLICY IF EXISTS rls_observations_delete ON public.field_observations;
DROP POLICY IF EXISTS rls_files_insert        ON public.files;
DROP POLICY IF EXISTS rls_files_update        ON public.files;
DROP POLICY IF EXISTS rls_files_delete        ON public.files;

-- field_observations: 学生可 INSERT 自己的记录
CREATE POLICY rls_observations_insert ON public.field_observations
FOR INSERT WITH CHECK (
  public.is_admin()
  OR (auth.uid() IS NOT NULL AND (
    submitted_by = auth.uid()
    OR public.is_owner_by_name(student_name)
  ))
);

-- field_observations: 学生只能 UPDATE 自己的
CREATE POLICY rls_observations_update ON public.field_observations
FOR UPDATE
USING  (public.is_admin() OR submitted_by = auth.uid())
WITH CHECK (public.is_admin() OR submitted_by = auth.uid());

-- field_observations: 只有 admin 能删
CREATE POLICY rls_observations_delete ON public.field_observations
FOR DELETE USING (public.is_admin());

-- files: 学生可 INSERT 自己上传的
CREATE POLICY rls_files_insert ON public.files
FOR INSERT WITH CHECK (
  public.is_admin()
  OR (auth.uid() IS NOT NULL AND (
    uploaded_by = auth.uid()
    OR public.is_owner_by_name(student_name)
  ))
);

-- files: 学生只能 UPDATE 自己的
CREATE POLICY rls_files_update ON public.files
FOR UPDATE
USING  (public.is_admin() OR uploaded_by = auth.uid())
WITH CHECK (public.is_admin() OR uploaded_by = auth.uid());

-- files: 只有 admin 能删
CREATE POLICY rls_files_delete ON public.files
FOR DELETE USING (public.is_admin());

COMMIT;

-- =============================================
-- Step 3（历史数据修复）：把旧 student_name（邮箱前缀）换成 profiles.name
-- 等 Phase 3 前端部署完再执行这段，避免提前切换影响现有功能
-- =============================================
-- UPDATE field_observations fo
-- SET student_name = p.name
-- FROM profiles p
-- WHERE fo.submitted_by = p.id AND fo.submitted_by IS NOT NULL;

-- =============================================
-- Step 4: Storage Bucket RLS（先在 Dashboard 手动建好 bucket：field-observations，私有）
-- 然后在此执行 Storage 策略
-- =============================================

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'field-observations' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
USING (bucket_id = 'field-observations' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'field-observations' AND public.is_admin());

-- 验证
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('field_observations', 'files')
ORDER BY tablename, cmd;
