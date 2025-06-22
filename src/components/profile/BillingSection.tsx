
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, CreditCard, Calendar, Zap, CheckCircle, AlertCircle } from 'lucide-react';

const BillingSection: React.FC = () => {
  const { subscription, loading, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    // Check for success/cancel params and show toast
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "Payment Successful!",
        description: "Welcome to Shielder Pro! Your subscription is now active.",
      });
      // Remove params from URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh subscription status
      checkSubscription();
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your subscription was not activated. You can try again anytime.",
        variant: "destructive",
      });
      // Remove params from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
        <div className="text-white">Loading billing information...</div>
      </Card>
    );
  }

  const isPro = subscription?.subscription_tier === 'pro';
  const isSubscribed = subscription?.subscribed || false;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-400" />
            Current Plan
          </h3>
          <Badge 
            className={isPro ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}
          >
            {isPro ? 'Pro' : 'Free'}
          </Badge>
        </div>

        <div className="space-y-4">
          {isPro ? (
            <div className="space-y-3">
              <div className="flex items-center text-green-400">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>Shielder Pro - $6.00/month</span>
              </div>
              
              {subscription?.subscription_end && (
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-5 h-5 mr-2" />
                  <span>Next billing date: {new Date(subscription.subscription_end).toLocaleDateString()}</span>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <div className="flex items-center text-green-400">
                  <Zap className="w-4 h-4 mr-2" />
                  <span className="text-sm">Unlimited AI Password Generator & Analyzer</span>
                </div>
                <div className="flex items-center text-green-400">
                  <Shield className="w-4 h-4 mr-2" />
                  <span className="text-sm">Access to all secure vaults</span>
                </div>
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Advanced organization and import/export</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>Free Plan - Limited Features</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-400">
                  <span className="text-sm">• AI Password Generator (5/day)</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <span className="text-sm">• AI Password Analyzer (5/day)</span>
                </div>
                <div className="flex items-center text-red-400">
                  <span className="text-sm">• No vault access</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-green-400" />
          Billing Management
        </h3>

        <div className="space-y-4">
          {!isPro ? (
            <div>
              <p className="text-gray-300 mb-4">
                Upgrade to Shielder Pro to unlock all features including secure vaults, unlimited AI capabilities, and advanced organization tools.
              </p>
              <Button
                onClick={createCheckout}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Upgrade to Pro - $6/month
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-gray-300 mb-4">
                Manage your subscription, update payment methods, view invoices, and more through the Stripe Customer Portal.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={openCustomerPortal}
                  variant="outline"
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
                <Button
                  onClick={checkSubscription}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Refresh Status
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Feature Comparison */}
      {!isPro && (
        <Card className="glass-card p-6 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-400/30">
          <h3 className="text-xl font-semibold text-white mb-4">Why Upgrade to Pro?</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-400 mb-3">With Pro You Get:</h4>
              <div className="space-y-2">
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Unlimited AI features</span>
                </div>
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Secure Password Vault</span>
                </div>
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">API Keys & Secrets Vault</span>
                </div>
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Certificate Management</span>
                </div>
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Import/Export functionality</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-400 mb-3">Free Plan Limitations:</h4>
              <div className="space-y-2">
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Only 5 AI generations/day</span>
                </div>
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">No secure vaults</span>
                </div>
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">No organization features</span>
                </div>
                <div className="flex items-center text-red-400">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">No import/export</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              onClick={createCheckout}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              Start Your Pro Trial
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default BillingSection;
