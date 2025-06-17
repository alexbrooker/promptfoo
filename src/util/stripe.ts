import Stripe from 'stripe';
import logger from '../logger';
import { supabase } from '../server/middleware/auth';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Updated pricing for security-focused product
export const SUBSCRIPTION_PLANS = {
  quick_check: {
    id: 'quick_check',
    name: 'Quick Check',
    priceId: process.env.STRIPE_QUICK_CHECK_PRICE_ID || 'price_quick_check',
    price: 49,
    discountedPrice: 29,
    active: true,
    interval: 'one-off' as const,
    features: [
      '~100 essential security tests',
      'OWASP LLM Top 10 coverage',
      'Prompt injection detection',
      'Basic compliance check',
      'Professional security report',
      'Email delivery',
    ],
  },
  business_scan: {
    id: 'business_scan',
    name: 'Business Scan',
    priceId: process.env.STRIPE_BUSINESS_SCAN_PRICE_ID || 'price_business_scan',
    price: 999,
    discountedPrice: 499,
    active: true,
    interval: 'one-off' as const,
    features: [
      '~2000 comprehensive security tests',
      'OWASP LLM Top 10 + MITRE ATLAS coverage',
      'EU AI Act compliance assessment',
      'Advanced adversarial testing',
      'Detailed vulnerability analysis',
      'Executive summary report',
      'Priority email support',
    ],
  },
  monthly_monitoring: {
    id: 'monthly_monitoring',
    name: 'Monthly Monitoring',
    priceId: process.env.STRIPE_MONTHLY_MONITORING_PRICE_ID || 'price_monthly_monitoring',
    price: 750,
    discountedPrice: 599,
    active: true,
    interval: 'month' as const,
    features: [
      'Everything in Business Scan',
      'Automated monthly scans',
      'Email report delivery',
      'Continuous security monitoring',
      'New test patterns included',
      'Priority support & consultation',
    ],
  },
} as const;

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

export function validatePlanId(planId: string): planId is PlanId {
  return planId in SUBSCRIPTION_PLANS;
}

export function getPlanByPriceId(priceId: string): (typeof SUBSCRIPTION_PLANS)[PlanId] | null {
  for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
    if (plan.priceId === priceId) {
      return plan;
    }
  }
  return null;
}

export async function createOrRetrieveCustomer(
  userId: string,
  email: string,
  metadata?: Record<string, string>,
): Promise<Stripe.Customer> {
  // First, try to find existing customer by user ID in metadata
  const existingCustomers = await stripe.customers.list({
    limit: 1,
    expand: ['data.subscriptions'],
  });

  const existingCustomer = existingCustomers.data.find(
    (customer) => customer.metadata.userId === userId,
  );

  if (existingCustomer) {
    logger.info(`Found existing Stripe customer for user ${userId}: ${existingCustomer.id}`);

    // Update user profile with Stripe customer ID if not already set
    try {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: existingCustomer.id })
        .eq('id', userId);
      logger.info(`Updated user profile with Stripe customer ID: ${existingCustomer.id}`);
    } catch (error) {
      logger.warn(`Failed to update user profile with Stripe customer ID: ${error}`);
    }

    return existingCustomer;
  }

  // Create new customer
  logger.info(`Creating new Stripe customer for user ${userId} with email ${email}`);
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
      ...metadata,
    },
  });

  // Update user profile with new Stripe customer ID
  try {
    await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', userId);
    logger.info(`Updated user profile with new Stripe customer ID: ${customer.id}`);
  } catch (error) {
    logger.warn(`Failed to update user profile with new Stripe customer ID: ${error}`);
  }

  return customer;
}

export async function getCustomerSubscription(
  customerId: string,
): Promise<Stripe.Subscription | null> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      expand: ['data.items.data.price'],
      limit: 1,
    });

    return subscriptions.data[0] || null;
  } catch (error) {
    logger.error(`Error fetching subscription for customer ${customerId}: ${error}`);
    return null;
  }
}

export async function getCustomerInvoices(
  customerId: string,
  limit = 10,
): Promise<Stripe.Invoice[]> {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data;
  } catch (error) {
    logger.error(`Error fetching invoices for customer ${customerId}: ${error}`);
    return [];
  }
}

export function formatSubscriptionForResponse(
  subscription: Stripe.Subscription,
  customer: Stripe.Customer,
  invoices?: Stripe.Invoice[],
) {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanByPriceId(priceId || '');
  
  // Get the actual price from Stripe instead of local plan definition
  const stripePrice = subscription.items.data[0]?.price;
  const actualPrice = stripePrice?.unit_amount || plan?.price || 0;

  return {
    id: subscription.id,
    status: subscription.status,
    planId: plan?.id || 'unknown',
    planName: plan?.name || 'Unknown Plan',
    price: actualPrice / 100, // Convert from cents to dollars
    interval: plan?.interval || 'month',
    currentPeriodStart: subscription.items.data[0]?.current_period_start,
    currentPeriodEnd: subscription.items.data[0]?.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    customerId: customer.id,
    invoices: invoices?.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid || 0,
      date: invoice.created,
      status: invoice.status,
      downloadUrl: invoice.hosted_invoice_url || '',
    })),
  };
}
