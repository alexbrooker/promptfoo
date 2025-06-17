# Frontend End-to-End Testing Guide

Manual testing procedures for validating the complete user flow.

## 🚀 Setup

1. **Start both servers:**
   ```bash
   # Terminal 1: Backend
   npm run dev:server

   # Terminal 2: Frontend  
   npm run dev:app

   # Terminal 3: Webhook forwarding
   stripe listen --forward-to localhost:15500/api/stripe/webhook
   ```

2. **Open browser:** http://localhost:3000

## 🧪 Test Scenarios

### **Scenario 1: New User Registration + Subscription**

**Steps:**
1. 📝 Register new user with email: `e2e-test-1@example.com`
2. 🔐 Complete onboarding flow
3. 💳 Navigate to subscription/pricing page
4. 🎯 Click "Subscribe to Pro Plan"
5. 💰 Complete Stripe checkout (use test card: `4242 4242 4242 4242`)
6. ✅ Verify redirect to success page

**Expected Results:**
- ✅ User created in Supabase profiles table
- ✅ Stripe customer created with correct metadata
- ✅ Webhook processed successfully
- ✅ User subscription_tier = 'pro'
- ✅ Subscription record in database

**Verification Queries:**
```sql
-- Check user was created
SELECT id, email, subscription_tier, stripe_customer_id 
FROM profiles WHERE email = 'e2e-test-1@example.com';

-- Check subscription created
SELECT * FROM subscriptions WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'e2e-test-1@example.com'
);
```

### **Scenario 2: Plan Change via Customer Portal**

**Prerequisites:** Complete Scenario 1

**Steps:**
1. 🏠 Go to account/billing page in your app
2. 🔗 Click "Manage Subscription" (opens Stripe Customer Portal)
3. 📈 Change plan from Pro to Enterprise
4. ✅ Confirm change in Stripe portal
5. 🔙 Return to your app
6. 🔄 Refresh page to see updated plan

**Expected Results:**
- ✅ Webhook `customer.subscription.updated` processed
- ✅ User subscription_tier = 'enterprise'
- ✅ Subscription record updated in database
- ✅ Frontend displays new plan

### **Scenario 3: Subscription Cancellation**

**Prerequisites:** Complete Scenario 2

**Steps:**
1. 🔗 Return to Stripe Customer Portal
2. ❌ Cancel subscription
3. ✅ Confirm cancellation
4. 🔙 Return to your app
5. 🔄 Verify access is reverted

**Expected Results:**
- ✅ Webhook `customer.subscription.deleted` processed
- ✅ User subscription_tier = 'free'
- ✅ Subscription status = 'canceled'
- ✅ Frontend shows free tier features only

### **Scenario 4: Payment Failure Simulation**

**Steps:**
1. 📝 Register new user: `e2e-test-2@example.com`
2. 💳 Try to subscribe using declining test card: `4000 0000 0000 0002`
3. ❌ Payment should fail
4. 🔄 Retry with valid card: `4242 4242 4242 4242`

**Expected Results:**
- ✅ First payment logs failure in usage_logs
- ✅ Second payment succeeds and creates subscription
- ✅ User gets appropriate error messaging

## 📊 Real-time Monitoring

**While testing, monitor:**

1. **Browser Developer Console** - Check for JavaScript errors
2. **Backend Server Logs** - Watch webhook processing
3. **Stripe CLI Output** - See webhook delivery status
4. **Supabase Database** - Real-time data changes

## 🎯 Stripe Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Visa - Always succeeds |
| `4000 0000 0000 0002` | Visa - Always declined |
| `4000 0000 0000 9995` | Visa - Always fails with insufficient_funds |
| `4000 0025 0000 3155` | Visa - Requires authentication (3D Secure) |

**Other test data:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

## 🔍 Debugging Tips

**If subscription isn't working:**
1. Check backend logs for webhook errors
2. Verify STRIPE_WEBHOOK_SECRET is correct
3. Check Supabase connection
4. Verify price IDs match between frontend and backend

**If frontend isn't updating:**
1. Check if you're refetching user data after subscription
2. Verify authentication state
3. Check API calls in Network tab

**If webhooks aren't processing:**
1. Verify Stripe CLI is forwarding to correct port (15500)
2. Check webhook signature verification
3. Look for database permission errors

## 🧹 Cleanup After Testing

```sql
-- Remove test users
DELETE FROM usage_logs WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE 'e2e-test-%@example.com'
);

DELETE FROM subscriptions WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE 'e2e-test-%@example.com'  
);

DELETE FROM profiles WHERE email LIKE 'e2e-test-%@example.com';
```

**Also cleanup in Stripe Dashboard:**
- Delete test customers
- Cancel any test subscriptions

## 📈 Success Criteria

Your frontend integration is working correctly when:

✅ Users can register and subscribe seamlessly
✅ Plan changes reflect immediately in your app
✅ Cancellations properly restrict access
✅ Payment failures are handled gracefully
✅ All webhook events are processed correctly
✅ Database stays consistent with Stripe state

This gives you confidence that real users will have a smooth experience! 🎉