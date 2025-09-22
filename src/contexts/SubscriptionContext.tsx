import React, { createContext, useContext } from 'react';

interface SubscriptionContextType {
  canUseFeature: (feature: 'ai_generation' | 'ai_analysis' | 'vault') => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always allow access to all features since the app is now completely free
  const canUseFeature = () => true;

  return (
    <SubscriptionContext.Provider value={{
      canUseFeature,
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
