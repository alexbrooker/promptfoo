#!/bin/bash

# Webhook Results Verification Script
# This script generates SQL queries to verify webhook test results

echo "🔍 Stripe Webhook Results Verification"
echo "======================================"

echo ""
echo "📋 Run these SQL queries in your Supabase SQL editor to verify results:"
echo ""

cat << 'EOF'
-- 1. Check all test user profiles and their subscription tiers
SELECT 
    id,
    email,
    subscription_tier,
    stripe_customer_id,
    updated_at
FROM profiles 
WHERE id LIKE 'test-user-%'
ORDER BY id;

-- Expected Results:
-- test-user-1 (basic@test.com): subscription_tier should be 'free' (was canceled)
-- test-user-2 (pro@test.com): subscription_tier should be 'enterprise' (was upgraded)
-- test-user-3 (enterprise@test.com): subscription_tier should be 'free' (no subscription created)

-- 2. Check all subscription records
SELECT 
    id,
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    plan_id,
    status,
    created_at,
    updated_at
FROM subscriptions 
WHERE stripe_customer_id IN ('cus_test_basic123', 'cus_test_pro456', 'cus_test_enterprise789')
ORDER BY created_at;

-- Expected Results:
-- Should see subscription records for basic and pro customers
-- Basic customer subscription should have status = 'canceled'
-- Pro customer subscription should have plan_id = 'enterprise'

-- 3. Check payment events in usage logs
SELECT 
    user_id,
    action,
    metadata,
    created_at
FROM usage_logs 
WHERE user_id IN ('test-user-1', 'test-user-2', 'test-user-3')
AND action IN ('payment_succeeded', 'payment_failed')
ORDER BY created_at;

-- Expected Results:
-- Should see payment_succeeded and payment_failed entries for test-user-2
-- Metadata should contain invoice details and amounts

-- 4. Summary report
SELECT 
    p.email,
    p.subscription_tier,
    COUNT(s.id) as subscription_count,
    COUNT(ul.id) as usage_log_count,
    MAX(s.updated_at) as last_subscription_update,
    MAX(ul.created_at) as last_usage_log
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id
LEFT JOIN usage_logs ul ON p.id = ul.user_id
WHERE p.id LIKE 'test-user-%'
GROUP BY p.id, p.email, p.subscription_tier
ORDER BY p.email;

-- 5. Check for any errors or unexpected data
SELECT 'Profiles without stripe_customer_id' as issue, COUNT(*) as count
FROM profiles 
WHERE id LIKE 'test-user-%' AND stripe_customer_id IS NULL

UNION ALL

SELECT 'Subscriptions with unknown plan_id' as issue, COUNT(*) as count
FROM subscriptions 
WHERE plan_id NOT IN ('basic', 'pro', 'enterprise', 'unknown')
AND stripe_customer_id IN ('cus_test_basic123', 'cus_test_pro456', 'cus_test_enterprise789')

UNION ALL

SELECT 'Usage logs without metadata' as issue, COUNT(*) as count
FROM usage_logs 
WHERE user_id IN ('test-user-1', 'test-user-2', 'test-user-3')
AND action IN ('payment_succeeded', 'payment_failed')
AND metadata IS NULL;
EOF

echo ""
echo "🎯 Expected Test Results Summary:"
echo "================================"
echo "test-user-1 (basic@test.com):"
echo "  ✓ subscription_tier: 'free' (canceled)"
echo "  ✓ Has 1 canceled subscription record"
echo ""
echo "test-user-2 (pro@test.com):"
echo "  ✓ subscription_tier: 'enterprise' (upgraded)"
echo "  ✓ Has 1 active subscription record"
echo "  ✓ Has 2 usage_log entries (payment_succeeded, payment_failed)"
echo ""
echo "test-user-3 (enterprise@test.com):"
echo "  ✓ subscription_tier: 'free' (no changes)"
echo "  ✓ No subscription records"
echo "  ✓ No usage_log entries"
echo ""
echo "🚨 Red Flags to Watch For:"
echo "========================="
echo "  ❌ Any subscription_tier not in ['free', 'basic', 'pro', 'enterprise']"
echo "  ❌ Missing subscription records for triggered events"
echo "  ❌ subscription status not matching expected values"
echo "  ❌ Missing usage_log entries for payment events"
echo "  ❌ Empty or malformed metadata in usage_logs"
echo ""
echo "📊 If results don't match expectations:"
echo "====================================="
echo "1. Check your server logs for errors"
echo "2. Verify webhook endpoint is receiving events"
echo "3. Check Stripe CLI for any failed webhook deliveries"
echo "4. Ensure your STRIPE_WEBHOOK_SECRET is correct"
echo "5. Verify your price IDs match the test data"