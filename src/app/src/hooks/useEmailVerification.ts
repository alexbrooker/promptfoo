import { useCallback } from 'react';
import { useUserStore } from '@app/stores/userStore';

interface EmailVerificationResult {
  canProceed: boolean;
  needsEmail: boolean;
  status: {
    hasEmail: boolean;
    email?: string;
    status: 'no_email' | 'ok';
    message?: string;
  };
  error: string | null;
}

export function useEmailVerification() {
  const { user } = useUserStore();
  const checkEmailStatus = useCallback(async (): Promise<EmailVerificationResult> => {
    if (!user?.email) {
      return {
        canProceed: false,
        needsEmail: true,
        status: {
          hasEmail: false,
          status: 'no_email',
          message: 'Email verification required',
        },
        error: null,
      };
    }

    return {
      canProceed: true,
      needsEmail: false,
      status: {
        hasEmail: true,
        email: user.email,
        status: 'ok',
      },
      error: null,
    };
  }, [user]);

  // Email updates should be handled through Supabase auth flow
  const saveEmail = useCallback(async (email: string): Promise<{ error?: string }> => {
    return { error: 'Email updates should be handled through account settings' };
  }, []);

  return { checkEmailStatus, saveEmail };
}
