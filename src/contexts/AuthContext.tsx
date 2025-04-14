import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { hashMasterPassword, verifyMasterPassword } from '../utils/encryption';
import { sqliteStorageService } from '../utils/sqliteStorage';
import { useToast } from '@/components/ui/use-toast';
import { SecurityQuestion } from '@/components/auth/SecurityQuestionsSetup';

interface AuthContextType {
  isAuthenticated: boolean;
  isSetup: boolean;
  hasSecurityQuestions: () => Promise<boolean>;
  setupMasterPassword: (password: string) => Promise<boolean>;
  setupSecurityQuestions: (questions: SecurityQuestion[]) => Promise<boolean>;
  getSecurityQuestions: () => Promise<SecurityQuestion[] | null>;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  resetVault: () => Promise<void>;
  updateMasterPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  resetPasswordWithSecurityQuestions: (newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSetup, setIsSetup] = useState<boolean>(false);
  const [hasSecurityQs, setHasSecurityQs] = useState<boolean>(false);
  const { toast } = useToast();

  // Check if master password is set up
  useEffect(() => {
    const checkSetup = async () => {
      const hasPassword = await sqliteStorageService.hasMasterPasswordSetup();
      const hasQuestions = await sqliteStorageService.hasSecurityQuestions();
      setIsSetup(hasPassword);
      setHasSecurityQs(hasQuestions);
    };
    
    checkSetup();
  }, []);
  
  const hasSecurityQuestions = async (): Promise<boolean> => {
    return await sqliteStorageService.hasSecurityQuestions();
  };
  
  const setupMasterPassword = async (password: string): Promise<boolean> => {
    try {
      // Hash the master password and store it
      const hash = hashMasterPassword(password);
      await sqliteStorageService.storeMasterPasswordHash(hash);
      
      // Set the master password for encryption/decryption
      await sqliteStorageService.setMasterPassword(password);
      
      // Initialize the passwords storage with an empty array
      await sqliteStorageService.savePasswords([]);
      
      setIsAuthenticated(true);
      setIsSetup(true);
      
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

  const setupSecurityQuestions = async (questions: SecurityQuestion[]): Promise<boolean> => {
    try {
      // Store the security questions
      const success = await sqliteStorageService.saveSecurityQuestions(questions);
      
      if (success) {
        setHasSecurityQs(true);
        toast({
          title: "Security questions set",
          description: "Your security questions have been saved successfully.",
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error setting up security questions:', error);
      toast({
        title: "Error setting up security questions",
        description: "Failed to save your security questions. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const getSecurityQuestions = async (): Promise<SecurityQuestion[] | null> => {
    try {
      return await sqliteStorageService.getSecurityQuestions();
    } catch (error) {
      console.error('Error getting security questions:', error);
      return null;
    }
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const storedHash = await sqliteStorageService.getMasterPasswordHash();
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
        await sqliteStorageService.setMasterPassword(password);
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
    sqliteStorageService.clearMasterPassword();
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been securely logged out.",
    });
  };

  const resetVault = async (): Promise<void> => {
    try {
      await sqliteStorageService.resetVault();
      setIsAuthenticated(false);
      setIsSetup(false);
      setHasSecurityQs(false);
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
  
  const updateMasterPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const storedHash = await sqliteStorageService.getMasterPasswordHash();
      if (!storedHash) {
        toast({
          title: "Error",
          description: "No vault found. Please set up a master password first.",
          variant: "destructive",
        });
        return false;
      }
      
      // Verify the current password
      const isValid = verifyMasterPassword(currentPassword, storedHash);
      if (!isValid) {
        toast({
          title: "Authentication failed",
          description: "Current password is incorrect. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      // Get all passwords with the current password
      const passwords = await sqliteStorageService.getPasswords();
      
      // Update the master password hash
      const newHash = hashMasterPassword(newPassword);
      await sqliteStorageService.storeMasterPasswordHash(newHash);
      
      // Set the new master password for encryption/decryption
      await sqliteStorageService.setMasterPassword(newPassword);
      
      // Re-save all passwords with the new password
      await sqliteStorageService.savePasswords(passwords);
      
      toast({
        title: "Password updated",
        description: "Your master password has been updated successfully.",
      });
      return true;
    } catch (error) {
      console.error('Error updating master password:', error);
      toast({
        title: "Error",
        description: "Failed to update master password. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const resetPasswordWithSecurityQuestions = async (newPassword: string): Promise<boolean> => {
    try {
      // Update the master password hash
      const newHash = hashMasterPassword(newPassword);
      await sqliteStorageService.storeMasterPasswordHash(newHash);
      
      // Set the new master password for encryption/decryption
      await sqliteStorageService.setMasterPassword(newPassword);
      
      // Try to decrypt passwords with new password (they might be corrupted)
      try {
        await sqliteStorageService.getPasswords();
      } catch (e) {
        // If decryption fails, initialize with empty array
        await sqliteStorageService.savePasswords([]);
      }
      
      setIsAuthenticated(true);
      
      toast({
        title: "Password reset successful",
        description: "Your master password has been reset. You can now access your vault.",
      });
      return true;
    } catch (error) {
      console.error('Error resetting password with security questions:', error);
      toast({
        title: "Error",
        description: "Failed to reset master password. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const value = {
    isAuthenticated,
    isSetup,
    hasSecurityQuestions,
    setupMasterPassword,
    setupSecurityQuestions,
    getSecurityQuestions,
    login,
    logout,
    resetVault,
    updateMasterPassword,
    resetPasswordWithSecurityQuestions
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
