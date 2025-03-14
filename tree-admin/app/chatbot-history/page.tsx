'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowLeft, Search, User, Bot, Calendar, Filter, Download, ChevronLeft, ChevronRight, Clock, ArrowUpRight, X, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: number;
  session_id: string;
  user_id: number | null;
  user_name: string | null;
  email: string | null;
  display_name?: string;
  user_message: string;
  bot_response: string;
  created_at: string;
}

interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="20%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export default function ChatbotHistoryPage() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 20
  });
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch chat history data
  const fetchChatHistory = async (page = 1, search = '', date = 'all') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chatbot-history?page=${page}&limit=${pagination.limit}&search=${search}&date=${date}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }
      
      const data = await response.json();
      setChatHistory(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // You could add a toast notification here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory(pagination.currentPage, searchTerm, dateFilter);
  }, [dateFilter]);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchChatHistory(1, searchTerm, dateFilter);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchChatHistory(page, searchTerm, dateFilter);
  };

  // Delete conversation by session ID
  const deleteConversation = async () => {
    if (!selectedMessage) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/chatbot-history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: selectedMessage.session_id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      // Remove the deleted session from the chat history
      const updatedHistory = chatHistory.filter(
        msg => msg.session_id !== selectedMessage.session_id
      );
      
      setChatHistory(updatedHistory);
      setSelectedMessage(null);
      setShowDeleteConfirm(false);
      
      // Show success message
      alert('Conversation deleted successfully');
      
      // Refresh chat history
      fetchChatHistory(pagination.currentPage, searchTerm, dateFilter);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export conversation(s) to CSV
  const exportConversations = async (sessionId?: string) => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/chatbot-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId: sessionId || (selectedMessage ? selectedMessage.session_id : undefined),
          format: 'csv'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to export conversation');
      }
      
      // Get the CSV data
      const csvData = await response.text();
      
      // Create a blob and download link
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = sessionId 
        ? `conversation_${sessionId.substring(0, 8)}.csv` 
        : `all_conversations_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error exporting conversation:', error);
      alert('Failed to export conversation');
    } finally {
      setIsExporting(false);
    }
  };

  // Format date to display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Group messages by session ID
  const groupedBySessions = chatHistory.reduce((acc, message) => {
    if (!acc[message.session_id]) {
      acc[message.session_id] = [];
    }
    acc[message.session_id].push(message);
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  // Page transition animations
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <motion.div 
      className="min-h-screen bg-slate-50"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link 
                href="/" 
                className="flex items-center text-slate-600 hover:text-emerald-600 transition-colors duration-200 mr-6"
              >
                <ArrowLeft size={18} className="mr-2" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
              <h1 className="text-xl font-bold text-slate-800 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-emerald-600" />
                Chatbot Conversation History
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors duration-200 flex items-center"
                onClick={() => exportConversations()}
                disabled={isExporting}
              >
                <Download size={14} className="mr-1.5" />
                {isExporting ? 'Exporting...' : 'Export All'}
              </motion.button>
              <Link href="/admin">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 text-sm bg-emerald-50 border border-emerald-200 rounded-md text-emerald-600 hover:bg-emerald-100 transition-colors duration-200 flex items-center"
                >
                  <ArrowUpRight size={14} className="mr-1.5" />
                  Admin Panel
                </motion.button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col space-y-6">
          {/* Search and filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-grow flex items-center max-w-md">
                <form onSubmit={handleSearch} className="w-full">
                  <div className={`relative flex items-center transition-all duration-200 ${isSearchFocused ? 'ring-2 ring-emerald-200' : ''}`}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Search conversations or users..."
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-300 transition-colors duration-200"
                    />
                    <Search size={16} className="absolute left-3 text-slate-400" />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          fetchChatHistory(1, '', dateFilter);
                        }}
                        className="absolute right-3 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </form>
              </div>
              
              <div className="flex flex-wrap items-center space-x-2">
                <div className="text-sm text-slate-500 flex items-center mr-1">
                  <Filter size={14} className="mr-1.5" />
                  Filter by:
                </div>
                <div className="inline-flex bg-slate-100 rounded-lg p-1">
                  <button 
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${dateFilter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                    onClick={() => setDateFilter('all')}
                  >
                    All time
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${dateFilter === 'today' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                    onClick={() => setDateFilter('today')}
                  >
                    Today
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${dateFilter === 'week' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                    onClick={() => setDateFilter('week')}
                  >
                    This week
                  </button>
                  <button 
                    className={`px-3 py-1 text-xs rounded-md transition-all duration-200 ${dateFilter === 'month' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800'}`}
                    onClick={() => setDateFilter('month')}
                  >
                    This month
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session list */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-220px)] flex flex-col">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-medium text-slate-800 flex items-center">
                    <Calendar size={16} className="mr-2 text-emerald-600" />
                    Chat Sessions
                  </h3>
                  <span className="text-xs py-1 px-2 bg-white rounded-full text-slate-600 border border-slate-200">
                    {pagination.total} total
                  </span>
                </div>
                
                {loading ? (
                  <div className="flex-grow p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-2/3 mb-1"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4 mt-2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-grow overflow-y-auto divide-y divide-slate-100">
                    {Object.entries(groupedBySessions).length > 0 ? (
                      Object.entries(groupedBySessions).map(([sessionId, messages]) => {
                        // Sort messages by created_at date
                        const sortedMessages = [...messages].sort(
                          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                        
                        // Get first and last message to show preview
                        const firstMessage = sortedMessages[0];
                        const lastMessage = sortedMessages[sortedMessages.length - 1];
                        const date = new Date(firstMessage.created_at);
                        
                        return (
                          <motion.div 
                            key={sessionId}
                            whileHover={{ backgroundColor: 'rgba(167, 243, 208, 0.1)' }}
                            className={`p-4 cursor-pointer border-l-2 transition-all duration-200 ${
                              selectedMessage?.session_id === sessionId 
                                ? 'border-l-emerald-500 bg-emerald-50' 
                                : 'border-l-transparent hover:border-l-emerald-200'
                            }`}
                            onClick={() => setSelectedMessage(firstMessage)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 border border-emerald-200 shadow-sm mr-3">
                                  {firstMessage.user_name ? (
                                    firstMessage.user_name.charAt(0).toUpperCase()
                                  ) : (
                                    <User size={14} />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 text-sm">
                                    {firstMessage.display_name || firstMessage.email || firstMessage.user_name || 'Anonymous User'}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {!firstMessage.user_name && !firstMessage.email 
                                      ? 'Session: ' + sessionId.substring(0, 8) 
                                      : (firstMessage.email ? 'Session: ' + sessionId.substring(0, 8) : 'No Email')
                                    }
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-slate-500 whitespace-nowrap ml-2 mt-1 flex items-center">
                                <Clock size={12} className="mr-1 opacity-70" />
                                {formatDate(firstMessage.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-snug">
                              {firstMessage.user_message}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-emerald-600 font-medium">
                                {sortedMessages.length} message{sortedMessages.length !== 1 ? 's' : ''}
                              </p>
                              <span className="text-xs px-1.5 py-0.5 bg-emerald-50 rounded text-emerald-700 border border-emerald-100">
                                {new Date(lastMessage.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                          <MessageSquare size={24} className="text-slate-400" />
                        </div>
                        <h3 className="text-slate-700 font-medium mb-1">No conversations found</h3>
                        <p className="text-slate-500 text-sm">
                          {searchTerm ? 
                            'Try using different search terms or filters' : 
                            'Chatbot conversations will appear here'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                      className={`flex items-center text-xs ${
                        pagination.currentPage === 1 
                          ? 'text-slate-400 cursor-not-allowed' 
                          : 'text-slate-600 hover:text-emerald-600'
                      }`}
                    >
                      <ChevronLeft size={14} className="mr-1" />
                      Previous
                    </button>
                    <span className="text-xs text-slate-500">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className={`flex items-center text-xs ${
                        pagination.currentPage === pagination.totalPages 
                          ? 'text-slate-400 cursor-not-allowed' 
                          : 'text-slate-600 hover:text-emerald-600'
                      }`}
                    >
                      Next
                      <ChevronRight size={14} className="ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Conversation details */}
            <div className="lg:col-span-2 h-[calc(100vh-220px)]">
              {selectedMessage ? (
                <motion.div 
                  className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 border border-emerald-200 shadow-sm mr-3">
                        {selectedMessage.user_name ? (
                          selectedMessage.user_name.charAt(0).toUpperCase()
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">
                          {selectedMessage.display_name || selectedMessage.email || selectedMessage.user_name || 'Anonymous User'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {!selectedMessage.user_name && !selectedMessage.email 
                            ? 'Session: ' + selectedMessage.session_id.substring(0, 8) 
                            : (selectedMessage.email ? 'Session: ' + selectedMessage.session_id.substring(0, 8) : 'No Email')
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 mr-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors duration-200"
                        onClick={() => exportConversations(selectedMessage.session_id)}
                        disabled={isExporting}
                      >
                        <Download size={16} />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors duration-200"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto p-6 space-y-6">
                    {chatHistory
                      .filter(msg => msg.session_id === selectedMessage.session_id)
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((msg, index) => (
                        <motion.div 
                          key={msg.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="space-y-4"
                        >
                          {/* User message */}
                          <div className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 border border-blue-200 shadow-sm mr-3 flex-shrink-0">
                              <User size={14} />
                            </div>
                            <div className="flex-grow">
                              <div className="bg-blue-50 p-4 rounded-lg rounded-tl-none border border-blue-100 text-slate-700">
                                <p className="whitespace-pre-wrap">{msg.user_message}</p>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 ml-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          {/* Bot response */}
                          <div className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 border border-emerald-200 shadow-sm mr-3 flex-shrink-0">
                              <Bot size={14} />
                            </div>
                            <div className="flex-grow">
                              <div className="bg-emerald-50 p-4 rounded-lg rounded-tl-none border border-emerald-100 text-slate-700">
                                <p className="whitespace-pre-wrap">{msg.bot_response}</p>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 ml-1">
                                {new Date(msg.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <MessageSquare size={30} className="text-slate-300" />
                  </div>
                  <h3 className="text-slate-700 font-medium mb-2 text-lg">Select a conversation</h3>
                  <p className="text-slate-500 max-w-md">
                    Choose a conversation from the list to view the detailed chat history between users and the Green Map chatbot.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-lg font-medium text-slate-800 mb-3">Confirm Delete</h3>
            <p className="text-slate-600 mb-5">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-md hover:bg-red-600 flex items-center"
                onClick={deleteConversation}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
