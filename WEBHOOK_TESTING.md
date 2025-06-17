# Simple Webhook Testing for MVP

Quick and easy testing for your Stripe webhook implementation.

## 🚀 Quick Start

### 1. Setup Test Data
Run this SQL in your Supabase SQL editor:
```sql
-- Create test user profiles (using actual auth.users IDs)
INSERT INTO profiles (
  id, 
  email, 
  stripe_customer_id, 
  subscription_tier, 
  display_name,
  name,
  company,
  chatbot_role,
  industry,
  use_case,
  compliance_needs,
  country_of_operation,
  terms_accepted,
  onboarding_completed,
  usage_quota,
  usage_current
) VALUES
(
  '924a10be-8d1d-4186-8f7b-20a9dd97fc3d', 
  'basic@test.com', 
  'cus_test_basic123', 
  'free', 
  'Basic Test User',
  'John Basic',
  'Test Corp Basic',
  'Customer Support Bot',
  'Technology',
  'Customer service automation',
  ARRAY['GDPR', 'SOX'],
  'United States',
  true,
  true,
  5,
  0
),
(
  '8dedb28a-db6d-43d4-85dc-1cfc23228639', 
  'pro@test.com', 
  'cus_test_pro456', 
  'free', 
  'Pro Test User',
  'Jane Pro',
  'Pro Solutions Inc',
  'Sales Assistant',
  'Finance',
  'Lead qualification',
  ARRAY['HIPAA', 'PCI'],
  'Canada',
  true,
  true,
  25,
  3
),
(
  '8af0cab6-6ea8-4960-a93f-dc25d566893f', 
  'enterprise@test.com', 
  'cus_test_enterprise789', 
  'free', 
  'Enterprise Test User',
  'Bob Enterprise',
  'Enterprise Solutions LLC',
  'Technical Support Bot',
  'Healthcare',
  'Patient inquiry automation',
  ARRAY['HIPAA', 'GDPR', 'SOX'],
  'United Kingdom',
  true,
  true,
  100,
  15
);
```

### 2. Start Your Backend
```bash
npm run dev:server  # Backend on port 15500
```

### 3. Forward Webhooks
```bash
stripe listen --forward-to localhost:15500/api/stripe/webhook
```

### 4. Run Tests
```bash
./test-scripts/simple-webhook-test.sh
```

## 🧪 What Gets Tested

✅ **Subscription Creation** - User gets correct plan  
✅ **Plan Changes** - User tier updates correctly  
✅ **Cancellation** - User reverts to free tier  
✅ **Payment Logging** - Payments are recorded  

## 📊 Quick Verification

After tests, check your Supabase data:

```sql
-- Check user tiers
SELECT id, email, subscription_tier FROM profiles WHERE email IN ('basic@test.com', 'pro@test.com', 'enterprise@test.com');

-- Check subscriptions  
SELECT stripe_customer_id, plan_id, status FROM subscriptions;

-- Check payment logs
SELECT action, user_id FROM usage_logs WHERE action LIKE 'payment_%';
```

**Expected Results:**
- test-user-1: subscription_tier = 'free' (was canceled)
- test-user-2: has payment log entry
- Subscription records exist with correct plan_id values

## 🧹 Cleanup

```sql
DELETE FROM usage_logs WHERE user_id IN ('924a10be-8d1d-4186-8f7b-20a9dd97fc3d', '8dedb28a-db6d-43d4-85dc-1cfc23228639', '8af0cab6-6ea8-4960-a93f-dc25d566893f');
DELETE FROM subscriptions WHERE stripe_customer_id IN ('cus_test_basic123', 'cus_test_pro456', 'cus_test_enterprise789');  
DELETE FROM profiles WHERE id IN ('924a10be-8d1d-4186-8f7b-20a9dd97fc3d', '8dedb28a-db6d-43d4-85dc-1cfc23228639', '8af0cab6-6ea8-4960-a93f-dc25d566893f');
```

## 🚨 Troubleshooting

**Server not responding?**
- Check backend is running: `npm run dev:server`
- Verify port 15500 is accessible

**Webhook events not working?**
- Check Stripe CLI is forwarding correctly
- Verify STRIPE_WEBHOOK_SECRET in .env

**Database not updating?**
- Check Supabase connection in backend logs
- Verify test users exist with correct stripe_customer_id values

That's it! Simple testing for your MVP. 🎯