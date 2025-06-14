
import CryptoJS from 'crypto-js';

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

export const hashMasterPassword = (masterPassword: string): string => {
  return CryptoJS.SHA256(masterPassword).toString();
};
