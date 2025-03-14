'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function MigrationPage() {
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }
      
      setMigrationResult(data);
      toast.success(`Migration completed! ${data.stats.migrated} trees migrated, ${data.stats.skipped} skipped.`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error(`Migration failed: ${err.message || 'Unknown error'}`);
      console.error('Migration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Database Migration Tool</h1>
        <Link
          href="/admin"
          className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Tree Data Migration</h2>
        <p className="mb-4 text-gray-700">
          This tool will migrate tree data from the old format to the new pin-specific format. 
          Each tree location will be converted to include specific pin styles and images.
        </p>
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes</h3>
          <ul className="list-disc pl-5 text-yellow-700 space-y-1">
            <li>This migration is only needed once.</li>
            <li>The migration process will not delete any data.</li>
            <li>Trees already in the new format will be skipped automatically.</li>
            <li>This process may take some time if you have many trees.</li>
          </ul>
        </div>
        <button
          onClick={runMigration}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {isLoading ? 'Running Migration...' : 'Start Migration'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <h3 className="font-medium">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {migrationResult && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Migration Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
              <div className="text-blue-700 text-sm">Total Trees</div>
              <div className="text-2xl font-bold">{migrationResult.stats.total}</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-md p-4">
              <div className="text-green-700 text-sm">Migrated</div>
              <div className="text-2xl font-bold">{migrationResult.stats.migrated}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
              <div className="text-yellow-700 text-sm">Skipped</div>
              <div className="text-2xl font-bold">{migrationResult.stats.skipped}</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-md p-4">
              <div className="text-red-700 text-sm">Errors</div>
              <div className="text-2xl font-bold">{migrationResult.stats.errors}</div>
            </div>
          </div>
          
          {migrationResult.details && migrationResult.details.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Detailed Results</h3>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tree ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {migrationResult.details.map((result: any, index: number) => (
                      <tr key={index} className={
                        result.status === 'error' ? 'bg-red-50' : 
                        result.status === 'migrated' ? 'bg-green-50' : 
                        'bg-yellow-50'
                      }>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {result.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            result.status === 'error' ? 'bg-red-100 text-red-800' : 
                            result.status === 'migrated' ? 'bg-green-100 text-green-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 