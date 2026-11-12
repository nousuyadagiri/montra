-- ====================================================================
-- MONTRA: Fix Split Group Creation, RLS Recursion & Atomic RPC
-- Idempotent migration safe to re-run in Supabase SQL Editor.
-- ====================================================================

-- 1. Harden SECURITY DEFINER membership helpers with explicit search_path
CREATE OR REPLACE FUNCTION public.is_group_member_or_creator(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.expense_groups
    WHERE id = p_group_id AND created_by = p_user_id
    UNION ALL
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_group_admin_or_creator(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.expense_groups
    WHERE id = p_group_id AND created_by = p_user_id
    UNION ALL
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 2. Replace cross-table RLS policies on expense_groups & group_members cleanly
DROP POLICY IF EXISTS "Members can view expense groups" ON public.expense_groups;
CREATE POLICY "Members can view expense groups" ON public.expense_groups
  FOR SELECT USING (
    auth.uid() = created_by OR public.is_group_member_or_creator(id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create expense groups" ON public.expense_groups;
CREATE POLICY "Users can create expense groups" ON public.expense_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group creators or members can update group" ON public.expense_groups;
CREATE POLICY "Group creators or members can update group" ON public.expense_groups
  FOR UPDATE USING (
    auth.uid() = created_by OR public.is_group_admin_or_creator(id, auth.uid())
  );

DROP POLICY IF EXISTS "Group creators can delete group" ON public.expense_groups;
CREATE POLICY "Group creators can delete group" ON public.expense_groups
  FOR DELETE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Members can view other members in group" ON public.group_members;
CREATE POLICY "Members can view other members in group" ON public.group_members
  FOR SELECT USING (
    public.is_group_member_or_creator(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Group creators or admins can add members" ON public.group_members;
CREATE POLICY "Group creators or admins can add members" ON public.group_members
  FOR INSERT WITH CHECK (
    public.is_group_admin_or_creator(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Group creators or admins can delete members" ON public.group_members;
CREATE POLICY "Group creators or admins can delete members" ON public.group_members
  FOR DELETE USING (
    public.is_group_admin_or_creator(group_id, auth.uid()) OR user_id = auth.uid()
  );

-- 3. Harden group_expenses, expense_splits, and settlements policies using SECURITY DEFINER helper
DROP POLICY IF EXISTS "Group members can view expenses" ON public.group_expenses;
CREATE POLICY "Group members can view expenses" ON public.group_expenses
  FOR SELECT USING (
    public.is_group_member_or_creator(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Group members can insert expenses" ON public.group_expenses;
CREATE POLICY "Group members can insert expenses" ON public.group_expenses
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND public.is_group_member_or_creator(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Group members can view and create settlements" ON public.settlements;
CREATE POLICY "Group members can view and create settlements" ON public.settlements
  FOR ALL USING (
    public.is_group_member_or_creator(group_id, auth.uid())
  );

-- 4. Atomic RPC to create an expense group + admin creator + initial members safely
CREATE OR REPLACE FUNCTION public.create_expense_group(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'Trip',
  p_currency TEXT DEFAULT 'INR',
  p_creator_name TEXT DEFAULT 'You',
  p_member_names TEXT[] DEFAULT '{}'
)
RETURNS public.expense_groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_group public.expense_groups;
  v_creator_name TEXT;
  v_member_name TEXT;
  v_seen_names TEXT[] := ARRAY[]::TEXT[];
  v_user_email TEXT;
  v_meta_name TEXT;
  v_meta_currency TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a group' USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR length(btrim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Group name cannot be empty' USING ERRCODE = '22023';
  END IF;

  -- Guarantee profiles FK exists even if user registered before trigger setup
  SELECT email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'currency'
  INTO v_user_email, v_meta_name, v_meta_currency
  FROM auth.users
  WHERE id = v_user_id;

  INSERT INTO public.profiles (id, full_name, email, currency)
  VALUES (
    v_user_id,
    COALESCE(NULLIF(btrim(v_meta_name), ''), NULLIF(btrim(p_creator_name), ''), split_part(COALESCE(v_user_email, ''), '@', 1), 'User'),
    COALESCE(v_user_email, ''),
    COALESCE(NULLIF(btrim(v_meta_currency), ''), NULLIF(btrim(p_currency), ''), 'INR')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.expense_groups (created_by, name, description, category, currency)
  VALUES (
    v_user_id,
    btrim(p_name),
    NULLIF(btrim(COALESCE(p_description, '')), ''),
    COALESCE(NULLIF(btrim(p_category), ''), 'Trip'),
    COALESCE(NULLIF(btrim(p_currency), ''), 'INR')
  )
  RETURNING * INTO v_group;

  v_creator_name := COALESCE(NULLIF(btrim(p_creator_name), ''), NULLIF(btrim(v_meta_name), ''), 'You');
  v_seen_names := array_append(v_seen_names, lower(v_creator_name));

  INSERT INTO public.group_members (group_id, user_id, member_name, role)
  VALUES (v_group.id, v_user_id, v_creator_name, 'admin');

  IF p_member_names IS NOT NULL THEN
    FOREACH v_member_name IN ARRAY p_member_names LOOP
      v_member_name := btrim(COALESCE(v_member_name, ''));
      IF length(v_member_name) > 0 AND NOT (lower(v_member_name) = ANY(v_seen_names)) THEN
        v_seen_names := array_append(v_seen_names, lower(v_member_name));
        INSERT INTO public.group_members (group_id, user_id, member_name, role)
        VALUES (v_group.id, NULL, v_member_name, 'member');
      END IF;
    END LOOP;
  END IF;

  RETURN v_group;
END;
$$;

REVOKE ALL ON FUNCTION public.create_expense_group(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_expense_group(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) TO authenticated;

