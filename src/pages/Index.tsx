
import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatInterface from '@/components/ChatInterface';
import { useAuthStore } from '@/state/authStore';
import { useChatStore } from '@/state/store';
import { useNavigate } from 'react-router-dom';
import ChatClients from '@/components/ChatClients';
import { Button } from '@/components/ui/button';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const Index: React.FC = () => {
  const { isAuthenticated, currentUser, logout } = useAuthStore();
  const { setClientName, setClientId } = useChatStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // Update the client name and ID when the user logs in
  useEffect(() => {
    if (currentUser?.username) {
      setClientName(currentUser.username);
      if (currentUser.id) {
        setClientId(currentUser.id);
      }
    }
  }, [currentUser, setClientName, setClientId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout>
      <div className="fixed inset-0 overflow-hidden bg-background theme-transition">
        <div className="h-full py-4 px-4 md:px-8">
          <div className="max-w-6xl mx-auto h-full">
            <Card className="flex flex-col h-full overflow-hidden shadow-lg">
              <div className="absolute top-6 right-6 md:right-10 z-20 flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full"
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLogout}
                  className="rounded-full"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <CardHeader className="sticky top-0 z-10 bg-card py-2 px-4">
                <CardTitle> 
                  <ChatClients /> 
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ChatInterface />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
