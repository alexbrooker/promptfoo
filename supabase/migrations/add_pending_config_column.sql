-- Add pending_test_plan_config column to profiles table
-- This will store the generated config from guest onboarding until it's processed

ALTER TABLE profiles ADD COLUMN pending_test_plan_config JSONB;

COMMENT ON COLUMN profiles.pending_test_plan_config IS 'Stores generated test plan config from guest onboarding until processed';