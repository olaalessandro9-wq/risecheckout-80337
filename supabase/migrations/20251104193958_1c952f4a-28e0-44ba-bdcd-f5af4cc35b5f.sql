-- ============================================================================
-- Security Fix: Remove unused SECURITY DEFINER views
-- ============================================================================
-- Issue: v_system_health_summary and v_unresolved_errors use SECURITY DEFINER
-- which bypasses RLS and executes with elevated privileges.
-- Resolution: Drop views as they are not used in the application.
-- ============================================================================

-- Drop unused system health summary view
DROP VIEW IF EXISTS public.v_system_health_summary;

-- Drop unused unresolved errors view  
DROP VIEW IF EXISTS public.v_unresolved_errors;

-- ============================================================================
-- ✅ SECURITY FIX APPLIED
-- ============================================================================
-- The SECURITY DEFINER views have been removed as they were:
-- 1. Not used anywhere in the application code
-- 2. Querying service-role-only tables (system_health_logs, edge_function_errors)
-- 3. Posing unnecessary security risk by bypassing RLS
-- 
-- If these views are needed in the future, they should be:
-- - Recreated as regular views (without SECURITY DEFINER)
-- - Or accessed directly via service role queries from admin tools
-- ============================================================================