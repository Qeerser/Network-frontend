
import React from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ChatClients from '@/components/ChatClients';
import ChatInterface from '@/components/ChatInterface';

const Index: React.FC = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-section bg-gradient-to-b from-background to-secondary/30 theme-transition">
        <div className="container-fluid text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <h1 className="font-bold tracking-tight">
              Welcome to <span className="text-primary">ChopKhui</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              A beautiful and responsive chat application with seamless theme switching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg">Get Started</Button>
              <Button size="lg" variant="outline">Learn More</Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Chat Section */}
      <section className="section bg-background theme-transition">
        <div className="container-fluid">
          <div className="text-center mb-12">
            <h2 className="mb-4">Chat System</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with other users in real-time
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Chat Client</CardTitle>
                <CardDescription>
                  Set your name and see who's connected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatClients />
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>
                  Chat privately with users or join group conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChatInterface />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-background theme-transition">
        <div className="container-fluid">
          <div className="text-center mb-12">
            <h2 className="mb-4">Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover what makes our application special
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Private Messaging",
                description: "Exchange direct messages with other connected users."
              },
              {
                title: "Group Chats",
                description: "Create and join group conversations with multiple users."
              },
              {
                title: "Theme Switching",
                description: "Seamlessly switch between dark and light themes."
              },
              {
                title: "Real-time Updates",
                description: "Messages and user status update instantly."
              },
              {
                title: "Responsive Design",
                description: "Works perfectly on mobile, tablet and desktop."
              },
              {
                title: "User-friendly Interface",
                description: "Clean and intuitive UI for effortless communication."
              }
            ].map((feature, index) => (
              <Card key={index} className="card-hover">
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary/5 theme-transition">
        <div className="container-fluid text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground">
              Join us today and experience the difference.
            </p>
            <Button size="lg" className="mt-4">Sign Up Now</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
