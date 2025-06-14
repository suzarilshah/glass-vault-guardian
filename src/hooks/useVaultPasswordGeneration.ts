
import { useCallback } from 'react';

export const useVaultPasswordGeneration = () => {
  const generateNewPassword = useCallback(() => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let newPassword = '';
    for (let i = 0; i < 16; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return newPassword;
  }, []);

  return {
    generateNewPassword,
  };
};
