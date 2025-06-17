#!/bin/bash

# Comprehensive Plan Transition Testing
# Tests all possible subscription plan changes and edge cases

set -e

echo "🔄 Comprehensive Plan Transition Testing"
echo "========================================"

# Configuration
LOCAL_WEBHOOK_URL="http://localhost:15500/api/stripe/webhook"

echo "📋 Testing all plan transition combinations..."
echo ""

# Check prerequisites
if ! curl -s "$LOCAL_WEBHOOK_URL" >/dev/null 2>&1; then
    echo "❌ Backend server not responding at $LOCAL_WEBHOOK_URL"
    echo "   Please start your backend server with: npm run dev:server"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Function to wait and log transition
test_transition() {
    local from_plan="$1"
    local to_plan="$2"
    local customer_id="$3"
    local price_id="$4"
    local test_number="$5"
    
    echo "$test_number Testing: $from_plan → $to_plan"
    echo "   Customer: $customer_id"
    echo "   Price ID: $price_id"
    
    if [[ "$to_plan" == "canceled" ]]; then
        stripe trigger customer.subscription.deleted \
          --override customer="$customer_id"
    else
        stripe trigger customer.subscription.updated \
          --override customer="$customer_id" \
          --override items[0].price.id="$price_id"
    fi
    
    sleep 2
    echo "   ✓ Transition completed"
    echo ""
}

# Function to create initial subscription
create_subscription() {
    local plan="$1"
    local customer_id="$2"
    local price_id="$3"
    
    echo "📝 Creating initial $plan subscription for $customer_id"
    stripe trigger customer.subscription.created \
      --override customer="$customer_id" \
      --override items[0].price.id="$price_id"
    sleep 2
    echo "   ✓ Initial subscription created"
    echo ""
}

# Test customers and their initial states
CUSTOMER_BASIC="cus_test_basic123"
CUSTOMER_PRO="cus_test_pro456" 
CUSTOMER_ENTERPRISE="cus_test_enterprise789"
CUSTOMER_TRANSITION="cus_test_transition999"

# Price IDs (these should match your actual Stripe price IDs)
PRICE_BASIC="${STRIPE_BASIC_PRICE_ID:-price_basic_test}"
PRICE_PRO="${STRIPE_PRO_PRICE_ID:-price_pro_test}"
PRICE_ENTERPRISE="${STRIPE_ENTERPRISE_PRICE_ID:-price_enterprise_test}"

echo "🎯 Plan Transition Matrix Testing"
echo "================================"

# GROUP 1: Upgrades from Basic
echo "GROUP 1: Basic Plan Upgrades"
echo "----------------------------"

create_subscription "basic" "$CUSTOMER_BASIC" "$PRICE_BASIC"
test_transition "basic" "pro" "$CUSTOMER_BASIC" "$PRICE_PRO" "1.1"
test_transition "pro" "enterprise" "$CUSTOMER_BASIC" "$PRICE_ENTERPRISE" "1.2"
test_transition "enterprise" "canceled" "$CUSTOMER_BASIC" "" "1.3"

# GROUP 2: Upgrades from Pro
echo "GROUP 2: Pro Plan Changes"
echo "-------------------------"

create_subscription "pro" "$CUSTOMER_PRO" "$PRICE_PRO"
test_transition "pro" "enterprise" "$CUSTOMER_PRO" "$PRICE_ENTERPRISE" "2.1"
test_transition "enterprise" "basic" "$CUSTOMER_PRO" "$PRICE_BASIC" "2.2"
test_transition "basic" "canceled" "$CUSTOMER_PRO" "" "2.3"

# GROUP 3: Enterprise Plan Changes
echo "GROUP 3: Enterprise Plan Changes"
echo "--------------------------------"

create_subscription "enterprise" "$CUSTOMER_ENTERPRISE" "$PRICE_ENTERPRISE"
test_transition "enterprise" "pro" "$CUSTOMER_ENTERPRISE" "$PRICE_PRO" "3.1"
test_transition "pro" "basic" "$CUSTOMER_ENTERPRISE" "$PRICE_BASIC" "3.2"
test_transition "basic" "pro" "$CUSTOMER_ENTERPRISE" "$PRICE_PRO" "3.3"
test_transition "pro" "canceled" "$CUSTOMER_ENTERPRISE" "" "3.4"

# GROUP 4: Rapid Plan Changes
echo "GROUP 4: Rapid Plan Changes"
echo "---------------------------"

create_subscription "basic" "$CUSTOMER_TRANSITION" "$PRICE_BASIC"
echo "4.1 Testing rapid plan changes (basic → pro → enterprise → basic)"
stripe trigger customer.subscription.updated \
  --override customer="$CUSTOMER_TRANSITION" \
  --override items[0].price.id="$PRICE_PRO" &

sleep 1

stripe trigger customer.subscription.updated \
  --override customer="$CUSTOMER_TRANSITION" \
  --override items[0].price.id="$PRICE_ENTERPRISE" &

sleep 1

stripe trigger customer.subscription.updated \
  --override customer="$CUSTOMER_TRANSITION" \
  --override items[0].price.id="$PRICE_BASIC" &

wait
sleep 3
echo "   ✓ Rapid transitions completed"
echo ""

# GROUP 5: Reactivation Scenarios
echo "GROUP 5: Reactivation Scenarios"
echo "-------------------------------"

# Cancel and recreate
test_transition "basic" "canceled" "$CUSTOMER_TRANSITION" "" "5.1"
sleep 2
echo "5.2 Testing reactivation after cancellation"
create_subscription "pro" "$CUSTOMER_TRANSITION" "$PRICE_PRO"

# GROUP 6: Payment Events During Different Plans
echo "GROUP 6: Payment Events by Plan"
echo "-------------------------------"

echo "6.1 Testing payment success on basic plan"
stripe trigger invoice.payment_succeeded \
  --override customer="$CUSTOMER_BASIC" \
  --override amount_paid=2900

echo "6.2 Testing payment failure on pro plan"
stripe trigger invoice.payment_failed \
  --override customer="$CUSTOMER_PRO" \
  --override amount_due=9900

echo "6.3 Testing payment success on enterprise plan"
stripe trigger invoice.payment_succeeded \
  --override customer="$CUSTOMER_ENTERPRISE" \
  --override amount_paid=29900

sleep 3
echo "   ✓ Payment events completed"
echo ""

# GROUP 7: Edge Cases in Transitions
echo "GROUP 7: Transition Edge Cases"
echo "------------------------------"

echo "7.1 Testing transition to same plan (should be idempotent)"
stripe trigger customer.subscription.updated \
  --override customer="$CUSTOMER_PRO" \
  --override items[0].price.id="$PRICE_PRO"

echo "7.2 Testing transition with invalid price ID"
stripe trigger customer.subscription.updated \
  --override customer="$CUSTOMER_PRO" \
  --override items[0].price.id="price_invalid_test"

echo "7.3 Testing multiple cancellations (should be idempotent)"
stripe trigger customer.subscription.deleted \
  --override customer="$CUSTOMER_BASIC"

stripe trigger customer.subscription.deleted \
  --override customer="$CUSTOMER_BASIC"

sleep 3
echo "   ✓ Edge case transitions completed"
echo ""

echo "🎉 All plan transition tests completed!"
echo ""
echo "📊 Comprehensive Verification:"
echo "============================="
echo ""

cat << 'EOF'
Run these SQL queries in Supabase to verify all transitions:

-- 1. Check final subscription states for all test customers
SELECT 
    s.stripe_customer_id,
    s.plan_id,
    s.status,
    p.subscription_tier,
    s.updated_at
FROM subscriptions s
JOIN profiles p ON s.user_id = p.id
WHERE s.stripe_customer_id IN (
    'cus_test_basic123', 
    'cus_test_pro456', 
    'cus_test_enterprise789', 
    'cus_test_transition999'
)
ORDER BY s.stripe_customer_id, s.updated_at;

-- 2. Count subscription updates per customer (should show transition history)
SELECT 
    stripe_customer_id,
    COUNT(*) as total_updates,
    MIN(created_at) as first_subscription,
    MAX(updated_at) as last_update
FROM subscriptions 
WHERE stripe_customer_id LIKE 'cus_test_%'
GROUP BY stripe_customer_id;

-- 3. Check payment events across all plans
SELECT 
    ul.user_id,
    ul.action,
    ul.metadata->>'amount' as amount,
    p.subscription_tier as current_tier,
    ul.created_at
FROM usage_logs ul
JOIN profiles p ON ul.user_id = p.id
WHERE ul.action IN ('payment_succeeded', 'payment_failed')
AND ul.user_id LIKE 'test-user-%'
ORDER BY ul.created_at;

-- 4. Verify no duplicate active subscriptions
SELECT 
    stripe_customer_id,
    COUNT(*) as active_subscriptions
FROM subscriptions 
WHERE status = 'active'
AND stripe_customer_id LIKE 'cus_test_%'
GROUP BY stripe_customer_id
HAVING COUNT(*) > 1;
-- This should return no rows

-- 5. Check profile tier consistency
SELECT 
    p.id,
    p.email,
    p.subscription_tier,
    COALESCE(s.plan_id, 'no_subscription') as latest_subscription_plan,
    CASE 
        WHEN s.status = 'canceled' OR s.id IS NULL THEN 'free'
        ELSE s.plan_id
    END as expected_tier,
    CASE 
        WHEN p.subscription_tier = CASE 
            WHEN s.status = 'canceled' OR s.id IS NULL THEN 'free'
            ELSE s.plan_id
        END THEN 'CONSISTENT'
        ELSE 'INCONSISTENT'
    END as tier_consistency
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id 
    AND s.created_at = (
        SELECT MAX(s2.created_at) 
        FROM subscriptions s2 
        WHERE s2.user_id = p.id
    )
WHERE p.id LIKE 'test-user-%';
EOF

echo ""
echo "🎯 Expected Results Summary:"
echo "==========================="
echo ""
echo "Customer States After All Tests:"
echo "  cus_test_basic123: CANCELED (tier = free)"
echo "  cus_test_pro456: CANCELED (tier = free)" 
echo "  cus_test_enterprise789: CANCELED (tier = free)"
echo "  cus_test_transition999: ACTIVE on pro plan (tier = pro)"
echo ""
echo "Payment Events:"
echo "  Should have payment_succeeded and payment_failed events"
echo "  Amounts should match test values (2900, 9900, 29900)"
echo ""
echo "Data Integrity:"
echo "  ✓ No duplicate active subscriptions"
echo "  ✓ Profile tiers match latest subscription status"
echo "  ✓ All transitions properly logged"
echo "  ✓ Rapid changes handled without corruption"
echo ""
echo "🧹 To clean up after testing:"
echo "   ./test-scripts/cleanup-test-data.sh"