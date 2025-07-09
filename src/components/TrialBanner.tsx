import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Clock, Crown } from "lucide-react";

const TrialBanner = () => {
  const { subscription, isTrialActive, getDaysRemainingInTrial, createCheckout } = useSubscription();

  if (!subscription || !isTrialActive()) return null;

  const daysRemaining = getDaysRemainingInTrial();
  const isLastDay = daysRemaining <= 1;

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5" />
          <div>
            <p className="font-semibold">Pro Trial Active</p>
            <p className="text-sm opacity-90">
              {isLastDay ? "Trial expires today!" : `${daysRemaining} days remaining`}
            </p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          onClick={createCheckout}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default TrialBanner;