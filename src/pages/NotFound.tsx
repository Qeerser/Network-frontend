
import React from "react";
import Layout from "../components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";

const NotFound: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container-fluid py-24 flex flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-lg">
          <h1 className="text-7xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-medium">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page at <code className="bg-secondary px-2 py-1 rounded">{location.pathname}</code> doesn't exist.
          </p>
          <div className="pt-4">
            <Button onClick={() => navigate("/")} size="lg">
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
