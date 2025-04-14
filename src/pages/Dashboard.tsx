
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PasswordList from '@/components/passwords/PasswordList';
import PasswordForm from '@/components/passwords/PasswordForm';

const Dashboard = () => {
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [editingPasswordId, setEditingPasswordId] = useState<string | undefined>(undefined);
  
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
