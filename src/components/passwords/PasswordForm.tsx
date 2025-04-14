import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, RefreshCcw, Check, X, Shield, Plus, Trash } from 'lucide-react';
import { usePasswords, CATEGORIES, CategoryDefinition } from '@/contexts/PasswordContext';
import { PasswordEntry, CredentialType, BaseField } from '@/utils/storage';
import { generatePassword, evaluatePasswordStrength, getPasswordStrengthLabel } from '@/utils/encryption';

interface PasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string;
}

const PasswordForm = ({ isOpen, onClose, editingId }: PasswordFormProps) => {
  const { addPassword, updatePassword, getPassword, getCategoryByType } = usePasswords();
  
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [notes, setNotes] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credentialType, setCredentialType] = useState<CredentialType>('website');
  const [customFields, setCustomFields] = useState<BaseField[]>([]);
  
  const selectedCategory = CATEGORIES.find(cat => cat.name === category);
  
  const [showGenerator, setShowGenerator] = useState(false);
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  
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
  
  useEffect(() => {
    if (editingId && isOpen) {
      const passwordData = getPassword(editingId);
      if (passwordData) {
        setTitle(passwordData.title || '');
        setUsername(passwordData.username || '');
        setPassword(passwordData.password || '');
        setUrl(passwordData.url || '');
        setCategory(getCategoryNameByCredentialType(passwordData.credentialType));
        setSubcategory(passwordData.subcategory || '');
        setNotes(passwordData.notes || '');
        setCredentialType(passwordData.credentialType);
        setCustomFields(passwordData.customFields || []);
      }
    }
  }, [editingId, isOpen, getPassword]);
  
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        if (!editingId) {
          setTitle('');
          setUsername('');
          setPassword('');
          setUrl('');
          setCategory('');
          setSubcategory('');
          setNotes('');
          setShowGenerator(false);
          setShowPassword(false);
          setCredentialType('website');
          setCustomFields([]);
        }
      }, 300);
    }
  }, [isOpen, editingId]);
  
  const getCategoryNameByCredentialType = (type: CredentialType): string => {
    const category = CATEGORIES.find(cat => cat.credentialType === type);
    return category ? category.name : 'Other';
  };
  
  const handleCategoryChange = (categoryName: string) => {
    setCategory(categoryName);
    
    const selectedCat = CATEGORIES.find(cat => cat.name === categoryName);
    if (selectedCat) {
      setCredentialType(selectedCat.credentialType);
      
      if (selectedCat.defaultFields && selectedCat.defaultFields.length > 0) {
        setCustomFields(JSON.parse(JSON.stringify(selectedCat.defaultFields)));
      } else {
        setCustomFields([]);
      }
      
      if (selectedCat.subcategories && selectedCat.subcategories.length > 0) {
        setSubcategory(selectedCat.subcategories[0]);
      } else {
        setSubcategory('');
      }
    }
  };
  
  const addCustomField = () => {
    setCustomFields([...customFields, { name: '', value: '', isSecret: false }]);
  };
  
  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };
  
  const updateCustomField = (index: number, field: Partial<BaseField>) => {
    const updatedFields = [...customFields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    setCustomFields(updatedFields);
  };
  
  const handleGeneratePassword = () => {
    if (!includeLowercase && !includeUppercase && !includeNumbers && !includeSymbols) {
      return;
    }
    
    const newPassword = generatePassword(passwordLength, {
      includeLowercase,
      includeUppercase,
      includeNumbers,
      includeSymbols
    });
    
    setPassword(newPassword);
    setShowPassword(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !category) {
      alert('Please enter at least a title and category');
      return;
    }
    
    if (['website', 'email', 'app'].includes(credentialType) && (!username || !password)) {
      alert('Please enter both username and password');
      return;
    }
    
    if (customFields.length > 0) {
      const invalidFields = customFields.filter(field => !field.name || !field.value);
      if (invalidFields.length > 0) {
        alert('Please fill out all custom fields');
        return;
      }
    }
    
    const passwordData = {
      title,
      username,
      password,
      url,
      category,
      subcategory: subcategory || undefined,
      notes,
      credentialType,
      customFields: customFields.length > 0 ? customFields : undefined
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
          <DialogTitle>{editingId ? 'Edit Credential' : 'Add New Credential'}</DialogTitle>
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
            <Select value={category} onValueChange={handleCategoryChange} required>
              <SelectTrigger className="bg-vault-darker border-gray-700">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter(cat => cat.name !== 'All').map((cat) => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedCategory?.subcategories && selectedCategory.subcategories.length > 0 && (
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select value={subcategory} onValueChange={setSubcategory}>
                <SelectTrigger className="bg-vault-darker border-gray-700">
                  <SelectValue placeholder="Select a subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory.subcategories.map((subcat) => (
                    <SelectItem key={subcat} value={subcat}>
                      {subcat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {['website', 'email', 'app', 'software', 'financialBanking', 'socialMedia', 'gaming', 'professional', 'digital'].includes(credentialType) && (
            <>
              <div>
                <Label htmlFor="username">Username / Email</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. john.doe@example.com"
                  className="bg-vault-darker border-gray-700"
                  required={['website', 'email', 'app'].includes(credentialType)}
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
                    required={['website', 'email', 'app'].includes(credentialType)}
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
            </>
          )}
          
          {['website', 'financialBanking', 'socialMedia', 'professional', 'digital'].includes(credentialType) && (
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. https://example.com"
                className="bg-vault-darker border-gray-700"
              />
            </div>
          )}
          
          {customFields.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <Label>Custom Fields</Label>
              </div>
              
              {customFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={field.name}
                      onChange={(e) => updateCustomField(index, { name: e.target.value })}
                      placeholder="Field name"
                      className="mb-2 bg-vault-darker border-gray-700"
                    />
                    <div className="relative">
                      <Input
                        type={field.isSecret && !showPassword ? 'password' : 'text'}
                        value={field.value}
                        onChange={(e) => updateCustomField(index, { value: e.target.value })}
                        placeholder="Field value"
                        className="bg-vault-darker border-gray-700"
                      />
                      {field.isSecret && (
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
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCustomField(index, { isSecret: !field.isSecret })}
                    >
                      {field.isSecret ? 
                        <Eye className="h-4 w-4 text-gray-400" /> : 
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      }
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeCustomField(index)}
                    >
                      <Trash className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={addCustomField}
          >
            <Plus className="h-4 w-4" />
            Add Custom Field
          </Button>
          
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
