
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { evaluatePasswordStrength, getPasswordStrengthLabel } from '@/utils/encryption';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Current password is required.",
  }),
  newPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const SecuritySettings = () => {
  const { toast } = useToast();
  const { logout, resetVault, updateMasterPassword } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const watchNewPassword = form.watch("newPassword");
  const passwordStrength = evaluatePasswordStrength(watchNewPassword);
  const passwordLabel = watchNewPassword ? getPasswordStrengthLabel(passwordStrength) : "";
  
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

  function onSubmit(data: PasswordFormValues) {
    if (passwordStrength < 2) {
      toast({
        title: "Weak password",
        description: "Please use a stronger password with a mix of characters.",
        variant: "destructive",
      });
      return;
    }
    
    const success = updateMasterPassword(data.currentPassword, data.newPassword);
    if (success) {
      form.reset();
    }
  }

  function handleResetVault() {
    // Confirm with the user before resetting
    const confirmed = window.confirm(
      "WARNING: This will permanently delete all saved passwords and reset your vault. This action cannot be undone. Are you sure you want to continue?"
    );
    
    if (confirmed) {
      // Reset the vault and log out
      resetVault();
    }
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Master Password</CardTitle>
          <CardDescription>
            Update your master password to keep your vault secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showCurrentPassword ? "text" : "password"} 
                          placeholder="Enter your current password" 
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? 
                          <EyeOff className="h-4 w-4 text-gray-400" /> : 
                          <Eye className="h-4 w-4 text-gray-400" />
                        }
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>New Password</FormLabel>
                      {watchNewPassword && (
                        <span className={`text-xs ${
                          passwordStrength < 2 ? 'text-red-400' : 
                          passwordStrength < 3 ? 'text-yellow-400' : 
                          'text-green-400'
                        }`}>
                          {passwordLabel}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="Enter your new password" 
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? 
                          <EyeOff className="h-4 w-4 text-gray-400" /> : 
                          <Eye className="h-4 w-4 text-gray-400" />
                        }
                      </Button>
                    </div>
                    {watchNewPassword && (
                      <div className="w-full h-1 mt-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getStrengthColor()} transition-all`} 
                          style={{ width: `${(passwordStrength + 1) * 20}%` }}
                        />
                      </div>
                    )}
                    <FormDescription>
                      Use at least 12 characters with a mix of uppercase, lowercase, numbers, and symbols.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Confirm your new password" 
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? 
                          <EyeOff className="h-4 w-4 text-gray-400" /> : 
                          <Eye className="h-4 w-4 text-gray-400" />
                        }
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit">Update Password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Security Options</CardTitle>
          <CardDescription>
            Configure additional security settings for your vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Auto-lock vault</h3>
              <p className="text-sm text-muted-foreground">
                Lock vault after 5 minutes of inactivity
              </p>
            </div>
            <Switch
              checked={autoLockEnabled}
              onCheckedChange={setAutoLockEnabled}
            />
          </div>
          
          <div className="pt-4">
            <Button 
              variant="destructive" 
              onClick={handleResetVault}
            >
              Reset Vault
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will delete all your saved passwords and reset your vault.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
