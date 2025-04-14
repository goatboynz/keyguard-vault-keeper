
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PasswordList from '@/components/passwords/PasswordList';
import PasswordForm from '@/components/passwords/PasswordForm';
import { usePasswords } from '@/contexts/PasswordContext';

const Dashboard = () => {
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | undefined>(undefined);
  const { selectedCategory, selectedSubcategory } = usePasswords();
  
  const handleAddPassword = () => {
    setEditingPasswordId(undefined);
    setIsPasswordFormOpen(true);
  };
  
  const handleEditPassword = (id: string) => {
    setEditingPasswordId(id);
    setIsPasswordFormOpen(true);
  };
  
  const handleClosePasswordForm = () => {
    setIsPasswordFormOpen(false);
    setEditingPasswordId(undefined);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onAddPassword={handleAddPassword} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">
              {selectedCategory}
              {selectedSubcategory !== 'All' && (
                <span className="text-gray-400 ml-2">/ {selectedSubcategory}</span>
              )}
            </h1>
          </div>
          <PasswordList onEdit={handleEditPassword} />
        </main>
      </div>
      
      <PasswordForm
        isOpen={isPasswordFormOpen}
        onClose={handleClosePasswordForm}
        editingId={editingPasswordId}
      />
    </div>
  );
};

export default Dashboard;
