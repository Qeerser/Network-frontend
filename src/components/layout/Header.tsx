
import React from 'react';
import { useTheme } from '../ThemeProvider';
import { useAuthStore } from '@/state/authStore';
import { Button } from '@/components/ui/button';
import { Moon, Sun, LogOut, User } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur theme-transition">
      <div className="container-fluid flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-primary font-bold text-xl md:text-2xl">
              ChopKhui
            </span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link to="/" className="transition-colors hover:text-foreground/80">
            Home
          </Link>
          <Link to="/about" className="transition-colors hover:text-foreground/80">
            About
          </Link>
          <Link to="/contact" className="transition-colors hover:text-foreground/80">
            Contact
          </Link>
        </nav>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-md">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline-flex text-sm font-medium">
                {currentUser?.username}
              </span>
              
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
                <LogOut className="h-4 w-4 mr-1" />
                Logout
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
