/*
# Secure team roles and customer assignments

1. Purpose
- Prevent signed-in users from changing their own role through direct table updates.
- Give administrators a secure server-checked path to change member roles.
- Add administrator-only member visibility and customer assignment support.

2. Modified tables
- `profiles`: administrators can read the team list; ordinary users can update only `full_name`.
- `customers`: add `assigned_to`, which identifies the team member responsible for the customer. Existing customers are assigned to their current owner.

3. Security changes
- Add `public.is_admin()` as a SECURITY DEFINER helper that checks the caller's database role.
- Add `public.set_member_role(uuid, text)`, which validates that the caller is an administrator and accepts only `admin` or `sales`.
- Add `public.assign_customer(uuid, uuid)`, which validates that the caller is an administrator and that the assignee exists.
- Revoke direct profile role writes and direct customer assignment writes from authenticated clients.
- Administrators can read all CRM records; sales users continue to read their own records, and customers assigned to them.

4. Important notes
- No existing records are deleted.
- Existing customers retain access through `owner_id` and are also assigned to their current owner.
- Role changes and assignments are performed through checked database functions, not client-side permission checks.
*/

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.customers
  ALTER COLUMN owner_id SET DEFAULT auth.uid();

UPDATE public.customers
SET assigned_to = owner_id
WHERE assigned_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON public.customers(assigned_to, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_member_role(p_member uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_role NOT IN ('admin', 'sales') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_member) THEN
    RAISE EXCEPTION 'Member not found';
  END IF;
  UPDATE public.profiles SET role = p_role, updated_at = now() WHERE id = p_member;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_member_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_member_role(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_customer(p_customer uuid, p_member uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_member) THEN
    RAISE EXCEPTION 'Member not found';
  END IF;
  UPDATE public.customers SET assigned_to = p_member, updated_at = now() WHERE id = p_customer;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_customer(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_customer(uuid, uuid) TO authenticated;

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
USING ((select auth.uid()) = id OR public.is_admin());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

REVOKE INSERT, UPDATE ON public.customers FROM authenticated;
GRANT INSERT (name, phone, email, source, status, notes, is_archived, next_action, next_follow_up_at) ON public.customers TO authenticated;
GRANT UPDATE (name, phone, email, source, status, notes, is_archived, next_action, next_follow_up_at) ON public.customers TO authenticated;

DROP POLICY IF EXISTS customers_select ON public.customers;
CREATE POLICY customers_select ON public.customers FOR SELECT TO authenticated
USING ((select auth.uid()) = owner_id OR assigned_to = (select auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS customers_insert ON public.customers;
CREATE POLICY customers_insert ON public.customers FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS customers_update ON public.customers;
CREATE POLICY customers_update ON public.customers FOR UPDATE TO authenticated
USING ((select auth.uid()) = owner_id OR public.is_admin())
WITH CHECK ((select auth.uid()) = owner_id OR public.is_admin());

DROP POLICY IF EXISTS customers_delete ON public.customers;
CREATE POLICY customers_delete ON public.customers FOR DELETE TO authenticated
USING ((select auth.uid()) = owner_id OR public.is_admin());

DROP POLICY IF EXISTS deals_select ON public.deals;
CREATE POLICY deals_select ON public.deals FOR SELECT TO authenticated
USING ((select auth.uid()) = owner_id OR public.is_admin());

DROP POLICY IF EXISTS tasks_select ON public.tasks;
CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated
USING ((select auth.uid()) = owner_id OR public.is_admin());

DROP POLICY IF EXISTS appointments_select ON public.appointments;
CREATE POLICY appointments_select ON public.appointments FOR SELECT TO authenticated
USING ((select auth.uid()) = owner_id OR public.is_admin());

DROP POLICY IF EXISTS activities_select ON public.activities;
CREATE POLICY activities_select ON public.activities FOR SELECT TO authenticated
USING ((select auth.uid()) = owner_id OR public.is_admin());
