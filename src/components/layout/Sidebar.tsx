
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Folder, Home, Settings, KeyRound, CreditCard, Shield, Briefcase, Package2, 
  BadgePercent, DoorClosed, Hash, KeySquare, Building2, Gamepad2, Wifi, Network,
  Star, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePasswords } from '@/contexts/PasswordContext';
import { useMobile } from '@/hooks/use-mobile';

interface SidebarProps {
  onAddPassword?: () => void;
}

type NavItem = {
  title: string;
  path?: string; // Optional as category items don't have paths
  icon: React.ReactNode;
  isCategory?: boolean;
  subcategories?: string[];
  credentialType?: string;
};

const Sidebar = ({ onAddPassword }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const { 
    categories, 
    subcategories,
    selectCategory, 
    selectSubcategory,
    selectedCategory,
    selectedSubcategory
  } = usePasswords();
  
  useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  // Map credential types to appropriate icons
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Website': return <Globe className="h-4 w-4" />;
      case 'App': return <Smartphone className="h-4 w-4" />;
      case 'Email': return <Mail className="h-4 w-4" />;
      case 'CCTV': return <Video className="h-4 w-4" />;
      case 'Door Code': return <DoorClosed className="h-4 w-4" />;
      case 'API Key': return <Hash className="h-4 w-4" />;
      case 'Software': return <Package2 className="h-4 w-4" />;
      case 'Financial': return <CreditCard className="h-4 w-4" />;
      case 'Social Media': return <MessageSquare className="h-4 w-4" />;
      case 'Gaming': return <Gamepad2 className="h-4 w-4" />;
      case 'Networking': return <Network className="h-4 w-4" />;
      case 'Professional': return <Briefcase className="h-4 w-4" />;
      case 'Digital': return <KeySquare className="h-4 w-4" />;
      case 'Other': return <Folder className="h-4 w-4" />;
      default: return <Folder className="h-4 w-4" />;
    }
  };

  // Navigation items including general pages and categories
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Settings",
      path: "/settings",
      icon: <Settings className="h-4 w-4" />
    },
    {
      title: "Categories",
      icon: <Folder className="h-4 w-4" />,
      isCategory: true
    },
    // ... Add favorites, etc. if needed
  ];
  
  // Dynamically add category items
  const categoryItems: NavItem[] = categories.map(category => ({
    title: category,
    icon: getCategoryIcon(category),
    isCategory: true,
    subcategories: subcategories[category] || [],
    credentialType: category
  }));
  
  const handleCategoryClick = (category: string) => {
    selectCategory(category);
    selectSubcategory('All');
  };
  
  const handleSubcategoryClick = (subcategory: string) => {
    selectSubcategory(subcategory);
  };
  
  return (
    <div className={cn(
      "h-screen bg-vault-darker border-r border-gray-800 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-vault-accent mr-2" />
              <span className="font-semibold">KeyGuard</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        <Button
          className="mb-6 w-full bg-vault-accent hover:bg-vault-accent/90 justify-center"
          onClick={onAddPassword}
        >
          {isCollapsed ? (
            <Plus className="h-4 w-4" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Password
            </>
          )}
        </Button>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {/* Main navigation items */}
            {navItems.map((item, index) => (
              item.path ? (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors",
                    isActive ? "bg-vault-dark text-vault-accent" : "text-gray-400 hover:bg-vault-dark/50 hover:text-white"
                  )}
                >
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center w-full">
                          {item.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      {item.icon}
                      <span className="ml-3 text-sm">{item.title}</span>
                    </>
                  )}
                </NavLink>
              ) : item.isCategory ? (
                <div key={index} className="pt-4">
                  {!isCollapsed && (
                    <h2 className="mb-2 px-3 text-xs font-semibold text-gray-500 uppercase">
                      {item.title}
                    </h2>
                  )}
                </div>
              ) : null
            ))}
            
            {/* Category items */}
            {categoryItems.map((item, index) => (
              <div key={`category-${index}`}>
                <button
                  className={cn(
                    "flex items-center px-3 py-2 w-full rounded-md transition-colors",
                    selectedCategory === item.title 
                      ? "bg-vault-dark text-vault-accent" 
                      : "text-gray-400 hover:bg-vault-dark/50 hover:text-white"
                  )}
                  onClick={() => handleCategoryClick(item.title)}
                >
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center w-full">
                          {item.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <>
                      {item.icon}
                      <span className="ml-3 text-sm">{item.title}</span>
                    </>
                  )}
                </button>
                
                {/* Subcategories - only show if category is selected and not collapsed */}
                {!isCollapsed && selectedCategory === item.title && item.subcategories && item.subcategories.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    <button
                      className={cn(
                        "flex items-center px-3 py-1 w-full rounded-md transition-colors text-sm",
                        selectedSubcategory === 'All' 
                          ? "text-vault-accent" 
                          : "text-gray-400 hover:text-white"
                      )}
                      onClick={() => handleSubcategoryClick('All')}
                    >
                      All
                    </button>
                    
                    {item.subcategories.map((subcategory, subIndex) => (
                      <button
                        key={`subcategory-${subIndex}`}
                        className={cn(
                          "flex items-center px-3 py-1 w-full rounded-md transition-colors text-sm",
                          selectedSubcategory === subcategory 
                            ? "text-vault-accent" 
                            : "text-gray-400 hover:text-white"
                        )}
                        onClick={() => handleSubcategoryClick(subcategory)}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

// Missing import statements
import { 
  ChevronLeft, ChevronRight, Mail, Globe, Smartphone, 
  Video, MessageSquare 
} from 'lucide-react';

export default Sidebar;
