#!/bin/bash

# Cleanup Test Data Script
# Removes all test data created during webhook testing

echo "🧹 Cleaning Up Stripe Webhook Test Data"
echo "======================================="

echo ""
echo "📋 Run this SQL in your Supabase SQL editor to clean up test data:"
echo ""

cat << 'EOF'
-- Clean up test data in reverse dependency order

-- 1. Remove usage logs for test users
DELETE FROM usage_logs 
WHERE user_id IN ('test-user-1', 'test-user-2', 'test-user-3', 'test-user-4');

-- 2. Remove subscription records for test customers
DELETE FROM subscriptions 
WHERE stripe_customer_id IN ('cus_test_basic123', 'cus_test_pro456', 'cus_test_enterprise789', 'cus_test_transition999');

-- 3. Remove test organizations (if created)
DELETE FROM organizations 
WHERE id IN ('org-test-1', 'org-test-2');

-- 4. Remove test user profiles
DELETE FROM profiles 
WHERE id IN ('test-user-1', 'test-user-2', 'test-user-3', 'test-user-4');

-- 5. Verify cleanup
SELECT 'Remaining test profiles' as table_name, COUNT(*) as remaining_records
FROM profiles 
WHERE id LIKE 'test-user-%'

UNION ALL

SELECT 'Remaining test subscriptions' as table_name, COUNT(*) as remaining_records
FROM subscriptions 
WHERE stripe_customer_id LIKE 'cus_test_%'

UNION ALL

SELECT 'Remaining test usage logs' as table_name, COUNT(*) as remaining_records
FROM usage_logs 
WHERE user_id LIKE 'test-user-%'

UNION ALL

SELECT 'Remaining test organizations' as table_name, COUNT(*) as remaining_records
FROM organizations 
WHERE id LIKE 'org-test-%';

-- Expected result: All counts should be 0
EOF

echo ""
echo "⚠️  Warning: This will permanently delete all test data!"
echo "   Make sure you've verified your webhook implementation first."
echo ""
echo "✅ After running the cleanup SQL, your database will be ready for production."
echo ""
echo "🔄 To run tests again:"
echo "   1. Run test-data/supabase-test-setup.sql"
echo "   2. Run test-scripts/webhook-integration-test.sh"