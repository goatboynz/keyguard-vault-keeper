
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Plus, FolderLock, Wifi, Mail, Globe, Smartphone, Database, 
  Key, Code, Laptop, CreditCard, Share2, Gamepad2, Network, 
  Briefcase, ChevronDown, ChevronRight
} from 'lucide-react';
import { usePasswords, CATEGORIES } from '@/contexts/PasswordContext';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Map category names to icon components
const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Database': <Database className="h-4 w-4" />,
    'Wifi': <Wifi className="h-4 w-4" />,
    'Mail': <Mail className="h-4 w-4" />,
    'Globe': <Globe className="h-4 w-4" />,
    'Smartphone': <Smartphone className="h-4 w-4" />,
    'Key': <Key className="h-4 w-4" />,
    'Code': <Code className="h-4 w-4" />,
    'Laptop': <Laptop className="h-4 w-4" />,
    'CreditCard': <CreditCard className="h-4 w-4" />,
    'Share2': <Share2 className="h-4 w-4" />,
    'Gamepad2': <Gamepad2 className="h-4 w-4" />,
    'Network': <Network className="h-4 w-4" />,
    'Briefcase': <Briefcase className="h-4 w-4" />
  };
  
  return icons[iconName] || <Database className="h-4 w-4" />;
};

interface SidebarProps {
  onAddPassword: () => void;
}

const Sidebar = ({ onAddPassword }: SidebarProps) => {
  const { 
    selectedCategory, 
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory
  } = usePasswords();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  
  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setOpenCategories({
      ...openCategories,
      [categoryName]: !openCategories[categoryName]
    });
  };
  
  return (
    <aside className="w-64 min-w-64 bg-vault-darker border-r border-gray-800 h-screen overflow-y-auto">
      <div className="p-4">
        <Button onClick={onAddPassword} className="w-full bg-vault-accent hover:bg-vault-accent/90 gap-2">
          <Plus className="h-4 w-4" />
          <span>Add Credential</span>
        </Button>
      </div>
      
      <Separator className="bg-gray-800" />
      
      <nav className="p-3">
        <p className="text-xs uppercase text-gray-500 font-medium px-3 mb-2">Categories</p>
        <ul className="space-y-1">
          {CATEGORIES.map((category) => {
            const isActive = selectedCategory === category.name;
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            const isOpen = openCategories[category.name];
            
            return (
              <li key={category.name}>
                {hasSubcategories ? (
                  <Collapsible 
                    open={isOpen} 
                    onOpenChange={() => toggleCategory(category.name)}
                    className={cn(
                      "w-full",
                      isActive && "bg-vault-accent/10 rounded-md"
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between font-normal",
                          isActive 
                            ? "bg-vault-accent/10 text-vault-accent" 
                            : "hover:bg-vault-accent/5"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(category.icon)}
                          <span>{category.name}</span>
                        </div>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-8 mt-1 space-y-1">
                      {category.subcategories?.map(subcat => (
                        <Button
                          key={subcat}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start gap-2 text-sm font-normal",
                            selectedSubcategory === subcat && selectedCategory === category.name
                              ? "bg-vault-accent/10 text-vault-accent" 
                              : "hover:bg-vault-accent/5"
                          )}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setSelectedSubcategory(subcat);
                          }}
                        >
                          <span>{subcat}</span>
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal",
                      isActive 
                        ? "bg-vault-accent/10 text-vault-accent" 
                        : "hover:bg-vault-accent/5"
                    )}
                    onClick={() => {
                      setSelectedCategory(category.name);
                      setSelectedSubcategory('All');
                    }}
                  >
                    {getCategoryIcon(category.icon)}
                    <span>{category.name}</span>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
