
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Zap, AlertTriangle } from 'lucide-react';

const UsageMeter: React.FC = () => {
  const { subscription, usage } = useSubscription();

  if (!subscription || subscription.subscription_tier === 'pro') return null;

  const limit = 5;
  const generationUsage = usage?.ai_password_generations || 0;
  const analysisUsage = usage?.ai_password_analyses || 0;

  return (
    <Card className="glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20 mb-6">
      <div className="flex items-center mb-3">
        <Zap className="w-5 h-5 text-yellow-400 mr-2" />
        <h3 className="text-white font-semibold">Daily Usage (Free Plan)</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>AI Password Generation</span>
            <span>{generationUsage}/{limit}</span>
          </div>
          <Progress 
            value={(generationUsage / limit) * 100} 
            className="h-2"
          />
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-gray-300 mb-1">
            <span>AI Password Analysis</span>
            <span>{analysisUsage}/{limit}</span>
          </div>
          <Progress 
            value={(analysisUsage / limit) * 100} 
            className="h-2"
          />
        </div>
      </div>
      
      {(generationUsage >= limit || analysisUsage >= limit) && (
        <div className="flex items-center mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />
          <span className="text-sm text-yellow-400">
            Daily limit reached. Resets at 12:00 AM GMT.
          </span>
        </div>
      )}
      
      <p className="text-xs text-gray-400 mt-3">
        Upgrade to Pro for unlimited AI features and access to secure vaults.
      </p>
    </Card>
  );
};

export default UsageMeter;
