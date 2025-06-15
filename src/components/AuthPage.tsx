
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import SocialAuthButtons from './auth/SocialAuthButtons';
import AuthForm from './auth/AuthForm';
import MFAForm from './auth/MFAForm';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMfaChallenge, setIsMfaChallenge] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [showVerificationReminder, setShowVerificationReminder] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
      <Card className="glass-card w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border-white/20">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {isMfaChallenge ? 'Enter 2FA Code' : (isSignUp ? 'Create Account' : 'Welcome Back')}
          </h1>
          <p className="text-gray-400">
            {isMfaChallenge ? 'Enter the code from your authenticator app.' : (isSignUp ? 'Sign up for PW Shield' : 'Sign in to your account')}
          </p>
        </div>

        {/* Verification Reminder after signup */}
        {!isSignUp && showVerificationReminder && (
          <div className="mb-5 bg-blue-900/60 border border-blue-500 rounded px-4 py-3 flex items-center justify-between">
            <span className="text-blue-200 text-sm">
              Please check your email and verify your account before logging in.
            </span>
            <button
              aria-label="Dismiss reminder"
              onClick={() => setShowVerificationReminder(false)}
              className="ml-4 rounded-full hover:bg-blue-800/80 text-blue-200 transition p-1"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" className="inline-block align-middle">
                <line x1="4" y1="4" x2="12" y2="12" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
                <line x1="4" y1="12" x2="12" y2="4" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}

        {isMfaChallenge ? (
          <MFAForm
            mfaCode={mfaCode}
            setMfaCode={setMfaCode}
            loading={loading}
            setLoading={setLoading}
            setIsMfaChallenge={setIsMfaChallenge}
          />
        ) : (
          <>
            <SocialAuthButtons
              isSignUp={isSignUp}
              loading={loading}
              setLoading={setLoading}
            />

            <AuthForm
              isSignUp={isSignUp}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              setLoading={setLoading}
              setIsMfaChallenge={setIsMfaChallenge}
              setIsSignUp={setIsSignUp}
              setShowVerificationReminder={setShowVerificationReminder}
            />

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setShowVerificationReminder(false); }}
                className="text-green-400 hover:text-green-300 text-sm"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthPage;
