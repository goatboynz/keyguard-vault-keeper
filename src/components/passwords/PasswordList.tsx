
import { useState, useMemo } from 'react';
import { usePasswords } from '@/contexts/PasswordContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Eye, EyeOff, Copy, Edit, Trash2, Globe, Mail, Shield, Wifi, 
  Smartphone, Database, Key, Code, Laptop, CreditCard, Share2, 
  Gamepad2, Network, Briefcase 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PasswordEntry, BaseField } from '@/utils/storage';

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'cctv':
      return <Wifi className="h-4 w-4 text-blue-400" />;
    case 'email':
      return <Mail className="h-4 w-4 text-amber-400" />;
    case 'websites':
      return <Globe className="h-4 w-4 text-green-400" />;
    case 'door codes':
      return <Key className="h-4 w-4 text-red-400" />;
    case 'api keys':
      return <Code className="h-4 w-4 text-violet-400" />;
    case 'software':
      return <Laptop className="h-4 w-4 text-blue-500" />;
    case 'financial':
      return <CreditCard className="h-4 w-4 text-emerald-400" />;
    case 'social media':
      return <Share2 className="h-4 w-4 text-pink-400" />;
    case 'gaming':
      return <Gamepad2 className="h-4 w-4 text-indigo-400" />;
    case 'networking':
      return <Network className="h-4 w-4 text-cyan-400" />;
    case 'work':
      return <Briefcase className="h-4 w-4 text-orange-400" />;
    case 'digital access':
      return <Smartphone className="h-4 w-4 text-purple-400" />;
    default:
      return <Database className="h-4 w-4 text-gray-400" />;
  }
};

interface PasswordListProps {
  onEdit: (id: string) => void;
}

const PasswordList = ({ onEdit }: PasswordListProps) => {
  const { passwords, deletePassword, selectedCategory, selectedSubcategory, searchTerm } = usePasswords();
  const { toast } = useToast();
  const [visiblePasswords, setVisiblePasswords] = useState<string[]>([]);
  const [visibleCustomFields, setVisibleCustomFields] = useState<Record<string, string[]>>({});
  
  // Filter passwords based on category, subcategory and search term
  const filteredPasswords = useMemo(() => {
    return passwords.filter(password => {
      // Category filter
      if (selectedCategory !== 'All') {
        // Find category definition
        const categoryDefinition = { name: selectedCategory };
        
        // Check if this password belongs to the selected category
        if (password.category !== categoryDefinition.name) {
          return false;
        }
        
        // Subcategory filter
        if (selectedSubcategory !== 'All' && password.subcategory !== selectedSubcategory) {
          return false;
        }
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        
        // Check standard fields
        if (
          password.title.toLowerCase().includes(searchLower) ||
          password.username.toLowerCase().includes(searchLower) ||
          (password.url && password.url.toLowerCase().includes(searchLower)) ||
          (password.notes && password.notes.toLowerCase().includes(searchLower))
        ) {
          return true;
        }
        
        // Check custom fields
        if (password.customFields) {
          return password.customFields.some(field => 
            field.name.toLowerCase().includes(searchLower) || 
            field.value.toLowerCase().includes(searchLower)
          );
        }
        
        return false;
      }
      
      return true;
    });
  }, [passwords, selectedCategory, selectedSubcategory, searchTerm]);

  // Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    if (visiblePasswords.includes(id)) {
      setVisiblePasswords(visiblePasswords.filter(pwId => pwId !== id));
    } else {
      // Show password and schedule auto-hide after 10 seconds
      setVisiblePasswords([...visiblePasswords, id]);
      setTimeout(() => {
        setVisiblePasswords(prevVisible => prevVisible.filter(pwId => pwId !== id));
      }, 10000); // 10 seconds
    }
  };
  
  // Toggle custom field visibility
  const toggleCustomFieldVisibility = (passwordId: string, fieldName: string) => {
    const currentVisible = visibleCustomFields[passwordId] || [];
    
    if (currentVisible.includes(fieldName)) {
      setVisibleCustomFields({
        ...visibleCustomFields,
        [passwordId]: currentVisible.filter(name => name !== fieldName)
      });
    } else {
      setVisibleCustomFields({
        ...visibleCustomFields,
        [passwordId]: [...currentVisible, fieldName]
      });
      
      // Auto-hide after 10 seconds
      setTimeout(() => {
        setVisibleCustomFields(prev => ({
          ...prev,
          [passwordId]: (prev[passwordId] || []).filter(name => name !== fieldName)
        }));
      }, 10000);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, itemName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${itemName} has been copied to clipboard and will be cleared shortly.`,
    });
    
    // Clear clipboard after 30 seconds for security
    setTimeout(() => {
      navigator.clipboard.writeText('');
    }, 30000); // 30 seconds
  };

  // Handle password deletion
  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deletePassword(id);
    }
  };
  
  // Render credential fields based on type
  const renderCredentialFields = (password: PasswordEntry) => {
    return (
      <div className="space-y-3">
        {/* Standard username/password for most types */}
        {['website', 'email', 'app', 'software', 'financialBanking', 'socialMedia', 'gaming', 'professional', 'digital'].includes(password.credentialType) && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-sm text-vault-muted">Username</span>
              <div className="flex items-center gap-2">
                <span className="text-sm">{password.username}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(password.username, 'Username')}
                >
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-vault-muted">Password</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">
                  {visiblePasswords.includes(password.id)
                    ? password.password
                    : '••••••••••••'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => togglePasswordVisibility(password.id)}
                >
                  {visiblePasswords.includes(password.id) ? (
                    <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(password.password, 'Password')}
                >
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                </Button>
              </div>
            </div>
          </>
        )}
        
        {/* Custom fields */}
        {password.customFields && password.customFields.map((field, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-vault-muted">{field.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">
                {field.isSecret && !visibleCustomFields[password.id]?.includes(field.name)
                  ? '••••••••••••'
                  : field.value}
              </span>
              {field.isSecret && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleCustomFieldVisibility(password.id, field.name)}
                >
                  {visibleCustomFields[password.id]?.includes(field.name) ? (
                    <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(field.value, field.name)}
              >
                <Copy className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Empty state
  if (filteredPasswords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <Shield className="h-16 w-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-medium mb-2">No credentials found</h3>
        <p className="text-vault-muted mb-6 max-w-md">
          {searchTerm
            ? "No credentials match your search. Try adjusting your search criteria."
            : selectedCategory !== 'All'
            ? selectedSubcategory !== 'All'
              ? `No credentials in the "${selectedCategory}/${selectedSubcategory}" category yet.`
              : `No credentials in the "${selectedCategory}" category yet.`
            : "Your vault is empty. Add your first credential to get started."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {filteredPasswords.map(password => (
        <div
          key={password.id}
          className="bg-vault-darker vault-gradient border border-gray-800 rounded-lg overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {getCategoryIcon(password.category)}
              <span className="text-xs uppercase tracking-wider text-vault-muted">
                {password.category}
                {password.subcategory && ` / ${password.subcategory}`}
              </span>
            </div>
            
            <h3 className="font-medium text-lg mb-2 truncate">{password.title}</h3>
            
            {password.url && (
              <a
                href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-vault-accent hover:underline flex items-center gap-1 mb-4"
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="truncate">{password.url}</span>
              </a>
            )}
            
            {renderCredentialFields(password)}
            
            {password.notes && (
              <div className="mt-4 p-3 bg-vault-dark/30 rounded border border-gray-800">
                <p className="text-sm text-gray-300">{password.notes}</p>
              </div>
            )}
          </div>
          
          <div className="bg-vault-dark/50 p-3 border-t border-gray-800 flex justify-between items-center">
            <span className="text-xs text-vault-muted">
              Last updated: {format(new Date(password.lastModified), 'MMM d, yyyy')}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(password.id)}
              >
                <Edit className="h-3.5 w-3.5 text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDelete(password.id, password.title)}
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PasswordList;
