'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export default function SignOutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Execute the sign-out process
    const handleSignOut = async () => {
      try {
        // Call the server API first to clear cookies
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          credentials: 'include' // Important to include credentials
        });

        if (!response.ok) {
          throw new Error('Server logout failed');
        }

        // Clear all possible auth cookies to ensure complete logout
        const cookiesToClear = [
          'auth_token',
          'logged_in',
          'token',
          'next-auth.session-token',
          'next-auth.csrf-token',
          'next-auth.callback-url',
          '__Secure-next-auth.session-token',
          '__Secure-next-auth.csrf-token',
          '__Host-next-auth.csrf-token'
        ];

        // Clear cookies with different paths and domains
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${cookieName}=; Path=/; Domain=${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${cookieName}=; Path=/; Domain=.${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        });
        
        try {
          // Then try to sign out on the client side (might fail but that's ok)
          await signOut({ redirect: false }).catch(e => console.log('SignOut client error:', e));
        } catch (e) {
          console.log('Ignored client signout error:', e);
        }
        
        // Show success message
        toast.success('Logged out successfully');
        
        // Notify other components about the authentication change
        localStorage.setItem('auth-state-change', Date.now().toString());
        
        // Dispatch the auth-state-change event
        window.dispatchEvent(new Event('auth-state-change'));
        
        // Force a complete reload to clean up any cached state
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (error) {
        console.error('Error during sign out:', error);
        setError('Something went wrong during sign out. Please try refreshing the page.');
        toast.error('Something went wrong during sign out');
        
        // Still redirect to home after a delay, even on error
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleSignOut();
  }, [router]);

  return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-[var(--background)]">
      <div className="p-8 bg-[var(--background-card)] rounded-lg shadow-md text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Signing Out</h1>
        
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 border-t-4 border-emerald-500 border-solid rounded-full animate-spin"></div>
        </div>
        
        {error ? (
          <p className="text-red-500 mb-6">{error}</p>
        ) : (
          <p className="text-[var(--text-secondary)] mb-6">
            You are being signed out of your account. 
            You will be redirected to the home page shortly.
          </p>
        )}
        
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
} 