
import CryptoJS from 'crypto-js';

/**
 * Encrypts data using AES-256 encryption with a derived key
 * @param data - The data to encrypt
 * @param masterPassword - The master password to derive the key from
 * @returns The encrypted data
 */
export function encryptData(data: string, masterPassword: string): string {
  try {
    // In a production environment, we would use a proper key derivation function like PBKDF2
    // with a high number of iterations and a salt
    const key = CryptoJS.PBKDF2(masterPassword, 'vault-keeper-salt', {
      keySize: 256 / 32,
      iterations: 10000
    });
    
    const encrypted = CryptoJS.AES.encrypt(data, key.toString()).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data using AES-256 encryption with a derived key
 * @param encryptedData - The encrypted data
 * @param masterPassword - The master password to derive the key from
 * @returns The decrypted data
 */
export function decryptData(encryptedData: string, masterPassword: string): string {
  try {
    const key = CryptoJS.PBKDF2(masterPassword, 'vault-keeper-salt', {
      keySize: 256 / 32,
      iterations: 10000
    });
    
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key.toString()).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Incorrect password or corrupted data.');
  }
}

/**
 * Generates a hash of the master password for verification
 * @param masterPassword - The master password to hash
 * @returns The hashed password
 */
export function hashMasterPassword(masterPassword: string): string {
  try {
    return CryptoJS.PBKDF2(masterPassword, 'vault-keeper-verification-salt', {
      keySize: 256 / 32,
      iterations: 10000
    }).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verifies if the provided master password matches the stored hash
 * @param masterPassword - The master password to verify
 * @param storedHash - The stored hash to compare against
 * @returns True if the password matches, false otherwise
 */
export function verifyMasterPassword(masterPassword: string, storedHash: string): boolean {
  try {
    const hash = hashMasterPassword(masterPassword);
    return hash === storedHash;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

/**
 * Generates a random password
 * @param length - The length of the password
 * @param options - Password generation options
 * @returns The generated password
 */
export function generatePassword(
  length: number = 16,
  options: {
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
  } = {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true
  }
): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  
  let chars = '';
  if (options.includeUppercase) chars += uppercase;
  if (options.includeLowercase) chars += lowercase;
  if (options.includeNumbers) chars += numbers;
  if (options.includeSymbols) chars += symbols;
  
  if (chars === '') {
    throw new Error('At least one character set must be selected');
  }
  
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
}

/**
 * Evaluates the strength of a password
 * @param password - The password to evaluate
 * @returns A score from 0 to 4
 */
export function evaluatePasswordStrength(password: string): number {
  // Simple password strength evaluation
  // 0: Very weak, 1: Weak, 2: Medium, 3: Strong, 4: Very strong
  let score = 0;
  
  if (!password) return score;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety check
  if (/[A-Z]/.test(password)) score += 0.5;
  if (/[a-z]/.test(password)) score += 0.5;
  if (/[0-9]/.test(password)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(password)) score += 0.5;
  
  return Math.min(Math.floor(score), 4);
}

/**
 * Gets a descriptive label for a password strength score
 * @param score - The password strength score
 * @returns A string describing the password strength
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0: return 'Very Weak';
    case 1: return 'Weak';
    case 2: return 'Medium';
    case 3: return 'Strong';
    case 4: return 'Very Strong';
    default: return 'Unknown';
  }
}
