
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { evaluatePasswordStrength, getPasswordStrengthLabel } from '@/utils/encryption';
import SecurityQuestionsSetup, { SecurityQuestion } from './SecurityQuestionsSetup';

const MasterPasswordSetup = () => {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [confirmVisible, setConfirmVisible] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'password' | 'security-questions'>('password');
  
  const { setupMasterPassword, setupSecurityQuestions } = useAuth();
  
  const passwordStrength = evaluatePasswordStrength(password);
  const passwordLabel = getPasswordStrengthLabel(passwordStrength);
  
  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-red-600';
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-emerald-400';
      default: return 'bg-gray-400';
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!password || !confirmPassword) {
      setError('Please enter a password and confirm it');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (passwordStrength < 2) {
      setError('Please use a stronger password with a mix of uppercase, lowercase, numbers, and symbols');
      return;
    }
    
    // Setup master password
    const success = setupMasterPassword(password);
    if (success) {
      setStep('security-questions');
      setError(null);
    } else {
      setError('Failed to set up master password. Please try again.');
    }
  };
  
  const handleSecurityQuestionsComplete = (questions: SecurityQuestion[]) => {
    const success = setupSecurityQuestions(questions);
    if (!success) {
      setError('Failed to save security questions. Please try again.');
    }
  };
  
  const handleSkipSecurityQuestions = () => {
    // User can skip security questions, but they won't be able to recover their password
    console.log("Security questions setup skipped");
  };

  if (step === 'security-questions') {
    return (
      <SecurityQuestionsSetup 
        onComplete={handleSecurityQuestionsComplete} 
        onSkip={handleSkipSecurityQuestions}
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <Shield className="w-16 h-16 text-vault-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Create Your Vault</h1>
        <p className="text-vault-muted">Create a strong master password to secure your vault</p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handlePasswordSubmit}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium">Master Password</label>
            <span className={`text-xs ${
              passwordStrength < 2 ? 'text-red-400' : 
              passwordStrength < 3 ? 'text-yellow-400' : 
              'text-green-400'
            }`}>
              {password ? passwordLabel : ''}
            </span>
          </div>
          
          <div className="relative">
            <Input
              id="password"
              type={passwordVisible ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="pr-10 bg-vault-darker border border-gray-700"
              placeholder="Enter master password"
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? 
                <EyeOff className="h-4 w-4 text-gray-400" /> : 
                <Eye className="h-4 w-4 text-gray-400" />
              }
            </Button>
          </div>
          
          {password && (
            <div className="w-full h-1 mt-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStrengthColor()} transition-all`} 
                style={{ width: `${(passwordStrength + 1) * 20}%` }}
              />
            </div>
          )}
          
          <p className="text-xs text-vault-muted mt-2">
            Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols
          </p>
        </div>
        
        <div className="mb-8">
          <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
            Confirm Master Password
          </label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={confirmVisible ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              className="pr-10 bg-vault-darker border border-gray-700"
              placeholder="Confirm master password"
              autoComplete="new-password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setConfirmVisible(!confirmVisible)}
            >
              {confirmVisible ? 
                <EyeOff className="h-4 w-4 text-gray-400" /> : 
                <Eye className="h-4 w-4 text-gray-400" />
              }
            </Button>
          </div>
        </div>
        
        <div className="mb-6 bg-secondary/30 p-4 rounded-md border border-secondary flex items-start gap-3">
          <Lock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-400">Important Security Notice</p>
            <p className="text-xs text-vault-muted mt-1">
              Remember your master password! It cannot be recovered if you forget it. All your stored passwords will be lost.
            </p>
          </div>
        </div>
        
        <Button type="submit" className="w-full bg-vault-accent hover:bg-vault-accent/90">
          Continue
        </Button>
      </form>
    </div>
  );
};

export default MasterPasswordSetup;
