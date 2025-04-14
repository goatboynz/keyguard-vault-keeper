
import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ShieldQuestion } from 'lucide-react';

export interface SecurityQuestion {
  question: string;
  answer: string;
}

export const DEFAULT_SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What was your childhood nickname?",
  "In what city were you born?",
  "What is the name of your favorite childhood teacher?",
  "What is your mother's maiden name?"
];

interface SecurityQuestionsSetupProps {
  onComplete: (questions: SecurityQuestion[]) => void;
  onSkip?: () => void;
}

const SecurityQuestionsSetup = ({ onComplete, onSkip }: SecurityQuestionsSetupProps) => {
  const [questions, setQuestions] = useState<SecurityQuestion[]>(
    DEFAULT_SECURITY_QUESTIONS.map(q => ({ question: q, answer: '' }))
  );
  const [error, setError] = useState<string | null>(null);

  const handleAnswerChange = (index: number, answer: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].answer = answer;
    setQuestions(updatedQuestions);
    setError(null);
  };

  const handleQuestionChange = (index: number, question: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].question = question;
    setQuestions(updatedQuestions);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all questions have answers
    const unansweredQuestions = questions.filter(q => !q.answer.trim());
    if (unansweredQuestions.length > 0) {
      setError(`Please answer all security questions`);
      return;
    }
    
    onComplete(questions);
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-4">
          <ShieldQuestion className="w-12 h-12 text-vault-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Set Up Security Questions</h1>
        <p className="text-vault-muted">
          These questions will help you recover your vault if you forget your master password
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Security Questions</CardTitle>
            <CardDescription>
              Please answer all five security questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, index) => (
              <div key={index} className="space-y-2">
                <div>
                  <Label htmlFor={`question-${index}`}>Question {index + 1}</Label>
                  <Input
                    id={`question-${index}`}
                    value={q.question}
                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`answer-${index}`}>Answer</Label>
                  <Input
                    id={`answer-${index}`}
                    value={q.answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="mt-1"
                    placeholder="Your answer"
                  />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            {onSkip && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onSkip}
              >
                Skip for Now
              </Button>
            )}
            <Button type="submit" className="w-full sm:w-auto">
              Save Security Questions
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default SecurityQuestionsSetup;
