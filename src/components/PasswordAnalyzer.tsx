
import React, { useState } from 'react';
import { Shield, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { calculateCrackTime, calculatePasswordEntropy } from '@/utils/passwordUtils';

const PasswordAnalyzer = () => {
  const [testPassword, setTestPassword] = useState('');
  const [analysis, setAnalysis] = useState<{
    entropy: number;
    crackTime: { seconds: number; humanReadable: string };
  } | null>(null);

  const analyzePassword = () => {
    if (!testPassword) {
      setAnalysis(null);
      return;
    }

    const entropy = calculatePasswordEntropy(testPassword);
    const crackTime = calculateCrackTime(testPassword);
    
    setAnalysis({ entropy, crackTime });
  };

  const getSecurityLevel = (entropy: number) => {
    if (entropy < 28) return { level: 'Very Weak', color: 'text-red-400', bg: 'bg-red-500' };
    if (entropy < 36) return { level: 'Weak', color: 'text-orange-400', bg: 'bg-orange-500' };
    if (entropy < 60) return { level: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500' };
    if (entropy < 128) return { level: 'Strong', color: 'text-blue-400', bg: 'bg-blue-500' };
    return { level: 'Very Strong', color: 'text-green-400', bg: 'bg-green-500' };
  };

  return (
    <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Password Analyzer</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Enter password to analyze
            </label>
            <Input
              type="password"
              value={testPassword}
              onChange={(e) => {
                setTestPassword(e.target.value);
                analyzePassword();
              }}
              placeholder="Enter a password to check crack time"
              className="glass-input border-white/20 bg-white/5 text-white placeholder:text-gray-400"
            />
          </div>

          {analysis && testPassword && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-option p-4 rounded-lg border border-white/10">
                  <div className="text-sm text-gray-300 mb-1">Entropy</div>
                  <div className="text-xl font-semibold text-white">
                    {analysis.entropy.toFixed(1)} bits
                  </div>
                </div>

                <div className="glass-option p-4 rounded-lg border border-white/10">
                  <div className="text-sm text-gray-300 mb-1">Security Level</div>
                  <div className={`text-xl font-semibold ${getSecurityLevel(analysis.entropy).color}`}>
                    {getSecurityLevel(analysis.entropy).level}
                  </div>
                </div>
              </div>

              <div className="glass-option p-4 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <div className="text-sm text-gray-300">Time to crack (average)</div>
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {analysis.crackTime.humanReadable}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Assuming 1 billion guesses per second
                </div>
              </div>

              <div className="text-xs text-gray-400 text-center">
                Note: Actual crack time varies based on attack method, hardware, and password complexity
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PasswordAnalyzer;
