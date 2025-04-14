
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PasswordList from '@/components/passwords/PasswordList';
import PasswordForm from '@/components/passwords/PasswordForm';
import { usePasswords } from '@/contexts/PasswordContext';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | undefined>(undefined);
  const { selectedCategory, selectedSubcategory } = usePasswords();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
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
  
  if (!isAuthenticated) {
    return null;
  }
  
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
