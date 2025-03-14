import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { findBestMatch, knowledgeBase } from '@/lib/chatbot-knowledge';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get or create session ID from cookies
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('chatbot_session_id')?.value;
    
    if (!sessionId) {
      sessionId = uuidv4();
      // This will be set in the response
    }

    // Get user ID if logged in from auth session
    let userId = null;
    let userName = null;
    
    try {
      // Attempt to get the user session if they're logged in
      const session = await getServerSession(authOptions);
      if (session && session.user) {
        // Look up the user ID from their email
        const userResult = await query(
          `SELECT id, name FROM users WHERE email = ?`,
          [session.user.email]
        ) as any[];
        
        if (Array.isArray(userResult) && userResult.length > 0) {
          userId = userResult[0].id;
          userName = userResult[0].name;
        }
      }
    } catch (authError) {
      console.error('Authentication error:', authError);
      // Continue without user ID if there's an auth error
    }

    try {
      // First check our knowledge base for a match
      const knowledgeMatch = findBestMatch(message);
      
      if (knowledgeMatch) {
        // We found a match in our knowledge base
        const botResponse = knowledgeMatch.answer;
        
        // Save conversation to history with user ID if available
        await query(
          `INSERT INTO chatbot_history (user_id, session_id, user_message, bot_response) 
           VALUES (?, ?, ?, ?)`,
          [userId, sessionId, message, botResponse]
        );
        
        // Create response with cookie
        const response = NextResponse.json({ 
          response: botResponse,
          sessionId,
          user: userName ? { name: userName } : null
        });
        
        // Set session cookie if it doesn't exist
        if (!cookieStore.get('chatbot_session_id')) {
          if (sessionId) {
            response.cookies.set('chatbot_session_id', sessionId, {
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: '/'
            });
          }
        }
        
        return response;
      }
      
      // If no knowledge base match, perform database search
      const searchTerms = message.toLowerCase().split(' ').filter((term: string) => term.length > 3);
      const lowerCaseMessage = message.toLowerCase();
      
      // Get matching trees from database
      let botResponse = "I couldn't find specific information about that. Can you try asking something about the trees in our database? You can ask about tree species, their benefits, how to identify them, or general questions about the Green Map project.";
      
      // Enhanced pattern matching for city-specific tree count questions
      const cityPatterns = [
        /how many trees (?:are there |are |exist |do we have |can be found |grow |live |are located |are recorded )(?:in|at|near|around) ([a-z\s]+)/i,
        /tree count (?:in|at|near|around) ([a-z\s]+)/i,
        /number of trees (?:in|at|near|around) ([a-z\s]+)/i,
        /trees (?:in|at|near|around) ([a-z\s]+) count/i,
        /total trees (?:in|at|near|around) ([a-z\s]+)/i,
      ];
      
      // Check for city-specific tree count questions with improved patterns
      let cityMatch = null;
      
      for (const pattern of cityPatterns) {
        const match = lowerCaseMessage.match(pattern);
        if (match && match[1]) {
          cityMatch = match;
          break;
        }
      }
      
      // Fallback to simple pattern if complex patterns don't match
      if (!cityMatch) {
        cityMatch = lowerCaseMessage.match(/trees? in ([a-z\s]+)(?:city|town)?/i);
      }
      
      const countPhrases = ['how many', 'count', 'number of', 'total', 'quantity'];
      const isCountQuestion = countPhrases.some(phrase => lowerCaseMessage.includes(phrase));
      
      // Pattern matching for location-specific tree species questions
      const locationPatterns = [
        /where (?:can|are|is|do) (.+?) (?:trees?|grow|found|located)/i,
        /where (?:to find|to see) (.+?) trees?/i,
        /location of (.+?) trees?/i
      ];
      
      let speciesLocationMatch = null;
      let treeSpecies = null;
      
      for (const pattern of locationPatterns) {
        const match = lowerCaseMessage.match(pattern);
        if (match && match[1]) {
          speciesLocationMatch = match;
          treeSpecies = match[1].trim();
          // Remove common words that aren't species names
          treeSpecies = treeSpecies.replace(/\b(the|a|an|some|any|these|those|can|i|we|you|they|find)\b/gi, '').trim();
          break;
        }
      }
      
      // Handle queries about specific tree locations
      if (speciesLocationMatch && treeSpecies) {
        try {
          // Query for tree species
          const speciesQuery = `
            SELECT 
              scientific_name, 
              COUNT(*) as count,
              GROUP_CONCAT(DISTINCT location SEPARATOR ', ') as locations
            FROM trees
            WHERE 
              LOWER(scientific_name) LIKE ? OR 
              LOWER(scientific_name) LIKE ? OR
              LOWER(common_name) LIKE ? OR
              LOWER(common_name) LIKE ?
            GROUP BY scientific_name
            LIMIT 1
          `;
          
          const speciesResult = await query(speciesQuery, [
            `%${treeSpecies}%`, 
            `%${treeSpecies.endsWith('s') ? treeSpecies.slice(0, -1) : treeSpecies}%`,
            `%${treeSpecies}%`,
            `%${treeSpecies.endsWith('s') ? treeSpecies.slice(0, -1) : treeSpecies}%`
          ]) as any[];
          
          if (Array.isArray(speciesResult) && speciesResult.length > 0) {
            const speciesData = speciesResult[0];
            let speciesName = speciesData.scientific_name;
            let locationsList = speciesData.locations || 'various regions';
            
            botResponse = `🌳 Based on our database, ${speciesName} trees can be found in ${locationsList}. We have documented ${speciesData.count} of these trees in our system. You can explore their exact locations on our interactive map. Would you like to know more about ${treeSpecies} trees?`;
          } else {
            // No exact match found in database, provide general information
            // Allow knowledge base to handle this if possible
            const knowledgeMatch = findBestMatch(`Tell me about ${treeSpecies} trees`);
            
            if (knowledgeMatch) {
              botResponse = knowledgeMatch.answer;
            } else {
              botResponse = `I don't have specific location data for ${treeSpecies} trees in our local database. Different tree species thrive in different climate zones and conditions. Would you like me to provide general information about tree habitats or about a specific type of tree?`;
            }
          }
          
          // Save conversation to history with user ID if available
          await query(
            `INSERT INTO chatbot_history (user_id, session_id, user_message, bot_response) 
             VALUES (?, ?, ?, ?)`,
            [userId, sessionId, message, botResponse]
          );
          
          return NextResponse.json({ 
            response: botResponse,
            sessionId,
            user: userName ? { name: userName } : null
          });
        } catch (err) {
          console.error('Error processing species location query:', err);
        }
      }
      
      if (cityMatch && (isCountQuestion || lowerCaseMessage.includes('tree'))) {
        const city = cityMatch[1].trim();
        
        // Expanded query to get more tree data
        const cityCountQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(DISTINCT scientific_name) as species_count,
            AVG(height) as avg_height,
            MAX(height) as max_height,
            MIN(created_at) as earliest_record
          FROM trees 
          WHERE LOWER(location) LIKE ?
        `;
        
        const cityResult = await query(cityCountQuery, [`%${city}%`]) as any[];
        
        if (Array.isArray(cityResult) && cityResult.length > 0) {
          const cityData = cityResult[0];
          let cityTreeCount = cityData.total;
          
          if (cityTreeCount > 0) {
            // Enhanced response with more tree data
            const speciesCount = cityData.species_count || 0;
            const avgHeight = cityData.avg_height ? Math.round(cityData.avg_height) : null;
            const maxHeight = cityData.max_height || null;
            const earliestRecordDate = cityData.earliest_record ? new Date(cityData.earliest_record).getFullYear() : null;
            
            let response = `🌳 There are currently **${cityTreeCount} trees** recorded in our Green Map database for **${city.charAt(0).toUpperCase() + city.slice(1)}**. `;
            
            if (speciesCount > 0) {
              response += `These trees represent **${speciesCount} different species**. `;
            }
            
            if (avgHeight && maxHeight) {
              response += `The average tree height is approximately ${avgHeight} feet, with the tallest being ${maxHeight} feet. `;
            }
            
            if (earliestRecordDate) {
              response += `We've been collecting tree data in this area since ${earliestRecordDate}. `;
            }
            
            response += `\n\n📍 These trees contribute significantly to the urban forest of ${city.charAt(0).toUpperCase() + city.slice(1)}, providing shade, improving air quality, and creating habitat for local wildlife. You can explore all these trees on our interactive map!`;
            
            botResponse = response;
            
            // Additional query to get most common species in the city
            const speciesQuery = `
              SELECT scientific_name, COUNT(*) as count
              FROM trees
              WHERE LOWER(location) LIKE ? AND scientific_name IS NOT NULL
              GROUP BY scientific_name
              ORDER BY count DESC
              LIMIT 3
            `;
            
            const speciesResult = await query(speciesQuery, [`%${city}%`]) as any[];
            
            if (Array.isArray(speciesResult) && speciesResult.length > 0) {
              let speciesInfo = `\n\n🌿 The most common tree species in ${city.charAt(0).toUpperCase() + city.slice(1)} are:\n`;
              
              speciesResult.forEach((species: any, index: number) => {
                speciesInfo += `${index + 1}. **${species.scientific_name}** (${species.count} trees)\n`;
              });
              
              botResponse += speciesInfo;
            }
          } else {
            botResponse = `📍 I don't have specific tree information for **${city.charAt(0).toUpperCase() + city.slice(1)}** in our database yet. However, you can explore our map to see trees in other areas, or contribute by adding trees you know about in ${city}. Would you like information about another city or about trees in general?`;
          }
        }
      } 
      // General tree count question with enhanced data
      else if (isCountQuestion) {
        const enhancedCountQuery = `
          SELECT 
            COUNT(*) as total,
            COUNT(DISTINCT scientific_name) as species_count,
            COUNT(DISTINCT location) as location_count,
            AVG(height) as avg_height,
            MAX(height) as max_height
          FROM trees
        `;
        
        const countResult = await query(enhancedCountQuery) as any[];
        
        if (Array.isArray(countResult) && countResult.length > 0) {
          const treeData = countResult[0];
          const totalTrees = treeData.total;
          const speciesCount = treeData.species_count || 0;
          const locationCount = treeData.location_count || 0;
          const avgHeight = treeData.avg_height ? Math.round(treeData.avg_height) : null;
          const maxHeight = treeData.max_height || null;
          
          let response = `🌳 Our database currently contains **${totalTrees} trees** recorded across **${locationCount} different locations**. `;
          
          if (speciesCount > 0) {
            response += `These trees represent **${speciesCount} unique species**. `;
          }
          
          if (avgHeight && maxHeight) {
            response += `The average tree height is ${avgHeight} feet, with our tallest recorded tree measuring an impressive ${maxHeight} feet! `;
          }
          
          // Add most common species information
          const topSpeciesQuery = `
            SELECT scientific_name, COUNT(*) as count
            FROM trees
            WHERE scientific_name IS NOT NULL
            GROUP BY scientific_name
            ORDER BY count DESC
            LIMIT 5
          `;
          
          const speciesResult = await query(topSpeciesQuery) as any[];
          
          if (Array.isArray(speciesResult) && speciesResult.length > 0) {
            response += `\n\n🌿 Our most common tree species are:\n`;
            
            speciesResult.forEach((species: any, index: number) => {
              response += `${index + 1}. **${species.scientific_name}** (${species.count} trees)\n`;
            });
          }
          
          response += `\n📊 You can explore all these trees on our interactive map and contribute to our growing database by adding trees you discover!`;
          
          botResponse = response;
        }
      } 
      // Regular search for tree information with enhanced results
      else if (searchTerms.length > 0) {
        const searchQuery = `
          SELECT id, name, scientific_name, family_name, gen_info, distribution, location, height, age, health_status
          FROM trees 
          WHERE 
            LOWER(name) LIKE ? OR 
            LOWER(scientific_name) LIKE ? OR 
            LOWER(family_name) LIKE ? OR 
            LOWER(gen_info) LIKE ? OR 
            LOWER(distribution) LIKE ?
          LIMIT 3
        `;
        
        const searchParams = searchTerms.map((term: string) => `%${term}%`);
        const results = await query(searchQuery, [
          searchParams[0], searchParams[0], searchParams[0], searchParams[0], searchParams[0]
        ]) as any[];
        
        if (Array.isArray(results) && results.length > 0) {
          botResponse = `🔍 Here's what I found about your tree query:\n\n`;
          
          results.forEach((tree: any) => {
            botResponse += `🌳 **${tree.name}** (${tree.scientific_name || 'Scientific name not available'})\n`;
            
            if (tree.family_name) {
              botResponse += `👪 Family: ${tree.family_name}\n`;
            }
            
            if (tree.gen_info) {
              botResponse += `ℹ️ ${tree.gen_info.substring(0, 150)}...\n`;
            }
            
            if (tree.height || tree.age) {
              botResponse += `📏 `;
              if (tree.height) botResponse += `Height: ${tree.height} feet `;
              if (tree.height && tree.age) botResponse += `| `;
              if (tree.age) botResponse += `Age: approximately ${tree.age} years`;
              botResponse += `\n`;
            }
            
            if (tree.health_status) {
              const healthIcon = tree.health_status.toLowerCase().includes('good') ? '💚' : 
                                tree.health_status.toLowerCase().includes('fair') ? '💛' : '❤️';
              botResponse += `${healthIcon} Health: ${tree.health_status}\n`;
            }
            
            if (tree.location) {
              botResponse += `📍 Located in: ${tree.location}\n`;
            }
            
            if (tree.distribution) {
              botResponse += `🗺️ Native distribution: ${tree.distribution}\n`;
            }
            
            botResponse += '\n';
          });
          
          botResponse += `You can view these trees and more on our interactive map! Would you like more detailed information about any specific tree species?`;
        }
      }
      
      // Save conversation to history with user ID if available
      await query(
        `INSERT INTO chatbot_history (user_id, session_id, user_message, bot_response) 
         VALUES (?, ?, ?, ?)`,
        [userId, sessionId, message, botResponse]
      );
      
      // Create response with cookie and user info
      const response = NextResponse.json({ 
        response: botResponse,
        sessionId,
        user: userName ? { name: userName } : null
      });
      
      // Set session cookie if it doesn't exist
      if (!cookieStore.get('chatbot_session_id')) {
        if (sessionId) {
          response.cookies.set('chatbot_session_id', sessionId, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/'
          });
        }
      }
      
      return response;
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        response: "I'm having trouble connecting to the database. Please try again later.",
        sessionId,
        user: userName ? { name: userName } : null
      });
    }
  } catch (error) {
    console.error('Error processing chatbot request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
