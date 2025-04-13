
import React, { useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import ChatInterface from '@/components/ChatInterface';
import { useAuthStore } from '@/state/authStore';
import { useChatStore } from '@/state/store';
import { useNavigate } from 'react-router-dom';
import ChatClients from '@/components/ChatClients';

const Index: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuthStore();
  const { setClientName } = useChatStore();
  const navigate = useNavigate();
  
  // Update the clientName when the user logs in
  useEffect(() => {
    if (currentUser?.username) {
      setClientName(currentUser.username);
    }
  }, [currentUser, setClientName]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return (
    <Layout>
      <div className="fixed inset-0 bg-background theme-transition">
        <div className="h-full flex flex-col">
          <div className="flex-grow overflow-hidden">
            <Card className="h-full border-0 shadow-none rounded-none">
              <CardContent className="p-0 h-full flex flex-col">
                <div className="border-b p-4">
                  <ChatClients />
                </div>
                <div className="flex-grow overflow-hidden">
                  <ChatInterface />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
