
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import PasswordRecovery from './PasswordRecovery';

const Login = () => {
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const { login, hasSecurityQuestions } = useAuth();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your master password');
      return;
    }
    
    const success = login(password);
    if (!success) {
      setError('Invalid master password. Please try again.');
    }
  };
  
  if (showRecovery) {
    return <PasswordRecovery onCancel={() => setShowRecovery(false)} />;
  }
  
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <ShieldCheck className="w-16 h-16 text-vault-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Unlock Your Vault</h1>
        <p className="text-vault-muted">Enter your master password to access your secured passwords</p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Master Password
          </label>
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
              placeholder="Enter your master password"
              autoComplete="current-password"
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
        </div>
        
        <div className="mb-6 bg-secondary/30 p-4 rounded-md border border-secondary flex items-start gap-3">
          <Lock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-xs text-vault-muted">
              {hasSecurityQuestions 
                ? "Forgot your master password? You can reset it using your security questions."
                : "If you've forgotten your master password, there is no way to recover it. You'll need to reset your vault and start over."
              }
            </p>
            {hasSecurityQuestions && (
              <Button 
                type="button" 
                variant="link" 
                className="text-xs text-vault-accent p-0 h-auto"
                onClick={() => setShowRecovery(true)}
              >
                Reset password with security questions
              </Button>
            )}
          </div>
        </div>
        
        <Button type="submit" className="w-full bg-vault-accent hover:bg-vault-accent/90">
          Unlock Vault
        </Button>
      </form>
    </div>
  );
};

export default Login;
