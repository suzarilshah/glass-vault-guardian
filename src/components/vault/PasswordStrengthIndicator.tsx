
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { analyzePasswordStrength, getPasswordStrengthColor, getPasswordStrengthText } from '@/utils/passwordStrength';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  if (!password) return null;

  const analysis = analyzePasswordStrength(password);
  const strengthColor = getPasswordStrengthColor(analysis.score);
  const strengthText = getPasswordStrengthText(analysis.score);

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">Password Strength:</span>
        <span className={`text-sm font-medium ${strengthColor}`}>
          {strengthText}
        </span>
      </div>
      
      {analysis.isWeak && (
        <div className="bg-red-900/20 border border-red-500/50 rounded p-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Weak Password Detected</span>
          </div>
          <ul className="text-xs text-red-300 space-y-1">
            {analysis.feedback.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
