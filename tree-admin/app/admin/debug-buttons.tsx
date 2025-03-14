'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Plus, ExternalLink, Settings, AlertTriangle, HelpCircle, 
  Wrench, RefreshCw, Database, FileText, Send, MessageSquare, History, 
  PieChart, Shield, BarChart, Users, Image, Layers, MessageCircle, 
  ArrowUpRight, Grid, TreePine, ArrowRightCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

function AdminTools() {
  const [isOpen, setIsOpen] = useState(true); // Start expanded by default
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('main');

  // Function to backup the database
  const backupDatabase = async () => {
    try {
      setActiveAction("Database Backup");
      toast.loading("Creating database backup...", { id: 'db-backup' });
      
      // Real database backup implementation
      const response = await fetch('/api/admin/backup-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to backup database: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Create a download link for the backup file
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      
      // Create element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `tree-inventory-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      toast.success("Database backup completed! File downloaded.", { id: 'db-backup' });
    } catch (error) {
      console.error("Error backing up database:", error);
      toast.error(`Database backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'db-backup' });
    } finally {
      setActiveAction(null);
    }
  };

  // Function to generate a report
  const generateReport = async () => {
    try {
      setActiveAction("Generate Report");
      toast.loading("Generating inventory report...", { id: 'report' });
      
      // Real report generation implementation
      const response = await fetch('/api/admin/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Create a PDF or spreadsheet file from the data
      const blob = new Blob([JSON.stringify(data.reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `tree-inventory-report-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      toast.success("Report generated successfully! File downloaded.", { id: 'report' });
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'report' });
    } finally {
      setActiveAction(null);
    }
  };

  // Function to refresh metadata
  const refreshMetadata = async () => {
    try {
      setActiveAction("Refresh Metadata");
      toast.loading("Refreshing system metadata...", { id: 'metadata' });
      
      // Real metadata refresh implementation
      const response = await fetch('/api/admin/refresh-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh metadata: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update the local cache
      localStorage.setItem('systemMetadata', JSON.stringify(data.metadata));
      
      // Force reload assets if needed
      if (data.shouldReloadAssets) {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href) {
            link.setAttribute('href', href + '?v=' + new Date().getTime());
          }
        });
      }
      
      toast.success(`Metadata refreshed successfully! ${data.updatedItems} items updated.`, { id: 'metadata' });
    } catch (error) {
      console.error("Error refreshing metadata:", error);
      toast.error(`Metadata refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'metadata' });
    } finally {
      setActiveAction(null);
    }
  };

  // Function to send notifications
  const sendNotifications = async () => {
    try {
      setActiveAction("Send Notifications");
      toast.loading("Sending notifications to users...", { id: 'notifications' });
      
      // Real notifications implementation
      const response = await fetch('/api/admin/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'System Update',
          message: 'The tree inventory system has been updated with new features!',
          priority: 'normal'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send notifications: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      toast.success(`Notifications sent successfully to ${data.recipientCount} users!`, { id: 'notifications' });
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error(`Failed to send notifications: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'notifications' });
    } finally {
      setActiveAction(null);
    }
  };

  // Function to run system diagnostics
  const runDiagnostics = async () => {
    try {
      setActiveAction("System Diagnostics");
      toast.loading("Running system diagnostics...", { id: 'diagnostics' });
      
      // Real diagnostics implementation
      const response = await fetch('/api/admin/diagnostics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run diagnostics: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check diagnostic results
      const allPassed = Object.values(data.checks).every((check: any) => check.status === 'passed');
      
      if (allPassed) {
        toast.success("All diagnostics passed! System is healthy.", { id: 'diagnostics' });
      } else {
        const failedChecks = Object.entries(data.checks)
          .filter(([_, check]: [string, any]) => check.status !== 'passed')
          .map(([name, _]: [string, any]) => name);
        
        toast.error(`Some diagnostics failed: ${failedChecks.join(', ')}`, { id: 'diagnostics' });
      }
    } catch (error) {
      console.error("Error running diagnostics:", error);
      toast.error(`Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'diagnostics' });
    } finally {
      setActiveAction(null);
    }
  };

  // Animation variants for better animations
  const containerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const contentVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        height: { duration: 0.3 },
        opacity: { duration: 0.2, delay: 0.1 } 
      }
    },
    exit: { 
      height: 0, 
      opacity: 0,
      transition: { 
        height: { duration: 0.3 },
        opacity: { duration: 0.1 } 
      }
    }
  };

  // Navigation item renderer
  const NavigationButton = ({ 
    icon: Icon, 
    label, 
    href, 
    color, 
    hoverColor, 
    iconBgColor, 
    className = "" 
  }: {
    icon: React.ElementType;
    label: string;
    href: string;
    color: string;
    hoverColor: string;
    iconBgColor: string;
    className?: string;
  }) => (
    <motion.div variants={itemVariants} className="h-full">
      <Link 
        href={href}
        className={`h-full flex flex-col items-start gap-2 p-4 rounded-xl ${color} ${hoverColor} transition-colors border border-${color.split('-')[1]}-200 dark:border-${color.split('-')[1]}-900/50 group shadow-sm hover:shadow-md ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className={`${iconBgColor} p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-medium text-base">{label}</span>
        </div>
        <div className="w-full flex justify-end mt-2">
          <div className="bg-white dark:bg-black/20 p-1 rounded-full">
            <ArrowRightCircle className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
  
  // Tabs for organization
  const tabs = [
    { id: 'main', label: 'Main Navigation', icon: Layers },
    { id: 'admin', label: 'Admin Tools', icon: Wrench },
    { id: 'analytics', label: 'Analytics', icon: BarChart }
  ];

  return (
    <div className="mb-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="card border-2 border-neutral-200 dark:border-neutral-800 shadow-md rounded-xl overflow-hidden"
      >
        <motion.div 
          onClick={() => setIsOpen(!isOpen)}
          className="p-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-transparent dark:from-emerald-900/20 dark:via-emerald-900/10 dark:to-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-800/40 dark:to-teal-800/40 p-2 rounded-lg shadow-sm">
              <Grid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Tree Management Console</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">All system tools and navigation in one place</p>
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-full px-2.5 py-0.5 ml-2 border border-emerald-100 dark:border-emerald-800/50">Pro</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
            className="bg-white dark:bg-neutral-800 rounded-full p-1 shadow-sm"
          >
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </motion.div>
        </motion.div>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden"
            >
              <div className="p-5 pt-3 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-900/95">
                {/* Tabs Navigation */}
                <div className="flex space-x-2 mb-4 border-b border-neutral-200 dark:border-neutral-800">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 border-x border-t border-neutral-200 dark:border-neutral-800 shadow-sm' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                {/* Main Navigation Tab Content */}
                {activeTab === 'main' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <NavigationButton 
                      icon={Plus} 
                      label="Add Tree"
                      href="/admin/new_tree"
                      color="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      hoverColor="hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      iconBgColor="bg-white dark:bg-black/20"
                    />
                    
                    <NavigationButton 
                      icon={Image} 
                      label="Gallery"
                      href="/admin/gallery"
                      color="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      hoverColor="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      iconBgColor="bg-white dark:bg-black/20"
                    />
                    
                    <NavigationButton 
                      icon={Users} 
                      label="Users"
                      href="/admin/users"
                      color="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      hoverColor="hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                      iconBgColor="bg-white dark:bg-black/20"
                    />
                    
                    <NavigationButton 
                      icon={MessageCircle} 
                      label="Feedback"
                      href="/admin/feedback"
                      color="bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                      hoverColor="hover:bg-purple-100 dark:hover:bg-purple-900/30"
                      iconBgColor="bg-white dark:bg-black/20"
                    />
                    
                    <NavigationButton 
                      icon={ArrowUpRight} 
                      label="Migrate Data"
                      href="/admin/migrate"
                      color="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                      hoverColor="hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      iconBgColor="bg-white dark:bg-black/20"
                    />
                    
                    <NavigationButton 
                      icon={MessageSquare} 
                      label="Chatbot History"
                      href="/chatbot-history"
                      color="bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400"
                      hoverColor="hover:bg-teal-100 dark:hover:bg-teal-900/30"
                      iconBgColor="bg-white dark:bg-black/20"
                    />
                  </div>
                )}
                
                {/* Admin Tools Tab Content */}
                {activeTab === 'admin' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div variants={itemVariants}>
                      <Link 
                        href="/admin/new_tree" 
                        className="h-full flex flex-col items-start gap-2 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 text-emerald-700 dark:text-emerald-400 hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/30 dark:hover:to-green-900/20 transition-colors border border-emerald-200 dark:border-emerald-900/50 group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Plus className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-base">Add New Tree</span>
                        </div>
                        <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-1">
                          Create a new tree record with location and details
                        </p>
                        <div className="w-full flex justify-end mt-1">
                          <div className="bg-white dark:bg-black/20 p-1 rounded-full">
                            <Plus className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <button
                        onClick={runDiagnostics}
                        disabled={activeAction === "System Diagnostics"}
                        className="h-full w-full text-left flex flex-col items-start gap-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 text-blue-700 dark:text-blue-400 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/20 transition-colors border border-blue-200 dark:border-blue-900/50 group disabled:opacity-70 disabled:pointer-events-none shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300 relative">
                            <Settings className="h-5 w-5" />
                            {activeAction === "System Diagnostics" && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-base">Run Diagnostics</span>
                        </div>
                        <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-1">
                          Check system status and database connection
                        </p>
                        <div className="w-full flex justify-end mt-1">
                          <div className="bg-white dark:bg-black/20 p-1 rounded-full">
                            <Shield className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                          </div>
                        </div>
                      </button>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <button
                        onClick={backupDatabase}
                        disabled={activeAction === "Database Backup"}
                        className="w-full h-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-900/10 text-indigo-700 dark:text-indigo-400 hover:from-indigo-100 hover:to-indigo-200/50 dark:hover:from-indigo-900/30 dark:hover:to-indigo-900/20 transition-colors border border-indigo-200 dark:border-indigo-900/50 disabled:opacity-70 disabled:pointer-events-none shadow-sm hover:shadow-md"
                      >
                        <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <Database className={`h-5 w-5 ${activeAction === "Database Backup" ? "animate-pulse" : ""}`} />
                        </div>
                        <div>
                          <span className="font-medium text-base">Backup DB</span>
                          <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 mt-1">
                            Download database backup
                          </p>
                        </div>
                      </button>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <button
                        onClick={refreshMetadata}
                        disabled={activeAction === "Refresh Metadata"}
                        className="w-full h-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-900/10 text-teal-700 dark:text-teal-400 hover:from-teal-100 hover:to-teal-200/50 dark:hover:from-teal-900/30 dark:hover:to-teal-900/20 transition-colors border border-teal-200 dark:border-teal-900/50 disabled:opacity-70 disabled:pointer-events-none shadow-sm hover:shadow-md"
                      >
                        <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <RefreshCw className={`h-5 w-5 ${activeAction === "Refresh Metadata" ? "animate-spin" : ""}`} />
                        </div>
                        <div>
                          <span className="font-medium text-base">Refresh Metadata</span>
                          <p className="text-xs text-teal-700/70 dark:text-teal-400/70 mt-1">
                            Update system data
                          </p>
                        </div>
                      </button>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <button
                        onClick={sendNotifications}
                        disabled={activeAction === "Send Notifications"}
                        className="w-full h-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-900/20 dark:to-rose-900/10 text-rose-700 dark:text-rose-400 hover:from-rose-100 hover:to-rose-200/50 dark:hover:from-rose-900/30 dark:hover:to-rose-900/20 transition-colors border border-rose-200 dark:border-rose-900/50 disabled:opacity-70 disabled:pointer-events-none shadow-sm hover:shadow-md"
                      >
                        <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <Send className={`h-5 w-5 ${activeAction === "Send Notifications" ? "animate-pulse" : ""}`} />
                        </div>
                        <div>
                          <span className="font-medium text-base">Send Notifications</span>
                          <p className="text-xs text-rose-700/70 dark:text-rose-400/70 mt-1">
                            Alert all users
                          </p>
                        </div>
                      </button>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <Link
                        href="/admin/migrate"
                        className="w-full h-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-900/10 text-amber-700 dark:text-amber-400 hover:from-amber-100 hover:to-amber-200/50 dark:hover:from-amber-900/30 dark:hover:to-amber-900/20 transition-colors border border-amber-200 dark:border-amber-900/50 shadow-sm hover:shadow-md"
                      >
                        <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-medium text-base">Data Migration</span>
                          <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-1">
                            Transfer system data
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  </div>
                )}
                
                {/* Analytics Tab Content */}
                {activeTab === 'analytics' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.div variants={itemVariants}>
                      <Link
                        href="/admin/analytics"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/10 text-purple-700 dark:text-purple-400 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/30 dark:hover:to-violet-900/20 transition-colors border border-purple-200 dark:border-purple-900/50 group shadow-sm hover:shadow-md"
                      >
                        <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <PieChart className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-medium">Usage Analytics</span>
                          <p className="text-xs text-purple-700/70 dark:text-purple-400/70 mt-0.5">
                            View system usage statistics
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                    
                    <motion.div variants={itemVariants}>
                      <button
                        onClick={generateReport}
                        disabled={activeAction === "Generate Report"}
                        className="w-full text-left flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/10 text-fuchsia-700 dark:text-fuchsia-400 hover:from-fuchsia-100 hover:to-pink-100 dark:hover:from-fuchsia-900/30 dark:hover:to-pink-900/20 transition-colors border border-fuchsia-200 dark:border-fuchsia-900/50 group shadow-sm hover:shadow-md disabled:opacity-70 disabled:pointer-events-none"
                      >
                        <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300 relative">
                          <FileText className={`h-4 w-4 ${activeAction === "Generate Report" ? "animate-pulse" : ""}`} />
                        </div>
                        <div>
                          <span className="font-medium">Generate Report</span>
                          <p className="text-xs text-fuchsia-700/70 dark:text-fuchsia-400/70 mt-0.5">
                            Create inventory summary report
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  </div>
                )}
                
                {/* Help Section */}
                <motion.div 
                  variants={itemVariants}
                  className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-white dark:bg-black/20 p-2 rounded-lg shadow-sm flex-shrink-0">
                      <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div>
                      <h5 className="font-medium text-slate-700 dark:text-slate-300 mb-1">Need Help?</h5>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1.5">Visit our <a href="https://example.com/help" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center">documentation <ExternalLink className="w-2.5 h-2.5 ml-0.5" /></a></p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">For emergencies, contact <span className="font-medium text-slate-800 dark:text-white">support@greentreemap.com</span></p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default AdminTools;