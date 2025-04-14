
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { usePasswords } from '@/contexts/PasswordContext';

const emailFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

const ExportSettings = () => {
  const { toast } = useToast();
  const { categories } = usePasswords();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
      category: "All",
    },
  });
  
  function onSubmit(data: EmailFormValues) {
    // Here you would handle sending the email with passwords
    console.log("Email password export requested:", data);
    toast({
      title: "Export initiated",
      description: `The selected passwords will be sent to ${data.email}.`,
    });
    form.reset();
  }
  
  function handleExport() {
    // Here you would handle exporting the passwords to a file
    toast({
      title: "Export successful",
      description: `Your passwords have been exported as ${format.toUpperCase()}.`,
    });
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Passwords</CardTitle>
          <CardDescription>
            Send selected passwords to an email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recipient email" {...field} />
                    </FormControl>
                    <FormDescription>
                      The selected passwords will be sent to this email address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="All">All Passwords</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which passwords to include in the email.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit">Send Email</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Export Passwords</CardTitle>
          <CardDescription>
            Export your passwords as a file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              variant={format === 'csv' ? 'default' : 'outline'}
              onClick={() => setFormat('csv')}
            >
              CSV
            </Button>
            <Button
              variant={format === 'json' ? 'default' : 'outline'}
              onClick={() => setFormat('json')}
            >
              JSON
            </Button>
            <p className="text-sm text-muted-foreground">
              Select format for export
            </p>
          </div>
          
          <Button onClick={handleExport}>
            Export as {format.toUpperCase()}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportSettings;
