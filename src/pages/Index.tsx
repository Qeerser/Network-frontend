
import React from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
              A beautiful and responsive application with seamless theme switching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg">Get Started</Button>
              <Button size="lg" variant="outline">Learn More</Button>
            </div>
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
                title: "Responsive Design",
                description: "Looks great on any device, from mobile to desktop."
              },
              {
                title: "Theme Switching",
                description: "Seamlessly switch between dark and light themes."
              },
              {
                title: "Modern UI",
                description: "Clean, intuitive interface with beautiful components."
              },
              {
                title: "Scalable Structure",
                description: "Well-organized codebase ready for growth."
              },
              {
                title: "Accessible",
                description: "Built with accessibility in mind for all users."
              },
              {
                title: "Performance Focused",
                description: "Optimized for speed and smooth interactions."
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
