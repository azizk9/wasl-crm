/*
# Revoke public/anon execute on handle_new_user()

The handle_new_user() SECURITY DEFINER function is an auth trigger that runs
automatically when a new user signs up. It should never be callable by
unauthenticated or authenticated users via the REST API. The original migration
created it but did not REVOKE EXECUTE, so Supabase's default PUBLIC grant
exposed it. This migration revokes EXECUTE from PUBLIC, anon, and authenticated.
*/

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
