// Knowledge base for the Green Map chatbot
// This contains common questions and answers about trees, the Green Map project, and more

export interface KnowledgeEntry {
  keywords: string[];
  questions: string[];
  answer: string;
}

export const knowledgeBase: KnowledgeEntry[] = [
  // General project information
  {
    keywords: ['about', 'project', 'green map', 'what is', 'purpose'],
    questions: [
      'What is Green Map?',
      'Tell me about this project',
      'What is the purpose of Green Map?',
      'How does Green Map work?'
    ],
    answer: 'Green Map is an interactive platform that maps and catalogs tree species in urban and rural environments. Our mission is to promote environmental awareness, education, and conservation by making information about local trees easily accessible to everyone. Users can explore the map, learn about different tree species, and contribute to our database by identifying and submitting information about trees in their area.'
  },
  // Tree count and statistics
  {
    keywords: ['how many', 'count', 'number', 'trees', 'total'],
    questions: [
      'How many trees are there?',
      'What is the total number of trees?',
      'How many trees do you have in your database?',
      'Tree count'
    ],
    answer: 'Our database currently contains over 500 identified trees across multiple locations. The number grows regularly as more contributors help identify and document trees. You can explore all the trees on our interactive map or browse through the tree catalogue to see the complete collection.'
  },
  // Tree species information
  {
    keywords: ['species', 'types', 'kinds', 'varieties', 'different'],
    questions: [
      'What types of trees are in the database?',
      'How many species of trees do you have?',
      'What kind of trees can I find?',
      'Tell me about tree species'
    ],
    answer: 'Green Map includes a diverse range of tree species, including native and non-native varieties. Some of the most common species in our database include Oak, Maple, Pine, Palm, Ginkgo, and various fruit trees. Each species has detailed information including scientific name, family, distribution, and general information about its characteristics and ecological importance.'
  },
  // Environmental benefits
  {
    keywords: ['benefits', 'environment', 'environmental', 'importance', 'why', 'matter'],
    questions: [
      'Why are trees important?',
      'What are the benefits of trees?',
      'How do trees help the environment?',
      'Why should we care about trees?'
    ],
    answer: 'Trees provide numerous environmental benefits: they absorb carbon dioxide and release oxygen, improving air quality; they reduce urban heat through shade and evapotranspiration; they prevent soil erosion and reduce flooding; they provide habitat for wildlife; and they contribute to mental wellbeing and community aesthetics. A single mature tree can absorb around 48 pounds of carbon dioxide per year and provide enough oxygen for two people.'
  },
  // Conservation and protection
  {
    keywords: ['conservation', 'protect', 'save', 'endangered', 'threats'],
    questions: [
      'How can we protect trees?',
      'Are there endangered tree species?',
      'What threats do trees face?',
      'How does Green Map help conservation?'
    ],
    answer: 'Many tree species face threats from urban development, climate change, pests, and diseases. Green Map contributes to conservation efforts by raising awareness about local tree diversity, identifying rare or endangered species, and educating the public about the importance of tree preservation. You can help by participating in local tree planting initiatives, reporting noteworthy trees in your area, and supporting policies that protect urban and forest trees.'
  },
  // Tree identification
  {
    keywords: ['identify', 'recognition', 'how to', 'tell', 'difference'],
    questions: [
      'How can I identify a tree?',
      'What features help identify trees?',
      'How do I know what kind of tree I\'m looking at?',
      'Tips for tree identification'
    ],
    answer: 'To identify a tree, look at several key features: leaf shape and arrangement; bark texture and color; overall tree shape; flowers, fruits, or nuts; and location/habitat. Our Green Map provides detailed information about these features for each tree in our database. You can also use the search function to find trees with specific characteristics or use the map to see what trees should be present in your location.'
  },
  // Seasonal changes
  {
    keywords: ['seasons', 'seasonal', 'fall', 'autumn', 'spring', 'winter', 'summer', 'changes'],
    questions: [
      'How do trees change with seasons?',
      'Why do leaves change color?',
      'Which trees keep their leaves in winter?',
      'Seasonal tree changes'
    ],
    answer: 'Trees undergo remarkable seasonal changes. Deciduous trees shed their leaves in fall after displaying vibrant colors as chlorophyll breaks down, revealing other pigments. Evergreen trees retain their leaves/needles year-round. In spring, many trees produce flowers followed by fruit or seed development in summer. These cycles are influenced by temperature, daylight hours, and species-specific genetics. Our database includes information about seasonal changes for different tree species.'
  },
  // Tree age and growth
  {
    keywords: ['age', 'old', 'oldest', 'growth', 'grow', 'tall', 'height', 'size'],
    questions: [
      'How old can trees get?',
      'What is the oldest tree?',
      'How fast do trees grow?',
      'How tall can trees grow?'
    ],
    answer: 'Trees vary greatly in lifespan and growth rates. Some species like the Giant Sequoia can live over 3,000 years, while the oldest known individual tree is a Bristlecone Pine estimated to be over 5,000 years old. Growth rates depend on species, climate, and soil conditions. Some fast-growing species like Hybrid Poplar can grow 5-8 feet per year, while slow-growing oaks might grow less than 1 foot annually. The tallest trees (Coast Redwoods) can reach heights over 350 feet.'
  },
  // Urban trees
  {
    keywords: ['urban', 'city', 'street', 'park', 'towns'],
    questions: [
      'Why are urban trees important?',
      'What trees are good for cities?',
      'Benefits of street trees',
      'Urban tree challenges'
    ],
    answer: 'Urban trees provide crucial benefits including air filtration, temperature reduction (reducing urban heat islands by up to 10°F), stormwater management, energy conservation for nearby buildings, and improved mental health for residents. The best urban trees are typically those tolerant of pollution, restricted root zones, and varied water conditions. Species like Ginkgo, London Plane, and certain oaks are common urban choices. Urban trees face challenges including limited soil volume, pollution, physical damage, and conflicts with infrastructure.'
  },
  // Contributing to Green Map
  {
    keywords: ['contribute', 'add', 'submit', 'help', 'volunteer', 'participate'],
    questions: [
      'How can I contribute to Green Map?',
      'Can I add a tree to the database?',
      'How do I get involved?',
      'Ways to help the project'
    ],
    answer: 'There are several ways to contribute to Green Map: 1) Identify and submit information about trees in your area using our submission form; 2) Verify existing tree information for accuracy; 3) Provide photographs of trees in different seasons; 4) Participate in community mapping events; 5) Share educational content about trees or environmental conservation. We welcome contributions from tree enthusiasts, botanists, environmental scientists, and anyone passionate about trees!'
  },
  // Tree planting and care
  {
    keywords: ['plant', 'care', 'maintain', 'water', 'prune', 'fertilize', 'grow'],
    questions: [
      'How do I plant a tree?',
      'Tree care tips',
      'When is the best time to plant trees?',
      'How to care for young trees'
    ],
    answer: 'The best time to plant trees is typically in fall or early spring when temperatures are moderate. When planting, dig a hole 2-3 times wider than the root ball but at the same depth. Water deeply and regularly, especially during the first two years. Mulch around the base (keeping mulch away from the trunk) to retain moisture and suppress weeds. Young trees benefit from proper pruning to establish good structure, but avoid removing more than 25% of living branches in a single year. Different species have specific needs, so research your particular tree\'s requirements.'
  },
  // Tree diseases and pests
  {
    keywords: ['disease', 'pest', 'insect', 'problem', 'dying', 'sick', 'health'],
    questions: [
      'Common tree diseases',
      'How to identify tree pests',
      'What\'s wrong with my tree?',
      'Signs of an unhealthy tree'
    ],
    answer: 'Common signs of tree health problems include unusual leaf discoloration, premature leaf drop, cankers or oozing on bark, fungal growth, wilting, and dieback of branches. Major tree diseases include Dutch Elm Disease, Oak Wilt, and Sudden Oak Death. Common pests include Emerald Ash Borer, Gypsy Moth, and various beetles. If you notice concerning symptoms, consult with a certified arborist for diagnosis and treatment options. Early intervention often leads to better outcomes for affected trees.'
  },
  // Famous or notable trees
  {
    keywords: ['famous', 'notable', 'historic', 'biggest', 'oldest', 'special', 'unique'],
    questions: [
      'What are some famous trees?',
      'Are there any historic trees in the database?',
      'Tell me about remarkable trees',
      'Most impressive trees'
    ],
    answer: 'Our database includes information about several notable trees, including heritage trees with historical significance and champion trees that represent the largest of their species. Some famous trees around the world include General Sherman (the largest tree by volume), Methuselah (one of the oldest trees), and the Major Oak in Sherwood Forest (associated with Robin Hood legends). Local notable trees are marked with special indicators on our map, allowing users to discover trees with unique histories or characteristics in their area.'
  },
  // Native vs. non-native trees
  {
    keywords: ['native', 'non-native', 'invasive', 'exotic', 'indigenous', 'local'],
    questions: [
      'What are native trees?',
      'Difference between native and non-native trees',
      'Are invasive trees bad?',
      'Why plant native trees?'
    ],
    answer: 'Native trees are species that have evolved in a specific region over thousands of years, forming complex relationships with local wildlife, insects, and microorganisms. They typically require less maintenance and water once established. Non-native trees were introduced from other regions, either intentionally or accidentally. While many non-native trees are beneficial and well-adapted, some become invasive by outcompeting native vegetation. Our Green Map identifies whether trees are native or introduced to help inform conservation and landscaping decisions.'
  },
  // Climate change and trees
  {
    keywords: ['climate', 'change', 'global warming', 'carbon', 'sequestration', 'future'],
    questions: [
      'How do trees help with climate change?',
      'Carbon sequestration by trees',
      'Impact of climate change on trees',
      'Which trees are best for fighting climate change?'
    ],
    answer: 'Trees play a crucial role in mitigating climate change by sequestering carbon dioxide from the atmosphere. A mature tree can absorb approximately 48 pounds of CO2 per year. However, trees themselves are affected by changing climate conditions, with some species facing stress from altered precipitation patterns, temperature changes, and increased pest pressures. Fast-growing, long-lived species generally sequester more carbon. Our Green Map provides information about climate adaptability for different tree species to help guide future planting decisions in a changing climate.'
  },
  // Medicinal and edible trees
  {
    keywords: ['medicine', 'medicinal', 'edible', 'food', 'fruit', 'nut', 'uses'],
    questions: [
      'Which trees have medicinal properties?',
      'Edible trees and their fruits',
      'Trees with edible parts',
      'Traditional tree uses'
    ],
    answer: 'Many trees provide edible fruits, nuts, or have medicinal properties. Familiar examples include apple, cherry, walnut, and almond trees. Less known examples include the Ginkgo tree (leaves used in memory supplements), Willow (bark contains compounds similar to aspirin), and Neem (with various medicinal applications). Our database identifies edible and medicinal properties where applicable, though we recommend consulting expert sources before consuming any tree products, as some may require specific preparation or could interact with medications.'
  },
  // Specific Tree Information - Oak Trees
  {
    keywords: ['oak', 'acorn', 'quercus'],
    questions: [
      'Tell me about oak trees',
      'Information about oak trees',
      'Oak tree characteristics',
      'Oak tree species'
    ],
    answer: 'Oak trees (genus Quercus) are among the most recognizable and ecologically important trees in the world. There are over 500 species of oaks, ranging from massive shade trees to smaller shrubs. Notable characteristics include their distinctive lobed leaves (though some species have unlobed leaves), production of acorns, and typically strong, durable wood. Oaks can live for centuries, with some specimens known to be over 1,000 years old. They provide crucial habitat for wildlife, with a single oak supporting hundreds of insect species, birds, and mammals. Oaks are valued for their wood in furniture and barrel making, particularly for aging wines and spirits.'
  },
  // Specific Tree Information - Pine Trees
  {
    keywords: ['pine', 'conifer', 'evergreen', 'needle', 'pinus'],
    questions: [
      'Tell me about pine trees',
      'Information about pine trees',
      'Pine tree characteristics',
      'Pine tree species'
    ],
    answer: 'Pine trees (genus Pinus) are coniferous evergreens characterized by their needle-like leaves that grow in clusters (fascicles) and their distinctive seed-bearing cones. There are about 120 species worldwide, adapted to various climates and conditions. Pines are among the most commercially important tree groups, valued for timber, pulp, nuts, and resin products like turpentine. Many species have cultural significance, such as the Japanese red pine in Asian art. Pine forests create distinctive ecosystems with acidic soil from needle drop, and many species are fire-adapted with cones that only release seeds after exposure to heat. Their needles are rich in vitamin C and have been used traditionally to make tea.'
  },
  // Specific Tree Information - Maple Trees
  {
    keywords: ['maple', 'acer', 'syrup', 'sugar'],
    questions: [
      'Tell me about maple trees',
      'Information about maple trees',
      'Maple tree characteristics',
      'Maple tree species'
    ],
    answer: 'Maple trees (genus Acer) are beloved for their distinctive lobed leaves, vibrant fall colors, and in some species, sweet sap used to make maple syrup. There are approximately 128 species worldwide, with the Sugar Maple (Acer saccharum) being famous for syrup production. It takes about 40 gallons of maple sap to make just one gallon of maple syrup! Maples are also prized as ornamental trees in landscaping and as valuable hardwoods in furniture making. The distinctive winged seed pods of maples (called samaras or "helicopters") spin as they fall, helping them disperse by wind. Japanese Maples are particularly valued in garden design for their delicate, intricate leaf shapes and spectacular colors.'
  },
  // Specific Tree Information - Birch Trees
  {
    keywords: ['birch', 'betula', 'paper', 'white'],
    questions: [
      'Tell me about birch trees',
      'Information about birch trees',
      'Birch tree characteristics',
      'Birch tree species'
    ],
    answer: 'Birch trees (genus Betula) are immediately recognizable by their distinctive white, paper-like bark that peels in thin, horizontal strips on many species. These elegant trees are native to northern temperate regions and are among the first trees to colonize an area after a disturbance (they\'re known as "pioneer species"). Birches are relatively short-lived (typically 40-50 years), but grow quickly. Throughout history, birch bark has been used by indigenous peoples for canoes, containers, and writing material. Birch sap can be tapped similar to maple trees and is used to make birch syrup and even birch wine in some cultures. The trees are also known for their fine-grained wood used in furniture and plywood manufacturing.'
  },
  // Specific Tree Information - Palm Trees
  {
    keywords: ['palm', 'coconut', 'tropical', 'arecaceae'],
    questions: [
      'Tell me about palm trees',
      'Information about palm trees',
      'Palm tree characteristics',
      'Palm tree species'
    ],
    answer: 'Palm trees (family Arecaceae) are iconic symbols of tropical and subtropical regions, though they grow in a wide range of habitats from deserts to rainforests. Unlike typical trees, palms don\'t have branches; instead they have a crown of large evergreen leaves (fronds) at the top of an unbranched stem. There are over 2,600 species of palms, ranging from tiny understory plants to the imposing Royal Palm that can reach heights of 70 feet or more. The coconut palm is considered one of the most useful plants in the world, providing food, drink, oil, medicine, fiber, wood, and thatch. Date palms have sustained human populations in arid regions for thousands of years with their nutritious fruits.'
  },
  // Seasonal Behavior - Fall Foliage
  {
    keywords: ['fall', 'autumn', 'color', 'foliage', 'leaves', 'red', 'orange', 'yellow'],
    questions: [
      'Why do leaves change color in fall?',
      'Best trees for fall color',
      'Fall foliage information',
      'Autumn leaf colors explained'
    ],
    answer: 'The spectacular color show of autumn happens as trees prepare for winter dormancy. During growing seasons, leaves appear green due to chlorophyll, which masks other pigments present in the leaves. As days shorten and temperatures cool, trees stop producing chlorophyll, revealing hidden pigments: carotenoids (yellow and orange) and anthocyanins (reds and purples). Trees with the most vivid fall displays include Sugar Maple (bright orange-red), Red Maple (brilliant red), Sweetgum (purple, red, yellow), Aspen (golden yellow), and Japanese Maple (crimson red). Weather conditions affect color intensity - the best displays typically follow warm, sunny days and cool nights without freezing temperatures, combined with adequate but not excessive rainfall.'
  },
  // Regional Trees - Trees by Climate Zone
  {
    keywords: ['zone', 'region', 'hardiness', 'climate', 'local', 'grow'],
    questions: [
      'What trees grow in my area?',
      'Trees for different climate zones',
      'Best trees for my region',
      'Local native trees'
    ],
    answer: 'The suitability of trees for your area depends on your climate zone (hardiness zone), soil conditions, and local environmental factors. Cold northern regions (zones 2-4) support trees like Paper Birch, Balsam Fir, and Tamarack. Mid-temperature regions (zones 5-7) can grow a wide variety including Red Maple, many Oaks, and Eastern Redbud. Warmer southern areas (zones 8-10) support trees like Live Oak, Southern Magnolia, and Crape Myrtle. Arid regions need drought-tolerant species like Mesquite and Desert Willow, while coastal areas need salt-tolerant trees. Native trees are usually the best adapted to your local conditions and provide the most ecological benefits. Our Green Map can help identify trees native to your specific region.'
  },
  // Urban Tree Selection
  {
    keywords: ['city', 'urban', 'street', 'sidewalk', 'pavement', 'small', 'space'],
    questions: [
      'Best trees for urban environments',
      'Trees for small spaces',
      'Street tree recommendations',
      'Trees that don\'t damage sidewalks'
    ],
    answer: 'Urban environments present unique challenges for trees, including limited soil volume, compacted soils, air pollution, heat stress, and conflict with infrastructure. Trees well-suited for urban settings include: Ginkgo (pollution tolerant with contained root systems), Thornless Honeylocust (tolerates poor soil and casts light shade), Japanese Tree Lilac (small flowering tree for under utility lines), Kentucky Coffeetree (adaptable to urban conditions with few pest problems), and certain oak cultivars bred for urban tolerance. For tight spaces, consider columnar varieties like Fastigiate European Hornbeam or Armstrong Red Maple. Trees with invasive roots to avoid near pavement include Silver Maple, American Elm, and willows. Many cities now use structural soil systems and permeable pavements to give urban trees better growing conditions.'
  },
  // Tree Photography and Observation
  {
    keywords: ['photo', 'picture', 'photograph', 'observe', 'document', 'record'],
    questions: [
      'Tips for photographing trees',
      'Best ways to document trees',
      'How to observe trees',
      'Tree photography advice'
    ],
    answer: 'Documenting trees through photography and observation enriches your connection with nature and can contribute valuable data to citizen science projects like Green Map. For effective tree photography: 1) Capture the whole tree to show its shape and size, using a person or object for scale; 2) Take close-ups of distinctive features - bark patterns, leaf arrangements, flowers, and fruits; 3) Photograph in different lighting conditions (early morning and late afternoon light often highlights texture best); 4) Return throughout seasons to document changes; 5) Use a polarizing filter to reduce glare on shiny leaves. When observing trees, note seasonal timing of budbreak, flowering, fruiting, and leaf color change. Recording these phenological events can help track climate change impacts on tree life cycles.'
  },
  // Specific Tree Information - Mango Trees
  {
    keywords: ['mango', 'mangifera', 'indica', 'fruit', 'tropical'],
    questions: [
      'Tell me about mango trees',
      'Information about mango trees',
      'Mango tree characteristics',
      'Where do mango trees grow'
    ],
    answer: 'Mango trees (Mangifera indica) are evergreen tropical fruit trees native to South Asia but now cultivated in many tropical and subtropical regions worldwide. They grow best in USDA zones 9b-11 and require full sun and protection from frost. Mature mango trees can reach 100 feet tall in tropical settings, though cultivated varieties are often kept smaller for easier harvesting. They produce fleshy stone fruits (drupes) that are highly valued for their sweet, juicy flavor. Mango trees require warm temperatures (optimally 70-85°F) and a distinct dry season to trigger flowering. Major mango-producing regions include India, China, Thailand, Indonesia, Mexico, and parts of Central and South America. In the United States, they primarily grow in Florida, California, Hawaii, and Puerto Rico.'
  },
  // Specific Tree Information - Fruit Trees
  {
    keywords: ['fruit', 'fruiting', 'orchard', 'citrus', 'apple', 'pear', 'peach', 'cherry'],
    questions: [
      'Tell me about fruit trees',
      'Best fruit trees to grow',
      'Fruit tree information',
      'How to grow fruit trees',
      'Types of fruit trees'
    ],
    answer: 'Fruit trees include a diverse range of species that produce edible fruits, from familiar temperate species like apple, pear, peach, and cherry to tropical varieties like mango, avocado, and citrus. Each species has specific climate requirements: apples and pears grow well in cooler zones (3-9), stone fruits like peaches and cherries prefer zones 5-9, while citrus needs warm zones (8-11). Most fruit trees require full sun (6+ hours daily), well-draining soil, and regular watering. Many require cross-pollination from compatible varieties to produce fruit. The best fruit trees for a particular location depend on local climate, space availability, and soil conditions. Most fruit trees benefit from regular pruning to maintain shape, improve air circulation, and maximize fruit production.'
  },
  // Tree Location Information
  {
    keywords: ['where', 'location', 'grow', 'found', 'native', 'habitat'],
    questions: [
      'Where do trees grow',
      'Tree habitats and locations',
      'Native ranges of trees',
      'Where to find specific trees'
    ],
    answer: 'Tree species are distributed across the globe based on climate zones, soil types, and evolutionary history. Our Green Map database contains location information for documented trees, showing where specific species have been planted or naturally occur in your area. For information about where to find a specific tree type like oak, maple, or mango, please mention the tree name in your question. I can then provide details about its natural range, preferred growing conditions, and whether it\'s likely to be found in your region. You can also search our interactive map to find documented examples of specific tree species near you.'
  }
];

// Function to find best match for a user query
export function findBestMatch(userQuery: string): KnowledgeEntry | null {
  const query = userQuery.toLowerCase();
  let bestMatch: KnowledgeEntry | null = null;
  let highestScore = 0;
  
  // Check for location-specific queries that should be handled by database
  const locationPatterns = [
    /where (?:can|are|is|do) .* (grow|found|located|exist)/i,
    /where (?:can|are|is|do) .* trees/i,
    /where (?:can|are|is|do) .* tree/i,
    /location of .* trees/i,
    /find .* trees/i,
    /looking for .* trees/i
  ];
  
  // Check if this is asking about tree locations - defer to database for these
  for (const pattern of locationPatterns) {
    if (pattern.test(query)) {
      // Return null to let the database handle location-specific queries
      // unless we find a very strong match in keywords
      highestScore = 1; // Set minimum threshold higher for location queries
    }
  }
  
  // Check each knowledge entry
  for (const entry of knowledgeBase) {
    let score = 0;
    
    // Check if query directly matches any known questions
    for (const question of entry.questions) {
      const questionLower = question.toLowerCase();
      if (query.includes(questionLower) || questionLower.includes(query)) {
        return entry; // Direct match, return immediately
      }
      
      // Check for partial matches
      const words = questionLower.split(' ');
      for (const word of words) {
        if (word.length > 3 && query.includes(word)) {
          score += 1;
        }
      }
    }
    
    // Check keywords match
    for (const keyword of entry.keywords) {
      if (query.includes(keyword)) {
        score += 2; // Keywords are weighted more heavily
      }
    }
    
    // Check for specific tree types mentioned
    const queryWords = query.split(' ');
    const treeTypeIncluded = entry.keywords.some(keyword => 
      entry.keywords[0] === queryWords.find(word => word === keyword)
    );
    
    if (treeTypeIncluded) {
      score += 3; // Strongly prefer entries that match exact tree type mentioned
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  }
  
  // Return match only if score is high enough
  return highestScore >= 3 ? bestMatch : null; // Increased threshold for better matching
}
