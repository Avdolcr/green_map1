'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function TestButtonsPage() {
  const [clickCount, setClickCount] = useState(0);
  
  const handleButtonClick = () => {
    setClickCount(prev => prev + 1);
    console.log('Button clicked!');
    alert('Button clicked!');
  };
  
  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8">Button Test Page</h1>
      
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Click Counter: {clickCount}</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleButtonClick}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Button (onClick)
            </button>
            
            <div className="mt-4">
              <a 
                href="/admin" 
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 inline-block"
              >
                Go to Admin (a tag)
              </a>
            </div>
            
            <div className="mt-4">
              <Link
                href="/admin"
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 inline-block"
              >
                Go to Admin (Link)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 