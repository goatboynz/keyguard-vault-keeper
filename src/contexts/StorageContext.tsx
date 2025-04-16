
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sqliteStorageService } from '../utils/sqliteStorage';
import { useToast } from '@/components/ui/use-toast';

interface StorageContextValue {
  isReady: boolean;
  exportDatabase: () => Promise<void>;
  importDatabase: (file: File) => Promise<boolean>;
  syncWithServer: () => Promise<boolean>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined);

export const StorageProvider = ({ children }: { children: ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Set up periodic synchronization
  useEffect(() => {
    let syncInterval: number;
    
    if (isReady) {
      // Sync every 5 minutes
      syncInterval = window.setInterval(() => {
        syncWithServer(true);
      }, 5 * 60 * 1000);
    }
    
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isReady]);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // We need to wait for the SQLite database to be ready
        await sqliteStorageService.ensureDbReady();
        setIsReady(true);
        
        // Initial sync when the app starts
        syncWithServer(true);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        toast({
          title: "Storage Error",
          description: "Failed to initialize the database. Please try refreshing the page.",
          variant: "destructive",
        });
      }
    };

    initializeStorage();
  }, [toast]);

  const exportDatabase = async () => {
    try {
      await sqliteStorageService.saveToFile('keyguard-vault.db');
      toast({
        title: "Database Exported",
        description: "Your vault has been exported successfully.",
      });
    } catch (error) {
      console.error('Failed to export database:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your vault. Please try again.",
        variant: "destructive",
      });
    }
  };

  const importDatabase = async (file: File): Promise<boolean> => {
    try {
      const success = await sqliteStorageService.loadFromFile(file);
      
      if (success) {
        toast({
          title: "Database Imported",
          description: "Your vault has been imported successfully.",
        });
        
        // Sync newly imported database
        await syncWithServer(false);
        
        return true;
      } else {
        toast({
          title: "Import Failed",
          description: "Failed to import your vault. The file may be corrupted or invalid.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to import database:', error);
      toast({
        title: "Import Failed",
        description: "An error occurred while importing your vault.",
        variant: "destructive",
      });
      return false;
    }
  };

  const syncWithServer = async (silent: boolean = false): Promise<boolean> => {
    if (isSyncing) return false;
    
    setIsSyncing(true);
    try {
      const success = await sqliteStorageService.syncWithServer();
      
      if (success) {
        const now = new Date();
        setLastSyncTime(now);
        
        if (!silent) {
          toast({
            title: "Sync Completed",
            description: "Your vault has been synchronized successfully.",
          });
        }
        return true;
      } else {
        if (!silent) {
          toast({
            title: "Sync Failed",
            description: "Failed to synchronize your vault.",
            variant: "destructive",
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to sync database:', error);
      if (!silent) {
        toast({
          title: "Sync Failed",
          description: "An error occurred during synchronization.",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <StorageContext.Provider value={{ 
      isReady, 
      exportDatabase, 
      importDatabase,
      syncWithServer: () => syncWithServer(false),
      isSyncing,
      lastSyncTime
    }}>
      {isReady ? children : (
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <div>Initializing database...</div>
          <div className="text-sm text-muted-foreground mt-2">This may take a moment</div>
        </div>
      )}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
