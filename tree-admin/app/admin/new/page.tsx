'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTreePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dynamic [id] route with 'new' as the ID parameter
    router.replace('/admin/new_tree');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  );
} 