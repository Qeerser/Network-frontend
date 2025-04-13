
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useAuthStore } from '@/state/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" })
});

// Register form schema
const registerSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, login, register: registerUser, error, clearError, isLoading } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" }
  });

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Show toast on error
  useEffect(() => {
    if (error) {
      toast({
        title: isLogin ? "Login Error" : "Registration Error",
        description: error,
        variant: "destructive"
      });
      clearError();
    }
  }, [error, toast, clearError, isLogin]);

  // Login form submission
  const handleLogin = async (data: LoginFormValues) => {
    await login(data.email, data.password);
  };

  // Register form submission
  const handleRegister = async (data: RegisterFormValues) => {
    await registerUser(data.username, data.email, data.password);
  };

  // Toggle between login and register
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Theme toggle */}
      <button 
        onClick={toggleTheme} 
        className="absolute top-4 right-4 p-2 rounded-full pixel-button bg-secondary"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      
      <div className="w-full max-w-md">
        <div className="pixel-card bg-card p-6 animate-fade-in">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 pixel-fade-in">
              PixelChat
            </h1>
            <p className="text-muted-foreground pixel-fade-in">
              {isLogin ? "Login to your account" : "Create a new account"}
            </p>
          </div>
          
          {/* Auth forms container with slider */}
          <div className="pixel-slider">
            <div 
              className="slider-transition" 
              style={{ 
                // transform: isLogin ? 'translateX(0)' : 'translateX(-100%)',
                display: 'flex',
                width: '200%'
              }}
            >
              {isLogin ?
             (<div className="w-1/2 pr-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} className="pixel-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} className="pixel-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full mt-2 pixel-button bg-primary text-primary-foreground"
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </div>)
              
              
              :(<div className="w-1/2 pl-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="cooluser" {...field} className="pixel-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} className="pixel-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} className="pixel-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full mt-2 pixel-button bg-primary text-primary-foreground"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </div>)}
            </div>
          </div>
          
          {/* Slider navigation */}
          <div className="flex justify-between items-center mt-6">
            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleAuthMode}
              className="pixel-button"
              disabled={!isLogin}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={toggleAuthMode}
              className="pixel-button"
              disabled={isLogin}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
