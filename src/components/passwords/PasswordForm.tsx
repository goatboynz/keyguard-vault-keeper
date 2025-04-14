
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, RefreshCcw, Check, X, Shield } from 'lucide-react';
import { usePasswords } from '@/contexts/PasswordContext';
import { PasswordEntry } from '@/utils/storage';
import { generatePassword, evaluatePasswordStrength, getPasswordStrengthLabel } from '@/utils/encryption';

interface PasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string;
}

const CATEGORIES = ['CCTV', 'Email', 'Website', 'App', 'Other'];

const PasswordForm = ({ isOpen, onClose, editingId }: PasswordFormProps) => {
  const { addPassword, updatePassword, getPassword } = usePasswords();
  
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Password generation settings
  const [showGenerator, setShowGenerator] = useState(false);
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
  // Password strength
  const passwordStrength = evaluatePasswordStrength(password);
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);

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
  
  // Load existing password data if editing
  useEffect(() => {
    if (editingId && isOpen) {
      const passwordData = getPassword(editingId);
      if (passwordData) {
        setTitle(passwordData.title || '');
        setUsername(passwordData.username || '');
        setPassword(passwordData.password || '');
        setUrl(passwordData.url || '');
        setCategory(passwordData.category || '');
        setNotes(passwordData.notes || '');
      }
    }
  }, [editingId, isOpen, getPassword]);
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        if (!editingId) {
          setTitle('');
          setUsername('');
          setPassword('');
          setUrl('');
          setCategory('');
          setNotes('');
          setShowGenerator(false);
          setShowPassword(false);
        }
      }, 300); // Wait for dialog animation to complete
    }
  }, [isOpen, editingId]);
  
  const handleGeneratePassword = () => {
    if (!includeLowercase && !includeUppercase && !includeNumbers && !includeSymbols) {
      // Ensure at least one option is selected
      return;
    }
    
    const newPassword = generatePassword(passwordLength, {
      includeLowercase,
      includeUppercase,
      includeNumbers,
      includeSymbols
    });
    
    setPassword(newPassword);
    setShowPassword(true); // Show the password when it's generated
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!title || !username || !password || !category) {
      alert('Please fill out all required fields');
      return;
    }
    
    const passwordData = {
      title,
      username,
      password,
      url,
      category,
      notes
    };
    
    let success = false;
    
    if (editingId) {
      success = updatePassword(editingId, passwordData);
    } else {
      success = addPassword(passwordData);
    }
    
    if (success) {
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Password' : 'Add New Password'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Work Email"
              className="bg-vault-darker border-gray-700"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="bg-vault-darker border-gray-700">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="username">Username / Email</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john.doe@example.com"
              className="bg-vault-darker border-gray-700"
              required
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="password">Password</Label>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowGenerator(!showGenerator)}
              >
                {showGenerator ? 'Hide Generator' : 'Generate Password'}
              </Button>
            </div>
            
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10 bg-vault-darker border-gray-700"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 
                  <EyeOff className="h-4 w-4 text-gray-400" /> : 
                  <Eye className="h-4 w-4 text-gray-400" />
                }
              </Button>
            </div>
            
            {password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-vault-muted">Strength:</span>
                  <span className={`text-xs ${
                    passwordStrength < 2 ? 'text-red-400' : 
                    passwordStrength < 3 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>{strengthLabel}</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getStrengthColor()} transition-all`} 
                    style={{ width: `${(passwordStrength + 1) * 20}%` }}
                  />
                </div>
              </div>
            )}
            
            {showGenerator && (
              <div className="mt-3 p-4 bg-vault-darker rounded-md border border-gray-700">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="password-length">Length: {passwordLength}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7"
                        onClick={handleGeneratePassword}
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                        Generate
                      </Button>
                    </div>
                    <Input
                      id="password-length"
                      type="range"
                      min="8"
                      max="64"
                      value={passwordLength}
                      onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                      className="accent-vault-accent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include-uppercase"
                        checked={includeUppercase}
                        onChange={() => setIncludeUppercase(!includeUppercase)}
                        className="mr-2"
                      />
                      <Label htmlFor="include-uppercase" className="text-sm">
                        Uppercase
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include-lowercase"
                        checked={includeLowercase}
                        onChange={() => setIncludeLowercase(!includeLowercase)}
                        className="mr-2"
                      />
                      <Label htmlFor="include-lowercase" className="text-sm">
                        Lowercase
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include-numbers"
                        checked={includeNumbers}
                        onChange={() => setIncludeNumbers(!includeNumbers)}
                        className="mr-2"
                      />
                      <Label htmlFor="include-numbers" className="text-sm">
                        Numbers
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="include-symbols"
                        checked={includeSymbols}
                        onChange={() => setIncludeSymbols(!includeSymbols)}
                        className="mr-2"
                      />
                      <Label htmlFor="include-symbols" className="text-sm">
                        Symbols
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="url">URL (Optional)</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://example.com"
              className="bg-vault-darker border-gray-700"
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information here..."
              className="bg-vault-darker border-gray-700"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" className="bg-vault-accent hover:bg-vault-accent/90">
              <Check className="h-4 w-4 mr-1" />
              {editingId ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordForm;
