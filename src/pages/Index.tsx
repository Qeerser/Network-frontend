
import React from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ChatClients from '@/components/ChatClients';
import ChatInterface from '@/components/ChatInterface';

const Index: React.FC = () => {
  return (
    <Layout>
      <section className="section bg-background theme-transition">
        <div className="container-fluid">
          <div className="text-center mb-8">
            <h2 className="mb-2">ChopKhui Chat</h2>
            <p className="text-muted-foreground">Connect with others in real-time</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Online Users</CardTitle>
                <CardDescription>
                  See who's connected and set your name
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatClients />
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Chat</CardTitle>
                <CardDescription>
                  Private messages and group conversations
                </CardDescription>
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
