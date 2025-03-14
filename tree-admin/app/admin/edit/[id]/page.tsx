// This page has been deprecated. 
// Instead, we now use the unified form at /admin/[id]/page.tsx
// This redirects users to the new URL for backward compatibility

'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader } from 'lucide-react';

export default function EditTreePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  useEffect(() => {
    // Wait a moment then redirect to the new URL
    const timer = setTimeout(() => {
      router.replace(`/admin/${id}`);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [router, id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="card p-6 text-center max-w-md mx-auto">
        <Loader className="w-8 h-8 mx-auto mb-4 text-primary animate-spin" />
        <h1 className="text-xl font-bold mb-2">Redirecting...</h1>
        <p className="text-text-secondary mb-4">
          This page has been moved to a new location.
        </p>
        <p className="text-xs text-text-secondary">
          You'll be redirected automatically in a moment.
        </p>
        </div>
    </div>
  );
}
