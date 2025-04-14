
import { encryptData, decryptData } from './encryption';

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  notes?: string;
  lastModified: string;
  favorite?: boolean;
}

class LocalStorage {
  private masterPassword: string | null = null;
  private readonly MASTER_HASH_KEY = 'vault_master_hash';
  private readonly PASSWORDS_KEY = 'vault_passwords';
  
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
   * Resets the vault
   */
  resetVault(): void {
    localStorage.removeItem(this.MASTER_PASSWORD_KEY);
    localStorage.removeItem(this.PASSWORDS_KEY);
    this.masterPassword = null;
  }
}

export const storageService = new LocalStorage();
