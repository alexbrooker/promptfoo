import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@app/lib/supabase';
import { useUserStore } from '@app/stores/userStore';

interface Invoice {
  id: string;
  amount: number;
  date: number;
  status: string;
  downloadUrl: string;
}

interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  planId: string;
  planName: string;
  price: number;
  discountedPrice?: number;
  interval: 'month' | 'year' | 'one-off';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  customerId: string;
  invoices?: Invoice[];
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSubscription: (updates: Partial<Subscription>) => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('http://localhost:15500/api/stripe/subscription', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        // No subscription found - this is normal for new users
        setSubscription(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch subscription');
      }

      const subscriptionData = await response.json();
      setSubscription(subscriptionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Fetch subscription error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateSubscription = useCallback(
    async (updates: Partial<Subscription>) => {
      if (!user || !subscription) {
        setError('User not authenticated or no subscription found');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get the current session token
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          throw new Error('No access token found');
        }

        const response = await fetch('http://localhost:15500/api/stripe/subscription', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update subscription');
        }

        const updatedSubscription = await response.json();
        setSubscription(updatedSubscription);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Update subscription error:', err);
      } finally {
        setLoading(false);
      }
    },
    [user, subscription],
  );

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    updateSubscription,
  };
}
