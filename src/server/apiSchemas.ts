import { z } from 'zod';

const EmailSchema = z.string().email();

export const ApiSchemas = {
  User: {
    Get: {
      Response: z.object({
        email: EmailSchema.nullable(),
      }),
    },
    Update: {
      Request: z.object({
        email: EmailSchema,
      }),
      Response: z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    },
    EmailStatus: {
      Response: z.object({
        hasEmail: z.boolean(),
        email: EmailSchema.optional(),
        status: z.enum(['ok', 'exceeded_limit', 'show_usage_warning', 'no_email']),
        message: z.string().optional(),
      }),
    },
  },
  Eval: {
    UpdateAuthor: {
      Params: z.object({
        id: z.string(),
      }),
      Request: z.object({
        author: z.string().email(),
      }),
      Response: z.object({
        message: z.string(),
      }),
    },
  },
  Stripe: {
    CreateCheckoutSession: {
      Request: z.object({
        priceId: z.string(),
        customerId: z.string().optional(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      }),
      Response: z.object({
        url: z.string().url(),
      }),
    },
    CreatePortalSession: {
      Request: z.object({
        returnUrl: z.string().url(),
      }),
      Response: z.object({
        url: z.string().url(),
      }),
    },
    Subscription: {
      Get: {
        Response: z.object({
          id: z.string(),
          status: z.enum(['active', 'canceled', 'past_due', 'unpaid', 'incomplete']),
          planId: z.string(),
          planName: z.string(),
          price: z.number(),
          interval: z.enum(['month', 'year']),
          currentPeriodStart: z.number(),
          currentPeriodEnd: z.number(),
          cancelAtPeriodEnd: z.boolean(),
          customerId: z.string(),
          invoices: z
            .array(
              z.object({
                id: z.string(),
                amount: z.number(),
                date: z.number(),
                status: z.string(),
                downloadUrl: z.string(),
              }),
            )
            .optional(),
        }),
      },
      Update: {
        Request: z.object({
          status: z.enum(['canceled']).optional(),
          planId: z.string().optional(),
        }),
        Response: z.object({
          id: z.string(),
          status: z.enum(['active', 'canceled', 'past_due', 'unpaid', 'incomplete']),
          planId: z.string(),
          planName: z.string(),
          price: z.number(),
          interval: z.enum(['month', 'year']),
          currentPeriodStart: z.number(),
          currentPeriodEnd: z.number(),
          cancelAtPeriodEnd: z.boolean(),
          customerId: z.string(),
        }),
      },
    },
    Webhook: {
      Request: z.object({
        id: z.string(),
        object: z.literal('event'),
        type: z.string(),
        data: z.object({
          object: z.any(),
        }),
      }),
      Response: z.object({
        received: z.boolean(),
      }),
    },
  },
};
