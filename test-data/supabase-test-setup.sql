-- Test Data Setup for Stripe Webhook Testing
-- Run this in your Supabase SQL editor before testing

-- Clean up existing test data
DELETE FROM usage_logs WHERE user_id IN ('test-user-1', 'test-user-2', 'test-user-3', 'test-user-4');
DELETE FROM subscriptions WHERE user_id IN ('test-user-1', 'test-user-2', 'test-user-3', 'test-user-4');
DELETE FROM profiles WHERE id IN ('test-user-1', 'test-user-2', 'test-user-3', 'test-user-4');

-- Create test users
INSERT INTO profiles (id, email, name, stripe_customer_id, subscription_tier, created_at) VALUES
('test-user-1', 'basic@test.com', 'Basic Test User', 'cus_test_basic123', 'free', NOW()),
('test-user-2', 'pro@test.com', 'Pro Test User', 'cus_test_pro456', 'free', NOW()),
('test-user-3', 'enterprise@test.com', 'Enterprise Test User', 'cus_test_enterprise789', 'free', NOW()),
('test-user-4', 'transition@test.com', 'Transition Test User', 'cus_test_transition999', 'free', NOW());

-- Create test organizations (optional, if using organizations)
INSERT INTO organizations (id, name, owner_id, created_at) VALUES
('org-test-1', 'Test Organization 1', 'test-user-1', NOW()),
('org-test-2', 'Test Organization 2', 'test-user-2', NOW());

-- Verify test data
SELECT 'Test Users Created:' as message;
SELECT id, email, stripe_customer_id, subscription_tier FROM profiles WHERE id LIKE 'test-user-%';

-- Test customer mapping
SELECT 'Customer ID Mapping:' as message;
SELECT 
  id as user_id, 
  email, 
  stripe_customer_id,
  CASE 
    WHEN stripe_customer_id = 'cus_test_basic123' THEN 'Basic Test Customer'
    WHEN stripe_customer_id = 'cus_test_pro456' THEN 'Pro Test Customer'
    WHEN stripe_customer_id = 'cus_test_enterprise789' THEN 'Enterprise Test Customer'
    WHEN stripe_customer_id = 'cus_test_transition999' THEN 'Transition Test Customer'
    ELSE 'Unknown'
  END as test_scenario
FROM profiles 
WHERE id LIKE 'test-user-%';