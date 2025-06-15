
import React from 'react';
import { Shield } from 'lucide-react';

interface PasswordSecurityMetricsProps {
  entropy: number;
  crackTime: { humanReadable: string };
}

const PasswordSecurityMetrics: React.FC<PasswordSecurityMetricsProps> = ({
  entropy,
  crackTime
}) => {
  const getSecurityLevel = (entropy: number) => {
    if (entropy < 28) return { level: 'Very Weak', color: 'text-red-400', bg: 'bg-red-500' };
    if (entropy < 36) return { level: 'Weak', color: 'text-orange-400', bg: 'bg-orange-500' };
    if (entropy < 60) return { level: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500' };
    if (entropy < 128) return { level: 'Strong', color: 'text-blue-400', bg: 'bg-blue-500' };
    return { level: 'Very Strong', color: 'text-green-400', bg: 'bg-green-500' };
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-option p-4 rounded-lg border border-white/10">
          <div className="text-sm text-gray-300 mb-1">Entropy</div>
          <div className="text-xl font-semibold text-white">
            {entropy.toFixed(1)} bits
          </div>
        </div>

        <div className="glass-option p-4 rounded-lg border border-white/10">
          <div className="text-sm text-gray-300 mb-1">Security Level</div>
          <div className={`text-xl font-semibold ${getSecurityLevel(entropy).color}`}>
            {getSecurityLevel(entropy).level}
          </div>
        </div>
      </div>

      <div className="glass-option p-4 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-green-400" />
          <div className="text-sm text-gray-300">Time to crack (average)</div>
        </div>
        <div className="text-2xl font-bold text-green-400">
          {crackTime.humanReadable}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Assuming 1 billion guesses per second
        </div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        Note: Actual crack time varies based on attack method, hardware, and password complexity
      </div>
    </>
  );
};

export default PasswordSecurityMetrics;
