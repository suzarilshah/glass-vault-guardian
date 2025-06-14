
export interface PasswordStrength {
  score: number; // 0-4 (weak to very strong)
  feedback: string[];
  isWeak: boolean;
}

export const analyzePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Check length
  if (password.length < 10) {
    feedback.push("Password should be at least 10 characters long");
  } else {
    score += 1;
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    feedback.push("Add at least one uppercase letter");
  } else {
    score += 1;
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    feedback.push("Add at least one lowercase letter");
  } else {
    score += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    feedback.push("Add at least one special character");
  } else {
    score += 1;
  }

  // Check for numbers
  if (!/\d/.test(password)) {
    feedback.push("Add at least one number");
  } else if (score === 4) {
    score += 1; // Bonus point for having all requirements plus numbers
  }

  const isWeak = score < 4 || password.length < 10;

  return {
    score,
    feedback,
    isWeak
  };
};

export const getStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "text-red-400";
    case 2:
      return "text-orange-400";
    case 3:
      return "text-yellow-400";
    case 4:
      return "text-green-400";
    case 5:
      return "text-emerald-400";
    default:
      return "text-gray-400";
  }
};

export const getStrengthText = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Fair";
    case 4:
      return "Strong";
    case 5:
      return "Very Strong";
    default:
      return "Unknown";
  }
};
