import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import logger from '../../logger';
import {
  createOrRetrieveCustomer,
  formatSubscriptionForResponse,
  getCustomerInvoices,
  getCustomerSubscription,
  stripe,
  SUBSCRIPTION_PLANS,
  validatePlanId,
} from '../../util/stripe';
import { ApiSchemas } from '../apiSchemas';
import { authenticateSupabaseUser, type AuthenticatedRequest } from '../middleware/auth';
import {
  handleCustomerCreated,
  handleSubscriptionUpdate,
  handleSubscriptionDeleted,
  handlePaymentSucceeded,
  handlePaymentFailed,
  handleChargeSucceeded,
} from '../services/webhookService';

export const stripeRouter = Router();

// Get available subscription plans
stripeRouter.get('/plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      discountedPrice: plan.discountedPrice,
      active: plan.active,
      interval: plan.interval,
      features: plan.features,
      priceId: plan.priceId,
      isPopular: plan.id === 'business_scan', // Mark business_scan as popular
    }));

    res.json(plans);
  } catch (error) {
    logger.error(`Error fetching subscription plans: ${error}`);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Create Stripe Checkout Session
stripeRouter.post(
  '/create-checkout-session',
  authenticateSupabaseUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { priceId, successUrl, cancelUrl } =
        ApiSchemas.Stripe.CreateCheckoutSession.Request.parse(req.body);

      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get the plan ID from priceId to validate it exists
      const planId = Object.keys(SUBSCRIPTION_PLANS).find(
        (key) => SUBSCRIPTION_PLANS[key as keyof typeof SUBSCRIPTION_PLANS].priceId === priceId,
      );

      if (!planId || !validatePlanId(planId)) {
        res.status(400).json({ error: 'Invalid plan ID' });
        return;
      }

      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];

      // Create or retrieve Stripe customer
      const customer = await createOrRetrieveCustomer(
        req.user.id,
        req.profile?.email || req.user.email || '',
        { source: 'promptfoo_subscription' },
      );

      // For recurring subscriptions, check for existing active subscription
      if (plan.interval !== 'one-off') {
        const existingSubscription = await getCustomerSubscription(customer.id);
        if (existingSubscription && existingSubscription.status === 'active') {
          res.status(400).json({
            error: 'Customer already has an active subscription',
            subscription: formatSubscriptionForResponse(existingSubscription, customer),
          });
          return;
        }
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: plan.interval === 'one-off' ? 'payment' : 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: req.user.id,
          planId,
        },
      });

      if (!session.url) {
        throw new Error('Failed to create checkout session URL');
      }

      res.json(
        ApiSchemas.Stripe.CreateCheckoutSession.Response.parse({
          url: session.url,
        }),
      );
    } catch (error) {
      logger.error(`Error creating checkout session: ${error}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: 'Failed to create checkout session' });
      }
    }
  },
);

// Create Stripe Customer Portal Session
stripeRouter.post(
  '/create-portal-session',
  authenticateSupabaseUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { returnUrl } = ApiSchemas.Stripe.CreatePortalSession.Request.parse(req.body);

      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Create or retrieve Stripe customer
      const customer = await createOrRetrieveCustomer(
        req.user.id,
        req.profile?.email || req.user.email || '',
      );

      // Create Stripe portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: returnUrl,
      });

      res.json(
        ApiSchemas.Stripe.CreatePortalSession.Response.parse({
          url: session.url,
        }),
      );
    } catch (error) {
      logger.error(`Error creating portal session: ${error}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: 'Failed to create portal session' });
      }
    }
  },
);

// Get current subscription
stripeRouter.get(
  '/subscription',
  authenticateSupabaseUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Create or retrieve Stripe customer
      const customer = await createOrRetrieveCustomer(req.user.id, req.user.email || '');

      // Get current subscription
      const subscription = await getCustomerSubscription(customer.id);

      if (!subscription) {
        res.status(404).json({ error: 'No subscription found' });
        return;
      }

      // Get recent invoices
      const invoices = await getCustomerInvoices(customer.id, 10);

      const formattedSubscription = formatSubscriptionForResponse(subscription, customer, invoices);

      res.json(ApiSchemas.Stripe.Subscription.Get.Response.parse(formattedSubscription));
    } catch (error) {
      logger.error(`Error fetching subscription: ${error}`);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  },
);

// Update subscription (e.g., cancel)
stripeRouter.patch(
  '/subscription',
  authenticateSupabaseUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { status, planId } = ApiSchemas.Stripe.Subscription.Update.Request.parse(req.body);

      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Create or retrieve Stripe customer
      const customer = await createOrRetrieveCustomer(req.user.id, req.user.email || '');

      // Get current subscription
      const subscription = await getCustomerSubscription(customer.id);

      if (!subscription) {
        res.status(404).json({ error: 'No subscription found' });
        return;
      }

      let updatedSubscription = subscription;

      // Handle cancellation
      if (status === 'canceled') {
        updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        });
        logger.info(`Subscription ${subscription.id} scheduled for cancellation at period end`);
      }

      // Handle plan change
      if (planId && validatePlanId(planId)) {
        const newPlan = SUBSCRIPTION_PLANS[planId];
        updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPlan.priceId,
            },
          ],
          proration_behavior: 'create_prorations',
        });
        logger.info(`Subscription ${subscription.id} changed to plan ${planId}`);
      }

      const formattedSubscription = formatSubscriptionForResponse(updatedSubscription, customer);

      res.json(ApiSchemas.Stripe.Subscription.Update.Response.parse(formattedSubscription));
    } catch (error) {
      logger.error(`Error updating subscription: ${error}`);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromError(error).toString() });
      } else {
        res.status(500).json({ error: 'Failed to update subscription' });
      }
    }
  },
);

// Get one-off payments for a user
stripeRouter.get(
  '/payments/one-off',
  authenticateSupabaseUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Create or retrieve Stripe customer
      const customer = await createOrRetrieveCustomer(req.user.id, req.user.email || '');

      // Get all charges
      const charges = await stripe.charges.list({
        customer: customer.id,
        limit: 50,
      });

      logger.info(`Found ${charges.data.length} total charges for customer ${customer.id}`);

      // Filter for one-off payments (not associated with subscriptions)
      const oneOffPayments = charges.data
        .filter((charge) => {
          const hasInvoice = (charge as any).invoice != null; // This checks for both null AND undefined
          const isOneTimePayment = !hasInvoice && charge.status === 'succeeded';

          logger.info(
            `Charge ${charge.id}: invoice=${JSON.stringify((charge as any).invoice)}, hasInvoice=${hasInvoice}, isOneTime=${isOneTimePayment}, amount=${charge.amount}, status=${charge.status}`,
          );
          return isOneTimePayment;
        })
        .map((charge) => ({
          id: charge.id,
          amount: charge.amount,
          date: charge.created,
          status: charge.status,
          description: charge.description || 'One-time purchase',
          downloadUrl: charge.receipt_url || '',
        }));

      logger.info(
        `Returning ${oneOffPayments.length} one-off payments for customer ${customer.id}`,
      );
      res.json(oneOffPayments);
    } catch (error) {
      logger.error(`Error fetching one-off payments: ${error}`);
      res.status(500).json({ error: 'Failed to fetch one-off payments' });
    }
  },
);

// Download billing invoices
stripeRouter.get(
  '/billing/download',
  authenticateSupabaseUser,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Create or retrieve Stripe customer
      const customer = await createOrRetrieveCustomer(req.user.id, req.user.email || '');

      // Get all invoices
      const invoices = await getCustomerInvoices(customer.id, 100);

      if (invoices.length === 0) {
        res.status(404).json({ error: 'No invoices found' });
        return;
      }

      // Create CSV content
      const csvHeader = 'Date,Amount,Status,Description,Invoice URL\n';
      const csvRows = invoices
        .map((invoice) => {
          const date = new Date(invoice.created * 1000).toISOString().split('T')[0];
          const amount = (invoice.amount_paid / 100).toFixed(2);
          const status = invoice.status || 'unknown';
          const description = invoice.description || 'Subscription payment';
          const url = invoice.hosted_invoice_url || '';
          return `${date},$${amount},${status},"${description}",${url}`;
        })
        .join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="billing-history.csv"');
      res.send(csvContent);
    } catch (error) {
      logger.error(`Error downloading billing history: ${error}`);
      res.status(500).json({ error: 'Failed to download billing history' });
    }
  },
);

// Stripe webhook handler
stripeRouter.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    logger.error('Stripe webhook secret not configured');
    res.status(400).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body as unknown as Buffer, sig, endpointSecret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err}`);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  logger.info(`Received Stripe webhook: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case 'customer.created':
        const customer = event.data.object;
        logger.info(`Customer created: ${customer.id}`);
        await handleCustomerCreated(customer as any);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        logger.info(`Subscription ${event.type}: ${subscription.id}`);
        await handleSubscriptionUpdate(subscription as any);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        logger.info(`Subscription deleted: ${deletedSubscription.id}`);
        await handleSubscriptionDeleted(deletedSubscription as any);
        break;

      case 'charge.succeeded':
        const charge = event.data.object;
        logger.info(`Charge succeeded: ${charge.id}`);
        await handleChargeSucceeded(charge as any);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        logger.info(`Invoice payment succeeded: ${invoice.id}`);
        await handlePaymentSucceeded(invoice as any);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        logger.warn(`Invoice payment failed: ${failedInvoice.id}`);
        await handlePaymentFailed(failedInvoice as any);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json(ApiSchemas.Stripe.Webhook.Response.parse({ received: true }));
  } catch (error) {
    logger.error(`Error processing webhook: ${error}`);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});
