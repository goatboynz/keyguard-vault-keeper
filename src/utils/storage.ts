
import { encryptData, decryptData } from './encryption';
import { SecurityQuestion } from '../components/auth/SecurityQuestionsSetup';

export interface BaseField {
  name: string;
  value: string;
  isSecret?: boolean;
}

export interface PasswordEntry {
  id: string;
  title: string;
  username: string; 
  password: string;
  url?: string;
  category: string;
  subcategory?: string;
  notes?: string;
  lastModified: string;
  favorite?: boolean;
  credentialType: CredentialType;
  customFields?: BaseField[];
}

export type CredentialType = 
  | 'website'
  | 'app'
  | 'email'
  | 'cctv'
  | 'doorCode'
  | 'apiKey'
  | 'software'
  | 'financialBanking'
  | 'socialMedia'
  | 'gaming'
  | 'networking'
  | 'professional'
  | 'digital'
  | 'other';

class LocalStorage {
  private masterPassword: string | null = null;
  private readonly MASTER_HASH_KEY = 'vault_master_hash';
  private readonly PASSWORDS_KEY = 'vault_passwords';
  private readonly SECURITY_QUESTIONS_KEY = 'vault_security_questions';
  
  /**
   * Sets the master password for the vault
   * @param password - The master password to set
   */
  setMasterPassword(password: string): void {
    this.masterPassword = password;
  }
  
  /**
   * Clears the master password from memory
   */
  clearMasterPassword(): void {
    this.masterPassword = null;
  }
  
  /**
   * Checks if a master password has been set up
   * @returns Whether a master password has been set up
   */
  hasMasterPasswordSetup(): boolean {
    return localStorage.getItem(this.MASTER_HASH_KEY) !== null;
  }
  
  /**
   * Checks if security questions have been set up
   * @returns Whether security questions have been set up
   */
  hasSecurityQuestions(): boolean {
    return localStorage.getItem(this.SECURITY_QUESTIONS_KEY) !== null;
  }
  
  /**
   * Gets the stored passwords
   * @returns The stored passwords
   */
  getPasswords(): PasswordEntry[] {
    if (!this.masterPassword) {
      throw new Error('Master password not set');
    }
    
    const encryptedData = localStorage.getItem(this.PASSWORDS_KEY);
    if (!encryptedData) return [];
    
    try {
      const decryptedData = decryptData(encryptedData, this.masterPassword);
      return JSON.parse(decryptedData) as PasswordEntry[];
    } catch (error) {
      console.error('Error getting passwords:', error);
      return [];
    }
  }
  
  /**
   * Saves passwords to storage
   * @param passwords - The passwords to save
   * @returns Whether the operation was successful
   */
  savePasswords(passwords: PasswordEntry[]): boolean {
    if (!this.masterPassword) {
      throw new Error('Master password not set');
    }
    
    try {
      const encryptedData = encryptData(JSON.stringify(passwords), this.masterPassword);
      localStorage.setItem(this.PASSWORDS_KEY, encryptedData);
      return true;
    } catch (error) {
      console.error('Error saving passwords:', error);
      return false;
    }
  }
  
  /**
   * Stores the master password hash
   * @param hash - The hash of the master password
   */
  storeMasterPasswordHash(hash: string): void {
    localStorage.setItem(this.MASTER_HASH_KEY, hash);
  }
  
  /**
   * Gets the stored master password hash
   * @returns The stored master password hash
   */
  getMasterPasswordHash(): string | null {
    return localStorage.getItem(this.MASTER_HASH_KEY);
  }
  
  /**
   * Saves security questions to storage
   * @param questions - The security questions to save
   * @returns Whether the operation was successful
   */
  saveSecurityQuestions(questions: SecurityQuestion[]): boolean {
    try {
      // We'll store these unencrypted since they're needed for password recovery
      localStorage.setItem(this.SECURITY_QUESTIONS_KEY, JSON.stringify(questions));
      return true;
    } catch (error) {
      console.error('Error saving security questions:', error);
      return false;
    }
  }
  
  /**
   * Gets the stored security questions
   * @returns The stored security questions or null if not found
   */
  getSecurityQuestions(): SecurityQuestion[] | null {
    const data = localStorage.getItem(this.SECURITY_QUESTIONS_KEY);
    if (!data) return null;
    
    try {
      return JSON.parse(data) as SecurityQuestion[];
    } catch (error) {
      console.error('Error getting security questions:', error);
      return null;
    }
  }
  
  /**
   * Resets the vault
   */
  resetVault(): void {
    localStorage.removeItem(this.MASTER_HASH_KEY);
    localStorage.removeItem(this.PASSWORDS_KEY);
    localStorage.removeItem(this.SECURITY_QUESTIONS_KEY);
    this.masterPassword = null;
  }
}

export const storageService = new LocalStorage();
