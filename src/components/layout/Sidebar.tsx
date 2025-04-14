
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, FolderLock, Wifi, Mail, Globe, Smartphone, Database } from 'lucide-react';
import { usePasswords } from '@/contexts/PasswordContext';
import { Separator } from '@/components/ui/separator';

type CategoryItem = {
  name: string;
  icon: React.ElementType;
};

const categories: CategoryItem[] = [
  { name: 'All', icon: Database },
  { name: 'CCTV', icon: Wifi },
  { name: 'Email', icon: Mail },
  { name: 'Website', icon: Globe },
  { name: 'App', icon: Smartphone },
];

interface SidebarProps {
  onAddPassword: () => void;
}

const Sidebar = ({ onAddPassword }: SidebarProps) => {
  const { selectedCategory, setSelectedCategory } = usePasswords();
  
  return (
    <aside className="w-64 min-w-64 bg-vault-darker border-r border-gray-800 h-screen overflow-y-auto">
      <div className="p-4">
        <Button onClick={onAddPassword} className="w-full bg-vault-accent hover:bg-vault-accent/90 gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Password</span>
        </Button>
      </div>
      
      <Separator className="bg-gray-800" />
      
      <nav className="p-3">
        <p className="text-xs uppercase text-gray-500 font-medium px-3 mb-2">Categories</p>
        <ul className="space-y-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.name;
            
            return (
              <li key={category.name}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 font-normal",
                    isActive 
                      ? "bg-vault-accent/10 text-vault-accent" 
                      : "hover:bg-vault-accent/5"
                  )}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-vault-accent" : "text-gray-400")} />
                  <span>{category.name}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
