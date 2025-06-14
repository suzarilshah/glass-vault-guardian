
import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { analyzePasswordStrength, getStrengthColor, getStrengthText } from '@/utils/passwordStrength';

interface PasswordStrengthIndicatorProps {
  password: string;
  showWarning?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showWarning = true 
}) => {
  const strength = analyzePasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Shield className={`w-4 h-4 ${getStrengthColor(strength.score)}`} />
        <span className={`text-sm font-medium ${getStrengthColor(strength.score)}`}>
          {getStrengthText(strength.score)}
        </span>
      </div>
      
      {showWarning && strength.isWeak && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium text-sm">Weak Password Detected</span>
          </div>
          <ul className="text-red-300 text-xs space-y-1">
            {strength.feedback.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
          <p className="text-red-300 text-xs mt-2 font-medium">
            Consider updating this password for better security.
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
