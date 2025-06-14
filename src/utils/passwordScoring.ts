
interface PasswordScore {
  totalScore: number;
  breakdown: {
    length: number;
    uppercase: number;
    lowercase: number;
    numbers: number;
    specialChars: number;
    noDictionary: number;
    noRepetition: number;
  };
  strengthLevel: 'weak' | 'fair' | 'good' | 'strong';
  strengthColor: string;
  feedback: string;
  suggestions: string[];
}

// Common dictionary words and patterns to check against
const COMMON_PASSWORDS = [
  'password', 'pass', '123456', '12345678', 'qwerty', 'abc123', 'password1',
  'admin', 'login', 'welcome', 'monkey', 'letmein', 'dragon', 'princess',
  'football', 'iloveyou', 'master', 'sunshine', 'shadow', 'baseball'
];

const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertyuiop', 'asdf', 'asdfghjkl', 'zxcv', 'zxcvbnm',
  '1234', '12345', '123456', '1234567', '12345678', '123456789',
  'abcd', 'abcde', 'abcdef', 'abcdefg'
];

export const calculatePasswordScore = (password: string): PasswordScore => {
  const breakdown = {
    length: calculateLengthScore(password),
    uppercase: calculateUppercaseScore(password),
    lowercase: calculateLowercaseScore(password),
    numbers: calculateNumbersScore(password),
    specialChars: calculateSpecialCharsScore(password),
    noDictionary: calculateDictionaryScore(password),
    noRepetition: calculateRepetitionScore(password)
  };

  const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
  
  const { strengthLevel, strengthColor, feedback } = getStrengthCategory(totalScore);
  const suggestions = generateSuggestions(password, breakdown);

  return {
    totalScore,
    breakdown,
    strengthLevel,
    strengthColor,
    feedback,
    suggestions
  };
};

const calculateLengthScore = (password: string): number => {
  if (password.length < 8) return 0;
  if (password.length < 12) return 15;
  return 30;
};

const calculateUppercaseScore = (password: string): number => {
  return /[A-Z]/.test(password) ? 10 : 0;
};

const calculateLowercaseScore = (password: string): number => {
  return /[a-z]/.test(password) ? 10 : 0;
};

const calculateNumbersScore = (password: string): number => {
  return /[0-9]/.test(password) ? 10 : 0;
};

const calculateSpecialCharsScore = (password: string): number => {
  const specialChars = password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/g);
  if (!specialChars) return 0;
  if (specialChars.length === 1) return 10;
  return 15;
};

const calculateDictionaryScore = (password: string): number => {
  const lowerPassword = password.toLowerCase();
  
  // Check for exact matches with common passwords
  if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
    return 0;
  }
  
  // Check for keyboard patterns
  if (KEYBOARD_PATTERNS.some(pattern => lowerPassword.includes(pattern))) {
    return 0;
  }
  
  // Check for simple substitutions (e.g., @ for a, 0 for o)
  const substitutedPassword = lowerPassword
    .replace(/@/g, 'a')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't');
    
  if (COMMON_PASSWORDS.some(common => substitutedPassword.includes(common))) {
    return 0;
  }
  
  return 15;
};

const calculateRepetitionScore = (password: string): number => {
  // Check for repetitive characters (3+ in a row)
  if (/(.)\1{2,}/.test(password)) {
    return 0;
  }
  
  // Check for sequential characters
  for (let i = 0; i < password.length - 2; i++) {
    const char1 = password.charCodeAt(i);
    const char2 = password.charCodeAt(i + 1);
    const char3 = password.charCodeAt(i + 2);
    
    if (char2 === char1 + 1 && char3 === char2 + 1) {
      return 0; // Found sequential pattern
    }
  }
  
  return 10;
};

const getStrengthCategory = (score: number): { strengthLevel: 'weak' | 'fair' | 'good' | 'strong', strengthColor: string, feedback: string } => {
  if (score <= 40) {
    return {
      strengthLevel: 'weak',
      strengthColor: 'text-red-500',
      feedback: 'Password is too weak. Add more characters, variety, and avoid common patterns.'
    };
  } else if (score <= 60) {
    return {
      strengthLevel: 'fair',
      strengthColor: 'text-orange-500',
      feedback: 'Password is fair. Consider adding more length or special characters.'
    };
  } else if (score <= 80) {
    return {
      strengthLevel: 'good',
      strengthColor: 'text-yellow-500',
      feedback: 'Password is good, but could be stronger with additional complexity.'
    };
  } else {
    return {
      strengthLevel: 'strong',
      strengthColor: 'text-green-500',
      feedback: 'Great! This is a strong password.'
    };
  }
};

const generateSuggestions = (password: string, breakdown: any): string[] => {
  const suggestions = [];
  
  if (breakdown.length < 30) {
    if (password.length < 8) {
      suggestions.push('Use at least 8 characters (recommended: 12+)');
    } else {
      suggestions.push('Consider using 12+ characters for better security');
    }
  }
  
  if (breakdown.uppercase === 0) {
    suggestions.push('Add at least one uppercase letter (A-Z)');
  }
  
  if (breakdown.lowercase === 0) {
    suggestions.push('Add at least one lowercase letter (a-z)');
  }
  
  if (breakdown.numbers === 0) {
    suggestions.push('Add at least one number (0-9)');
  }
  
  if (breakdown.specialChars === 0) {
    suggestions.push('Add at least one special character (!@#$%^&*)');
  } else if (breakdown.specialChars === 10) {
    suggestions.push('Consider adding more special characters for extra strength');
  }
  
  if (breakdown.noDictionary === 0) {
    suggestions.push('Avoid common words, patterns, and predictable substitutions');
  }
  
  if (breakdown.noRepetition === 0) {
    suggestions.push('Avoid repetitive characters (aaa) and sequential patterns (123, abc)');
  }
  
  return suggestions;
};

export const getPasswordStrengthColor = (strengthLevel: string): string => {
  switch (strengthLevel) {
    case 'weak': return 'text-red-500';
    case 'fair': return 'text-orange-500';
    case 'good': return 'text-yellow-500';
    case 'strong': return 'text-green-500';
    default: return 'text-gray-500';
  }
};

export const getPasswordStrengthBgColor = (strengthLevel: string): string => {
  switch (strengthLevel) {
    case 'weak': return 'bg-red-500';
    case 'fair': return 'bg-orange-500';
    case 'good': return 'bg-yellow-500';
    case 'strong': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};
