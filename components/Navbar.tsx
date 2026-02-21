import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../lib/types';
import AuthModal from './AuthModal';
import { signOut } from '../services/authService';
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeUser: User | null;
  // loginAs is deprecated in favor of real auth but kept for compatibility if needed, 
  // though we will use internal modal logic mostly.
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeUser, onLogout }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    onLogout(); // Update parent state
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="h-[100px] border-b border-brand-charcoal/10 sticky top-0 bg-[#F9F9F9]/90 backdrop-blur-md z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 group" onClick={closeMobileMenu}>
            <img src="/logo.png" alt="Thaikick" className="h-12 w-auto object-contain" />
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex gap-10">
            <Link to="/gyms" className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors">Gyms</Link>
            <Link to="/camps" className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors">Camps</Link>
            <Link to="/shop" className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors">Shop</Link>
            {activeUser && (
              <>
                <Link
                  to={activeUser.role === 'customer' ? '/dashboard' : activeUser.role === 'owner' ? '/owner' : '/admin'}
                  className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors"
                >
                  Dashboard
                </Link>
                {(activeUser.role === 'admin' || activeUser.role === 'owner') && (
                  <>
                    <Link
                      to="/analytics"
                      className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors"
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/shop-admin"
                      className="font-mono text-xs uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors"
                    >
                      Shop
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* User Actions & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6">
              {activeUser ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-xs uppercase text-brand-charcoal">{activeUser.name}</span>
                    <span className="font-mono text-[10px] text-gray-500 uppercase">{activeUser.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 border border-gray-200 hover:bg-brand-red hover:text-white hover:border-brand-red transition-colors rounded-full"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-brand-charcoal text-white font-mono text-xs font-bold uppercase px-6 py-3 hover:bg-brand-blue transition-colors flex items-center gap-2"
                >
                  <UserIcon className="w-3 h-3" /> Login
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              className="md:hidden p-2 text-brand-charcoal hover:text-brand-red transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[100px] left-0 w-full bg-white border-b border-gray-200 shadow-lg flex flex-col px-4 py-4 space-y-4">
            <Link to="/gyms" onClick={closeMobileMenu} className="font-mono text-sm uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors">Gyms</Link>
            <Link to="/camps" onClick={closeMobileMenu} className="font-mono text-sm uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors">Camps</Link>
            <Link to="/shop" onClick={closeMobileMenu} className="font-mono text-sm uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors">Shop</Link>
            {activeUser && (
              <>
                <Link
                  to={activeUser.role === 'customer' ? '/dashboard' : activeUser.role === 'owner' ? '/owner' : '/admin'}
                  onClick={closeMobileMenu}
                  className="font-mono text-sm uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors"
                >
                  Dashboard
                </Link>
                {(activeUser.role === 'admin' || activeUser.role === 'owner') && (
                  <>
                    <Link
                      to="/analytics"
                      onClick={closeMobileMenu}
                      className="font-mono text-sm uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors"
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/shop-admin"
                      onClick={closeMobileMenu}
                      className="font-mono text-sm uppercase tracking-widest text-brand-charcoal hover:text-brand-red transition-colors"
                    >
                      Shop
                    </Link>
                  </>
                )}
              </>
            )}

            <div className="border-t border-gray-100 pt-4 mt-2">
              {activeUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase text-brand-charcoal">{activeUser.name}</span>
                    <span className="font-mono text-xs text-gray-500 uppercase">{activeUser.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 border border-gray-200 hover:bg-brand-red hover:text-white hover:border-brand-red transition-colors rounded-full"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsAuthOpen(true);
                    closeMobileMenu();
                  }}
                  className="w-full bg-brand-charcoal text-white font-mono text-sm font-bold uppercase px-6 py-3 hover:bg-brand-blue transition-colors flex items-center justify-center gap-2"
                >
                  <UserIcon className="w-4 h-4" /> Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={() => {
          // Parent App.tsx usually listens to auth state changes via listener,
          // but we can also trigger a manual refresh or just close modal.
          // The real state update happens in App.tsx's useEffect.
          setIsAuthOpen(false);
          setIsMobileMenuOpen(false);
        }}
      />
    </>
  );
};

export default Navbar;