
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, KeyRound, ShieldQuestion } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SecurityQuestion } from './SecurityQuestionsSetup';

interface PasswordRecoveryProps {
  onCancel: () => void;
}

const PasswordRecovery = ({ onCancel }: PasswordRecoveryProps) => {
  const { resetPasswordWithSecurityQuestions, getSecurityQuestions } = useAuth();
  const [answers, setAnswers] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'questions' | 'new-password'>('questions');
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[] | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadSecurityQuestions = async () => {
      const questions = await getSecurityQuestions();
      setSecurityQuestions(questions);
      setLoading(false);
    };
    
    loadSecurityQuestions();
  }, [getSecurityQuestions]);

  const handleAnswerChange = (index: number, answer: string) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = answer;
    setAnswers(updatedAnswers);
    setError(null);
  };

  const handleQuestionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!securityQuestions) return;
    
    // Validate all questions have answers
    if (answers.length !== securityQuestions.length || answers.some(a => !a.trim())) {
      setError('Please answer all security questions');
      return;
    }
    
    // Check if answers match stored answers
    const allCorrect = securityQuestions.every((q, i) => 
      answers[i].toLowerCase().trim() === q.answer.toLowerCase().trim()
    );
    
    if (!allCorrect) {
      setError('One or more answers are incorrect');
      return;
    }
    
    // Proceed to new password step
    setStep('new-password');
    setError(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    const success = await resetPasswordWithSecurityQuestions(newPassword);
    if (!success) {
      setError('Failed to reset password. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center">Loading security questions...</div>;
  }

  if (!securityQuestions || securityQuestions.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Password Recovery</CardTitle>
            <CardDescription>
              No security questions have been set up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven't set up security questions for password recovery. 
              Without security questions, there is no way to recover your master password.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={onCancel} className="w-full">
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-4">
          {step === 'questions' ? (
            <ShieldQuestion className="w-12 h-12 text-vault-accent" />
          ) : (
            <KeyRound className="w-12 h-12 text-vault-accent" />
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">Reset Master Password</h1>
        <p className="text-vault-muted">
          {step === 'questions' 
            ? 'Answer your security questions to reset your password' 
            : 'Create a new master password'}
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        {step === 'questions' ? (
          <form onSubmit={handleQuestionsSubmit}>
            <CardHeader>
              <CardTitle>Security Questions</CardTitle>
              <CardDescription>
                Answer your security questions to verify your identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityQuestions.map((q, index) => (
                <div key={index} className="space-y-2">
                  <p className="font-medium text-sm">{q.question}</p>
                  <Input
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Your answer"
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Continue
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <CardHeader>
              <CardTitle>New Master Password</CardTitle>
              <CardDescription>
                Create a new strong master password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                />
              </div>
              <p className="text-xs text-vault-muted mt-2">
                Make sure to use a strong password with a mix of letters, numbers, and symbols
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep('questions')}>
                Back
              </Button>
              <Button type="submit">
                Reset Password
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default PasswordRecovery;
