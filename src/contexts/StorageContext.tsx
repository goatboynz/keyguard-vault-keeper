
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
        // The SQLite storage service initializes itself when created,
        // but we need to wait for it to be ready before rendering children
        await new Promise(resolve => setTimeout(resolve, 1000));
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
      {isReady ? children : <div className="flex items-center justify-center h-screen">Initializing database...</div>}
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
