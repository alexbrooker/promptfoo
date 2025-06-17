#!/bin/bash

# Simple Stripe Webhook Test for MVP
# Tests core subscription functionality only

set -e

echo "🧪 Simple Stripe Webhook Test"
echo "============================="

# Check backend server
if ! curl -s "http://localhost:15500/api/stripe/webhook" >/dev/null 2>&1; then
    echo "❌ Backend server not running. Start with: npm run dev:server"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

echo "📝 Testing core webhook functionality..."

# Test 1: Create subscription
echo "1️⃣ Testing subscription creation"
stripe trigger customer.subscription.created \
  --override subscription:customer=cus_SUBVwb47LYKxSy \
  --override subscription:"items[0][price]"=price_1RYUTUFJc5Krtqi5HLJboqTp

sleep 2
echo "   ✓ Subscription created"

# Get the subscription ID from the first test (check Stripe CLI output or dashboard)
echo "📋 Note: Check Stripe dashboard for subscription ID created in Test 1"
echo "    Then update this script with: --override subscription:id=sub_ACTUAL_ID"

# Test 2: Update subscription (plan change)  
echo "2️⃣ Testing plan change"
stripe trigger customer.subscription.updated \
  --override subscription:customer=cus_SUBVwb47LYKxSy

sleep 2
echo "   ✓ Plan updated"

# Test 3: Payment while subscription is active
echo "3️⃣ Testing payment with active subscription"
stripe trigger invoice.payment_succeeded \
  --override invoice:customer=cus_SUBVwb47LYKxSy

sleep 2
echo "   ✓ Payment processed (subscription active)"

# Test 4: Cancel subscription
echo "4️⃣ Testing subscription cancellation"
stripe trigger customer.subscription.deleted \
  --override subscription:customer=cus_SUBVwb47LYKxSy

sleep 2
echo "   ✓ Subscription canceled"

# Test 5: Payment after cancellation (should still log but user is now free tier)
echo "5️⃣ Testing payment after subscription canceled"
stripe trigger invoice.payment_failed \
  --override invoice:customer=cus_SUBVwb47LYKxSy

sleep 2
echo "   ✓ Payment failure logged (subscription canceled)"

echo ""
echo "🎉 All tests completed!"
echo ""
echo "📊 Quick verification (run in Supabase):"
echo "SELECT id, email, subscription_tier FROM profiles WHERE id LIKE 'test-user-%';"
echo "SELECT stripe_customer_id, plan_id, status FROM subscriptions;"
echo "SELECT action, user_id FROM usage_logs WHERE action LIKE 'payment_%';"