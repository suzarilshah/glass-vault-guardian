
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Zap } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface UpgradePromptProps {
  feature: string;
  description: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, description }) => {
  const { createCheckout } = useSubscription();

  return (
    <Card className="p-8 bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-400/50 text-center backdrop-blur-sm">
      <div className="flex justify-center mb-6">
        <Shield className="w-16 h-16 text-green-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-4">
        Unlock {feature} with Shielder Pro
      </h2>
      
      <p className="text-gray-200 mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-center text-green-300">
          <Lock className="w-5 h-5 mr-2" />
          <span>Secure Password, API & Certificate Vaults</span>
        </div>
        <div className="flex items-center justify-center text-green-300">
          <Zap className="w-5 h-5 mr-2" />
          <span>Unlimited AI Features</span>
        </div>
        <div className="flex items-center justify-center text-green-300">
          <Shield className="w-5 h-5 mr-2" />
          <span>Advanced Organization & Import/Export</span>
        </div>
      </div>
      
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-white">$6<span className="text-lg text-gray-300">/month</span></div>
        <div className="text-sm text-gray-300">Cancel anytime</div>
      </div>
      
      <Button
        onClick={createCheckout}
        size="lg"
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold w-full transition-colors duration-200"
      >
        <Shield className="w-5 h-5 mr-2" />
        Upgrade to Pro
      </Button>
    </Card>
  );
};

export default UpgradePrompt;
