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
  private readonly DB_FILE_NAME = 'keyguard_vault.db';
  private readonly DB_FOLDER_NAME = 'database';
  private serverUrl: string | null = null;

  constructor() {
    this.serverUrl = this.getServerUrl();
    this.initializationPromise = this.initDatabase();
  }

  /**
   * Get the server URL from environment or config
   */
  private getServerUrl(): string | null {
    // In a real app, this would come from environment variables or config
    // For now return null, as we'll implement server sync in a future step
    return null;
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
      
      // Try to load database from server first if URL is available
      let databaseLoaded = false;
      
      if (this.serverUrl) {
        try {
          const response = await fetch(`${this.serverUrl}/api/database/${this.DB_FILE_NAME}`);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            this.db = new SQL.Database(uint8Array);
            console.log('Database loaded from server');
            databaseLoaded = true;
          }
        } catch (error) {
          console.warn('Could not load database from server:', error);
        }
      }
      
      // If server load failed, try to load from IndexedDB as fallback
      if (!databaseLoaded) {
        const existingDbData = await this.loadDatabaseFromStorage();
        
        if (existingDbData) {
          // Create database from existing data
          this.db = new SQL.Database(existingDbData);
          console.log('Database loaded from IndexedDB');
          databaseLoaded = true;
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
        
        // Immediately save the new database to storage
        await this.saveDatabaseToStorage();
        
        // If server URL is available, also save to server
        if (this.serverUrl) {
          await this.saveToServer();
        }
      }
      
      this.initialized = true;
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      this.initialized = false;
    }
  }

  /**
   * Save the database to the server
   */
  private async saveToServer(): Promise<boolean> {
    if (!this.db || !this.serverUrl) return false;
    
    try {
      const data = this.db.export();
      const blob = new Blob([data], { type: 'application/x-sqlite3' });
      
      const formData = new FormData();
      formData.append('database', blob, this.DB_FILE_NAME);
      
      const response = await fetch(`${this.serverUrl}/api/database/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        console.log('Database saved to server');
        return true;
      } else {
        console.error('Failed to save database to server:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error saving to server:', error);
      return false;
    }
  }

  /**
   * Save the database to IndexedDB storage as fallback
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
          
          const storeRequest = store.put(data, this.DB_FILE_NAME);
          
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
          
          const getRequest = store.get(this.DB_FILE_NAME);
          
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
   * After any operation that modifies data, call this to persist changes
   */
  private async persistChanges(): Promise<void> {
    // Save to local IndexedDB first
    await this.saveDatabaseToStorage();
    
    // Then try to save to server if available
    if (this.serverUrl) {
      await this.saveToServer();
    }
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
   * Saves the database to a file
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
      a.download = `${this.DB_FOLDER_NAME}/${filename}`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log(`Database saved as ${this.DB_FOLDER_NAME}/${filename}`);
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
        
        // After successful local import, try to save to server if available
        if (this.serverUrl) {
          await this.saveToServer();
        }
        
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
   * This would be called periodically or when the app reconnects
   */
  async syncWithServer(): Promise<boolean> {
    if (!this.serverUrl) return false;
    
    try {
      // Get the latest database from the server
      const response = await fetch(`${this.serverUrl}/api/database/${this.DB_FILE_NAME}`);
      if (!response.ok) {
        console.error('Failed to fetch database from server');
        return false;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const serverData = new Uint8Array(arrayBuffer);
      
      // Import the server database
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });
      
      // Save the current database temporarily
      const currentDb = this.db;
      
      // Load the server database
      this.db = new SQL.Database(serverData);
      
      // TODO: Add more sophisticated merge logic if needed
      
      // Persist the merged database
      await this.persistChanges();
      
      console.log('Database synchronized with server');
      return true;
    } catch (error) {
      console.error('Error syncing with server:', error);
      return false;
    }
  }
}

export const sqliteStorageService = new SQLiteStorage();
