'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (res.ok) {
        setUser(null);
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-emerald-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold">Green Map</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/' 
                    ? 'border-white text-white' 
                    : 'border-transparent text-emerald-100 hover:border-emerald-300'
                }`}
              >
                Home
              </Link>
              <Link
                href="/map"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/map' 
                    ? 'border-white text-white' 
                    : 'border-transparent text-emerald-100 hover:border-emerald-300'
                }`}
              >
                Map
              </Link>
              <Link
                href="/gallery"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/gallery' 
                    ? 'border-white text-white' 
                    : 'border-transparent text-emerald-100 hover:border-emerald-300'
                }`}
              >
                Gallery
              </Link>
              <Link
                href="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname === '/about' 
                    ? 'border-white text-white' 
                    : 'border-transparent text-emerald-100 hover:border-emerald-300'
                }`}
              >
                About
              </Link>
              
              {/* Admin link visible only for admin users */}
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname.startsWith('/admin') 
                      ? 'border-white text-white' 
                      : 'border-transparent text-emerald-100 hover:border-emerald-300'
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
          
          {/* Auth buttons / User menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {!loading && (
              <>
                {user ? (
                  <div className="ml-3 relative">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{user.name}</span>
                      <button
                        onClick={handleLogout}
                        className="px-3 py-1 rounded-md bg-emerald-700 text-sm hover:bg-emerald-600"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <Link
                      href="/login"
                      className="px-3 py-1 rounded-md bg-emerald-700 text-sm hover:bg-emerald-600"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-3 py-1 rounded-md bg-white text-emerald-800 text-sm hover:bg-emerald-100"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-700"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === '/'
                ? 'border-white text-white bg-emerald-700'
                : 'border-transparent text-emerald-100 hover:bg-emerald-600'
            }`}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/map"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === '/map'
                ? 'border-white text-white bg-emerald-700'
                : 'border-transparent text-emerald-100 hover:bg-emerald-600'
            }`}
            onClick={() => setIsOpen(false)}
          >
            Map
          </Link>
          <Link
            href="/gallery"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === '/gallery'
                ? 'border-white text-white bg-emerald-700'
                : 'border-transparent text-emerald-100 hover:bg-emerald-600'
            }`}
            onClick={() => setIsOpen(false)}
          >
            Gallery
          </Link>
          <Link
            href="/about"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname === '/about'
                ? 'border-white text-white bg-emerald-700'
                : 'border-transparent text-emerald-100 hover:bg-emerald-600'
            }`}
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
          
          {/* Admin link visible only for admin users */}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname.startsWith('/admin')
                  ? 'border-white text-white bg-emerald-700'
                  : 'border-transparent text-emerald-100 hover:bg-emerald-600'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Admin Dashboard
            </Link>
          )}
          
          {/* Mobile auth buttons */}
          {!loading && (
            <div className="pt-4 pb-3 border-t border-emerald-700">
              {user ? (
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user.name}</div>
                    <div className="text-sm font-medium text-emerald-200">{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-auto px-3 py-1 rounded-md bg-emerald-700 text-sm hover:bg-emerald-600"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-1 px-4">
                  <Link
                    href="/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-emerald-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 