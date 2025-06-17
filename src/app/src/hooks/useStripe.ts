import { useState, useCallback } from 'react';
import { callAuthenticatedApi } from '@app/utils/api';

interface UseStripeReturn {
  loading: boolean;
  error: string | null;
  createCheckoutSession: (priceId: string, planDetails?: { interval: string; name: string }) => Promise<void>;
  createPortalSession: () => Promise<void>;
}

export function useStripe(): UseStripeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckoutSession = useCallback(async (priceId: string, planDetails?: { interval: string; name: string }) => {
    setLoading(true);
    setError(null);

    try {
      // Different success URLs based on plan type
      const isOneTime = planDetails?.interval === 'one-off';
      const successUrl = isOneTime 
        ? `${window.location.origin}/subscription/success?type=one-time&plan=${encodeURIComponent(planDetails.name)}`
        : `${window.location.origin}/subscription/success?type=subscription&plan=${encodeURIComponent(planDetails?.name || 'Unknown Plan')}`;

      const response = await callAuthenticatedApi('/stripe/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({
          priceId,
          successUrl,
          cancelUrl: `${window.location.origin}/subscription?canceled=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Stripe checkout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPortalSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await callAuthenticatedApi('/stripe/create-portal-session', {
        method: 'POST',
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/subscription`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create portal session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Stripe portal error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCheckoutSession,
    createPortalSession,
  };
}