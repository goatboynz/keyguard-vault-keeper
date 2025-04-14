
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
  private readonly DB_FILE_KEY = 'keyguard_db_file';
  private readonly DB_FILE_NAME = 'vault.db';
  private readonly DB_FOLDER_NAME = 'database';

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
      
      // Try to load database from IndexedDB if it exists
      const existingDbData = await this.loadDatabaseFromStorage();
      
      if (existingDbData) {
        // Create database from existing data
        this.db = new SQL.Database(existingDbData);
        console.log('Database loaded from IndexedDB');
      } else {
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
        
        console.log('New database created');
      }
      
      this.initialized = true;
      
      // Save the initial database to IndexedDB
      await this.saveDatabaseToStorage();
      
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      this.initialized = false;
    }
  }

  /**
   * Save the database to IndexedDB storage
   */
  private async saveDatabaseToStorage(): Promise<void> {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      
      // Use IndexedDB to store the binary data
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('KeyGuardVaultDB', 1);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('dbFiles')) {
            db.createObjectStore('dbFiles');
          }
        };
        
        request.onerror = (event) => {
          console.error('IndexedDB error:', event);
          reject(new Error('Failed to open IndexedDB'));
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['dbFiles'], 'readwrite');
          const store = transaction.objectStore('dbFiles');
          
          const storeRequest = store.put(data, this.DB_FILE_KEY);
          
          storeRequest.onsuccess = () => {
            console.log('Database saved to IndexedDB');
            resolve();
          };
          
          storeRequest.onerror = (event) => {
            console.error('Error storing database:', event);
            reject(new Error('Failed to save database to IndexedDB'));
          };
        };
      });
    } catch (error) {
      console.error('Error saving database to storage:', error);
    }
  }

  /**
   * Load the database from IndexedDB storage
   */
  private async loadDatabaseFromStorage(): Promise<Uint8Array | null> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('KeyGuardVaultDB', 1);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('dbFiles')) {
            db.createObjectStore('dbFiles');
          }
        };
        
        request.onerror = (event) => {
          console.error('IndexedDB error:', event);
          resolve(null); // Resolve with null to create a new database
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // If the database is new, it won't have our data yet
          if (!db.objectStoreNames.contains('dbFiles')) {
            resolve(null);
            return;
          }
          
          const transaction = db.transaction(['dbFiles'], 'readonly');
          const store = transaction.objectStore('dbFiles');
          
          const getRequest = store.get(this.DB_FILE_KEY);
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              console.log('Database loaded from IndexedDB');
              resolve(getRequest.result);
            } else {
              console.log('No database found in IndexedDB');
              resolve(null);
            }
          };
          
          getRequest.onerror = (event) => {
            console.error('Error loading database:', event);
            resolve(null); // Resolve with null to create a new database
          };
        };
      });
    } catch (error) {
      console.error('Error loading database from storage:', error);
      return null;
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
  private async setSettingValue(key: string, value: string): Promise<void> {
    if (!this.db) return;
    
    try {
      this.db.run(
        'INSERT OR REPLACE INTO vault_settings (key, value) VALUES (?, ?)',
        [key, value]
      );
      
      // Save database after each setting update
      await this.saveDatabaseToStorage();
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
      
      // Save database after passwords update
      await this.saveDatabaseToStorage();
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
    await this.setSettingValue(this.MASTER_HASH_KEY, hash);
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
      await this.setSettingValue(this.SECURITY_QUESTIONS_KEY, JSON.stringify(questions));
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
      
      // Save changes to IndexedDB
      await this.saveDatabaseToStorage();
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
      
      // Save the imported database to IndexedDB
      await this.saveDatabaseToStorage();
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }

  /**
   * Creates the database directory if it doesn't exist
   */
  private async ensureDatabaseDirectoryExists(): Promise<void> {
    try {
      // Check if database directory exists
      const handle = await window.showDirectoryPicker({
        id: 'database-dir',
        startIn: 'documents'
      });
      
      try {
        // Try to get the database folder
        await handle.getDirectoryHandle(this.DB_FOLDER_NAME, { create: true });
        console.log('Database directory exists or was created');
      } catch (error) {
        console.error('Failed to create database directory:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to access file system:', error);
      throw error;
    }
  }

  /**
   * Saves the database to a file in the database folder
   */
  async saveToFile(filename: string = 'keyguard-vault.db'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const data = this.db.export();
      const blob = new Blob([data], { type: 'application/x-sqlite3' });
      
      // Create the database folder if it doesn't exist
      try {
        await this.ensureDatabaseDirectoryExists();
      } catch (error) {
        // If file system access fails, fall back to direct download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database/${filename}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
        return;
      }
      
      try {
        // Get the directory handle
        const dirHandle = await window.showDirectoryPicker({
          id: 'database-dir',
          startIn: 'documents'
        });
        
        // Get or create the database folder
        const dbDirHandle = await dirHandle.getDirectoryHandle(this.DB_FOLDER_NAME, { create: true });
        
        // Create or overwrite the file
        const fileHandle = await dbDirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        console.log(`Database saved to ${this.DB_FOLDER_NAME}/${filename}`);
      } catch (error) {
        console.error('Error writing to file system:', error);
        
        // Fall back to direct download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database/${filename}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (error) {
      console.error('Failed to save database to file:', error);
      throw error;
    }
  }
  
  /**
   * Loads the database from a file
   */
  async loadFromFile(file: File): Promise<boolean> {
    try {
      // Read file as ArrayBuffer
      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
      
      // Convert ArrayBuffer to Uint8Array
      const data = new Uint8Array(buffer);
      
      // Import the database
      const success = await this.importDatabase(data);
      if (success) {
        console.log('Database loaded from file successfully');
        return true;
      } else {
        console.error('Failed to import database from file');
        return false;
      }
    } catch (error) {
      console.error('Error loading database from file:', error);
      return false;
    }
  }
}

export const sqliteStorageService = new SQLiteStorage();
