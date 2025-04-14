
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePasswords } from '@/contexts/PasswordContext';

const Header = () => {
  const { logout } = useAuth();
  const { setSearchTerm } = usePasswords();
  const [searchInput, setSearchInput] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setSearchTerm(value); // Update search in real-time
  };
  
  return (
    <header className="bg-vault-darker border-b border-gray-800 py-4 px-6 vault-header sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-vault-accent" />
          <h1 className="text-xl font-semibold">KeyGuard Vault</h1>
        </div>
        
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search passwords..."
              className="pl-10 bg-vault-dark/50 border-gray-700"
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>
        </form>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" title="Settings" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
