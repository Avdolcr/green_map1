"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { FaMapMarkedAlt, FaTree, FaLeaf, FaChevronDown, FaArrowRight } from "react-icons/fa";
import AnimatedCard from "../components/AnimatedCard";
import AnimatedSection from "../components/AnimatedSection";

export default function Home() {
  const [treeCount, setTreeCount] = useState(0);
  const [speciesCount, setSpeciesCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    // Fetch tree statistics
    const fetchTreeStats = async () => {
      try {
        const response = await fetch('/api/tree-stats');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tree statistics');
        }
        
        const data = await response.json();
        setTreeCount(data.totalTrees || 0);
        setSpeciesCount(data.uniqueSpecies || 0);
        
        // Display a warning if tree_status column doesn't exist
        if (data.columnExists === false) {
          console.warn('tree_status column does not exist in trees table');
        }
        
        setApiError(null);
      } catch (error) {
        console.error("Error fetching tree statistics:", error);
        setApiError(error instanceof Error ? error.message : 'Failed to fetch tree statistics');
      }
    };

    fetchTreeStats();
    setIsLoaded(true);
    
    // Animate counting up
    if (treeCount > 0) {
      const treeCounter = animateCounter(0, treeCount, 2000, (value) => {
        setTreeCount(Math.floor(value));
      });
      
      const speciesCounter = animateCounter(0, speciesCount, 2000, (value) => {
        setSpeciesCount(Math.floor(value));
      });

    return () => {
        clearInterval(treeCounter);
        clearInterval(speciesCounter);
    };
    }
  }, []);

  // Function to animate counting up
  const animateCounter = (start: number, end: number, duration: number, callback: (value: number) => void) => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const timePassed = Date.now() - startTime;
      const progress = Math.min(timePassed / duration, 1);
      const value = start + progress * (end - start);
      
      callback(value);
      
      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16);
    
    return timer;
  };

  return (
    <main className="min-h-screen" ref={containerRef}>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Gradient Background */}
        <motion.div 
          className="absolute inset-0 z-0 bg-gradient-to-b from-[var(--primary-dark)] via-[var(--primary)] to-[var(--background)]"
          style={{ opacity }}
        >
          <div className="absolute inset-0 bg-[var(--primary-dark)]/30 z-5" />
          <div className="absolute inset-0 bg-gradient-radial from-[var(--primary-light)]/10 via-transparent to-transparent z-10" />
        </motion.div>
        
        {/* Hero Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
          >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white 
                leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                Discover and Explore the <span className="text-[var(--secondary-light)]">Green World</span> Around Us
            </h1>
              
              <p className="text-lg md:text-xl text-white/95 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]">
                An interactive platform for mapping, documenting, and exploring the diversity and beauty of trees in our environment.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mt-10">
              <Link href="/Explore_Map">
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(74, 125, 109, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white 
                      py-3 px-6 rounded-md font-medium flex items-center gap-2 transition-all duration-300"
                  >
                    <FaMapMarkedAlt />
                    <span>Explore Map</span>
                  </motion.div>
              </Link>
                
              <Link href="/Explore_Trees">
                  <motion.div
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(74, 125, 109, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-transparent border-2 border-white text-white 
                      py-3 px-6 rounded-md font-medium flex items-center gap-2 hover:bg-white/10 transition-all duration-300"
                  >
                    <FaTree />
                    <span>View Tree Collection</span>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
            
        {/* Scroll Indicator */}
            <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer z-10"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <FaChevronDown className="text-white text-3xl" />
          </motion.div>
      </section>

      {/* Statistics Section - Updated background */}
      <AnimatedSection className="py-20 bg-[var(--background-alt)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-4xl font-bold mb-6 text-[var(--text-primary)]"
              >
                Documenting Our Natural Heritage
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-[var(--text-secondary)] mb-8 leading-relaxed"
              >
                Our mission is to create a comprehensive digital atlas of trees, promoting awareness 
                about biodiversity and supporting conservation efforts through education and community involvement.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link href="/about">
                  <div className="inline-flex items-center text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium gap-2">
                    Learn more about our mission
                    <FaArrowRight className="text-sm" />
                </div>
                </Link>
              </motion.div>
            </div>
              
            <div className="grid grid-cols-2 gap-6">
              {!apiError ? (
                <>
              <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-gradient-to-br from-[var(--primary-light)]/10 to-[var(--primary)]/20 backdrop-blur-sm p-8 rounded-xl border border-[var(--primary-light)]/20 shadow-md"
                  >
                    <div className="mb-4">
                      <FaTree className="text-4xl text-[var(--primary-light)]" />
                </div>
                    <p className="text-sm uppercase font-medium text-[var(--text-secondary)] mb-2">Total Trees</p>
                    <h3 className="text-4xl font-bold text-[var(--text-primary)]">{treeCount.toLocaleString()}</h3>
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">Documented and mapped</p>
              </motion.div>
              <motion.div
                    initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-gradient-to-br from-[var(--secondary)]/10 to-[var(--secondary)]/20 backdrop-blur-sm p-8 rounded-xl border border-[var(--secondary)]/20 shadow-md"
                  >
                    <div className="mb-4">
                      <FaLeaf className="text-4xl text-[var(--secondary)]" />
                </div>
                    <p className="text-sm uppercase font-medium text-[var(--text-secondary)] mb-2">Unique Species</p>
                    <h3 className="text-4xl font-bold text-[var(--text-primary)]">{speciesCount.toLocaleString()}</h3>
                    <p className="mt-3 text-sm text-[var(--text-secondary)]">Variety of tree species</p>
                  </motion.div>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="col-span-2 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error Loading Statistics</h3>
                  <p className="text-red-600 dark:text-red-300">{apiError}</p>
            </motion.div>
              )}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Features Section */}
      <AnimatedSection className="py-20 bg-[var(--background)]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-6 text-[var(--text-primary)]"
            >
              Explore Our Features
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-[var(--text-secondary)]"
            >
              Discover the tools and resources we provide to help you explore and learn about the trees in our environment.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedCard 
              title="Interactive Map"
              description="Explore trees in their geographic context with our interactive mapping tool."
              link="/Explore_Map"
              linkText="Open Map"
              icon={<FaMapMarkedAlt className="w-8 h-8" />}
              delay={0}
            />
            
            <AnimatedCard 
              title="Tree Database"
              description="Browse our comprehensive database of tree species with detailed information."
              link="/Explore_Trees"
              linkText="Browse Trees"
              icon={<FaTree className="w-8 h-8" />}
              delay={0.2}
            />
            
            <AnimatedCard 
              title="Photo Gallery"
              description="View stunning photographs of trees, leaves, flowers, and bark from our collection."
              link="/Gallery"
              linkText="View Gallery"
              icon={<FaLeaf className="w-8 h-8" />}
              delay={0.4}
            />
          </div>
        </div>
      </AnimatedSection>
    </main>
  );
}