'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react';

// Dynamically import the AdminTreeForm with no SSR issues
const AdminTreeForm = dynamic(
  () => import('../[id]/page').then((mod) => mod.default), 
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    )
  }
);

export default function NewTreePage() {
  return <AdminTreeForm />;
} 