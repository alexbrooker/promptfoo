#!/bin/bash

# Edge Case Testing Script for Stripe Webhooks
# Tests error conditions and unusual scenarios

set -e

echo "🚨 Stripe Webhook Edge Case Testing"
echo "==================================="

# Configuration
LOCAL_WEBHOOK_URL="http://localhost:15500/api/stripe/webhook"

echo "🔍 Testing edge cases and error conditions..."
echo ""

# Test 1: Unknown Customer ID
echo "1️⃣  Testing: Unknown customer ID"
echo "   This should log a warning and not crash the server"

stripe trigger customer.subscription.created \
  --override customer=cus_nonexistent_customer \
  --override items[0].price.id=price_basic_test

echo "   ✓ Completed - Check logs for 'No user found' warning"
echo ""

# Test 2: Invalid Price ID (Unknown Plan)
echo "2️⃣  Testing: Invalid/unknown price ID"
echo "   This should create subscription with plan_id = 'unknown'"

stripe trigger customer.subscription.created \
  --override customer=cus_test_basic123 \
  --override items[0].price.id=price_invalid_unknown

sleep 3
echo "   ✓ Completed - Check subscription record for plan_id = 'unknown'"
echo ""

# Test 3: Malformed Subscription Data
echo "3️⃣  Testing: Missing subscription items"
echo "   This should handle gracefully without crashing"

# Note: This is harder to simulate with Stripe CLI, but would test:
# - Subscription without items.data array
# - Subscription with empty items
# - Missing price information

echo "   ℹ️  Simulated test - would require custom webhook payload"
echo "   📝 Manually test by sending malformed JSON to webhook endpoint"
echo ""

# Test 4: Database Connection Errors
echo "4️⃣  Testing: Database error simulation"
echo "   ℹ️  This requires temporarily breaking database connection"
echo "   📝 Manually test by:"
echo "       1. Changing Supabase URL to invalid value"
echo "       2. Triggering webhook"
echo "       3. Restoring correct URL"
echo ""

# Test 5: Duplicate Webhook Events
echo "5️⃣  Testing: Duplicate events (idempotency)"
echo "   Sending same subscription.created event twice"

stripe trigger customer.subscription.created \
  --override customer=cus_test_enterprise789 \
  --override items[0].price.id=price_pro_test

sleep 2

stripe trigger customer.subscription.created \
  --override customer=cus_test_enterprise789 \
  --override items[0].price.id=price_pro_test

echo "   ✓ Completed - Check that only one subscription record exists"
echo ""

# Test 6: Large Metadata Test
echo "6️⃣  Testing: Large metadata in payment events"
echo "   Testing with extensive invoice metadata"

stripe trigger invoice.payment_succeeded \
  --override customer=cus_test_basic123 \
  --override amount_paid=999999 \
  --override description="Large test payment with extensive metadata description"

echo "   ✓ Completed - Check usage_logs for large metadata handling"
echo ""

# Test 7: Rapid Fire Events
echo "7️⃣  Testing: Rapid succession of events"
echo "   Testing webhook rate limiting and processing"

for i in {1..5}; do
    echo "   Sending event $i/5..."
    stripe trigger invoice.payment_succeeded \
      --override customer=cus_test_pro456 \
      --override amount_paid=$((1000 + i * 100)) &
done

wait
echo "   ✓ Completed - Check that all 5 events were processed"
echo ""

# Test 8: Empty/Null Values
echo "8️⃣  Testing: Edge case values"
echo "   Testing with zero amounts and empty strings"

stripe trigger invoice.payment_succeeded \
  --override customer=cus_test_pro456 \
  --override amount_paid=0 \
  --override description=""

echo "   ✓ Completed - Check handling of zero amounts"
echo ""

echo "🎯 Edge Case Testing Complete!"
echo ""
echo "📊 Verification Steps:"
echo "====================="
echo "1. Check server logs for warnings and errors"
echo "2. Verify no crashes or unhandled exceptions"
echo "3. Check database for:"
echo "   - Proper error handling (no corrupt data)"
echo "   - Duplicate prevention"
echo "   - Unknown plan handling"
echo ""
echo "🔍 Run verification queries:"
echo "=========================="

cat << 'EOF'
-- Check for unknown plans
SELECT * FROM subscriptions WHERE plan_id = 'unknown';

-- Check for duplicate subscriptions (should not exist)
SELECT stripe_customer_id, COUNT(*) as count 
FROM subscriptions 
GROUP BY stripe_customer_id 
HAVING COUNT(*) > 1;

-- Check rapid fire payment logs
SELECT user_id, COUNT(*) as payment_count, MIN(created_at), MAX(created_at)
FROM usage_logs 
WHERE action = 'payment_succeeded' 
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Check zero amount payments
SELECT * FROM usage_logs 
WHERE action = 'payment_succeeded' 
AND metadata->>'amount' = '0';
EOF

echo ""
echo "⚠️  Expected Results:"
echo "===================="
echo "✅ Server should handle all events without crashing"
echo "✅ Unknown customers should log warnings, not errors"
echo "✅ Invalid price IDs should result in plan_id = 'unknown'"
echo "✅ No duplicate subscription records"
echo "✅ All payment events should be logged"
echo "✅ Zero amounts should be handled correctly"
echo ""
echo "🚨 Red Flags:"
echo "============"
echo "❌ Server crashes or unhandled exceptions"
echo "❌ Duplicate subscription records"
echo "❌ Missing payment logs"
echo "❌ Corrupt data in database"
echo "❌ Memory leaks from rapid events"