
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageService, PasswordEntry } from '../utils/storage';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

interface PasswordContextType {
  passwords: PasswordEntry[];
  addPassword: (password: Omit<PasswordEntry, 'id' | 'lastModified'>) => boolean;
  updatePassword: (id: string, password: Partial<Omit<PasswordEntry, 'id' | 'lastModified'>>) => boolean;
  deletePassword: (id: string) => boolean;
  getPassword: (id: string) => PasswordEntry | undefined;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

export const PasswordProvider = ({ children }: { children: ReactNode }) => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Load passwords from storage when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const storedPasswords = storageService.getPasswords();
        setPasswords(storedPasswords);
      } catch (error) {
        console.error('Error loading passwords:', error);
        toast({
          title: "Error loading passwords",
          description: "Failed to load your passwords. Please try logging in again.",
          variant: "destructive",
        });
      }
    } else {
      setPasswords([]);
    }
  }, [isAuthenticated, toast]);

  // Derived categories from passwords
  const categories = ['All', ...new Set(passwords.map(p => p.category))].filter(Boolean);

  // CRUD operations
  const addPassword = (password: Omit<PasswordEntry, 'id' | 'lastModified'>): boolean => {
    try {
      const newPassword: PasswordEntry = {
        ...password,
        id: crypto.randomUUID(),
        lastModified: new Date().toISOString()
      };
      
      const updatedPasswords = [...passwords, newPassword];
      const saved = storageService.savePasswords(updatedPasswords);
      
      if (saved) {
        setPasswords(updatedPasswords);
        toast({
          title: "Password added",
          description: `${password.title} has been added to your vault.`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding password:', error);
      toast({
        title: "Error adding password",
        description: "Failed to add password to your vault.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updatePassword = (
    id: string, 
    passwordUpdate: Partial<Omit<PasswordEntry, 'id' | 'lastModified'>>
  ): boolean => {
    try {
      const index = passwords.findIndex(p => p.id === id);
      if (index === -1) return false;
      
      const updatedPasswords = [...passwords];
      updatedPasswords[index] = {
        ...updatedPasswords[index],
        ...passwordUpdate,
        lastModified: new Date().toISOString()
      };
      
      const saved = storageService.savePasswords(updatedPasswords);
      
      if (saved) {
        setPasswords(updatedPasswords);
        toast({
          title: "Password updated",
          description: `${updatedPasswords[index].title} has been updated.`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error updating password",
        description: "Failed to update password in your vault.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deletePassword = (id: string): boolean => {
    try {
      const passwordToDelete = passwords.find(p => p.id === id);
      if (!passwordToDelete) return false;
      
      const updatedPasswords = passwords.filter(p => p.id !== id);
      const saved = storageService.savePasswords(updatedPasswords);
      
      if (saved) {
        setPasswords(updatedPasswords);
        toast({
          title: "Password deleted",
          description: `${passwordToDelete.title} has been deleted from your vault.`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting password:', error);
      toast({
        title: "Error deleting password",
        description: "Failed to delete password from your vault.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getPassword = (id: string): PasswordEntry | undefined => {
    return passwords.find(p => p.id === id);
  };

  const value = {
    passwords,
    addPassword,
    updatePassword,
    deletePassword,
    getPassword,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
  };

  return <PasswordContext.Provider value={value}>{children}</PasswordContext.Provider>;
};

export const usePasswords = (): PasswordContextType => {
  const context = useContext(PasswordContext);
  if (context === undefined) {
    throw new Error('usePasswords must be used within a PasswordProvider');
  }
  return context;
};
