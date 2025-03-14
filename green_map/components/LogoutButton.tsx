'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export default function LogoutButton({ className, children, onClick }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // Trigger a storage event to notify other components about auth state change
    window.localStorage.setItem('auth-state-change', Date.now().toString());
    
    // Call the onClick callback if provided
    if (onClick) {
      onClick();
    }
    
    // Redirect to the dedicated sign-out page that handles the logout process
    router.push('/signout');
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className || "text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md transition-colors"}
    >
      {isLoggingOut ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          <span>Logging out...</span>
        </div>
      ) : (
        children || "Sign Out"
      )}
    </button>
  );
} 