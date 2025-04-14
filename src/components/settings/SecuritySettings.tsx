import { useState, useEffect } from 'react';
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
import { Eye, EyeOff, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { evaluatePasswordStrength, getPasswordStrengthLabel } from '@/utils/encryption';
import { SecurityQuestion } from '../auth/SecurityQuestionsSetup';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  const { logout, resetVault, updateMasterPassword, hasSecurityQuestions, getSecurityQuestions, setupSecurityQuestions } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [isSecurityQuestionsLoading, setIsSecurityQuestionsLoading] = useState(true);
  const [hasSetupQuestions, setHasSetupQuestions] = useState(false);
  
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>(
    Array(5).fill({ question: '', answer: '' })
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmittingQuestions, setIsSubmittingQuestions] = useState(false);
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  useEffect(() => {
    const loadSecurityQuestions = async () => {
      try {
        setIsSecurityQuestionsLoading(true);
        const hasQuestions = await hasSecurityQuestions();
        setHasSetupQuestions(hasQuestions);
        
        if (hasQuestions) {
          const questions = await getSecurityQuestions();
          if (questions && Array.isArray(questions)) {
            setSecurityQuestions(questions);
          }
        }
      } catch (error) {
        console.error("Failed to load security questions:", error);
      } finally {
        setIsSecurityQuestionsLoading(false);
      }
    };
    
    loadSecurityQuestions();
  }, [hasSecurityQuestions, getSecurityQuestions]);
  
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

  async function onSubmit(data: PasswordFormValues) {
    if (passwordStrength < 2) {
      toast({
        title: "Weak password",
        description: "Please use a stronger password with a mix of characters.",
        variant: "destructive",
      });
      return;
    }
    
    const success = await updateMasterPassword(data.currentPassword, data.newPassword);
    if (success) {
      form.reset();
      toast({
        title: "Password updated",
        description: "Your master password has been updated successfully.",
      });
    }
  }

  async function handleResetVault() {
    const confirmed = window.confirm(
      "WARNING: This will permanently delete all saved passwords and reset your vault. This action cannot be undone. Are you sure you want to continue?"
    );
    
    if (confirmed) {
      await resetVault();
      toast({
        title: "Vault reset",
        description: "Your vault has been reset. You will be logged out now.",
      });
    }
  }
  
  function handleQuestionChange(index: number, value: string) {
    const updated = [...securityQuestions];
    if (!updated[index]) {
      updated[index] = { question: '', answer: '' };
    }
    updated[index].question = value;
    setSecurityQuestions(updated);
  }
  
  function handleAnswerChange(index: number, value: string) {
    const updated = [...securityQuestions];
    if (!updated[index]) {
      updated[index] = { question: '', answer: '' };
    }
    updated[index].answer = value;
    setSecurityQuestions(updated);
  }
  
  async function handleSaveSecurityQuestions() {
    const emptyQuestions = securityQuestions.filter(q => !q.question.trim() || !q.answer.trim());
    if (emptyQuestions.length > 0) {
      toast({
        title: "Incomplete security questions",
        description: "Please provide both questions and answers for all security questions.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmittingQuestions(true);
    
    try {
      const success = await setupSecurityQuestions(securityQuestions);
      if (success) {
        setDialogOpen(false);
        setHasSetupQuestions(true);
        toast({
          title: "Security questions updated",
          description: "Your security questions have been saved successfully.",
        });
      } else {
        toast({
          title: "Failed to save questions",
          description: "There was a problem saving your security questions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving security questions:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingQuestions(false);
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Security Questions</CardTitle>
            <CardDescription>
              Set up security questions for password recovery
            </CardDescription>
          </div>
          <ShieldQuestion className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          {isSecurityQuestionsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Loading security questions...</span>
            </div>
          ) : (
            <>
              <p className="text-sm">
                {hasSetupQuestions 
                  ? "You have set up security questions for password recovery."
                  : "You haven't set up security questions yet. Setting up security questions will allow you to recover your vault if you forget your master password."
                }
              </p>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    {hasSetupQuestions ? "Edit Security Questions" : "Set Up Security Questions"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Security Questions</DialogTitle>
                    <DialogDescription>
                      Set up 5 security questions to help recover your password if forgotten.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 max-h-[60vh] overflow-y-auto py-2">
                    {securityQuestions.map((q, index) => (
                      <div key={index} className="space-y-2">
                        <div>
                          <Label htmlFor={`question-${index}`}>Question {index + 1}</Label>
                          <Input
                            id={`question-${index}`}
                            value={q?.question || ''}
                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`answer-${index}`}>Answer</Label>
                          <Input
                            id={`answer-${index}`}
                            value={q?.answer || ''}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="mt-1"
                            placeholder="Your answer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)} disabled={isSubmittingQuestions}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSaveSecurityQuestions} disabled={isSubmittingQuestions}>
                      {isSubmittingQuestions ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : "Save"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
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
