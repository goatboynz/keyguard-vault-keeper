
import { encryptData, decryptData } from './encryption';
import { SecurityQuestion } from '../components/auth/SecurityQuestionsSetup';
import { sqliteStorageService } from './sqliteStorage';

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

// Note: This class is now deprecated in favor of SQLiteStorage
// It's kept for reference and backward compatibility
class LocalStorage {
  private masterPassword: string | null = null;
  private readonly MASTER_HASH_KEY = 'vault_master_hash';
  private readonly PASSWORDS_KEY = 'vault_passwords';
  private readonly SECURITY_QUESTIONS_KEY = 'vault_security_questions';
  
  /**
   * Sets the master password for the vault
   * @param password - The master password to set
   */
  async setMasterPassword(password: string): Promise<void> {
    this.masterPassword = password;
    // Also set in SQLite for compatibility
    await sqliteStorageService.setMasterPassword(password);
  }
  
  /**
   * Clears the master password from memory
   */
  clearMasterPassword(): void {
    this.masterPassword = null;
    sqliteStorageService.clearMasterPassword();
  }
  
  /**
   * Checks if a master password has been set up
   * @returns Whether a master password has been set up
   */
  async hasMasterPasswordSetup(): Promise<boolean> {
    // Use SQLite service for the actual check
    return await sqliteStorageService.hasMasterPasswordSetup();
  }
  
  /**
   * Checks if security questions have been set up
   * @returns Whether security questions have been set up
   */
  async hasSecurityQuestions(): Promise<boolean> {
    // Use SQLite service for the actual check
    return await sqliteStorageService.hasSecurityQuestions();
  }
  
  /**
   * Gets the stored passwords
   * @returns The stored passwords
   */
  async getPasswords(): Promise<PasswordEntry[]> {
    // Use SQLite service for the actual retrieval
    return await sqliteStorageService.getPasswords();
  }
  
  /**
   * Saves passwords to storage
   * @param passwords - The passwords to save
   * @returns Whether the operation was successful
   */
  async savePasswords(passwords: PasswordEntry[]): Promise<boolean> {
    // Use SQLite service for the actual saving
    return await sqliteStorageService.savePasswords(passwords);
  }
  
  /**
   * Stores the master password hash
   * @param hash - The hash of the master password
   */
  async storeMasterPasswordHash(hash: string): Promise<void> {
    // Use SQLite service for the actual storage
    await sqliteStorageService.storeMasterPasswordHash(hash);
  }
  
  /**
   * Gets the stored master password hash
   * @returns The stored master password hash
   */
  async getMasterPasswordHash(): Promise<string | null> {
    // Use SQLite service for the actual retrieval
    return await sqliteStorageService.getMasterPasswordHash();
  }
  
  /**
   * Saves security questions to storage
   * @param questions - The security questions to save
   * @returns Whether the operation was successful
   */
  async saveSecurityQuestions(questions: SecurityQuestion[]): Promise<boolean> {
    // Use SQLite service for the actual saving
    return await sqliteStorageService.saveSecurityQuestions(questions);
  }
  
  /**
   * Gets the stored security questions
   * @returns The stored security questions or null if not found
   */
  async getSecurityQuestions(): Promise<SecurityQuestion[] | null> {
    // Use SQLite service for the actual retrieval
    return await sqliteStorageService.getSecurityQuestions();
  }
  
  /**
   * Resets the vault
   */
  async resetVault(): Promise<void> {
    // Use SQLite service for the actual reset
    await sqliteStorageService.resetVault();
  }
}

export const storageService = new LocalStorage();
