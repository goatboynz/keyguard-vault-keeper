
import initSqlJs, { Database } from 'sql.js';
import { SecurityQuestion } from '../components/auth/SecurityQuestionsSetup';
import { PasswordEntry } from './storage';
import { encryptData, decryptData } from './encryption';

// Constants
const DB_NAME = 'keyguard_vault';
const DB_STORE_NAME = 'sqliteData';
const DB_KEY = 'database';
const DB_VERSION = 1;

class SQLiteStorage {
  private db: Database | null = null;
  private masterPassword: string | null = null;
  private initialized = false;
  private readonly MASTER_HASH_KEY = 'master_hash';
  private readonly SECURITY_QUESTIONS_KEY = 'security_questions';
  private initializationPromise: Promise<void>;
  private readonly DB_FILE_NAME = 'keyguard_vault.db';
  private readonly DB_PATH = '/src/components/database/';

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
      
      let databaseLoaded = false;
      
      // Try to load database from IndexedDB
      try {
        const dbData = await this.loadFromIndexedDB();
        
        if (dbData) {
          this.db = new SQL.Database(dbData);
          console.log('Database loaded from IndexedDB');
          databaseLoaded = true;
        }
      } catch (error) {
        console.warn('Could not load database from IndexedDB:', error);
      }
      
      // If still not loaded, create a new database
      if (!databaseLoaded) {
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
        
        // Immediately save the new database
        await this.saveToIndexedDB();
      }
      
      this.initialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      this.initialized = false;
    }
  }

  /**
   * Save database to IndexedDB
   */
  private async saveToIndexedDB(): Promise<boolean> {
    if (!this.db) return false;
    
    return new Promise((resolve, reject) => {
      try {
        // Export the database as a Uint8Array
        const data = this.db.export();
        
        // Open IndexedDB
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBRequest).result;
          if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
            db.createObjectStore(DB_STORE_NAME);
          }
        };
        
        request.onerror = (event) => {
          console.error('Error opening IndexedDB:', event);
          reject(new Error('Could not open IndexedDB'));
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBRequest).result;
          const transaction = db.transaction([DB_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(DB_STORE_NAME);
          
          // Store the database binary data
          const putRequest = store.put(data, DB_KEY);
          
          putRequest.onsuccess = () => {
            console.log('Database saved to IndexedDB');
            resolve(true);
          };
          
          putRequest.onerror = (error) => {
            console.error('Error saving to IndexedDB:', error);
            reject(new Error('Failed to save database to IndexedDB'));
          };
          
          transaction.oncomplete = () => {
            db.close();
          };
        };
      } catch (error) {
        console.error('Error in saveToIndexedDB:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Load database from IndexedDB
   */
  private async loadFromIndexedDB(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBRequest).result;
          if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
            db.createObjectStore(DB_STORE_NAME);
          }
        };
        
        request.onerror = (event) => {
          console.error('Error opening IndexedDB:', event);
          reject(new Error('Could not open IndexedDB'));
        };
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBRequest).result;
          if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
            db.close();
            resolve(null);
            return;
          }
          
          const transaction = db.transaction([DB_STORE_NAME], 'readonly');
          const store = transaction.objectStore(DB_STORE_NAME);
          
          const getRequest = store.get(DB_KEY);
          
          getRequest.onsuccess = (event) => {
            const data = (event.target as IDBRequest).result;
            if (data) {
              resolve(data);
            } else {
              resolve(null);
            }
          };
          
          getRequest.onerror = (error) => {
            console.error('Error loading from IndexedDB:', error);
            reject(new Error('Failed to load database from IndexedDB'));
          };
          
          transaction.oncomplete = () => {
            db.close();
          };
        };
      } catch (error) {
        console.error('Error in loadFromIndexedDB:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Delete the database from IndexedDB
   */
  private async deleteFromIndexedDB(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.deleteDatabase(DB_NAME);
        
        request.onsuccess = () => {
          console.log('IndexedDB database deleted successfully');
          resolve(true);
        };
        
        request.onerror = (error) => {
          console.error('Error deleting IndexedDB database:', error);
          reject(new Error('Failed to delete IndexedDB database'));
        };
      } catch (error) {
        console.error('Error in deleteFromIndexedDB:', error);
        reject(error);
      }
    });
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
   * After any operation that modifies data, call this to persist changes
   */
  private async persistChanges(): Promise<void> {
    // Save to IndexedDB
    await this.saveToIndexedDB();
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
      
      // Persist changes
      await this.persistChanges();
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
      
      // Persist changes
      await this.persistChanges();
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
    await this.persistChanges();
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
      await this.persistChanges();
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
      
      // Persist changes
      await this.persistChanges();
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
      
      // Persist changes
      await this.persistChanges();
      return true;
    } catch (error) {
      console.error('Error importing database:', error);
      return false;
    }
  }

  /**
   * Saves the database to a file for download
   * @param filename - The name of the file to save
   */
  async saveToFile(filename: string = 'keyguard-vault.db'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const data = this.db.export();
      const blob = new Blob([data], { type: 'application/x-sqlite3' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log(`Database exported as ${filename}`);
    } catch (error) {
      console.error('Failed to save database to file:', error);
      throw error;
    }
  }
  
  /**
   * Loads the database from a file
   * @param file - The file to load
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
  
  /**
   * Synchronizes the local database with the server
   * This method uses IndexedDB and simulates syncing
   */
  async syncWithServer(): Promise<boolean> {
    try {
      console.log("Simulating sync with server...");
      // In a real implementation, this would communicate with a server
      // For now, we just ensure the database is persisted to IndexedDB
      await this.persistChanges();
      
      return true;
    } catch (error) {
      console.error('Error syncing with server:', error);
      return false;
    }
  }
}

export const sqliteStorageService = new SQLiteStorage();
