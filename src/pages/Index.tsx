
import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ChatInterface from '@/components/ChatInterface';
import { useAuthStore } from '@/state/authStore';
import { useChatStore } from '@/state/store';
import { useNavigate } from 'react-router-dom';
import ChatClients from '@/components/ChatClients';

const Index: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuthStore();
  const { setClientName, setClientId } = useChatStore();
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

  return (
    <Layout>
      <div className="fixed inset-0 overflow-hidden bg-background theme-transition">
        <div className="h-full py-4 px-4 md:px-8">
          <div className="max-w-6xl mx-auto h-full">
            <Card className="flex flex-col h-full overflow-hidden shadow-lg">
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
