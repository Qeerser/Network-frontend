
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
      <section className="section bg-background theme-transition">
        <div className="container-fluid">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle> 
                  <ChatClients /> </CardTitle>
              </CardHeader>
              <CardContent>
                <ChatInterface />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
