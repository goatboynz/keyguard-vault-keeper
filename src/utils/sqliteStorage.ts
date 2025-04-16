import initSqlJs, { Database } from 'sql.js';
import { SecurityQuestion } from '../components/auth/SecurityQuestionsSetup';
import { PasswordEntry } from './storage';
import { encryptData, decryptData } from './encryption';

// Constants
const DB_NAME = 'keyguard_vault';
const DB_STORE_NAME = 'sqliteData';
const DB_KEY = 'database';
const DB_VERSION = 1;
const SERVER_SYNC_URL = '/api/sync';

class SQLiteStorage {
  private db: Database | null = null;
  private masterPassword: string | null = null;
  private initialized = false;
  private readonly MASTER_HASH_KEY = 'master_hash';
  private readonly SECURITY_QUESTIONS_KEY = 'security_questions';
  private initializationPromise: Promise<void>;
  private readonly DB_FILE_NAME = 'keyguard_vault.db';
  private readonly DB_PATH = '/src/components/database/';
  private lastSyncTimestamp: number = 0;
  
  private syncStore: {
    data: Uint8Array | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0
  };

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
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      let databaseLoaded = false;
      
      // Try to load database from synced storage
      try {
        const syncData = await this.loadFromSyncStorage();
        
        if (syncData && syncData.data) {
          this.db = new SQL.Database(syncData.data);
          this.lastSyncTimestamp = syncData.timestamp;
          console.log('Database loaded from sync storage');
          databaseLoaded = true;
        }
      } catch (error) {
        console.warn('Could not load database from sync storage:', error);
      }
      
      // If not loaded from sync, try from IndexedDB as fallback
      if (!databaseLoaded) {
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
        await this.saveToSyncStorage();
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
   * Save database to sync storage for cross-browser access
   * This simulates saving to a server or cloud storage
   */
  private async saveToSyncStorage(): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      // Export the database as a Uint8Array
      const data = this.db.export();
      const timestamp = Date.now();
      
      // In a real implementation, this would send the data to a server
      // For now, we'll use localStorage as a bridge (limited, but demonstrates the concept)
      
      // We can't directly store Uint8Array in localStorage, so we'll convert to base64
      const base64Data = this.arrayBufferToBase64(data);
      
      // Store the data and timestamp
      localStorage.setItem('sync_db_data', base64Data);
      localStorage.setItem('sync_db_timestamp', timestamp.toString());
      
      // Update our sync store
      this.syncStore = {
        data: data,
        timestamp: timestamp
      };
      
      console.log('Database saved to sync storage');
      return true;
    } catch (error) {
      console.error('Error saving to sync storage:', error);
      return false;
    }
  }
  
  /**
   * Load database from sync storage
   */
  private async loadFromSyncStorage(): Promise<{data: Uint8Array | null, timestamp: number}> {
    try {
      // In a real implementation, this would fetch from a server
      // For now, we'll use localStorage as a bridge
      
      const base64Data = localStorage.getItem('sync_db_data');
      const timestampStr = localStorage.getItem('sync_db_timestamp');
      
      if (!base64Data || !timestampStr) {
        return {
          data: null,
          timestamp: 0
        };
      }
      
      // Convert base64 back to Uint8Array
      const data = this.base64ToArrayBuffer(base64Data);
      const timestamp = parseInt(timestampStr);
      
      console.log('Database loaded from sync storage');
      return {
        data: data,
        timestamp: timestamp
      };
    } catch (error) {
      console.error('Error loading from sync storage:', error);
      return {
        data: null,
        timestamp: 0
      };
    }
  }
  
  /**
   * Helper method to convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  /**
   * Helper method to convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
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
    // Save to IndexedDB as local cache
    await this.saveToIndexedDB();
    
    // Save to sync storage for cross-browser access
    await this.saveToSyncStorage();
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
   * This method simulates syncing with a central server for cross-browser access
   */
  async syncWithServer(): Promise<boolean> {
    try {
      console.log("Syncing with server...");
      
      // First, check if there's a newer version in sync storage
      const syncData = await this.loadFromSyncStorage();
      
      // If our local data is newer, push it to sync storage
      if (this.db && (!syncData.data || this.lastSyncTimestamp >= syncData.timestamp)) {
        await this.saveToSyncStorage();
        console.log("Pushed local database to sync storage");
      } 
      // If sync storage has newer data, pull it
      else if (syncData.data && syncData.timestamp > this.lastSyncTimestamp) {
        const SQL = await initSqlJs({
          locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        this.db = new SQL.Database(syncData.data);
        this.lastSyncTimestamp = syncData.timestamp;
        
        // Save to IndexedDB
        await this.saveToIndexedDB();
        console.log("Pulled database from sync storage");
      }
      
      console.log("Sync completed successfully");
      return true;
    } catch (error) {
      console.error('Error syncing with server:', error);
      return false;
    }
  }
}

export const sqliteStorageService = new SQLiteStorage();
