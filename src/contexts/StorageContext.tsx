
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sqliteStorageService } from '../utils/sqliteStorage';
import { useToast } from '@/components/ui/use-toast';

interface StorageContextValue {
  isReady: boolean;
}

const StorageContext = createContext<StorageContextValue | undefined>(undefined);

export const StorageProvider = ({ children }: { children: ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // We need to wait for the SQLite WASM module to load
        await sqliteStorageService.ensureDbReady();
        setIsReady(true);
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

  return (
    <StorageContext.Provider value={{ isReady }}>
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
