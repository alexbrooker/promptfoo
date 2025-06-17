#!/bin/bash

# Stripe Webhook Integration Test Script
# Make sure your local server is running on port 3000 before executing

set -e

echo "🔧 Stripe Webhook Integration Test Suite"
echo "========================================"

# Configuration
LOCAL_WEBHOOK_URL="http://localhost:15500/api/stripe/webhook"
STRIPE_CLI_VERSION=$(stripe version 2>/dev/null || echo "not installed")

# Check prerequisites
echo "📋 Checking prerequisites..."

if [[ "$STRIPE_CLI_VERSION" == "not installed" ]]; then
    echo "❌ Stripe CLI not found. Please install it first:"
    echo "   npm install -g stripe-cli"
    echo "   or visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

echo "✅ Stripe CLI found: $STRIPE_CLI_VERSION"

# Check if server is running
if ! curl -s "$LOCAL_WEBHOOK_URL" >/dev/null 2>&1; then
    echo "❌ Local server not responding at $LOCAL_WEBHOOK_URL"
    echo "   Please start your server with: npm run dev"
    exit 1
fi

echo "✅ Local server is running"

# Test database connection
echo "📊 Checking database setup..."
echo "   Please ensure you've run the test data setup SQL in Supabase"
echo "   File: test-data/supabase-test-setup.sql"
read -p "   Press Enter to continue when ready..."

echo ""
echo "🧪 Starting webhook tests..."

# Function to wait and check database
check_database() {
    local test_name="$1"
    local customer_id="$2"
    local expected_result="$3"
    
    echo "   Waiting 3 seconds for webhook processing..."
    sleep 3
    
    echo "   ✓ $test_name completed"
    echo "   📝 Please verify in Supabase:"
    echo "      - Check subscriptions table for customer: $customer_id"
    echo "      - Expected: $expected_result"
    echo ""
}

# Test 1: Basic Plan Subscription Created
echo "1️⃣  Testing: Basic subscription creation"
echo "   Triggering customer.subscription.created event..."

# Override with test customer data
stripe trigger customer.subscription.created \
  --override customer=cus_test_basic123 \
  --override items[0].price.id=price_basic_test

check_database "Basic subscription creation" "cus_test_basic123" "New subscription record, user tier = basic"

# Test 2: Pro Plan Subscription Created
echo "2️⃣  Testing: Pro subscription creation"
echo "   Triggering customer.subscription.created event..."

stripe trigger customer.subscription.created \
  --override customer=cus_test_pro456 \
  --override items[0].price.id=price_pro_test

check_database "Pro subscription creation" "cus_test_pro456" "New subscription record, user tier = pro"

# Test 3: Subscription Update (Plan Change)
echo "3️⃣  Testing: Subscription update (plan change)"
echo "   Triggering customer.subscription.updated event..."

stripe trigger customer.subscription.updated \
  --override customer=cus_test_pro456 \
  --override items[0].price.id=price_enterprise_test

check_database "Subscription plan change" "cus_test_pro456" "Updated subscription, user tier = enterprise"

# Test 4: Subscription Canceled
echo "4️⃣  Testing: Subscription cancellation"
echo "   Triggering customer.subscription.deleted event..."

stripe trigger customer.subscription.deleted \
  --override customer=cus_test_basic123

check_database "Subscription cancellation" "cus_test_basic123" "Subscription status = canceled, user tier = free"

# Test 5: Payment Succeeded
echo "5️⃣  Testing: Payment success"
echo "   Triggering invoice.payment_succeeded event..."

stripe trigger invoice.payment_succeeded \
  --override customer=cus_test_pro456 \
  --override amount_paid=2900

check_database "Payment success" "cus_test_pro456" "New usage_log entry with action = payment_succeeded"

# Test 6: Payment Failed
echo "6️⃣  Testing: Payment failure"
echo "   Triggering invoice.payment_failed event..."

stripe trigger invoice.payment_failed \
  --override customer=cus_test_pro456 \
  --override amount_due=2900

check_database "Payment failure" "cus_test_pro456" "New usage_log entry with action = payment_failed"

# Test 7: Edge Case - Unknown Customer
echo "7️⃣  Testing: Edge case - Unknown customer"
echo "   Triggering event with non-existent customer..."

stripe trigger customer.subscription.created \
  --override customer=cus_unknown_customer \
  --override items[0].price.id=price_basic_test

echo "   Waiting 3 seconds for webhook processing..."
sleep 3
echo "   ✓ Unknown customer test completed"
echo "   📝 Check logs for warning message about unknown customer"
echo ""

echo "🎉 All webhook tests completed!"
echo ""
echo "📊 Verification Checklist:"
echo "   □ Check Supabase subscriptions table for test data"
echo "   □ Check profiles table for updated subscription_tier values"
echo "   □ Check usage_logs table for payment events"
echo "   □ Check server logs for any errors or warnings"
echo ""
echo "🧹 To clean up test data, run:"
echo "   ./test-scripts/cleanup-test-data.sh"
echo ""
echo "📋 For detailed verification, run:"
echo "   ./test-scripts/verify-webhook-results.sh"