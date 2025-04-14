
import initSqlJs, { Database } from 'sql.js';
import { SecurityQuestion } from '../components/auth/SecurityQuestionsSetup';
import { PasswordEntry, BaseField, CredentialType } from './storage';
import { encryptData, decryptData } from './encryption';

class SQLiteStorage {
  private db: Database | null = null;
  private masterPassword: string | null = null;
  private initialized = false;
  private readonly MASTER_HASH_KEY = 'master_hash';
  private readonly SECURITY_QUESTIONS_KEY = 'security_questions';
  private initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.initDatabase();
  }

  /**
   * Initialize the SQLite database
   */
  private async initDatabase(): Promise<void> {
    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        // Specify the path to the SQL.js wasm file
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      // Create a new database
      this.db = new SQL.Database();
      
      // Create tables if they don't exist
      this.db.run(`
        CREATE TABLE IF NOT EXISTS vault_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `);
      
      this.db.run(`
        CREATE TABLE IF NOT EXISTS vault_passwords (
          id TEXT PRIMARY KEY,
          data TEXT
        );
      `);
      
      this.initialized = true;

      // Attempt to load data from localStorage if it exists (for migration)
      this.migrateFromLocalStorage();
      
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      this.initialized = false;
    }
  }

  /**
   * Migrate data from localStorage to SQLite (one-time migration)
   */
  private migrateFromLocalStorage(): void {
    try {
      // Migrate master password hash if exists
      const masterHash = localStorage.getItem('vault_master_hash');
      if (masterHash) {
        this.setSettingValue(this.MASTER_HASH_KEY, masterHash);
      }
      
      // Migrate security questions if exist
      const securityQuestions = localStorage.getItem('vault_security_questions');
      if (securityQuestions) {
        this.setSettingValue(this.SECURITY_QUESTIONS_KEY, securityQuestions);
      }
      
      // Migrate passwords if exist and master password is set
      if (this.masterPassword) {
        const encryptedPasswords = localStorage.getItem('vault_passwords');
        if (encryptedPasswords) {
          this.db?.run(
            'INSERT OR REPLACE INTO vault_passwords (id, data) VALUES (?, ?)',
            ['passwords', encryptedPasswords]
          );
        }
      }
      
      console.log('Migration from localStorage completed');
    } catch (error) {
      console.error('Error during migration from localStorage:', error);
    }
  }

  /**
   * Ensures the database is ready before performing operations
   * @returns Whether the database is ready
   */
  public async ensureDbReady(): Promise<boolean> {
    if (!this.initialized) {
      try {
        await this.initializationPromise;
      } catch (error) {
        console.error('Error ensuring DB ready:', error);
        // Try to initialize again if it failed
        this.initializationPromise = this.initDatabase();
        await this.initializationPromise;
      }
    }
    
    return this.db !== null;
  }

  /**
   * Gets a value from the settings table
   * @param key - The key to get
   * @returns The value or null if not found
   */
  private getSettingValue(key: string): string | null {
    if (!this.db) return null;
    
    try {
      const result = this.db.exec(`SELECT value FROM vault_settings WHERE key = '${key}'`);
      if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0] as string;
      }
      return null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Sets a value in the settings table
   * @param key - The key to set
   * @param value - The value to set
   */
  private setSettingValue(key: string, value: string): void {
    if (!this.db) return;
    
    try {
      this.db.run(
        'INSERT OR REPLACE INTO vault_settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    } catch (error) {
      console.error(`Error setting value for ${key}:`, error);
    }
  }

  /**
   * Sets the master password for the vault
   * @param password - The master password to set
   */
  async setMasterPassword(password: string): Promise<void> {
    await this.ensureDbReady();
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
  async hasMasterPasswordSetup(): Promise<boolean> {
    await this.ensureDbReady();
    return this.getSettingValue(this.MASTER_HASH_KEY) !== null;
  }
  
  /**
   * Checks if security questions have been set up
   * @returns Whether security questions have been set up
   */
  async hasSecurityQuestions(): Promise<boolean> {
    await this.ensureDbReady();
    return this.getSettingValue(this.SECURITY_QUESTIONS_KEY) !== null;
  }
  
  /**
   * Gets the stored passwords
   * @returns The stored passwords
   */
  async getPasswords(): Promise<PasswordEntry[]> {
    await this.ensureDbReady();
    
    if (!this.masterPassword) {
      throw new Error('Master password not set');
    }
    
    try {
      const result = this.db!.exec("SELECT data FROM vault_passwords WHERE id = 'passwords'");
      if (result.length > 0 && result[0].values.length > 0) {
        const encryptedData = result[0].values[0][0] as string;
        const decryptedData = decryptData(encryptedData, this.masterPassword);
        return JSON.parse(decryptedData) as PasswordEntry[];
      }
      return [];
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
  async savePasswords(passwords: PasswordEntry[]): Promise<boolean> {
    await this.ensureDbReady();
    
    if (!this.masterPassword) {
      throw new Error('Master password not set');
    }
    
    try {
      const encryptedData = encryptData(JSON.stringify(passwords), this.masterPassword);
      this.db!.run(
        'INSERT OR REPLACE INTO vault_passwords (id, data) VALUES (?, ?)',
        ['passwords', encryptedData]
      );
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
  async storeMasterPasswordHash(hash: string): Promise<void> {
    await this.ensureDbReady();
    this.setSettingValue(this.MASTER_HASH_KEY, hash);
  }
  
  /**
   * Gets the stored master password hash
   * @returns The stored master password hash
   */
  async getMasterPasswordHash(): Promise<string | null> {
    await this.ensureDbReady();
    return this.getSettingValue(this.MASTER_HASH_KEY);
  }
  
  /**
   * Saves security questions to storage
   * @param questions - The security questions to save
   * @returns Whether the operation was successful
   */
  async saveSecurityQuestions(questions: SecurityQuestion[]): Promise<boolean> {
    await this.ensureDbReady();
    
    try {
      this.setSettingValue(this.SECURITY_QUESTIONS_KEY, JSON.stringify(questions));
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
  async getSecurityQuestions(): Promise<SecurityQuestion[] | null> {
    await this.ensureDbReady();
    
    try {
      const data = this.getSettingValue(this.SECURITY_QUESTIONS_KEY);
      if (!data) return null;
      return JSON.parse(data) as SecurityQuestion[];
    } catch (error) {
      console.error('Error getting security questions:', error);
      return null;
    }
  }
  
  /**
   * Resets the vault
   */
  async resetVault(): Promise<void> {
    await this.ensureDbReady();
    
    try {
      this.db!.run("DELETE FROM vault_settings WHERE key = ?", [this.MASTER_HASH_KEY]);
      this.db!.run("DELETE FROM vault_settings WHERE key = ?", [this.SECURITY_QUESTIONS_KEY]);
      this.db!.run("DELETE FROM vault_passwords WHERE id = 'passwords'");
      this.masterPassword = null;
    } catch (error) {
      console.error('Error resetting vault:', error);
    }
  }

  /**
   * Exports the database as a Uint8Array for backup
   */
  exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }
  
  /**
   * Imports a database from a Uint8Array
   * @param data - The database data to import
   */
  async importDatabase(data: Uint8Array): Promise<boolean> {
    try {
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      this.db = new SQL.Database(data);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }
}

export const sqliteStorageService = new SQLiteStorage();
