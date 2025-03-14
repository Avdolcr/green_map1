// app/page.tsx
'use client';

import Link from 'next/link';
import { Leaf, Globe, Shield, ChevronRight, TreePine, Sparkles, ExternalLink, Map, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    { 
      icon: Globe, 
      title: "Global Arboretum", 
      text: "Real-time geospatial tracking with precision mapping",
      color: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-100",
      delay: 0.1,
      hoverColor: "group-hover:bg-emerald-100",
      hoverText: "group-hover:text-emerald-700"
    },
    { 
      icon: Leaf, 
      title: "Species Archive", 
      text: "Comprehensive taxonomic database with AI-powered insights",
      color: "bg-teal-50",
      iconColor: "text-teal-600",
      borderColor: "border-teal-100",
      delay: 0.2,
      hoverColor: "group-hover:bg-teal-100",
      hoverText: "group-hover:text-teal-700"
    },
    { 
      icon: Shield, 
      title: "Eco-Security", 
      text: "Blockchain-verified conservation tracking & access control",
      color: "bg-cyan-50",
      iconColor: "text-cyan-600", 
      borderColor: "border-cyan-100",
      delay: 0.3,
      hoverColor: "group-hover:bg-cyan-100",
      hoverText: "group-hover:text-cyan-700"
    },
  ];

  const statsItems = [
    { 
      icon: Map, 
      value: "10,000+", 
      label: "Trees Mapped",
      delay: 0.1
    },
    { 
      icon: Database, 
      value: "50+", 
      label: "Species Cataloged",
      delay: 0.2
    },
    { 
      icon: Shield, 
      value: "100%", 
      label: "Data Integrity",
      delay: 0.3
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-green-50/30">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-emerald-100/20 to-teal-100/20 rounded-bl-[100px] blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-teal-100/20 to-cyan-100/20 rounded-tr-[100px] blur-3xl"></div>
        
        {/* Subtle patterns */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwYzkuOTQgMCAxOCA4LjA2IDE4IDE4aDEyYzAgOS45NCA4LjA2IDE4IDE4djEyYy05Ljk0IDAgMTgtOC4wNi0xOC0xOEgzNnptMCAxMnYtMTJoMTJ2MTJIMzZ6IiBvcGFjaXR5PSIuNSIgZmlsbD0iIzMzMzMzMyIvPjxwYXRoIGQ9Ik01NCA0OGMtOS45NCAwLTE4LTguMDYtMTgtMThoMTJjMCA5Ljk0IDguMDYgMTggMTggMTh2MTJjLTkuOTQgMC0xOC04LjA2LTE4LTE4SDM2YzAtOS45NC04LjA2LTE4LTE4LTE4djEyYzkuOTQgMCAxOCA4LjA2IDE4IDE4aDEyeiIgZmlsbD0iIzMzMzMzMyIvPjwvZz48L3N2Zz4=')]"></div>
      </div>

      {/* Content container */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Navbar */}
        <motion.nav 
          className="flex justify-between items-center py-4 mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <TreePine className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold text-slate-800">Urban Tree Inventory</span>
          </div>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors duration-200 flex items-center gap-1">
            Admin Login
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </motion.nav>

        {/* Hero section */}
        <section className="py-16 md:py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block p-1.5 px-3 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 text-xs font-medium border border-emerald-100 shadow-sm mb-6"
            >
              <span className="flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                <span>Ecological Monitoring Platform</span>
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-700 via-teal-600 to-green-700 bg-clip-text text-transparent drop-shadow-sm leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Urban Tree Inventory
            </motion.h1>
            
            <motion.p 
              className="text-slate-600 text-lg md:text-xl mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              A platform for tracking, monitoring, and managing urban forest resources with precision and environmental stewardship.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/login">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg shadow-md hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center"
                >
                  <Shield size={18} className="mr-2" />
                  Admin Dashboard
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats section */}
        <motion.section 
          className="py-12 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {statsItems.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + stat.delay }}
              >
                <div className="inline-flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center shadow-sm border border-emerald-100">
                    <stat.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Features section */}
        <section className="py-12 mb-12">
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2"
            >
              Advanced Capabilities
            </motion.span>
            
            <motion.h2 
              className="text-2xl md:text-3xl font-bold mb-4 text-slate-800"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Advanced Ecosystem Management
            </motion.h2>
            
            <motion.p 
              className="text-slate-500 max-w-2xl mx-auto text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Our platform combines ecological expertise with cutting-edge technology
            </motion.p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all duration-300 hover:shadow-md"
              >
                <div className={`mb-5 rounded-full w-14 h-14 flex items-center justify-center ${feature.color} ${feature.hoverColor} transition-colors duration-300 border ${feature.borderColor}`}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor} ${feature.hoverText} transition-colors duration-300`} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-800 group-hover:text-emerald-700 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-slate-500 mb-5 leading-relaxed">
                  {feature.text}
                </p>
                <div className="mt-auto pt-2">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-300"
                  >
                    <span className="border-b border-dashed border-emerald-300 hover:border-emerald-600 transition-colors duration-300">Learn more</span>
                    <ChevronRight className="ml-1 w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
                
                {/* Corner decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden pointer-events-none opacity-5">
                  <div className="absolute -top-10 -right-10 w-20 h-20 bg-emerald-600 rotate-45"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA section */}
        <section className="py-12 mb-8">
          <motion.div 
            className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl shadow-sm border border-emerald-100 p-8 md:p-12 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="inline-flex items-center justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                    <TreePine className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-800">Ready to get started?</h2>
                <p className="text-slate-600 text-lg mb-8 max-w-xl mx-auto">
                  Access the administrative dashboard to manage your urban forest inventory data with precision and ease.
                </p>
                
                <Link href="/login" 
                  className="relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 group"
                >
                  <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center gap-2">
                    <span className="font-medium">Go to Dashboard</span>
                    <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>
            </div>
            
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl">
                <TreePine className="absolute top-0 left-0 w-12 h-12 text-emerald-900" />
                <TreePine className="absolute bottom-0 right-0 w-16 h-16 text-emerald-900" />
                <TreePine className="absolute top-1/4 right-1/4 w-10 h-10 text-emerald-900" />
                <TreePine className="absolute bottom-1/4 left-1/4 w-14 h-14 text-emerald-900" />
                <Leaf className="absolute top-1/3 right-1/3 w-12 h-12 text-emerald-900" />
                <Globe className="absolute bottom-1/3 left-1/3 w-16 h-16 text-emerald-900" />
              </div>
            </div>
          </motion.div>
        </section>
        
        {/* Footer */}
        <motion.footer 
          className="py-8 border-t border-slate-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <TreePine className="h-5 w-5 text-emerald-600" />
              <span className="text-sm text-slate-600"> 2025 Urban Tree Inventory</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors duration-200">Privacy Policy</Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors duration-200">Terms of Service</Link>
              <Link href="#" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors duration-200">Contact</Link>
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}