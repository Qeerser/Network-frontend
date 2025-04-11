
import React from 'react';
import Layout from '../components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const Contact: React.FC = () => {
  return (
    <Layout>
      <div className="container-fluid py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              We'd love to hear from you. Get in touch with our team.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Your email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Your message" rows={5} />
                  </div>
                </form>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Send Message</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Alternative ways to get in touch with us.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Email</h3>
                  <p className="text-muted-foreground">info@example.com</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Phone</h3>
                  <p className="text-muted-foreground">+1 (234) 567-890</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Address</h3>
                  <p className="text-muted-foreground">
                    123 Main Street<br />
                    Suite 500<br />
                    New York, NY 10001
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Friday: 9am - 5pm<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
