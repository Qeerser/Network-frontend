
import React from 'react';
import Layout from '../components/layout/Layout';
import { Separator } from '@/components/ui/separator';

const About: React.FC = () => {
  return (
    <Layout>
      <div className="container-fluid py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="mb-6">About Us</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Learn more about ชื่อ ชอบคุย and our mission.
          </p>
          
          <Separator className="my-8" />
          
          <div className="prose dark:prose-invert max-w-none">
            <h2>Our Story</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. 
              Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus 
              rhoncus ut eleifend nibh porttitor.
            </p>
            
            <h2 className="mt-8">Our Mission</h2>
            <p>
              Donec ut libero sed arcu vehicula ultricies a non tortor. Lorem ipsum dolor sit amet, 
              consectetur adipiscing elit. Aenean ut gravida lorem.
            </p>
            <ul>
              <li>Creating seamless user experiences</li>
              <li>Building beautiful, responsive interfaces</li>
              <li>Connecting people through conversation</li>
              <li>Making technology accessible to everyone</li>
            </ul>
            
            <h2 className="mt-8">Our Team</h2>
            <p>
              Ut turpis felis, pulvinar a semper sed, adipiscing id dolor. Pellentesque auctor nisi id 
              magna consequat sagittis. Curabitur dapibus enim sit amet elit pharetra tincidunt 
              feugiat nisl imperdiet.
            </p>
            
            <blockquote>
              "We believe in creating technology that enhances human connection rather than 
              replacing it."
            </blockquote>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
