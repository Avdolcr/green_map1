"use client";

import { ReactNode, Suspense } from "react";
import { ThemeProvider } from "./ThemeProvider";
import dynamic from "next/dynamic";
import { FaTree, FaEnvelope, FaMapMarkedAlt, FaLeaf, FaGithub, FaTwitter, FaInstagram } from "react-icons/fa";
import Link from "next/link";

// Dynamically load Navbar component
const DynamicNavbar = dynamic(() => import("../app/components/navbar"), {
  ssr: false
});

interface ClientWrapperProps {
  children: ReactNode;
}

// This component includes all the client-side only elements
const ClientWrapper: React.FC<ClientWrapperProps> = ({ children }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <ThemeProvider>
      {/* Subtle background gradient - softened for better visibility */}
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--background)] to-[var(--background-alt)] -z-10" />
      
      <Suspense fallback={<div className="h-16 w-full bg-[var(--primary-dark)]/70 backdrop-blur-md fixed top-0 left-0 z-50"></div>}>
        <DynamicNavbar />
      </Suspense>
      
      <main className="relative flex min-h-screen flex-col">
        {children}
      </main>
      
      <footer className="w-full py-12 mt-auto border-t border-[var(--primary-light)]/10 bg-[var(--background-alt)]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] rounded-lg flex items-center justify-center shadow-md">
                  <FaTree className="text-white text-sm" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  <span className="font-normal">Green</span>Map
                </h3>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">
                Exploring, documenting, and preserving the beauty of trees while promoting environmental awareness 
                through interactive mapping and educational resources.
              </p>
              <div className="flex gap-4 pt-2">
                <a href="https://twitter.com" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300" aria-label="Twitter">
                  <FaTwitter className="w-5 h-5" />
                </a>
                <a href="https://instagram.com" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300" aria-label="Instagram">
                  <FaInstagram className="w-5 h-5" />
                </a>
                <a href="https://github.com" className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300" aria-label="GitHub">
                  <FaGithub className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300 flex items-center gap-2">
                    <FaLeaf className="text-xs text-[var(--primary-light)]" />
                    <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Explore_Map" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300 flex items-center gap-2">
                    <FaMapMarkedAlt className="text-xs text-[var(--primary-light)]" />
                    <span>Explore Map</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Explore_Trees" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300 flex items-center gap-2">
                    <FaTree className="text-xs text-[var(--primary-light)]" />
                    <span>Explore Trees</span>
                  </Link>
                </li>
                <li>
                  <Link href="/Gallery" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300 flex items-center gap-2">
                    <FaLeaf className="text-xs text-[var(--primary-light)]" />
                    <span>Gallery</span>
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300 flex items-center gap-2">
                    <FaLeaf className="text-xs text-[var(--primary-light)]" />
                    <span>About Us</span>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300">
                    Tree Care Guidelines
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300">
                    Environmental Impact
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300">
                    Conservation Efforts
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300">
                    Planting Guides
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3 text-[var(--text-primary)]">Contact</h3>
              <p className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                <FaEnvelope className="mt-1 text-[var(--primary-light)]" />
                <span>contact@greenmap.org</span>
              </p>
              <div className="pt-4">
                <Link 
                  href="/feedback" 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors duration-300 text-sm font-medium"
                >
                  <FaEnvelope className="w-4 h-4" />
                  <span>Send Feedback</span>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-[var(--primary-light)]/10 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-[var(--text-secondary)]">
              © {currentYear} Green Map. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors duration-300">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </ThemeProvider>
  );
};

export default ClientWrapper; 