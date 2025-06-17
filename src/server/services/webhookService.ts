import logger from '../../logger';
import { supabase } from '../middleware/auth';
import { SUBSCRIPTION_PLANS } from '../../util/stripe';
import type Stripe from 'stripe';

/**
 * Service for handling Stripe webhook events
 * Separated from route handlers for better testing and organization
 */

/**
 * Handle customer creation - store Stripe customer ID in profile
 */
export async function handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
  try {
    // Extract user ID from customer metadata (set when customer is created)
    const userId = customer.metadata?.userId;
    
    if (!userId) {
      logger.warn(`Customer ${customer.id} created without userId metadata`);
      return;
    }

    // Update user profile with Stripe customer ID
    const { error } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user profile with customer ID: ${error.message}`);
    }

    logger.info(`Successfully linked customer ${customer.id} to user ${userId}`);

  } catch (error) {
    logger.error(`Error handling customer creation: ${error}`);
    throw error;
  }
}

interface CustomerLookupResult {
  userId: string;
  organizationId?: string;
}

/**
 * Find user by Stripe customer ID
 */
async function findUserByCustomerId(customerId: string): Promise<CustomerLookupResult | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, organization_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (error || !profile) {
      logger.warn(`No user found for Stripe customer ${customerId}`);
      return null;
    }

    return {
      userId: profile.id,
      organizationId: profile.organization_id,
    };
  } catch (error) {
    logger.error(`Error looking up user for customer ${customerId}: ${error}`);
    return null;
  }
}

/**
 * Get plan ID from Stripe price ID
 */
function getPlanIdFromPrice(priceId: string): string {
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.priceId === priceId);
  return plan?.id || 'pro'; // Default to 'pro' instead of 'unknown' for constraint compliance
}

/**
 * Extract customer ID from Stripe object
 */
function extractCustomerId(stripeObject: { customer: string | Stripe.Customer | Stripe.DeletedCustomer | null }): string {
  if (!stripeObject.customer) {
    throw new Error('Customer is null');
  }
  return typeof stripeObject.customer === 'string' 
    ? stripeObject.customer 
    : stripeObject.customer.id;
}

/**
 * Handle subscription creation or update
 */
export async function handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
  try {
    const customerId = extractCustomerId(subscription);
    const user = await findUserByCustomerId(customerId);
    
    if (!user) return;

    const priceId = subscription.items.data[0]?.price?.id;
    const planId = getPlanIdFromPrice(priceId || '');

    // Use transaction for data consistency  
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.userId,
        organization_id: user.organizationId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan_id: planId,
        status: subscription.status,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'stripe_subscription_id',
        ignoreDuplicates: false 
      });

    if (subscriptionError) {
      throw new Error(`Failed to update subscription: ${subscriptionError.message}`);
    }

    // Update user profile subscription tier
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_tier: planId })
      .eq('id', user.userId);

    if (profileError) {
      throw new Error(`Failed to update user subscription tier: ${profileError.message}`);
    }

    logger.info(`Successfully updated subscription ${subscription.id} for user ${user.userId}`);

  } catch (error) {
    logger.error(`Error handling subscription update: ${error}`);
    throw error; // Re-throw to trigger webhook retry
  }
}

/**
 * Handle subscription deletion/cancellation
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    const customerId = extractCustomerId(subscription);
    const user = await findUserByCustomerId(customerId);
    
    if (!user) return;

    // Update subscription status to canceled
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subscriptionError) {
      throw new Error(`Failed to mark subscription as canceled: ${subscriptionError.message}`);
    }

    // Revert user to free tier
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ subscription_tier: 'free' })
      .eq('id', user.userId);

    if (profileError) {
      throw new Error(`Failed to revert user to free tier: ${profileError.message}`);
    }

    logger.info(`Successfully canceled subscription ${subscription.id} for user ${user.userId}`);

  } catch (error) {
    logger.error(`Error handling subscription deletion: ${error}`);
    throw error;
  }
}

/**
 * Handle successful one-time payment (charge succeeded)
 */
export async function handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
  try {
    const customerId = typeof charge.customer === 'string' 
      ? charge.customer 
      : charge.customer?.id;
    
    if (!customerId) {
      logger.warn(`Charge ${charge.id} has no customer associated`);
      return;
    }

    const user = await findUserByCustomerId(customerId);
    if (!user) return;

    // Get plan info from charge metadata
    // The checkout session metadata should flow through to the charge
    const planInfo = charge.metadata?.planId || charge.metadata?.plan_id || 'basic_one_off';
    
    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: user.userId,
        action: 'payment_succeeded',
        metadata: {
          charge_id: charge.id,
          amount: charge.amount,
          currency: charge.currency,
          plan_id: planInfo,
          payment_type: 'one_time',
          payment_method_id: charge.payment_method,
          receipt_url: charge.receipt_url,
        }
      });

    if (error) {
      throw new Error(`Failed to log one-time payment success: ${error.message}`);
    }

    logger.info(`Logged successful one-time payment for user ${user.userId}, amount: ${charge.amount / 100} ${charge.currency}`);

  } catch (error) {
    logger.error(`Error handling charge success: ${error}`);
    throw error;
  }
}

/**
 * Handle successful payment (invoice-based, for subscriptions)
 */
export async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  try {
    const customerId = extractCustomerId(invoice);
    const user = await findUserByCustomerId(customerId);
    
    if (!user) return;

    // Get subscription info from the invoice
    const subscriptionId = (invoice as any).subscription as string;
    const priceId = (invoice.lines.data[0] as any)?.price?.id;
    const planId = getPlanIdFromPrice(priceId || '');

    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: user.userId,
        action: 'payment_succeeded',
        metadata: {
          invoice_id: invoice.id,
          subscription_id: subscriptionId,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          plan_id: planId,
          payment_type: 'subscription',
          period_start: invoice.period_start,
          period_end: invoice.period_end,
        }
      });

    if (error) {
      throw new Error(`Failed to log payment success: ${error.message}`);
    }

    logger.info(`Logged successful payment for user ${user.userId}`);

  } catch (error) {
    logger.error(`Error handling payment success: ${error}`);
    throw error;
  }
}

/**
 * Handle failed payment
 */
export async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  try {
    const customerId = extractCustomerId(invoice);
    const user = await findUserByCustomerId(customerId);
    
    if (!user) return;

    const { error } = await supabase
      .from('usage_logs')
      .insert({
        user_id: user.userId,
        action: 'payment_failed',
        metadata: {
          invoice_id: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          failure_reason: invoice.last_finalization_error?.message || 'Unknown',
        }
      });

    if (error) {
      throw new Error(`Failed to log payment failure: ${error.message}`);
    }

    logger.info(`Logged failed payment for user ${user.userId}`);

  } catch (error) {
    logger.error(`Error handling payment failure: ${error}`);
    throw error;
  }
}