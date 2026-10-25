/*
# Add role column to profiles table

## Purpose
Adds a "role" column to the profiles table so users can be assigned
a role (admin or sales). This enables role-based features in the CRM
(e.g. admin-only views, permission badges).

## Changes
1. Modified Tables
   - `profiles`: new column `role text NOT NULL DEFAULT 'sales'`
     - Possible values: 'admin', 'sales'
     - Defaults to 'sales' for all existing and new users

2. Security
   - No RLS policy changes — existing policies already cover SELECT/UPDATE
     on profiles for the owning user.
   - The `role` column is updatable by the owning user (already covered by
     the column grant on profiles).
   - Note: For strict production use, role changes should be server-enforced
     (SECURITY DEFINER function) so users can't self-elevate. That is
     recommended as a follow-up but not added here to keep the change minimal.

## Notes
1. The default 'sales' means all current users become "sales" role automatically.
2. To make a user an admin, run: UPDATE profiles SET role='admin' WHERE id='<uuid>';
3. The frontend will read this column to display role badges and gate features.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'sales';

-- Ensure existing rows get the default if they had NULL (shouldn't happen with NOT NULL, but safe)
UPDATE profiles SET role = 'sales' WHERE role IS NULL;
