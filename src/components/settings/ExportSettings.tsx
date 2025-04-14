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
import { useStorage } from '@/contexts/StorageContext';
import { DatabaseIcon, Upload } from 'lucide-react';

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
  const { exportDatabase, importDatabase } = useStorage();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const fileInputRef = useState<HTMLInputElement | null>(null)[1];
  
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

  const handleDatabaseExport = async () => {
    try {
      await exportDatabase();
    } catch (error) {
      console.error('Failed to export database:', error);
      toast({
        title: "Export Failed",
        description: "There was a problem exporting your database.",
        variant: "destructive",
      });
    }
  };

  const handleDatabaseImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const success = await importDatabase(file);
      if (!success) {
        toast({
          title: "Import Failed",
          description: "The database file could not be imported.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to import database:', error);
      toast({
        title: "Import Error",
        description: "There was an error processing your database file.",
        variant: "destructive",
      });
    }
    
    // Reset the file input
    e.target.value = '';
  };

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
                          <SelectItem key={category.name} value={category.name}>
                            {category.name}
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

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>
            Export or import your entire vault as a database file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={handleDatabaseExport}
              className="w-full sm:w-auto"
            >
              <DatabaseIcon className="mr-2 h-4 w-4" />
              Export Database
            </Button>
            
            <div className="relative w-full sm:w-auto">
              <input
                type="file"
                id="database-import"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".db,.sqlite"
                onChange={handleDatabaseImport}
                ref={fileInputRef}
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fileInputRef?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Database
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Database files are saved in the "database" folder and contain your entire encrypted vault.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportSettings;
