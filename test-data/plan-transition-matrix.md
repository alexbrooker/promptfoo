# Plan Transition Test Matrix

Comprehensive testing coverage for all possible subscription plan changes.

## 🎯 Test Matrix Overview

### Plan Combinations Tested

| From Plan | To Plan | Test ID | Webhook Event | Expected Result |
|-----------|---------|---------|---------------|-----------------|
| **none** → basic | `1.0` | `subscription.created` | User tier = basic |
| **none** → pro | `2.0` | `subscription.created` | User tier = pro |
| **none** → enterprise | `3.0` | `subscription.created` | User tier = enterprise |
| **basic** → pro | `1.1` | `subscription.updated` | User tier = pro |
| **basic** → enterprise | `1.2` | `subscription.updated` | User tier = enterprise |
| **basic** → canceled | `1.3` | `subscription.deleted` | User tier = free |
| **pro** → basic | `2.1` | `subscription.updated` | User tier = basic |
| **pro** → enterprise | `2.2` | `subscription.updated` | User tier = enterprise |
| **pro** → canceled | `2.3` | `subscription.deleted` | User tier = free |
| **enterprise** → basic | `3.1` | `subscription.updated` | User tier = basic |
| **enterprise** → pro | `3.2` | `subscription.updated` | User tier = pro |
| **enterprise** → canceled | `3.3` | `subscription.deleted` | User tier = free |

### Additional Scenarios

| Scenario | Test ID | Description | Expected Behavior |
|----------|---------|-------------|-------------------|
| **Rapid Changes** | `4.x` | Multiple plan changes in quick succession | Last change wins, no data corruption |
| **Reactivation** | `5.x` | Cancel then create new subscription | Clean transition, new subscription record |
| **Same Plan Update** | `7.1` | Update to current plan | Idempotent, no unnecessary changes |
| **Invalid Plan** | `7.2` | Update to non-existent price ID | Graceful handling, plan_id = 'unknown' |
| **Double Cancellation** | `7.3` | Cancel already canceled subscription | Idempotent, no errors |

## 📊 Test Customers

| Customer ID | Purpose | Initial State | Final Expected State |
|-------------|---------|---------------|---------------------|
| `cus_test_basic123` | Basic plan lifecycle | free | canceled (free) |
| `cus_test_pro456` | Pro plan lifecycle | free | canceled (free) |
| `cus_test_enterprise789` | Enterprise plan lifecycle | free | canceled (free) |
| `cus_test_transition999` | Rapid transitions & reactivation | free | active (pro) |

## 🔄 Complete Test Flow

### Group 1: Basic Plan Lifecycle
```
free → basic → pro → enterprise → canceled
```

### Group 2: Pro Plan Lifecycle  
```
free → pro → enterprise → basic → canceled
```

### Group 3: Enterprise Plan Lifecycle
```
free → enterprise → pro → basic → pro → canceled
```

### Group 4: Rapid Transitions
```
free → basic → pro → enterprise → basic (all rapid)
```

### Group 5: Reactivation
```
active → canceled → active (new subscription)
```

### Group 6: Payment Events
```
Test payments at each plan level:
- Basic: $29/month
- Pro: $99/month  
- Enterprise: $299/month
```

## 🧪 Adding New Test Scenarios

To add new plan transition tests:

### 1. Add Test Function
```bash
# In plan-transition-tests.sh
test_custom_scenario() {
    local description="$1"
    local customer_id="$2"
    local actions="$3"
    
    echo "Testing: $description"
    # Add your test logic here
}
```

### 2. Add to Test Matrix
```bash
# Call your test function
echo "GROUP X: Custom Scenarios"
echo "-------------------------"
test_custom_scenario "Your scenario" "$CUSTOMER_ID" "your_actions"
```

### 3. Update Verification Queries
Add corresponding SQL queries to verify your new scenario works correctly.

## 🎯 Custom Test Examples

### Example 1: Testing Plan Downgrades
```bash
# Test enterprise → basic direct downgrade
test_transition "enterprise" "basic" "$CUSTOMER_ID" "$PRICE_BASIC" "X.1"

# Verify billing impact
stripe trigger invoice.payment_succeeded \
  --override customer="$CUSTOMER_ID" \
  --override amount_paid=2900  # Basic plan amount
```

### Example 2: Testing Failed Payment Scenarios
```bash
# Test failed payment on each plan
for plan in "basic" "pro" "enterprise"; do
    stripe trigger invoice.payment_failed \
      --override customer="$CUSTOMER_ID" \
      --override amount_due="$(get_plan_amount $plan)"
done
```

### Example 3: Testing Seasonal Changes
```bash
# Simulate black friday upgrade
test_transition "basic" "enterprise" "$CUSTOMER_ID" "$PRICE_ENTERPRISE" "BF.1"

# Simulate post-holiday downgrade  
test_transition "enterprise" "basic" "$CUSTOMER_ID" "$PRICE_BASIC" "BF.2"
```

## 🔍 Verification Strategy

### Database Consistency Checks
1. **Subscription State**: Verify latest subscription matches user tier
2. **No Duplicates**: Ensure no duplicate active subscriptions
3. **Payment Logs**: Verify all payment events are recorded
4. **Transition History**: Check subscription update timestamps

### Business Logic Validation
1. **Upgrade Path**: Higher tier access is immediate
2. **Downgrade Path**: Access maintained until period end (if applicable)
3. **Cancellation**: Immediate reversion to free tier
4. **Reactivation**: Clean slate with new subscription

### Performance Validation
1. **Rapid Changes**: System handles quick succession without corruption
2. **Concurrent Events**: Multiple webhook events don't interfere
3. **Large Scale**: Test with many customers/transitions

## 📈 Extending Test Coverage

### Future Test Scenarios to Consider:

1. **Proration Testing**
   - Mid-cycle upgrades
   - Mid-cycle downgrades
   - Partial refunds

2. **Trial Period Testing**
   - Trial → paid conversion
   - Trial cancellation
   - Trial extension

3. **Team/Organization Testing**
   - Multi-user subscription changes
   - Seat-based plan changes
   - Admin vs member permissions

4. **International Testing**
   - Currency-specific plans
   - Tax-inclusive pricing
   - Regional plan restrictions

5. **Integration Testing**
   - Webhook → database → frontend sync
   - Real Stripe API vs test events
   - Production webhook reliability

## 🚀 Running Extended Tests

```bash
# Run all plan transition tests
./test-scripts/plan-transition-tests.sh

# Run specific test groups
SKIP_RAPID_TESTS=true ./test-scripts/plan-transition-tests.sh

# Run with custom price IDs
PRICE_BASIC="price_real_basic" ./test-scripts/plan-transition-tests.sh

# Run with verbose logging
DEBUG=true ./test-scripts/plan-transition-tests.sh
```