
export interface ApiKeyPattern {
  name: string;
  pattern: RegExp;
  description: string;
}

export const API_KEY_PATTERNS: ApiKeyPattern[] = [
  {
    name: 'OpenAI',
    pattern: /^sk-[a-zA-Z0-9]{48}$/,
    description: 'OpenAI API keys start with "sk-" followed by 48 characters'
  },
  {
    name: 'Stripe',
    pattern: /^sk_(test|live)_[a-zA-Z0-9]{24}$/,
    description: 'Stripe keys start with "sk_test_" or "sk_live_" followed by 24 characters'
  },
  {
    name: 'AWS',
    pattern: /^AKIA[0-9A-Z]{16}$/,
    description: 'AWS Access Keys start with "AKIA" followed by 16 characters'
  },
  {
    name: 'Google',
    pattern: /^AIza[0-9A-Za-z_-]{35}$/,
    description: 'Google API keys start with "AIza" followed by 35 characters'
  },
  {
    name: 'GitHub',
    pattern: /^(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}$/,
    description: 'GitHub tokens start with prefixes like "ghp_", "gho_", etc.'
  }
];

export const detectApiService = (apiKey: string): string | null => {
  for (const pattern of API_KEY_PATTERNS) {
    if (pattern.pattern.test(apiKey)) {
      return pattern.name;
    }
  }
  return null;
};

export const validateApiKeyFormat = (apiKey: string): { isValid: boolean; service?: string; message: string } => {
  if (!apiKey || apiKey.length < 8) {
    return { isValid: false, message: 'API key is too short' };
  }

  const service = detectApiService(apiKey);
  if (service) {
    return { isValid: true, service, message: `Valid ${service} API key format` };
  }

  return { isValid: true, message: 'API key format not recognized but appears valid' };
};

export const getApiKeyStrength = (apiKey: string): { strength: 'weak' | 'medium' | 'strong'; score: number } => {
  let score = 0;
  
  if (apiKey.length >= 32) score += 25;
  else if (apiKey.length >= 20) score += 15;
  else if (apiKey.length >= 12) score += 10;
  
  if (/[A-Z]/.test(apiKey)) score += 15;
  if (/[a-z]/.test(apiKey)) score += 15;
  if (/[0-9]/.test(apiKey)) score += 15;
  if (/[^A-Za-z0-9]/.test(apiKey)) score += 20;
  
  const hasPrefix = API_KEY_PATTERNS.some(p => p.pattern.test(apiKey));
  if (hasPrefix) score += 10;
  
  if (score >= 80) return { strength: 'strong', score };
  if (score >= 50) return { strength: 'medium', score };
  return { strength: 'weak', score };
};
