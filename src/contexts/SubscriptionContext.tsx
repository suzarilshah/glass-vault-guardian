
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: 'free' | 'pro';
  subscription_end?: string | null;
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
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      
      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      });
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

  const canUseFeature = (feature: 'ai_generation' | 'ai_analysis' | 'vault'): boolean => {
    if (!subscription) return false;
    
    if (subscription.subscription_tier === 'pro') return true;
    
    if (feature === 'vault') return false;
    
    if (!usage) return true; // Allow if usage not loaded yet
    
    const limit = 5;
    if (feature === 'ai_generation') {
      return usage.ai_password_generations < limit;
    }
    if (feature === 'ai_analysis') {
      return usage.ai_password_analyses < limit;
    }
    
    return false;
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
