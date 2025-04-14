
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageService, PasswordEntry, CredentialType, BaseField } from '../utils/storage';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

// Define category structure
export interface CategoryDefinition {
  name: string;
  icon: string;
  subcategories?: string[];
  credentialType: CredentialType;
  defaultFields?: BaseField[];
}

interface PasswordContextType {
  passwords: PasswordEntry[];
  addPassword: (password: Omit<PasswordEntry, 'id' | 'lastModified'>) => boolean;
  updatePassword: (id: string, password: Partial<Omit<PasswordEntry, 'id' | 'lastModified'>>) => boolean;
  deletePassword: (id: string) => boolean;
  getPassword: (id: string) => PasswordEntry | undefined;
  categories: CategoryDefinition[];
  selectedCategory: string;
  selectedSubcategory: string;
  setSelectedCategory: (category: string) => void;
  setSelectedSubcategory: (subcategory: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  getCategoryByType: (credentialType: CredentialType) => CategoryDefinition | undefined;
}

// Define all categories with their credential types
export const CATEGORIES: CategoryDefinition[] = [
  { name: 'All', icon: 'Database', credentialType: 'other' },
  { name: 'Websites', icon: 'Globe', credentialType: 'website', 
    subcategories: ['General', 'E-commerce', 'Educational', 'Healthcare', 'Government'] },
  { name: 'Email', icon: 'Mail', credentialType: 'email' },
  { name: 'CCTV', icon: 'Wifi', credentialType: 'cctv' },
  { name: 'Door Codes', icon: 'Key', credentialType: 'doorCode',
    defaultFields: [
      { name: 'location', value: '', isSecret: false },
      { name: 'code', value: '', isSecret: true }
    ]
  },
  { name: 'API Keys', icon: 'Code', credentialType: 'apiKey',
    defaultFields: [
      { name: 'service', value: '', isSecret: false },
      { name: 'key', value: '', isSecret: true },
      { name: 'purpose', value: '', isSecret: false }
    ]
  },
  { name: 'Software', icon: 'Laptop', credentialType: 'software',
    subcategories: ['Desktop Apps', 'Cloud Services', 'Software Licenses'] },
  { name: 'Financial', icon: 'CreditCard', credentialType: 'financialBanking',
    subcategories: ['Banking', 'Investment', 'Cryptocurrency', 'Payment Services'] },
  { name: 'Social Media', icon: 'Share2', credentialType: 'socialMedia',
    subcategories: ['Social Networks', 'Forums & Communities'] },
  { name: 'Gaming', icon: 'Gamepad2', credentialType: 'gaming',
    subcategories: ['Platforms', 'Game Accounts'] },
  { name: 'Networking', icon: 'Network', credentialType: 'networking',
    subcategories: ['Router/Modem', 'VPN', 'FTP/SFTP', 'SSH Keys'] },
  { name: 'Work', icon: 'Briefcase', credentialType: 'professional',
    subcategories: ['Company Portals', 'Business Apps', 'Shared Accounts'] },
  { name: 'Digital Access', icon: 'Smartphone', credentialType: 'digital',
    subcategories: ['WiFi Networks', 'Smart Home', 'Streaming Services'] },
];

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

export const PasswordProvider = ({ children }: { children: ReactNode }) => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
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
  
  const getCategoryByType = (credentialType: CredentialType): CategoryDefinition | undefined => {
    return CATEGORIES.find(cat => cat.credentialType === credentialType);
  };

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
          title: "Credential added",
          description: `${password.title} has been added to your vault.`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error adding password:', error);
      toast({
        title: "Error adding credential",
        description: "Failed to add credential to your vault.",
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
          title: "Credential updated",
          description: `${updatedPasswords[index].title} has been updated.`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error updating credential",
        description: "Failed to update credential in your vault.",
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
          title: "Credential deleted",
          description: `${passwordToDelete.title} has been deleted from your vault.`,
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting password:', error);
      toast({
        title: "Error deleting credential",
        description: "Failed to delete credential from your vault.",
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
    categories: CATEGORIES,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    searchTerm,
    setSearchTerm,
    getCategoryByType,
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
