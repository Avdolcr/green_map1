"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import "./AboutUs.css";
import AnimatedSection from "../../components/AnimatedSection";
import { useTheme } from "../../components/ThemeProvider";
import { FaLeaf, FaSeedling, FaTree, FaGlobe, FaUsers, FaBookOpen, FaHandHoldingHeart, FaChartBar } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

// Add animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.2
    }
  }
};

const cardVariants = {
  initial: { y: 50, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.3, ease: "easeInOut" }
  }
};

// Interface for species count data
interface SpeciesCount {
  scientific_name: string;
  common_name: string;
  count: number;
}

export default function AboutPage() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrees: 0,
    uniqueSpecies: 0,
    members: 0 // Placeholder for community members
  });
  const [speciesCounts, setSpeciesCounts] = useState<SpeciesCount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<any>(null);
  
  // Parallax effect refs and values
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityValue = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  
  // Smooth scrolling for parallax
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  
  // Fetch tree stats and species counts
  useEffect(() => {
    setIsClient(true);
    
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Create an object to store all fetch results and errors
        const results: {
          stats: { totalTrees: number; uniqueSpecies: number } | null;
          species: { species: SpeciesCount[] } | null;
          errors: string[];
        } = {
          stats: null,
          species: null,
          errors: [] as string[]
        };
        
        // Fetch general tree statistics
        try {
          console.log('Fetching tree statistics...');
          const statsResponse = await fetch('/api/tree-stats');
          
          if (!statsResponse.ok) {
            const errorData = await statsResponse.json();
            console.error('Tree stats API error:', errorData);
            results.errors.push(`Stats API: ${errorData.error || statsResponse.statusText}`);
            
            // Try fallback API
            console.log('Trying fallback stats API...');
            const fallbackStatsResponse = await fetch('/api/tree-stats-fallback');
            if (fallbackStatsResponse.ok) {
              results.stats = await fallbackStatsResponse.json();
              console.log('Fallback stats loaded successfully:', results.stats);
            } else {
              results.errors.push('Fallback stats API also failed');
            }
          } else {
            results.stats = await statsResponse.json();
            console.log('Tree stats loaded successfully:', results.stats);
          }
        } catch (statsError: any) {
          console.error('Failed to fetch tree statistics:', statsError);
          results.errors.push(`Stats fetch: ${statsError.message}`);
          
          // Try fallback API
          try {
            console.log('Trying fallback stats API after error...');
            const fallbackStatsResponse = await fetch('/api/tree-stats-fallback');
            if (fallbackStatsResponse.ok) {
              results.stats = await fallbackStatsResponse.json();
              console.log('Fallback stats loaded successfully:', results.stats);
            }
          } catch (fallbackError) {
            console.error('Fallback stats API also failed:', fallbackError);
          }
        }
        
        // Fetch species counts
        try {
          console.log('Fetching species counts...');
          const speciesResponse = await fetch('/api/tree-species-counts');
          
          if (!speciesResponse.ok) {
            const errorData = await speciesResponse.json();
            console.error('Species counts API error:', errorData);
            results.errors.push(`Species API: ${errorData.error || speciesResponse.statusText}`);
            
            // Try fallback API
            console.log('Trying fallback species API...');
            const fallbackSpeciesResponse = await fetch('/api/tree-species-fallback');
            if (fallbackSpeciesResponse.ok) {
              results.species = await fallbackSpeciesResponse.json();
              console.log('Fallback species loaded successfully:', results.species);
            } else {
              results.errors.push('Fallback species API also failed');
            }
          } else {
            results.species = await speciesResponse.json();
            console.log('Species counts loaded successfully:', results.species);
          }
        } catch (speciesError: any) {
          console.error('Failed to fetch species counts:', speciesError);
          results.errors.push(`Species fetch: ${speciesError.message}`);
          
          // Try fallback API
          try {
            console.log('Trying fallback species API after error...');
            const fallbackSpeciesResponse = await fetch('/api/tree-species-fallback');
            if (fallbackSpeciesResponse.ok) {
              results.species = await fallbackSpeciesResponse.json();
              console.log('Fallback species loaded successfully:', results.species);
            }
          } catch (fallbackError) {
            console.error('Fallback species API also failed:', fallbackError);
          }
        }
        
        // Try generic endpoint 
        if (!results.species) {
          try {
            console.log('Trying generic tree counts API...');
            const genericResponse = await fetch('/api/tree-counts-generic');
            if (genericResponse.ok) {
              results.species = await genericResponse.json();
              console.log('Generic tree counts loaded successfully:', results.species);
            } else {
              results.errors.push('Generic tree counts API also failed');
            }
          } catch (genericError: any) {
            console.error('Failed to fetch generic tree counts:', genericError);
            results.errors.push(`Generic API: ${genericError.message}`);
          }
        }
        
        // Update state based on fetch results
        
        // For tree stats - use real data or fallback
        if (results.stats) {
          setStats({
            totalTrees: results.stats.totalTrees || 0,
            uniqueSpecies: results.stats.uniqueSpecies || 0,
            members: 500 // Placeholder - would come from a real API in production
          });
        } else {
          // Hardcoded fallback data as last resort
          setStats({
            totalTrees: 1200,
            uniqueSpecies: 60,
            members: 500
          });
        }
        
        // For species counts - use real data or fallback
        if (results.species && results.species.species) {
          setSpeciesCounts(results.species.species);
          // Store the API info
          setApiInfo(results.species);
        } else {
          // Hardcoded fallback data as last resort
          setSpeciesCounts([
            { scientific_name: "Quercus robur", common_name: "English Oak", count: 245 },
            { scientific_name: "Acer platanoides", common_name: "Norway Maple", count: 187 },
            { scientific_name: "Tilia cordata", common_name: "Small-leaved Lime", count: 156 },
            { scientific_name: "Betula pendula", common_name: "Silver Birch", count: 134 },
            { scientific_name: "Fagus sylvatica", common_name: "European Beech", count: 98 },
          ]);
          setApiInfo(null);
        }
        
        // Set error state if there were any errors
        if (results.errors.length > 0) {
          const errorMessage = results.errors.join(', ');
          console.warn('Setting error state with message:', errorMessage);
          setError(errorMessage);
        } else {
          setError(null);
        }
      } catch (err: any) {
        console.error("Error in overall fetch process:", err);
        setError(err.message || "Failed to load data. Please try again later.");
        
        // Set hardcoded fallback data as last resort
        setStats({
          totalTrees: 1200,
          uniqueSpecies: 60,
          members: 500
        });
        setSpeciesCounts([
          { scientific_name: "Quercus robur", common_name: "English Oak", count: 245 },
          { scientific_name: "Acer platanoides", common_name: "Norway Maple", count: 187 },
          { scientific_name: "Tilia cordata", common_name: "Small-leaved Lime", count: 156 },
          { scientific_name: "Betula pendula", common_name: "Silver Birch", count: 134 },
          { scientific_name: "Fagus sylvatica", common_name: "European Beech", count: 98 },
        ]);
        setApiInfo(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const team = [
    {
      name: "Sarah Johnson",
      role: "Environmental Scientist",
      bio: "Leading our tree identification and classification efforts with over 10 years of experience in urban forestry.",
      icon: <FaLeaf className="team-icon" />,
      delay: 0.2
    },
    {
      name: "Michael Chen",
      role: "GIS Specialist",
      bio: "Manages our mapping technology and ensures accurate geographic data representation across all platforms.",
      icon: <FaGlobe className="team-icon" />,
      delay: 0.4
    },
    {
      name: "Amira Patel",
      role: "Community Engagement",
      bio: "Coordinates local events and educational workshops to connect residents with their neighborhood green spaces.",
      icon: <FaUsers className="team-icon" />,
      delay: 0.6
    }
  ];
  
  const initiatives = [
    {
      title: "Tree Mapping Initiative",
      description: "Documenting and cataloging urban forest species to create a comprehensive database for researchers and communities.",
      icon: <FaTree />,
      stats: `${stats.totalTrees.toLocaleString()}+ Trees Mapped`,
      color: "var(--primary)",
      delay: 0.2
    },
    {
      title: "Community Education",
      description: "Providing workshops, guided tours, and educational resources about local tree species and their ecological benefits.",
      icon: <FaBookOpen />,
      stats: "50+ Educational Events",
      color: "var(--secondary)",
      delay: 0.4
    },
    {
      title: "Conservation Projects",
      description: "Partnering with local organizations to protect endangered tree species and promote biodiversity in urban spaces.",
      icon: <FaHandHoldingHeart />,
      stats: "25 Active Projects",
      color: "var(--accent)",
      delay: 0.6
    }
  ];

  // Loading state component
  const LoadingState = () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading live data...</p>
    </div>
  );

  // Error state component
  const ErrorBanner = () => (
    <div className="error-banner">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <p className="error-title">Data loading issue</p>
        <p className="error-message">{error}</p>
        <p className="error-note">Showing fallback data</p>
      </div>
      <button onClick={() => setError(null)} className="dismiss-error" aria-label="Dismiss error">
        ×
      </button>
    </div>
  );

  return (
    <AnimatedSection className={`about-page ${isDarkMode ? "dark-mode" : ""}`} delay={0.2}>
      {/* Animated background elements */}
      {isClient && (
        <>
          <div className="animated-leaves">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="leaf"
        style={{ 
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 10}s`,
                  animationDuration: `${15 + Math.random() * 15}s`
                }}
              >
                <FaLeaf />
              </div>
            ))}
          </div>
          <div className="background-pattern"></div>
        </>
      )}
      
      {/* Hero Section */}
      <motion.div 
        className="about-hero-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
          <motion.div 
          className="about-hero-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1 
            className="gradient-text"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            About Green Map
          </motion.h1>
          
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            A community-driven initiative dedicated to documenting, preserving, and celebrating 
            the diverse tree species in our urban environment. We believe that understanding our 
            local ecosystem is the first step toward meaningful conservation.
          </motion.p>

          <motion.div 
            className="hero-stats"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {error && <ErrorBanner />}
            {isLoading ? (
              <LoadingState />
            ) : (
              <>
                <div className="stat-card">
                  <FaTree className="stat-icon" />
                  <div className="stat-value">{stats.totalTrees.toLocaleString()}+</div>
                  <div className="stat-label">Trees Mapped</div>
                </div>
                <div className="stat-card">
                  <FaLeaf className="stat-icon" />
                  <div className="stat-value">{stats.uniqueSpecies}+</div>
                  <div className="stat-label">Species Identified</div>
                </div>
                <div className="stat-card">
                  <FaUsers className="stat-icon" />
                  <div className="stat-value">{stats.members}+</div>
                  <div className="stat-label">Community Members</div>
                </div>
              </>
            )}
          </motion.div>
          
          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Link href="/Explore_Trees" className="cta-button">
              <FaLeaf className="cta-icon" />
              Explore Our Tree Diversity
            </Link>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="about-globe-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="pulsing-circle"></div>
          <div className="globe-visual">
            <FaGlobe className="globe-icon" />
            <div className="connecting-lines">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="connection-line" style={{ animationDelay: `${i * 0.5}s` }}></div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Mission Section */}
      <motion.section 
        className="content-section mission-section"
        variants={cardVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="section-header">
          <FaSeedling className="section-icon" />
          <h2>Our Mission</h2>
        </div>
        
        <div className="glass-card">
          <p>
            At Green Map, we're on a mission to connect people with the natural world around them through 
            technology and community engagement. We believe that urban forests are vital ecosystems that 
            deserve recognition, protection, and celebration.
          </p>
          <p>
            Through our interactive mapping platform, educational initiatives, and community events, 
            we aim to:
          </p>
          
          <motion.ul className="mission-list">
            <motion.li 
              variants={itemVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <span className="highlight">Document</span> urban tree species to create a comprehensive database
            </motion.li>
            <motion.li 
              variants={itemVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <span className="highlight">Educate</span> communities about local biodiversity
            </motion.li>
            <motion.li 
              variants={itemVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <span className="highlight">Inspire</span> conservation efforts and environmental stewardship
            </motion.li>
            <motion.li 
              variants={itemVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <span className="highlight">Connect</span> people with nature in urban environments
            </motion.li>
          </motion.ul>
          </div>
        </motion.section>
        
      {/* Initiatives Section */}
        <motion.section 
        className="content-section initiatives-section"
          variants={pageVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
        >
        <div className="section-header">
          <FaTree className="section-icon" />
          <h2>Our Initiatives</h2>
        </div>
        
        <div className="initiatives-grid">
          {initiatives.map((initiative, index) => (
            <motion.div
              key={initiative.title}
              className="initiative-card glass-card"
              variants={cardVariants}
              whileHover="hover"
              custom={index}
              transition={{ delay: initiative.delay }}
            >
              <div className="initiative-icon" style={{ backgroundColor: initiative.color }}>
                {initiative.icon}
              </div>
              <h3>{initiative.title}</h3>
              <p>{initiative.description}</p>
              <div className="initiative-stats">{initiative.stats}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>
      
      {/* Team Section */}
      <motion.section 
        className="content-section team-section"
        variants={cardVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="section-header">
          <FaUsers className="section-icon" />
          <h2>Our Team</h2>
        </div>
        
        <div className="team-grid">
          {team.map((member) => (
              <motion.div 
              key={member.name}
              className="team-card glass-card"
              variants={itemVariants}
              initial="initial"
              whileInView="animate"
              whileHover="hover"
              viewport={{ once: true }}
              transition={{ delay: member.delay }}
            >
              <div className="team-member-icon">
                {member.icon}
              </div>
              <h3>{member.name}</h3>
              <div className="member-role">{member.role}</div>
              <p>{member.bio}</p>
            </motion.div>
          ))}
        </div>
        </motion.section>
        
      {/* Join Us Section */}
        <motion.section 
        className="content-section join-section"
          variants={cardVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
        >
        <div className="join-content glass-card">
          <h2>Join Our Community</h2>
          <p>
            We believe in the power of collective action. By joining the Green Map community, 
            you'll help build a more sustainable and green urban environment for generations to come.
          </p>
          
          <motion.div 
            className="cta-buttons"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link href="/Explore_Map" className="cta-button primary">
              Explore Map
            </Link>
            <Link href="/Explore_Trees" className="cta-button secondary">
              Discover Trees
            </Link>
          </motion.div>
        </div>
        </motion.section>
    </AnimatedSection>
  );
}
