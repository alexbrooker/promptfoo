import { supabase } from '@app/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { create } from 'zustand';

export interface OnboardingData {
  name?: string;
  company?: string;
  chatbotRole?: string;
  industry?: string;
  useCase?: string;
  complianceNeeds?: string[];
  countryOfOperation?: string;
  termsAccepted?: boolean;
  onboardingCompleted?: boolean;
  scanCredits?: number;
  creditsUsed?: number;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  onboardingData: OnboardingData;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  saveOnboardingToProfile: () => Promise<void>;
  fetchOnboardingData: () => Promise<void>;
  consumeScanCredit: () => Promise<void>;
  refundScanCredit: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  onboardingData: {},
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    set({ user: data.user });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  fetchUser: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      set({ user, isLoading: false });
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ user: null, isLoading: false });
    }
  },
  updateOnboardingData: (data: Partial<OnboardingData>) => {
    set((state) => ({
      onboardingData: { ...state.onboardingData, ...data },
    }));
  },
  saveOnboardingToProfile: async () => {
    const { user, onboardingData } = get();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Map camelCase fields to snake_case for database
    const profileData = {
      id: user.id,
      email: user.email,
      name: onboardingData.name,
      company: onboardingData.company,
      chatbot_role: onboardingData.chatbotRole,
      industry: onboardingData.industry,
      use_case: onboardingData.useCase,
      compliance_needs: onboardingData.complianceNeeds,
      country_of_operation: onboardingData.countryOfOperation,
      terms_accepted: onboardingData.termsAccepted,
      onboarding_completed: onboardingData.onboardingCompleted,
      scan_credits: onboardingData.scanCredits,
      credits_used: onboardingData.creditsUsed,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(profileData);

    if (error) {
      throw error;
    }
  },
  fetchOnboardingData: async () => {
    const { user } = get();
    if (!user) {
      return;
    }

    // Force fresh data from database (bypass cache)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching onboarding data:', error);
      return;
    }

    if (data) {
      const newOnboardingData = {
        name: data.name,
        company: data.company,
        chatbotRole: data.chatbot_role,
        industry: data.industry,
        useCase: data.use_case,
        complianceNeeds: data.compliance_needs || [],
        countryOfOperation: data.country_of_operation,
        termsAccepted: data.terms_accepted,
        onboardingCompleted: data.onboarding_completed,
        scanCredits: data.scan_credits || 0,
        creditsUsed: data.credits_used || 0,
      };

      console.log('Fetched onboarding data:', newOnboardingData);
      set({ onboardingData: newOnboardingData });
    }
  },
  consumeScanCredit: async () => {
    const { user, onboardingData } = get();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const currentCredits = onboardingData.scanCredits || 0;
    const currentUsed = onboardingData.creditsUsed || 0;

    if (currentCredits <= 0) {
      throw new Error('No scan credits available');
    }

    const updatedData = {
      scanCredits: currentCredits - 1,
      creditsUsed: currentUsed + 1,
    };

    // Update database
    const { error } = await supabase
      .from('profiles')
      .update({
        scan_credits: updatedData.scanCredits,
        credits_used: updatedData.creditsUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    // Update local state
    set((state) => ({
      onboardingData: { ...state.onboardingData, ...updatedData },
    }));
  },
  refundScanCredit: async () => {
    const { user, onboardingData } = get();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const currentCredits = onboardingData.scanCredits || 0;
    const currentUsed = onboardingData.creditsUsed || 0;

    const updatedData = {
      scanCredits: currentCredits + 1,
      creditsUsed: Math.max(0, currentUsed - 1),
    };

    // Update database
    const { error } = await supabase
      .from('profiles')
      .update({
        scan_credits: updatedData.scanCredits,
        credits_used: updatedData.creditsUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    // Update local state
    set((state) => ({
      onboardingData: { ...state.onboardingData, ...updatedData },
    }));
  },
}));
