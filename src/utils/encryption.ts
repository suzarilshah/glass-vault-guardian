
import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

export const encryptPassword = (password: string, masterPassword: string): string => {
  return CryptoJS.AES.encrypt(password, masterPassword).toString();
};

export const decryptPassword = (encryptedPassword: string, masterPassword: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, masterPassword);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('Failed to decrypt password. Invalid master password.');
  }
};

// Use bcrypt with 12 rounds for secure password hashing
export const hashMasterPassword = (masterPassword: string): string => {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(masterPassword, salt);
};

// Verify master password against hash
export const verifyMasterPassword = (masterPassword: string, hash: string): boolean => {
  return bcrypt.compareSync(masterPassword, hash);
};
