
import React from 'react';
import { useTheme } from '../ThemeProvider';
import { useAuthStore } from '@/state/authStore';
import { Button } from '@/components/ui/button';
import { Moon, Sun, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur theme-transition \">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className={`h-9 w-9 rounded-full `}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                  {theme === 'dark' ? <Sun className="h-4 w-4 text-white" /> : <Moon className="h-4 w-4 text-black" />}
                  </Button>
          
          {isAuthenticated ? (
            <>
        
              <Button variant="outline" size="sm" onClick={handleLogout} 
                className={` hidden md:inline-flex ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              
              <Button size="sm" className="hidden md:inline-flex" onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </>
          )}
          
          {/* Mobile menu button */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
            <span className="sr-only">Menu</span>
          </Button>
        </div>
        
      </div>
    </header>
  );
};

export default Header;
