import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: 'free' | 'pro' | 'trial';
  subscription_end?: string | null;
  is_trial?: boolean;
  trial_end?: string | null;
}

interface UsageData {
  ai_password_generations: number;
  ai_password_analyses: number;
  usage_date: string;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  usage: UsageData | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  createCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  canUseFeature: (feature: 'ai_generation' | 'ai_analysis' | 'vault') => boolean;
  incrementUsage: (type: 'ai_password_generations' | 'ai_password_analyses') => Promise<boolean>;
  isTrialActive: () => boolean;
  getDaysRemainingInTrial: () => number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscription = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setUsage(data || {
        ai_password_generations: 0,
        ai_password_analyses: 0,
        usage_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const createCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upgrade to Pro",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        console.error('Checkout error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }
      
      if (!data?.url) {
        throw new Error('No checkout URL received');
      }
      
      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecting to Checkout",
        description: "Opening Stripe checkout in a new tab...",
      });
    } catch (error) {
      console.error('Error creating checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Payment Error",
        description: `Failed to start checkout: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      // Open customer portal in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  const canUseFeature = (feature: 'ai_generation' | 'ai_analysis' | 'vault') => {
    if (!subscription) return false;
    
    // Pro users can use all features
    if (subscription.subscribed && subscription.subscription_tier === 'pro') {
      return true;
    }
    
    // Trial users get pro features during trial period
    if (subscription.subscription_tier === 'trial' && isTrialActive()) {
      return true;
    }
    
    // Free users have limited access
    if (subscription.subscription_tier === 'free' || (subscription.subscription_tier === 'trial' && !isTrialActive())) {
      if (feature === 'vault') return true; // Basic vault access for free users
      
      if (!usage) return false;
      
      if (feature === 'ai_generation') {
        return usage.ai_password_generations < 3; // 3 generations per day for free
      }
      
      if (feature === 'ai_analysis') {
        return usage.ai_password_analyses < 3; // 3 analyses per day for free
      }
    }
    
    return false;
  };

  const isTrialActive = () => {
    if (!subscription || !subscription.is_trial || !subscription.trial_end) return false;
    return new Date(subscription.trial_end) > new Date();
  };

  const getDaysRemainingInTrial = () => {
    if (!subscription || !subscription.trial_end) return 0;
    const trialEnd = new Date(subscription.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const incrementUsage = async (type: 'ai_password_generations' | 'ai_password_analyses'): Promise<boolean> => {
    if (!user || !canUseFeature(type === 'ai_password_generations' ? 'ai_generation' : 'ai_analysis')) {
      return false;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('user_usage')
        .upsert({
          user_id: user.id,
          usage_date: today,
          [type]: (usage?.[type] || 0) + 1,
        }, {
          onConflict: 'user_id,usage_date'
        });

      if (error) throw error;
      
      // Refresh usage data
      await fetchUsage();
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
      fetchUsage();
    } else {
      setSubscription(null);
      setUsage(null);
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      usage,
      loading,
      checkSubscription,
      createCheckout,
      openCustomerPortal,
      canUseFeature,
      incrementUsage,
      isTrialActive,
      getDaysRemainingInTrial,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
