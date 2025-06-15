
import React from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MFAFormProps {
  mfaCode: string;
  setMfaCode: (code: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setIsMfaChallenge: (challenge: boolean) => void;
}

const MFAForm: React.FC<MFAFormProps> = ({
  mfaCode,
  setMfaCode,
  loading,
  setLoading,
  setIsMfaChallenge
}) => {
  const { toast } = useToast();

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const factor = data.session?.user?.factors?.find(f => f.factor_type === 'totp' && f.status === 'verified');

    if (!factor) {
      toast({ title: "Error", description: "No 2FA method found. Please try logging in again.", variant: "destructive" });
      setLoading(false);
      setIsMfaChallenge(false);
      return;
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: mfaCode });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "Successfully signed in." });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleMfaSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-gray-300">Authentication Code</label>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={mfaCode} onChange={(value) => setMfaCode(value)}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full glass-button bg-green-600 hover:bg-green-700 text-white"
        disabled={loading}
      >
        {loading ? 'Verifying...' : 'Verify Code'}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={() => setIsMfaChallenge(false)}
        className="w-full text-green-400 hover:text-green-300"
      >
        Back to login
      </Button>
    </form>
  );
};

export default MFAForm;
