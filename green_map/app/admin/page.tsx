'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Tree = {
  id: number;
  name: string;
  scientific_name: string;
  family_name: string;
  location: string;
  gen_info: string;
  distribution: string;
  image_url: string;
  created_at: string;
  tree_status: string;
};

export default function AdminDashboard() {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  
  useEffect(() => {
    const fetchTrees = async () => {
      try {
        const response = await fetch('/api/trees');
        
        if (!response.ok) {
          throw new Error('Failed to fetch trees');
        }
        
        const data = await response.json();
        setTrees(data.trees);
      } catch (err) {
        setError('Failed to load trees');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrees();
  }, []);
  
  // Function to delete a tree
  const handleDeleteTree = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tree?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/trees/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tree');
      }
      
      // Remove tree from state
      setTrees(trees.filter(tree => tree.id !== id));
    } catch (err) {
      console.error('Error deleting tree:', err);
      alert('Failed to delete tree');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-emerald-800">Admin Dashboard</h1>
      
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600">Manage trees and site content</p>
        <Link
          href="/admin/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md shadow transition duration-200"
        >
          Add New Tree
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scientific Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No trees found
                  </td>
                </tr>
              ) : (
                trees.map(tree => (
                  <tr key={tree.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tree.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-12 w-12 relative rounded-md overflow-hidden bg-gray-100">
                        {tree.image_url ? (
                          <Image
                            src={tree.image_url}
                            alt={tree.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tree.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <em>{tree.scientific_name}</em>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tree.tree_status === 'normal' 
                          ? 'bg-green-100 text-green-800' 
                          : tree.tree_status === 'old' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tree.tree_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/${tree.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/edit/${tree.id}`}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteTree(tree.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 