'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Feedback {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
  updated_at: string;
  admin_reply?: string;
  reply_date?: string;
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);
  const [dbStatus, setDbStatus] = useState<{status: 'unknown' | 'connected' | 'error', message: string}>({
    status: 'unknown',
    message: 'Database connection not tested'
  });
  
  // Add state for reply functionality
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);
  
  useEffect(() => {
    fetchFeedback();
  }, []);
  
  const testDatabaseConnection = async () => {
    try {
      setDbStatus({status: 'unknown', message: 'Testing connection...'});
      
      // Get the API URL
      // Change to the main green_map application URL instead of admin URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:3000';
      
      console.log('Testing database connection at:', `${apiUrl}/api/system/db-test`);
      
      const response = await fetch(`${apiUrl}/api/system/db-test`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        mode: 'cors' // Explicitly set CORS mode
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDbStatus({status: 'connected', message: 'Database connection successful'});
        toast.success('Database connection successful');
      } else {
        setDbStatus({
          status: 'error', 
          message: `Database connection failed: ${data.error || 'Unknown error'}`
        });
        toast.error(`Database connection failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Database connection test error:', error);
      setDbStatus({
        status: 'error', 
        message: `Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      toast.error(`Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const fetchFeedback = async () => {
    try {
      setLoading(true);
      
      // Get the API URL - pointing to the green_map API instead of the admin API
      // Note that the environment variable appears to have the full path including /api
      // So we need to make sure we don't duplicate /api in the URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
        : 'http://localhost:3000';
      
      // Log the API URL for debugging
      console.log('Fetching feedback from:', `${apiUrl}/api/feedback`);
      
      const response = await fetch(`${apiUrl}/api/feedback`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          // Add admin role for authentication since middleware might not work across domains
          'x-user-role': 'admin'
        },
        mode: 'cors' // Explicitly set CORS mode
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          toast.error('You are not authorized to access feedback. Please log in as an admin.');
        } else {
          toast.error(`Failed to fetch feedback: ${response.status} ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      
      if (!data.feedback || !Array.isArray(data.feedback)) {
        console.error('Invalid feedback data structure:', data);
        toast.error('Received invalid feedback data format');
        return;
      }
      
      setFeedback(data.feedback);
      
      // Count new feedback
      const newCount = data.feedback.filter((item: Feedback) => item.status === 'new').length;
      setNewFeedbackCount(newCount);
      
      // If there's new feedback, show notification
      if (newCount > 0) {
        toast.success(`You have ${newCount} new feedback message${newCount > 1 ? 's' : ''}!`);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      
      // More detailed error message based on error type
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error: Could not connect to the API server. Please check your connection or server status.');
      } else {
        toast.error(`Failed to load feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const updateFeedbackStatus = async (id: number, status: 'new' | 'read' | 'replied') => {
    try {
      // Get the API URL - pointing to the green_map API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
        : 'http://localhost:3000';
      
      console.log('Updating feedback status at:', `${apiUrl}/api/feedback`);
      
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          // Add admin role for authentication since middleware might not work across domains
          'x-user-role': 'admin'
        },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
        mode: 'cors' // Explicitly set CORS mode
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          toast.error('You are not authorized to update feedback. Please log in as an admin.');
        } else {
          toast.error(`Failed to update feedback: ${response.status} ${response.statusText}`);
        }
        return;
      }
      
      // Update local state
      setFeedback(prev => 
        prev.map(item => 
          item.id === id ? { ...item, status } : item
        )
      );
      
      toast.success('Feedback status updated');
    } catch (error) {
      console.error('Error updating feedback status:', error);
      
      // More detailed error message based on error type
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error: Could not connect to the API server. Please check your connection or server status.');
      } else {
        toast.error(`Failed to update feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Add function to handle opening the reply modal
  const handleOpenReply = (item: Feedback) => {
    setSelectedFeedback(item);
    setReplyText(item.admin_reply || '');
    setReplyError(null);
    setReplySuccess(null);
  };
  
  // Add function to handle closing the reply modal
  const handleCloseReply = () => {
    setSelectedFeedback(null);
    setReplyText('');
    setReplyError(null);
    setReplySuccess(null);
  };
  
  // Add function to handle submitting the reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFeedback) return;
    
    if (!replyText.trim()) {
      setReplyError('Please enter a reply');
      return;
    }
    
    setIsReplying(true);
    setReplyError(null);
    
    try {
      // Get the API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
        : 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/admin/feedback/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'x-user-role': 'admin'
        },
        body: JSON.stringify({
          feedback_id: selectedFeedback.id,
          reply: replyText
        }),
        credentials: 'include',
        mode: 'cors'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit reply');
      }
      
      // Update the feedback item in the local state
      setFeedback(prevFeedback => 
        prevFeedback.map(item => 
          item.id === selectedFeedback.id 
            ? { 
                ...item, 
                admin_reply: replyText, 
                status: 'replied',
                reply_date: new Date().toISOString()
              } 
            : item
        )
      );
      
      setReplySuccess('Reply submitted successfully');
      
      // Close the modal after a delay
      setTimeout(() => {
        handleCloseReply();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting reply:', error);
      setReplyError(error instanceof Error ? error.message : 'Failed to submit reply');
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <h1 className="text-2xl font-bold text-gray-800">User Feedback</h1>
        <div className="flex gap-2">
          <button
            onClick={testDatabaseConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Test Database Connection
          </button>
          <button
            onClick={fetchFeedback}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Database connection status */}
      <div className={`mb-6 p-4 rounded-md ${
        dbStatus.status === 'connected' ? 'bg-green-50 border-l-4 border-green-400' : 
        dbStatus.status === 'error' ? 'bg-red-50 border-l-4 border-red-400' :
        'bg-gray-50 border-l-4 border-gray-400'
      }`}>
        <p className={`flex items-center ${
          dbStatus.status === 'connected' ? 'text-green-800' : 
          dbStatus.status === 'error' ? 'text-red-800' :
          'text-gray-800'
        }`}>
          <span className="mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
          <span>Database Status:</span> <span className="ml-1 font-medium">{dbStatus.message}</span>
        </p>
        <div className="mt-2 text-sm">
          <p className="text-gray-600">API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</p>
          <p className="text-gray-600 mt-1">If you're experiencing connection issues:</p>
          <ul className="list-disc ml-5 mt-1 text-gray-600">
            <li>Verify the database is running</li>
            <li>Check the .env.local file for correct database credentials</li>
            <li>Ensure the API server is running</li>
            <li>Confirm NEXT_PUBLIC_API_URL points to the correct server</li>
          </ul>
        </div>
      </div>
      
      {newFeedbackCount > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="flex items-center text-yellow-800">
            <span className="mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </span>
            You have {newFeedbackCount} new feedback message{newFeedbackCount > 1 ? 's' : ''} to review!
          </p>
        </div>
      )}
      
      {/* Add reply modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Reply to Feedback</h2>
                <button 
                  onClick={handleCloseReply}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-gray-900">{selectedFeedback.subject}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedFeedback.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 mt-2">{selectedFeedback.message}</p>
                <div className="mt-2 text-sm text-gray-500">
                  From: {selectedFeedback.user_name} ({selectedFeedback.user_email})
                </div>
              </div>
              
              {replyError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-700">{replyError}</p>
                </div>
              )}
              
              {replySuccess && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                  <p className="text-green-700">{replySuccess}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmitReply}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reply">
                    Your Reply
                  </label>
                  <textarea
                    id="reply"
                    rows={6}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter your reply here..."
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseReply}
                    className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    disabled={isReplying}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={isReplying}
                  >
                    {isReplying ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : 'Send Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : feedback.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No feedback received yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {feedback.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.subject}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{item.message}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.user_name}</div>
                    <div className="text-sm text-gray-500">{item.user_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'new' 
                        ? 'bg-blue-100 text-blue-800' 
                        : item.status === 'read'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.status === 'new' ? 'New' : item.status === 'read' ? 'Read' : 'Replied'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenReply(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      {item.status === 'replied' ? 'Edit Reply' : 'Reply'}
                    </button>
                    {/* Add other actions as needed */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 