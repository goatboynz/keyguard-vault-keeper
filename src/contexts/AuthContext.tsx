
import { createContext, useState, useContext, ReactNode } from 'react';
import { hashMasterPassword, verifyMasterPassword } from '../utils/encryption';
import { storageService } from '../utils/storage';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  isSetup: boolean;
  setupMasterPassword: (password: string) => boolean;
  login: (password: string) => boolean;
  logout: () => void;
  resetVault: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();
  
  const isSetup = storageService.hasMasterPasswordSetup();

  const setupMasterPassword = (password: string): boolean => {
    try {
      // Hash the master password and store it
      const hash = hashMasterPassword(password);
      storageService.storeMasterPasswordHash(hash);
      
      // Set the master password for encryption/decryption
      storageService.setMasterPassword(password);
      
      // Initialize the passwords storage with an empty array
      storageService.savePasswords([]);
      
      setIsAuthenticated(true);
      toast({
        title: "Vault created successfully",
        description: "Your password vault has been set up. Keep your master password safe!",
      });
      return true;
    } catch (error) {
      console.error('Error setting up master password:', error);
      toast({
        title: "Error setting up vault",
        description: "Failed to set up your password vault. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const login = (password: string): boolean => {
    try {
      const storedHash = storageService.getMasterPasswordHash();
      if (!storedHash) {
        toast({
          title: "Error",
          description: "No vault found. Please set up a master password first.",
          variant: "destructive",
        });
        return false;
      }
      
      const isValid = verifyMasterPassword(password, storedHash);
      if (isValid) {
        storageService.setMasterPassword(password);
        setIsAuthenticated(true);
        toast({
          title: "Authentication successful",
          description: "Welcome back to KeyGuard Vault Keeper!",
        });
        return true;
      } else {
        toast({
          title: "Authentication failed",
          description: "Incorrect master password. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error during login:', error);
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = (): void => {
    storageService.clearMasterPassword();
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been securely logged out.",
    });
  };

  const resetVault = (): void => {
    try {
      storageService.resetVault();
      setIsAuthenticated(false);
      toast({
        title: "Vault reset",
        description: "Your vault has been reset. All data has been removed.",
      });
    } catch (error) {
      console.error('Error resetting vault:', error);
      toast({
        title: "Error",
        description: "Failed to reset vault. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    isAuthenticated,
    isSetup,
    setupMasterPassword,
    login,
    logout,
    resetVault
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
