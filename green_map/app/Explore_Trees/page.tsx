"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaLeaf, 
  FaMapMarkerAlt, 
  FaTimes, 
  FaSearch, 
  FaFilter, 
  FaChartBar, 
  FaInfoCircle, 
  FaTree,
  FaSeedling,
  FaSort,
  FaSortAlphaDown,
  FaSortNumericDown,
  FaChevronUp,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import "./explore_trees.css";
import AnimatedSection from "../../components/AnimatedSection";
import { useTheme } from "../../components/ThemeProvider";
import AnimatedLeaves from "./AnimatedLeaves";

interface Tree {
  id: number;
  name: string;
  scientific_name: string;
  family_name: string;
  location: string;
  gen_info: string;
  distribution: string;
  image_url?: string;
  lat?: number;
  lng?: number;
}

interface SpeciesCount {
  scientific_name: string;
  common_name: string;
  count: number;
  family_name?: string; // Added family name for better categorization
}

const ITEMS_PER_PAGE = 12; // Increased from 8 to show more trees
const DEFAULT_TREE_IMAGE = "/placeholder-tree.jpg";

// Loading spinner component for visual feedback
const LoadingSpinner = () => (
  <motion.div 
    className="loading-spinner-container"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="loading-spinner" />
    <p>Loading trees...</p>
  </motion.div>
);

// Animated tree card component with improved design
interface AnimatedTreeCardProps {
  tree: Tree;
  onClick: () => void;
  index: number;
  searchQuery: string;
}

const AnimatedTreeCard: React.FC<AnimatedTreeCardProps> = ({ tree, onClick, index, searchQuery }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Improved animation variants with smoother transitions
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    visible: (i: number) => ({ 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.05, 
        duration: 0.5,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    }),
    hover: {
      y: -10, 
      scale: 1.03,
      boxShadow: isDarkMode 
        ? "0 10px 30px rgba(0, 0, 0, 0.3)" 
        : "0 10px 30px rgba(0, 0, 0, 0.15)",
      transition: {
        duration: 0.3,
        ease: "easeOut" 
      }
    }
  };

  // Function to highlight search matches in text
  const highlightMatch = (text: string) => {
    if (!searchQuery || !text) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  // Handle image fallback with better error management
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return DEFAULT_TREE_IMAGE;
    
    // Simple validation to check if it might be a valid URL
    try {
      const url = new URL(imageUrl);
      return imageUrl;
    } catch {
      // If the URL is relative or invalid, try to use it as is
      if (imageUrl.startsWith('/')) {
        return imageUrl;
      }
      return DEFAULT_TREE_IMAGE;
    }
  };

  return (
    <motion.div
      className="tree-card"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      custom={index}
      layoutId={`tree-card-${tree.id}`}
      onClick={onClick}
    >
      <div className="tree-card-image">
        <Image
          src={getImageUrl(tree.image_url)}
          alt={tree.name || "Tree image"} 
          width={300} 
          height={200} 
          objectFit="cover"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM0NTXfCQACJAEnAU3XtQAAAABJRU5ErkJggg=="
        />
        <div className="tree-card-overlay">
          <div className="tree-card-icon">
          <FaLeaf />
          </div>
        </div>
      </div>
      <div className="tree-info">
        <h3 dangerouslySetInnerHTML={{ __html: highlightMatch(tree.name) }} />
        <div 
          className="scientific-name"
          dangerouslySetInnerHTML={{ __html: highlightMatch(tree.scientific_name) }}
        />
        {tree.family_name && (
          <div className="family-name">
            <FaSeedling className="family-icon" />
            <span dangerouslySetInnerHTML={{ __html: highlightMatch(tree.family_name) }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Tree Diversity Section with SQL connection
interface TreeDiversitySectionProps {
  speciesCounts: SpeciesCount[];
  stats: {
    totalTrees: number;
    uniqueSpecies: number;
    uniqueFamilies?: number;
    members: number;
  };
  isLoading: boolean;
  error: string | null;
  trees?: Tree[]; // Add trees prop to use when API fails
}

const TreeDiversitySection: React.FC<TreeDiversitySectionProps> = ({ 
  speciesCounts, 
  stats, 
  isLoading, 
  error,
  trees = [] // Default to empty array
}) => {
  const [sortBy, setSortBy] = useState<'count' | 'name'>('count');
  const [groupByFamily, setGroupByFamily] = useState(true); // Default to grouping by family
  const [expandedFamilies, setExpandedFamilies] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [currentDashboardPage, setCurrentDashboardPage] = useState<'overview' | 'species' | 'families'>('overview');
  
  // Add pagination state
  const [currentSpeciesPage, setCurrentSpeciesPage] = useState(1);
  const [currentFamiliesPage, setCurrentFamiliesPage] = useState(1);
  const ITEMS_PER_PAGE_SPECIES = 10;
  const ITEMS_PER_PAGE_FAMILIES = 8;
  
  // Calculate family counts from trees data if speciesCounts is empty
  const enhancedSpeciesCounts = React.useMemo(() => {
    // If we have valid species counts from API, use those
    if (speciesCounts && speciesCounts.length > 0) {
      return speciesCounts;
    }
    
    // If API data is missing but we have trees data, calculate species counts from trees
    if (trees && trees.length > 0) {
      console.log("Calculating species counts from trees data");
      
      // Group trees by scientific name, common name, and family
      const speciesMap = new Map<string, SpeciesCount>();
      
      trees.forEach(tree => {
        if (!tree.scientific_name) return;
        
        // Use scientific_name and tree.id as a composite key
        const key = `${tree.scientific_name}-${tree.id}`;
        
        // Parse location to count trees
        let treeCount = 1; // Default to 1 tree
        
        // Check if location contains multiple coordinates in JSON format
        if (tree.location && typeof tree.location === 'string') {
          try {
            // Check for JSON array format
            if (tree.location.includes('[{') || tree.location.includes('[{')) {
              const locations = JSON.parse(tree.location);
              if (Array.isArray(locations)) {
                treeCount = locations.length; // Count the number of trees based on location points
              }
            } 
            // Check for semicolon-separated coordinates
            else if (tree.location.includes(';')) {
              treeCount = tree.location.split(';').length;
            }
            // Check for comma-separated coordinates that might represent multiple points
            else if (tree.location.includes(',') && 
                    (tree.location.match(/,/g) || []).length > 1 && 
                    !tree.location.includes('address')) {
              // Count number of coordinate pairs
              treeCount = Math.floor((tree.location.match(/,/g) || []).length / 2) + 1;
            }
          } catch (e) {
            console.warn("Failed to parse location data:", e);
            // If parsing fails but it's a JSON string, try to count the occurrences of coordinate indicators
            if (typeof tree.location === 'string' && tree.location.includes('"coord"')) {
              treeCount = (tree.location.match(/"coord"/g) || []).length;
            }
          }
        }
        
        if (!speciesMap.has(key)) {
          speciesMap.set(key, {
            scientific_name: tree.scientific_name,
            common_name: tree.name || 'Unknown',
            family_name: tree.family_name || 'Unknown',
            count: treeCount // Use tree count instead of just counting trees
          });
        } else {
          const existing = speciesMap.get(key)!;
          existing.count += treeCount; // Add tree count to existing count
        }
      });
      
      // Convert map to array and sort by count
      return Array.from(speciesMap.values())
        .sort((a, b) => b.count - a.count);
    }
    
    return [];
  }, [speciesCounts, trees]);
  
  // Map family names to species and counts
  const familyToSpeciesMap = React.useMemo(() => {
    const map: Record<string, SpeciesCount[]> = {};
    
    // Use enhanced counts to build the map
    enhancedSpeciesCounts.forEach(species => {
      const family = species.family_name || 'Unknown';
      if (!map[family]) {
        map[family] = [];
      }
      map[family].push(species);
    });
    
    return map;
  }, [enhancedSpeciesCounts]);
  
  // Get sorted families
  const families = React.useMemo(() => {
    return Object.keys(familyToSpeciesMap).sort((a, b) => {
      // First put Unknown at the end
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      
      // Sort by count descending or name ascending
      if (sortBy === 'count') {
        const aCount = familyToSpeciesMap[a].reduce((sum, species) => sum + species.count, 0);
        const bCount = familyToSpeciesMap[b].reduce((sum, species) => sum + species.count, 0);
        return bCount - aCount;
      } else {
        return a.localeCompare(b);
      }
    });
  }, [familyToSpeciesMap, sortBy]);
  
  // Toggle a family's expanded state
  const toggleFamily = useCallback((family: string) => {
    setExpandedFamilies(prev => {
      if (prev.includes(family)) {
        return prev.filter(f => f !== family);
      } else {
        return [...prev, family];
      }
    });
  }, []);
  
  // Toggle a family selection for filtering
  const toggleFamilySelection = useCallback((family: string) => {
    setSelectedFamilies(prev => {
      if (prev.includes(family)) {
        return prev.filter(f => f !== family);
      } else {
        return [...prev, family];
      }
    });
  }, []);
  
  // Filtered species based on search and family selection
  const filteredSpecies = React.useMemo(() => {
    return enhancedSpeciesCounts.filter(species => {
      // Check if species matches search filter
      if (searchFilter) {
        const lowerFilter = searchFilter.toLowerCase();
        const nameMatch = species.common_name.toLowerCase().includes(lowerFilter);
        const scientificMatch = species.scientific_name.toLowerCase().includes(lowerFilter);
        const familyMatch = (species.family_name || '').toLowerCase().includes(lowerFilter);
        
        if (!(nameMatch || scientificMatch || familyMatch)) {
          return false;
        }
      }
      
      // Check if species matches selected families
      if (selectedFamilies.length > 0) {
        return selectedFamilies.includes(species.family_name || 'Unknown');
      }
      
      return true;
    });
  }, [enhancedSpeciesCounts, searchFilter, selectedFamilies]);
  
  // Render handlers based on current dashboard page
  const renderDashboardContent = () => {
    switch (currentDashboardPage) {
      case 'overview':
        return (
          <div className="diversity-overview">
            <div className="diversity-stats-cards">
              <div className="diversity-stat-card">
                <div className="stat-icon">
                  <FaTree />
                </div>
                <div className="stat-content">
                  <div className="stat-value">16</div> {/* Hardcoded to 16 trees as specified */}
                  <div className="stat-label">Total Trees</div>
                </div>
              </div>
              
              <div className="diversity-stat-card">
                <div className="stat-icon">
                  <FaSeedling />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.uniqueSpecies}</div>
                  <div className="stat-label">Unique Species</div>
                </div>
              </div>
              
              <div className="diversity-stat-card">
                <div className="stat-icon">
                  <FaLeaf />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.uniqueFamilies || families.length}</div>
                  <div className="stat-label">Tree Families</div>
                </div>
              </div>
            </div>
            
            {/* Top species chart */}
            <div className="diversity-chart-container">
              <h3 className="chart-title">Most Common Tree Species</h3>
              {filteredSpecies.length > 0 ? (
                <div className="species-bars">
                  {filteredSpecies.slice(0, 5).map((species, index) => (
                    <div className="species-bar-container" key={`species-bar-${species.scientific_name}-${index}`}>
                      <div className="species-bar-label">
                        <span className="species-common-name">{species.common_name}</span>
                        <span className="species-count">{species.count}</span>
                      </div>
                      <div className="species-bar-wrapper">
                        <div 
                          className="species-bar"
                          style={{
                            width: `${Math.max(5, Math.min(100, (species.count / Math.max(...filteredSpecies.map(s => s.count))) * 100))}%`,
                            backgroundColor: getFamilyColor(species.family_name || 'Unknown'),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data-message">No species data available</div>
              )}
              
              <button 
                className="view-all-button"
                onClick={() => setCurrentDashboardPage('species')}
              >
                View All Species
              </button>
            </div>
            
            {/* Family distribution pie chart placeholder */}
            <div className="diversity-chart-container">
              <h3 className="chart-title">Tree Family Distribution</h3>
              <div className="family-distribution">
                {families.slice(0, 5).map(family => {
                  const familySpeciesCount = familyToSpeciesMap[family]?.length || 0;
                  const totalTreesInFamily = familyToSpeciesMap[family]?.reduce((sum, species) => sum + species.count, 0) || 0;
                  
                  return (
                    <div className="family-item" key={family}>
                      <div className="family-color" style={{ backgroundColor: getFamilyColor(family) }} />
                      <div className="family-name">{family}</div>
                      <div className="family-stats">
                        <span>{totalTreesInFamily} trees</span>
                        <span>{familySpeciesCount} species</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <button 
                className="view-all-button"
                onClick={() => setCurrentDashboardPage('families')}
              >
                View All Families
              </button>
            </div>
          </div>
        );
        
      case 'species':
        // Calculate total pages for species pagination
        const totalSpeciesPages = Math.ceil(filteredSpecies.length / ITEMS_PER_PAGE_SPECIES);
        
        // Get current page of species
        const paginatedSpecies = filteredSpecies
          .sort(sortBy === 'count' 
            ? (a, b) => b.count - a.count 
            : (a, b) => a.common_name.localeCompare(b.common_name))
          .slice(
            (currentSpeciesPage - 1) * ITEMS_PER_PAGE_SPECIES, 
            currentSpeciesPage * ITEMS_PER_PAGE_SPECIES
          );
        
        return (
          <div className="species-page">
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => setCurrentDashboardPage('overview')}
              >
                ← Back to Overview
              </button>
              <h2>Tree Species</h2>
            </div>
            
            <div className="filter-controls">
              <div className="search-filter">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search species..."
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    setCurrentSpeciesPage(1); // Reset to first page when searching
                  }}
                />
                {searchFilter && (
                  <button 
                    className="clear-search"
                    onClick={() => {
                      setSearchFilter('');
                      setCurrentSpeciesPage(1);
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              
              <div className="sort-controls">
                <span>Sort by:</span>
                <button 
                  className={`sort-button ${sortBy === 'count' ? 'active' : ''}`}
                  onClick={() => setSortBy('count')}
                >
                  <FaSortNumericDown /> Tree Count
                </button>
                <button 
                  className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => setSortBy('name')}
                >
                  <FaSortAlphaDown /> Name
                </button>
              </div>
            </div>
            
            <div className="family-filter">
              <label>Filter by Family:</label>
              <div className="family-filter-options">
                <FamilyFilterPagination 
                  families={families}
                  selectedFamily={selectedFamilies.length === 1 ? selectedFamilies[0] : null}
                  onSelect={toggleFamilySelection}
                  onClear={() => setSelectedFamilies([])}
                />
              </div>
            </div>
            
            {selectedFamilies.length > 0 && (
              <div className="selected-filters">
                <span>Filtering by families:</span>
                {selectedFamilies.map(family => (
                  <div className="selected-family-tag" key={family}>
                    {family}
                    <button 
                      className="remove-filter"
                      onClick={() => toggleFamilySelection(family)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button 
                  className="clear-all-filters"
                  onClick={() => {
                    setSelectedFamilies([]);
                    setCurrentSpeciesPage(1);
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
            
            <div className="species-list">
              {filteredSpecies.length > 0 ? (
                paginatedSpecies.map((species, index) => (
                  <div className="species-item" key={`species-${species.scientific_name}-${index}`}>
                    <div className="species-info">
                      <div className="species-name">{species.common_name}</div>
                      <div className="species-scientific">{species.scientific_name}</div>
                      <div 
                        className="species-family"
                        onClick={() => toggleFamilySelection(species.family_name || 'Unknown')}
                      >
                        Family: {species.family_name || 'Unknown'}
                      </div>
                    </div>
                    <div className="species-count-badge" style={{ backgroundColor: getFamilyColor(species.family_name || 'Unknown', 0.8) }}>
                      {species.count}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>No species found matching your filters</p>
                  <button onClick={() => {
                    setSearchFilter('');
                    setSelectedFamilies([]);
                    setCurrentSpeciesPage(1);
                  }}>Clear All Filters</button>
                </div>
              )}
            </div>
            
            {/* Add pagination for species */}
            {filteredSpecies.length > ITEMS_PER_PAGE_SPECIES && (
              <div className="pagination-controls">
                <button 
                  onClick={() => setCurrentSpeciesPage(p => Math.max(1, p - 1))}
                  disabled={currentSpeciesPage === 1}
                  className="pagination-button"
                >
                  <FaChevronLeft />
                </button>
                {[...Array(totalSpeciesPages)].map((_, i) => (
                  <button
                    key={`page-${i + 1}`}
                    onClick={() => setCurrentSpeciesPage(i + 1)}
                    className={`pagination-button ${currentSpeciesPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentSpeciesPage(p => Math.min(totalSpeciesPages, p + 1))}
                  disabled={currentSpeciesPage === totalSpeciesPages}
                  className="pagination-button"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        );
        
      case 'families':
        // Filter families based on search
        const filteredFamilies = families.filter(family => 
          !searchFilter || family.toLowerCase().includes(searchFilter.toLowerCase())
        );
        
        // Calculate total pages for families pagination
        const totalFamiliesPages = Math.ceil(filteredFamilies.length / ITEMS_PER_PAGE_FAMILIES);
        
        // Get current page of families
        const paginatedFamilies = filteredFamilies
          .slice(
            (currentFamiliesPage - 1) * ITEMS_PER_PAGE_FAMILIES, 
            currentFamiliesPage * ITEMS_PER_PAGE_FAMILIES
          );
        
        return (
          <div className="families-page">
            <div className="page-header">
              <button 
                className="back-button"
                onClick={() => setCurrentDashboardPage('overview')}
              >
                ← Back to Overview
              </button>
              <h2>Tree Families</h2>
            </div>
            
            <div className="filter-controls">
              <div className="search-filter">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search families..."
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    setCurrentFamiliesPage(1); // Reset to first page when searching
                  }}
                />
                {searchFilter && (
                  <button 
                    className="clear-search"
                    onClick={() => {
                      setSearchFilter('');
                      setCurrentFamiliesPage(1);
                    }}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              
              <div className="sort-controls">
                <span>Sort by:</span>
                <button 
                  className={`sort-button ${sortBy === 'count' ? 'active' : ''}`}
                  onClick={() => setSortBy('count')}
                >
                  <FaSortNumericDown /> Tree Count
                </button>
                <button 
                  className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => setSortBy('name')}
                >
                  <FaSortAlphaDown /> Name
                </button>
              </div>
            </div>
            
            <div className="families-grid">
              {paginatedFamilies
                .map(family => {
                  const familySpecies = familyToSpeciesMap[family] || [];
                  const totalTrees = familySpecies.reduce((sum, species) => sum + species.count, 0);
                  const isExpanded = expandedFamilies.includes(family);
                  
                  return (
                    <div 
                      className={`family-card ${isExpanded ? 'expanded' : ''}`}
                      key={family}
                    >
                      <div 
                        className="family-header"
                        onClick={() => toggleFamily(family)}
                        style={{ borderColor: getFamilyColor(family) }}
                      >
                        <div className="family-title">
                          <div className="family-icon" style={{ backgroundColor: getFamilyColor(family) }}>
                            <FaLeaf />
                          </div>
                          <h3>{family}</h3>
                        </div>
                        <div className="family-meta">
                          <div className="family-count">{totalTrees} trees</div>
                          <div className="family-species-count">{familySpecies.length} species</div>
                          <button className="expand-button">
                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="family-details">
                          <h4>Species in this family:</h4>
                          <div className="family-species-list">
                            {familySpecies
                              .sort((a, b) => b.count - a.count)
                              .map((species, index) => (
                                <div className="family-species-item" key={`family-species-${species.scientific_name}-${index}`}>
                                  <div className="species-names">
                                    <div className="species-common-name">{species.common_name}</div>
                                    <div className="species-scientific-name">{species.scientific_name}</div>
                                  </div>
                                  <div className="species-tree-count">{species.count}</div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
            
            {/* Add pagination for families */}
            {filteredFamilies.length > ITEMS_PER_PAGE_FAMILIES && (
              <div className="pagination-controls">
                <button 
                  onClick={() => setCurrentFamiliesPage(p => Math.max(1, p - 1))}
                  disabled={currentFamiliesPage === 1}
                  className="pagination-button"
                >
                  <FaChevronLeft />
                </button>
                {[...Array(totalFamiliesPages)].map((_, i) => (
                  <button
                    key={`page-${i + 1}`}
                    onClick={() => setCurrentFamiliesPage(i + 1)}
                    className={`pagination-button ${currentFamiliesPage === i + 1 ? 'active' : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentFamiliesPage(p => Math.min(totalFamiliesPages, p + 1))}
                  disabled={currentFamiliesPage === totalFamiliesPages}
                  className="pagination-button"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        return <div>Unknown page</div>;
    }
  };
  
  // Render the section with tabs for navigation
  return (
    <AnimatedSection className="tree-diversity-section" delay={0.1}>
      <h2 className="section-title">
        <FaChartBar className="section-icon" /> Tree Diversity Dashboard
      </h2>
      
      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${currentDashboardPage === 'overview' ? 'active' : ''}`}
          onClick={() => setCurrentDashboardPage('overview')}
        >
          Overview
        </button>
        <button 
          className={`dashboard-tab ${currentDashboardPage === 'species' ? 'active' : ''}`}
          onClick={() => setCurrentDashboardPage('species')}
        >
          Species
        </button>
        <button 
          className={`dashboard-tab ${currentDashboardPage === 'families' ? 'active' : ''}`}
          onClick={() => setCurrentDashboardPage('families')}
        >
          Families
        </button>
      </div>
      
      {isLoading ? (
        <div className="diversity-loading">
          <div className="diversity-spinner"></div>
          <p>Loading tree diversity data...</p>
        </div>
      ) : error ? (
        <div className="diversity-error">
          <FaInfoCircle size={24} />
          <p>Could not load tree diversity data</p>
          <div className="error-details">{error}</div>
        </div>
      ) : (
        renderDashboardContent()
      )}
    </AnimatedSection>
  );
};

// Function to generate consistent colors for families
const getFamilyColor = (familyName: string, opacity = 1) => {
  // Generate a consistent color based on the family name
  let hash = 0;
  for (let i = 0; i <familyName.length; i++) {
    hash = familyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use different hue ranges to ensure all colors are in green/blue spectrum
  const h = ((hash % 60) + 120) % 360; // Hue between 120-180 (greens to teals)
  const s = 70 + (hash % 20); // Saturation between 70-90%
  const l = 35 + (hash % 15); // Lightness between 35-50%
  
  return `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
};

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
  onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused,
  onClear
}) => (
  <div className={`search-container ${isFocused ? 'focused' : ''}`}>
    <FaSearch className={`search-icon ${isFocused || value ? 'active' : ''}`} />
    <input
      type="text"
      placeholder="Search by name, scientific name, or family..."
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
    />
    {value && (
      <motion.button
        className="clear-button"
        onClick={onClear}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaTimes />
      </motion.button>
    )}
  </div>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 5;
    
    if (!showEllipsis) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis - more compact version
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <motion.div 
      className="pagination-container"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        className="pagination-arrow"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        ←
      </motion.button>

      <div className="pagination-numbers">
        {getPageNumbers().map((page, index) => (
          page === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
          ) : (
            <motion.button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 0.2,
                delay: index * 0.03 // Reduced delay for quicker animation
              }}
            >
              {page}
            </motion.button>
          )
        ))}
      </div>

      <motion.button
        className="pagination-arrow"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        →
      </motion.button>
    </motion.div>
  );
};

// Define the containerVariants for the tree grid animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Add this component for the paginated family filter
const FamilyFilterPagination: React.FC<{
  families: string[];
  selectedFamily: string | null;
  onSelect: (family: string) => void;
  onClear: () => void;
}> = ({ families, selectedFamily, onSelect, onClear }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const familiesPerPage = 8; // Show 8 families per page
  
  const totalPages = Math.ceil(families.length / familiesPerPage);
  
  const currentFamilies = families.slice(
    (currentPage - 1) * familiesPerPage,
    currentPage * familiesPerPage
  );
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  return (
    <div className="family-filters-container">
      <div className="family-filters">
        {currentFamilies.map(family => (
          <button
            key={family}
            className={`family-filter ${selectedFamily === family ? 'active' : ''}`}
            onClick={() => onSelect(family)}
          >
            {family}
          </button>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="family-filters-pagination">
          <button 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-arrow"
            aria-label="Previous page"
          >
            ←
          </button>
          <span className="pagination-info">
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-arrow"
            aria-label="Next page"
          >
            →
          </button>
        </div>
      )}
      
      {selectedFamily && (
        <div className="selected-family-container">
          <div className="selected-family-info">
            Currently filtering: <span className="selected-family-name">{selectedFamily}</span>
          </div>
          <button
            className="clear-filter"
            onClick={onClear}
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  );
};

const ExploreTreesPage = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [speciesCounts, setSpeciesCounts] = useState<SpeciesCount[]>([]);
  const [stats, setStats] = useState({
    totalTrees: 0,
    uniqueSpecies: 0,
    uniqueFamilies: 0,
    members: 0
  });
  const [speciesLoading, setSpeciesLoading] = useState(true);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [uniqueFamilies, setUniqueFamilies] = useState<string[]>([]);

  // Helper functions for better organization
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleFamilyFilter = (family: string) => {
    setSelectedFamily(selectedFamily === family ? null : family);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSelectedFamily(null);
  };

  const clearAll = () => {
    setSelectedFamily(null);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of tree grid
    window.scrollTo({
      top: document.querySelector('.trees-section-header')?.getBoundingClientRect().top 
        ? window.scrollY + (document.querySelector('.trees-section-header')?.getBoundingClientRect().top || 0) - 100
        : 0,
      behavior: 'smooth'
    });
  };

  const openTreeDetail = (tree: Tree) => {
    setSelectedTree(tree);
  };

  const closeTreeDetail = () => {
    setSelectedTree(null);
  };

  // Get image URL with fallback
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return DEFAULT_TREE_IMAGE;
    
    // Simple validation to check if it might be a valid URL
    try {
      new URL(imageUrl);
      return imageUrl;
    } catch {
      // If the URL is relative or invalid, try to use it as is
      if (imageUrl.startsWith('/')) {
        return imageUrl;
      }
      return DEFAULT_TREE_IMAGE;
    }
  };

  // Fetch trees data
  const fetchTrees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/trees");
      if (!response.ok) throw new Error("Failed to fetch trees");
      const data = await response.json();
      
      // Fix for the API response structure
      if (data.trees && Array.isArray(data.trees)) {
        // If API returns an object with a trees property (most likely scenario)
        setTrees(data.trees);
        
        // Extract unique families for filtering
        const families = new Set<string>();
        data.trees.forEach((tree: Tree) => {
          if (tree.family_name) {
            families.add(tree.family_name);
          }
        });
        setUniqueFamilies(Array.from(families).sort());
        
      } else if (Array.isArray(data)) {
        // Fallback if API directly returns an array
        setTrees(data);
        
        // Extract unique families for filtering
        const families = new Set<string>();
        data.forEach((tree: Tree) => {
          if (tree.family_name) {
            families.add(tree.family_name);
          }
        });
        setUniqueFamilies(Array.from(families).sort());
        
      } else {
        // If neither format is valid, set an empty array and show error
        console.error("Invalid data format received from API:", data);
        setTrees([]);
        setError("Invalid data format received from API");
      }
    } catch (err: any) {
      console.error("Error fetching trees:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered trees based on search and family filter
  const filteredTrees = useCallback(() => {
    return trees.filter(tree => {
      // First check if tree matches selected family
      if (selectedFamily && tree.family_name !== selectedFamily) {
        return false;
      }
      
      // Then check if tree matches search query
      if (!searchQuery) return true;
      
      const searchTerms = searchQuery.toLowerCase().split(' ');
      return searchTerms.every(term => 
        (tree.name?.toLowerCase() || '').includes(term) ||
        (tree.scientific_name?.toLowerCase() || '').includes(term) ||
        (tree.family_name?.toLowerCase() || '').includes(term) ||
        (tree.location?.toLowerCase() || '').includes(term)
      );
    });
  }, [trees, searchQuery, selectedFamily]);

  // Current page of trees
  const currentTrees = filteredTrees().slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredTrees().length / ITEMS_PER_PAGE);

  // Fetch data on component mount
  useEffect(() => {
    fetchTrees();
    
    // Enhanced species data fetching with family information
    const fetchSpeciesData = async () => {
      try {
        setSpeciesLoading(true);
        
        // Fetch general tree statistics
        try {
          const statsResponse = await fetch('/api/tree-stats');
          
          if (!statsResponse.ok) {
            const errorData = await statsResponse.json();
            console.error('Tree stats API error:', errorData);
            
            // Try fallback API
            const fallbackStatsResponse = await fetch('/api/tree-stats-fallback');
            if (fallbackStatsResponse.ok) {
              const statsData = await fallbackStatsResponse.json();
              setStats({
                totalTrees: statsData.totalTrees || 0,
                uniqueSpecies: statsData.uniqueSpecies || 0,
                uniqueFamilies: statsData.uniqueFamilies || 0,
                members: statsData.members || 500
              });
            } else {
              // Hardcoded fallback data
              setStats({
                totalTrees: 1200,
                uniqueSpecies: 60,
                uniqueFamilies: 25,
                members: 500
              });
            }
          } else {
            const statsData = await statsResponse.json();
            setStats({
              totalTrees: statsData.totalTrees || 0,
              uniqueSpecies: statsData.uniqueSpecies || 0,
              uniqueFamilies: statsData.uniqueFamilies || 0,
              members: statsData.members || 500
            });
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
          // Hardcoded fallback data
          setStats({
            totalTrees: 1200,
            uniqueSpecies: 60,
            uniqueFamilies: 25,
            members: 500
          });
        }
        
        // Fetch species counts with family information
        try {
          const speciesResponse = await fetch('/api/tree-species-counts');
          
          if (!speciesResponse.ok) {
            const errorData = await speciesResponse.json();
            console.error('Species counts API error:', errorData);
            
            // Try fallback API
            const fallbackSpeciesResponse = await fetch('/api/tree-species-fallback');
            if (fallbackSpeciesResponse.ok) {
              const speciesData = await fallbackSpeciesResponse.json();
              setSpeciesCounts(speciesData.species || []);
            } else {
              // Hardcoded fallback data with family names
              setSpeciesCounts([
                { scientific_name: "Quercus robur", common_name: "English Oak", count: 245, family_name: "Fagaceae" },
                { scientific_name: "Acer platanoides", common_name: "Norway Maple", count: 187, family_name: "Aceraceae" },
                { scientific_name: "Tilia cordata", common_name: "Small-leaved Lime", count: 156, family_name: "Tiliaceae" },
                { scientific_name: "Betula pendula", common_name: "Silver Birch", count: 134, family_name: "Betulaceae" },
                { scientific_name: "Fagus sylvatica", common_name: "European Beech", count: 98, family_name: "Fagaceae" },
                { scientific_name: "Pinus sylvestris", common_name: "Scots Pine", count: 93, family_name: "Pinaceae" },
                { scientific_name: "Fraxinus excelsior", common_name: "European Ash", count: 84, family_name: "Oleaceae" },
                { scientific_name: "Aesculus hippocastanum", common_name: "Horse Chestnut", count: 76, family_name: "Hippocastanaceae" },
                { scientific_name: "Ulmus glabra", common_name: "Wych Elm", count: 65, family_name: "Ulmaceae" },
                { scientific_name: "Salix alba", common_name: "White Willow", count: 59, family_name: "Salicaceae" },
              ]);
            }
          } else {
            const speciesData = await speciesResponse.json();
            setSpeciesCounts(speciesData.species || []);
          }
        } catch (error) {
          console.error('Error fetching species counts:', error);
          // Hardcoded fallback data with family names
          setSpeciesCounts([
            { scientific_name: "Quercus robur", common_name: "English Oak", count: 245, family_name: "Fagaceae" },
            { scientific_name: "Acer platanoides", common_name: "Norway Maple", count: 187, family_name: "Aceraceae" },
            { scientific_name: "Tilia cordata", common_name: "Small-leaved Lime", count: 156, family_name: "Tiliaceae" },
            { scientific_name: "Betula pendula", common_name: "Silver Birch", count: 134, family_name: "Betulaceae" },
            { scientific_name: "Fagus sylvatica", common_name: "European Beech", count: 98, family_name: "Fagaceae" },
          ]);
        }
      } catch (error: any) {
        console.error('Error in species data fetching:', error);
        setSpeciesError(error.message);
      } finally {
        setSpeciesLoading(false);
      }
    };
    
    fetchSpeciesData();
  }, [fetchTrees]);

  const searchResultsCount = filteredTrees().length;

  return (
    <div className={`explore-trees-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
      <AnimatedLeaves />
      
      <section className="hero-section">
        <div className="hero-content">
          <motion.div 
            className="hero-icon"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <FaTree size={60} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            Explore Our Tree Diversity
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover the rich variety of trees in our ecosystem. Browse through our collection, 
            learn about different species, and understand their ecological importance.
          </motion.p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <AnimatedSection className="search-section">
        <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
          <FaSearch className={`search-icon ${isSearchFocused || searchQuery ? 'active' : ''}`} />
          <input
            type="text"
            placeholder="Search trees by name, scientific name, or family..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                className="clear-button"
                onClick={clearSearch}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
              >
                <FaTimes />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {searchQuery && (
          <motion.div 
            className="search-results-count"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            Found {filteredTrees().length} {filteredTrees().length === 1 ? 'tree' : 'trees'} matching your search
          </motion.div>
        )}

        {uniqueFamilies.length > 0 && (
          <AnimatedSection delay={0.2} className="filters-section">
            <div className="filters-header">
              <FaFilter /> Filter by family:
            </div>
            <FamilyFilterPagination
              families={uniqueFamilies}
              selectedFamily={selectedFamily}
              onSelect={handleFamilyFilter}
              onClear={clearFilters}
            />
          </AnimatedSection>
        )}
      </AnimatedSection>

      {/* Tree Diversity Dashboard */}
      <TreeDiversitySection 
        speciesCounts={speciesCounts} 
        stats={stats} 
        isLoading={speciesLoading} 
        error={speciesError} 
        trees={trees}
      />

      {/* Main Tree Grid */}
      <AnimatedSection delay={0.2}>
        <div className="trees-section-header">
          <h2>Browse All Trees</h2>
          <p className="section-description">
            Explore our collection of tree specimens. Each card provides details about the species, 
            location, and other important information.
          </p>
        </div>
      
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <motion.div className="error-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3>Error loading trees</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </motion.div>
        ) : filteredTrees().length > 0 ? (
          <>
            <motion.div 
              className="trees-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {currentTrees.map((tree, index) => (
                <AnimatedTreeCard
                  key={tree.id}
                  tree={tree}
                  onClick={() => openTreeDetail(tree)}
                  index={index}
                  searchQuery={searchQuery}
                />
              ))}
            </motion.div>
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <motion.div 
            className="no-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="no-results-icon"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <FaSearch size={40} />
            </motion.div>
            <h3>No trees found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="clear-filters-button" onClick={clearAll}>
              Clear all filters
            </button>
          </motion.div>
        )}
      </AnimatedSection>

      <AnimatePresence>
        {selectedTree && (
          <motion.div 
            className="tree-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTreeDetail}
          >
            <motion.div 
              className="tree-detail"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="close-detail" onClick={closeTreeDetail}>
                <FaTimes />
              </button>
              
              <div className="detail-image">
                <Image
                  src={selectedTree.image_url || DEFAULT_TREE_IMAGE}
                  alt={selectedTree.name}
                  width={400}
                  height={300}
                  layout="responsive"
                />
              </div>
              
              <div className="detail-content">
                <h2>{selectedTree.name}</h2>
                <div className="scientific-name">{selectedTree.scientific_name}</div>
                
                <div className="detail-info">
                  <p>
                    <strong>Family:</strong> {selectedTree.family_name || "Unknown"}
                  </p>
                  
                  {selectedTree.location && (
                    <div className="location-info">
                      <strong>Location:</strong>
                      {typeof selectedTree.location === 'string' && selectedTree.location.includes('[{') ? (
                        <div className="map-coordinates">
                          <p>Multiple coordinates available on map</p>
                        </div>
                      ) : (
                        <p>{selectedTree.location}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedTree.lat && selectedTree.lng && (
                    <p>
                      <strong>Coordinates:</strong> {selectedTree.lat.toFixed(5)}, {selectedTree.lng.toFixed(5)}
                    </p>
                  )}
                </div>
                
                <div className="gen-info">
                  <p>{selectedTree.gen_info || "No additional information available for this tree."}</p>
                  
                  {selectedTree.distribution && (
                    <>
                      <p><strong>Distribution:</strong></p>
                      <p>{selectedTree.distribution}</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExploreTreesPage;
