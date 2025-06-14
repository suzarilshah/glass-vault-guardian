
// Character sets for entropy calculation
const CHARSET_SIZES = {
  lowercase: 26,
  uppercase: 26,
  numbers: 10,
  specialChars: 32,
};

// Common substitutions for keyword obfuscation
const OBFUSCATION_MAP: { [key: string]: string[] } = {
  'a': ['@', '4', 'A'],
  'e': ['3', 'E'],
  'i': ['1', '!', 'I'],
  'o': ['0', 'O'],
  's': ['$', '5', 'S'],
  't': ['7', 'T'],
  'l': ['1', 'L'],
  'g': ['9', 'G'],
  'b': ['6', 'B'],
  'z': ['2', 'Z'],
};

export const obfuscateKeyword = (keyword: string, includeNumbers: boolean = true, includeSpecialChars: boolean = true, includeUppercase: boolean = true): string => {
  if (!keyword) return '';
  
  let result = '';
  
  for (let i = 0; i < keyword.length; i++) {
    const char = keyword[i].toLowerCase();
    const substitutions = OBFUSCATION_MAP[char] || [char];
    
    // Filter substitutions based on requirements
    const filteredSubs = substitutions.filter(sub => {
      if (!includeNumbers && /\d/.test(sub)) return false;
      if (!includeSpecialChars && /[^a-zA-Z0-9]/.test(sub)) return false;
      if (!includeUppercase && /[A-Z]/.test(sub)) return false;
      return true;
    });
    
    // If no valid substitutions, use original character
    const validSubs = filteredSubs.length > 0 ? filteredSubs : [char];
    const randomSub = validSubs[Math.floor(Math.random() * validSubs.length)];
    
    result += randomSub;
  }
  
  // Add random padding if needed
  const padding = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < padding; i++) {
    if (includeNumbers) {
      result += Math.floor(Math.random() * 10);
    }
    if (includeSpecialChars && Math.random() > 0.5) {
      const specialChars = '!@#$%^&*';
      result += specialChars[Math.floor(Math.random() * specialChars.length)];
    }
  }
  
  return result;
};

export const calculatePasswordEntropy = (password: string): number => {
  let charsetSize = 0;
  
  if (/[a-z]/.test(password)) charsetSize += CHARSET_SIZES.lowercase;
  if (/[A-Z]/.test(password)) charsetSize += CHARSET_SIZES.uppercase;
  if (/[0-9]/.test(password)) charsetSize += CHARSET_SIZES.numbers;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += CHARSET_SIZES.specialChars;
  
  return Math.log2(Math.pow(charsetSize, password.length));
};

export const calculateCrackTime = (password: string): { seconds: number; humanReadable: string } => {
  const entropy = calculatePasswordEntropy(password);
  
  // Assuming 1 billion guesses per second (modern GPU)
  const guessesPerSecond = 1_000_000_000;
  
  // Average time to crack is half the total possible combinations
  const totalCombinations = Math.pow(2, entropy);
  const averageGuesses = totalCombinations / 2;
  const seconds = averageGuesses / guessesPerSecond;
  
  return {
    seconds,
    humanReadable: formatCrackTime(seconds)
  };
};

const formatCrackTime = (seconds: number): string => {
  if (seconds < 1) return 'Instantly';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
  if (seconds < 31536000000000) return `${Math.round(seconds / 31536000000)} thousand years`;
  if (seconds < 31536000000000000) return `${Math.round(seconds / 31536000000000)} million years`;
  return `${Math.round(seconds / 31536000000000000)} billion years`;
};
