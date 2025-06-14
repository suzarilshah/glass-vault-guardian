
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { validateApiKeyFormat, getApiKeyStrength } from '@/utils/apiKeyValidation';

interface ApiKeyValidationDisplayProps {
  apiKey: string;
}

const ApiKeyValidationDisplay: React.FC<ApiKeyValidationDisplayProps> = ({ apiKey }) => {
  if (!apiKey) return null;

  const apiKeyValidation = validateApiKeyFormat(apiKey);
  const apiKeyStrength = getApiKeyStrength(apiKey);

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'weak': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {apiKeyValidation.service && (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          {apiKeyValidation.service} Detected
        </Badge>
      )}
      <Badge className={`bg-gray-500/20 border-gray-500/30 ${getStrengthColor(apiKeyStrength.strength)}`}>
        {apiKeyStrength.strength.toUpperCase()} ({apiKeyStrength.score}%)
      </Badge>
    </div>
  );
};

export default ApiKeyValidationDisplay;
