
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/auth/Login';
import MasterPasswordSetup from '@/components/auth/MasterPasswordSetup';
import Dashboard from '@/pages/Dashboard';
import { PasswordProvider } from '@/contexts/PasswordContext';

const Index = () => {
  const { isAuthenticated, isSetup } = useAuth();

  // If authenticated, render the dashboard
  if (isAuthenticated) {
    return (
      <PasswordProvider>
        <Dashboard />
      </PasswordProvider>
    );
  }

  // If not authenticated but master password is set up, render login
  if (!isAuthenticated && isSetup) {
    return (
      <div className="min-h-screen bg-vault-dark flex flex-col items-center justify-center p-4">
        <Login />
      </div>
    );
  }

  // If not authenticated and no master password is set up, render setup
  return (
    <div className="min-h-screen bg-vault-dark flex flex-col items-center justify-center p-4">
      <MasterPasswordSetup />
    </div>
  );
};

export default Index;
