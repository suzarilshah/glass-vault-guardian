
export interface PasswordStrengthResult {
  score: number; // 0-4 (0: very weak, 4: very strong)
  feedback: string[];
  isWeak: boolean;
}

export const analyzePasswordStrength = (password: string): PasswordStrengthResult => {
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
    feedback.push("Password should contain at least one uppercase letter");
  } else {
    score += 1;
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    feedback.push("Password should contain at least one lowercase letter");
  } else {
    score += 1;
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    feedback.push("Password should contain at least one special character");
  } else {
    score += 1;
  }

  const isWeak = score < 3 || password.length < 10;

  return {
    score,
    feedback,
    isWeak
  };
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "text-red-500";
    case 2:
      return "text-orange-500";
    case 3:
      return "text-yellow-500";
    case 4:
      return "text-green-500";
    default:
      return "text-gray-500";
  }
};

export const getPasswordStrengthText = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "Unknown";
  }
};
