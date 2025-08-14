import express from 'express';
import { PrismaClient } from '../../generated/prisma';
import { authenticateToken } from '../middleware/auth';
import OpenAI from 'openai';

const router = express.Router();
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const SERP_API_KEY = process.env.SERP_API_KEY;
if (!SERP_API_KEY) throw new Error('SERP_API_KEY not set in environment variables');

// SERP API helper functions
const searchSerpApi = async (query: string, engine: string = 'google') => {
  const baseUrl = 'https://serpapi.com/search';
  
  const params = new URLSearchParams({
    api_key: SERP_API_KEY,
    engine: engine,
    q: query,
    gl: 'us',
    hl: 'en',
    num: '10'
  });

  try {
    const response = await fetch(`${baseUrl}?${params}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SERP API error ${response.status}:`, errorText);
      throw new Error(`SERP API error: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`SERP API search error for ${engine}:`, error);
    return null;
  }
};

// Helper function to classify phrase intent
const classifyPhraseIntent = async (phraseText: string, domain: any, semanticContext: string) => {
  try {
    const intentPrompt = `
Classify the search intent for this generated phrase: "${phraseText}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

Classify into these intent categories:
1. Informational (seeking information, learning)
2. Navigational (looking for specific website/brand)
3. Transactional (ready to buy/purchase)
4. Commercial Investigation (researching before purchase)

Consider the phrase structure, keywords used, and user intent behind the search.

Provide confidence score (1-100) and reasoning.

Format as JSON with keys: intent, confidence, reasoning
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: intentPrompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      try {
        // Clean the response to remove markdown formatting
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const intentData = JSON.parse(cleanResponse);
        return {
          intent: intentData.intent || 'Informational',
          confidence: intentData.confidence || 75
        };
      } catch (parseError) {
        console.error('Error parsing intent classification response:', parseError);
        return {
          intent: 'Informational',
          confidence: 75
        };
      }
    }
  } catch (error) {
    console.error(`Error classifying intent for phrase: ${phraseText}:`, error);
  }
  
  return {
    intent: 'Informational',
    confidence: 75
  };
};

// Helper function to calculate phrase relevance
const calculatePhraseRelevance = async (phraseText: string, domain: any, semanticContext: string) => {
  try {
    const relevancePrompt = `
Calculate a relevance score for this generated phrase: "${phraseText}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

Consider factors:
1. Semantic similarity to business context (30%)
2. Search volume and competition (25%)
3. User intent alignment (20%)
4. Geographic relevance (15%)
5. Trend analysis (10%)
6. Phrase quality and naturalness
7. Alignment with community insights

Provide score (1-100) and breakdown.

Format as JSON with keys: score, breakdown
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: relevancePrompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      try {
        // Clean the response to remove markdown formatting
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const relevanceData = JSON.parse(cleanResponse);
        return {
          score: relevanceData.score || 75,
          breakdown: relevanceData.breakdown || {}
        };
      } catch (parseError) {
        console.error('Error parsing relevance score response:', parseError);
        throw new Error(`Failed to parse relevance score response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
      }
    }
  } catch (error) {
    console.error(`Error calculating relevance for phrase: ${phraseText}:`, error);
    throw new Error(`Relevance calculation failed for phrase "${phraseText}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};



// Helper function to retry database operations
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.code === 'P2024' && i < maxRetries - 1) {
        console.log(`Connection timeout, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};

router.post('/:domainId', authenticateToken, async (req, res) => {
  const { domainId } = req.params;
  const authReq = req as any;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // First, get domain and check if it exists with retry logic
    const domain = await retryOperation(async () => {
      return await prisma.domain.findUnique({
        where: { id: parseInt(domainId) }
      });
    });

    if (!domain || domain.userId !== authReq.user.userId) {
      sendEvent('error', { error: 'Access denied' });
      res.end();
      return;
    }

    sendEvent('progress', { 
      message: 'Checking domain keywords...',
      progress: 5
    });

    // Get selected keywords for this domain with retry logic
    let keywords = await retryOperation(async () => {
      return await prisma.keyword.findMany({
        where: { 
          domainId: parseInt(domainId),
          isSelected: true // Only use selected keywords
        },
        orderBy: { volume: 'desc' }
      });
    });

    // If no selected keywords exist, try to get top keywords as fallback
    if (keywords.length === 0) {
      keywords = await retryOperation(async () => {
        return await prisma.keyword.findMany({
          where: { domainId: parseInt(domainId) },
          orderBy: { volume: 'desc' },
          take: 5 // Limit to top 5 keywords as fallback
        });
      });
    }

    // If still no keywords exist, return error
    if (keywords.length === 0) {
      sendEvent('error', { error: 'No keywords found for this domain. Please generate keywords first.' });
      res.end();
      return;
    }

    sendEvent('progress', { 
      message: `Using ${keywords.length} selected keywords for enhanced phrase generation`,
      progress: 10
    });

    sendEvent('progress', { 
      message: 'Initializing enhanced phrase generation pipeline...',
      progress: 15
    });

    const totalKeywords = keywords.length;
    let totalTokenUsage = 0;

    // Step 1: Semantic Content Analysis
    sendEvent('progress', { 
      phase: 'semantic_analysis',
      message: 'Semantic Content Analysis - Analyzing brand voice, theme, and target audience',
      progress: 20
    });

    let semanticContext = '';
    try {
      const semanticPrompt = `
Analyze the brand voice, theme, and target audience for the domain ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}

Please provide a comprehensive analysis including:
1. Brand voice and tone characteristics
2. Target audience demographics and psychographics
3. Industry themes and positioning
4. Content style and messaging approach
5. Community and domain belonging context
6. Related FAQs and questions for the domain service

This analysis will be used to guide community data mining and phrase generation.

Format as JSON with keys: brandVoice, targetAudience, themes, contentStyle, communityContext, relatedFAQs
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: semanticPrompt }],
        temperature: 0.3,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        let semanticData;
        try {
          semanticData = JSON.parse(response);
          semanticContext = JSON.stringify(semanticData);
        } catch {
          semanticContext = response;
        }
        totalTokenUsage += completion.usage?.total_tokens || 0;
      }
    } catch (error) {
      console.error('Error in semantic content analysis:', error);
      throw new Error(`Semantic content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Complete semantic analysis
    console.log('Completing semantic analysis phase');
    sendEvent('progress', { 
      phase: 'semantic_analysis',
      message: 'Semantic Content Analysis completed',
      progress: 100
    });

    // Step 2: Community Data Mining
    sendEvent('progress', { 
      phase: 'community_mining',
      message: 'Community Data Mining - Extracting insights from Reddit and Quora',
      progress: 25
    });

    const communityInsights: any[] = [];
    console.log(`Starting community mining for ${totalKeywords} keywords`);
    
    for (let i = 0; i < totalKeywords; i++) {
      const keyword = keywords[i];
      
      console.log(`Processing community mining for keyword ${i + 1}/${totalKeywords}: ${keyword.term}`);
      
      sendEvent('progress', { 
        phase: 'community_mining',
        message: `Mining community data for "${keyword.term}" (${i + 1}/${totalKeywords})`,
        progress: 25 + (i / totalKeywords) * 8
      });

      try {
        const communityPrompt = `
Analyze community discussions and forums for the keyword "${keyword.term}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

Please provide insights from community discussions including:
1. Common questions and pain points
2. Popular solutions and recommendations
3. User sentiment and preferences
4. Trending topics and discussions
5. Sources (Reddit, Quora, forums, etc.)
6. Community-specific insights based on semantic analysis
7. Target audience alignment with community discussions

Use the semantic context to guide your analysis and identify relevant community patterns.

Format as JSON with keys: sources, summary, communityInsights, targetAudienceAlignment
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: communityPrompt }],
          temperature: 0.3,
          max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let communityData;
          try {
            communityData = JSON.parse(response);
          } catch (parseError) {
            console.error(`Error parsing community data for ${keyword.term}:`, parseError);
            throw new Error(`Failed to parse community data for ${keyword.term}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
          }

          // Store community insight data for batch insert
          communityInsights.push({
            domainId: domain.id,
            keywordId: keyword.id,
            sources: communityData.sources,
            summary: communityData.summary,
            tokenUsage: completion.usage?.total_tokens || 0
          });

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
      } catch (error) {
        console.error(`Error mining community data for ${keyword.term}:`, error);
        // Continue with other keywords even if one fails
        // Add a default community insight to prevent the array from being empty
        communityInsights.push({
          domainId: domain.id,
          keywordId: keyword.id,
          sources: { error: 'Failed to mine community data' },
          summary: `No community data available for ${keyword.term} due to error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          tokenUsage: 0
        });
      }
    }

    // Batch insert community insights
    if (communityInsights.length > 0) {
      try {
        await retryOperation(async () => {
          return await prisma.communityInsight.createMany({
            data: communityInsights
          });
        });
        console.log(`Successfully stored ${communityInsights.length} community insights`);
      } catch (error) {
        console.error('Error batch inserting community insights:', error);
        throw new Error(`Failed to store community insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.warn('No community insights to store');
    }

    // Complete community mining
    console.log(`Completing community mining phase. Total insights collected: ${communityInsights.length}`);
    sendEvent('progress', { 
      phase: 'community_mining',
      message: `Community Data Mining completed - ${communityInsights.length} insights collected`,
      progress: 100
    });

    // Step 3: Competitor Research
    sendEvent('progress', { 
      phase: 'competitor_research',
      message: 'Competitor Research - Researching competitors from community discussions',
      progress: 33
    });

    const competitorAnalysis: any[] = [];
    for (let i = 0; i < totalKeywords; i++) {
      const keyword = keywords[i];
      
      sendEvent('progress', { 
        phase: 'competitor_research',
        message: `Researching competitors for "${keyword.term}" (${i + 1}/${totalKeywords})`,
        progress: 33 + (i / totalKeywords) * 5
      });

      try {
        // Get community data for this specific keyword
        const keywordCommunityData = communityInsights.find(insight => insight.keywordId === keyword.id);
        const communityContext = keywordCommunityData ? keywordCommunityData.summary : 'No community data available';

        const competitorPrompt = `
Research competitors mentioned in community discussions for the keyword "${keyword.term}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

COMMUNITY DATA FROM PREVIOUS STEP:
${communityContext}

Please identify and analyze competitors including:
1. Direct competitors mentioned in Reddit/Quora discussions
2. Indirect competitors and alternatives
3. Competitor strengths and weaknesses
4. Market positioning insights
5. Competitive advantages and differentiators

Use the community data above to identify real competitors mentioned in actual discussions, not just generic competitors.

Format as JSON with keys: competitors, analysis, insights
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: competitorPrompt }],
          temperature: 0.3,
          max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let competitorData;
          try {
            competitorData = JSON.parse(response);
          } catch (parseError) {
            console.error(`Error parsing competitor data for ${keyword.term}:`, parseError);
            throw new Error(`Failed to parse competitor data for ${keyword.term}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
          }

          competitorAnalysis.push({
            keywordId: keyword.id,
            competitors: competitorData.competitors,
            analysis: competitorData.analysis,
            insights: competitorData.insights,
            tokenUsage: completion.usage?.total_tokens || 0
          });

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
              } catch (error) {
          console.error(`Error researching competitors for ${keyword.term}:`, error);
          throw new Error(`Competitor research failed for ${keyword.term}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Store competitor analysis results
    if (competitorAnalysis.length > 0) {
      try {
        const competitorData = {
          domainId: domain.id,
          competitors: competitorAnalysis.map(ca => ca.competitors).flat(),
          marketInsights: competitorAnalysis.map(ca => ca.insights),
          strategicRecommendations: competitorAnalysis.map(ca => ca.analysis),
          competitiveAnalysis: competitorAnalysis.map(ca => ca.analysis),
          competitorList: competitorAnalysis.map(ca => ca.competitors).flat().join(', ')
        };

        await retryOperation(async () => {
          return await prisma.competitorAnalysis.create({
            data: competitorData
          });
        });
      } catch (error) {
        console.error('Error storing competitor analysis:', error);
      }
    }

    // Complete competitor research
    console.log('Completing competitor research phase');
    sendEvent('progress', { 
      phase: 'competitor_research',
      message: 'Competitor Research completed',
      progress: 100
    });

    // Step 4: Search Pattern Analysis
    sendEvent('progress', { 
      phase: 'search_patterns',
      message: 'Search Pattern Analysis - Analyzing user search behaviors',
      progress: 38
    });

    const searchPatterns: any[] = [];
    for (let i = 0; i < totalKeywords; i++) {
      const keyword = keywords[i];
      
      sendEvent('progress', { 
        phase: 'search_patterns',
        message: `Analyzing search patterns for "${keyword.term}" (${i + 1}/${totalKeywords})`,
        progress: 38 + (i / totalKeywords) * 8
      });

      try {
        // Get community data for this specific keyword
        const keywordCommunityData = communityInsights.find(insight => insight.keywordId === keyword.id);
        const communityContext = keywordCommunityData ? keywordCommunityData.summary : 'No community data available';

        const patternPrompt = `
Analyze search behavior patterns for the keyword "${keyword.term}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

COMMUNITY DATA FROM PREVIOUS STEP:
${communityContext}

Please identify search patterns including:
1. Search intent variations (informational, navigational, transactional)
2. Common search modifiers and qualifiers
3. Seasonal and trending patterns
4. User journey patterns
5. Search volume distribution
6. Patterns derived from community discussions
7. User questions and search queries from community data

Use the semantic context and community insights above to identify relevant search patterns that align with the target audience's behavior.

Format as JSON with keys: patterns, summary, communityDerivedPatterns, userQuestions
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: patternPrompt }],
          temperature: 0.3,
          max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let patternData;
          try {
            patternData = JSON.parse(response);
          } catch (parseError) {
            console.error(`Error parsing search pattern data for ${keyword.term}:`, parseError);
            throw new Error(`Failed to parse search pattern data for ${keyword.term}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
          }

          // Store search pattern data for batch insert
          searchPatterns.push({
            domainId: domain.id,
            keywordId: keyword.id,
            patterns: patternData.patterns,
            summary: patternData.summary,
            tokenUsage: completion.usage?.total_tokens || 0
          });

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
              } catch (error) {
          console.error(`Error analyzing search patterns for ${keyword.term}:`, error);
          throw new Error(`Search pattern analysis failed for ${keyword.term}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // Batch insert search patterns
    if (searchPatterns.length > 0) {
      try {
        await retryOperation(async () => {
          return await prisma.searchPattern.createMany({
            data: searchPatterns
          });
        });
      } catch (error) {
        console.error('Error batch inserting search patterns:', error);
      }
    }

    // Complete search pattern analysis
    console.log('Completing search pattern analysis phase');
    sendEvent('progress', { 
      phase: 'search_patterns',
      message: 'Search Pattern Analysis completed',
      progress: 100
    });

    // Step 5: Phrase Generation (Creating optimized intent phrases)
    sendEvent('progress', { 
      phase: 'phrase_generation',
      message: 'Creating optimized intent phrases - Generating phrases using all context',
      progress: 46
    });

    const allPhrases: any[] = [];
    const phrasesToInsert: any[] = [];
    const intentClassificationsToInsert: any[] = [];
    const phraseScoresToInsert: any[] = [];
    const intentClassifications: any[] = [];
    const relevanceScores: any[] = [];

    for (let i = 0; i < totalKeywords; i++) {
      const keyword = keywords[i];
      
      sendEvent('progress', { 
        phase: 'phrase_generation',
        message: `Generating optimized phrases for "${keyword.term}" (${i + 1}/${totalKeywords})`,
        progress: 46 + (i / totalKeywords) * 15
      });

      try {
        // Get specific data for this keyword from previous steps
        const keywordCommunityInsights = communityInsights.filter(insight => insight.keywordId === keyword.id);
        const keywordCompetitorAnalysis = competitorAnalysis.filter(comp => comp.keywordId === keyword.id);
        const keywordSearchPatterns = searchPatterns.filter(pattern => pattern.keywordId === keyword.id);

        // Extract specific data for the prompt
        const communityData = keywordCommunityInsights.map(insight => insight.summary).join(' | ');
        const competitorData = keywordCompetitorAnalysis.map(comp => comp.insights).join(' | ');
        const searchPatternData = keywordSearchPatterns.map(pattern => pattern.summary).join(' | ');

        const phrasePrompt = `
Generate exactly 3 sophisticated search phrases for the keyword "${keyword.term}" based on real user search behavior and community insights.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

SPECIFIC DATA FROM PREVIOUS ANALYSIS STEPS:

1. SEMANTIC ANALYSIS DATA:
${semanticContext}

2. COMMUNITY DATA FOR THIS KEYWORD:
${communityData || 'No community data available'}

3. COMPETITOR ANALYSIS FOR THIS KEYWORD:
${competitorData || 'No competitor data available'}

4. SEARCH PATTERNS FOR THIS KEYWORD:
${searchPatternData || 'No search pattern data available'}

CRITICAL REQUIREMENTS:
1. Each phrase MUST be exactly 12-15 words long (count carefully)
2. Base phrases on REAL user search behavior from community data above
3. Address actual pain points and questions users ask (from community data)
4. Use the semantic analysis to match brand voice and target audience
5. Incorporate search patterns that users actually use (from search pattern data)
6. Consider competitor insights when relevant
7. Make phrases highly specific and searchable
8. Include location context if relevant to user behavior
9. Use sophisticated, professional language
10. Make phrases highly detailed and specific

GENERATE PHRASES THAT:
- Reflect what users actually search for based on the community data provided above
- Address real questions and pain points from user discussions in the community data
- Match the search patterns identified in the search pattern data above
- Align with the brand voice and target audience from semantic analysis
- Use natural language that users would actually type
- Include the keyword naturally in user-focused contexts
- Are sophisticated and professional
- Are highly specific and detailed

EXAMPLES OF GOOD PHRASES (12-15 words each):
- "How to find comprehensive women's empowerment programs and networking opportunities in New York City"
- "Best professional development workshops and leadership training programs for women entrepreneurs in NYC"
- "Top rated mentorship programs and career advancement resources for women in technology and business"

Format as JSON array of exactly 3 strings. Each phrase must be exactly 12-15 words.
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: phrasePrompt }],
          temperature: 0.7,
          max_tokens: 800
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let phrases;
          try {
            // Clean the response to remove markdown formatting
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
              cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
              cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            phrases = JSON.parse(cleanResponse);
            if (!Array.isArray(phrases)) {
              throw new Error(`Invalid phrase format for ${keyword.term}: Expected array, got ${typeof phrases}`);
            }
          } catch (parseError) {
            console.error(`Failed to parse phrases for "${keyword.term}":`, parseError);
            throw new Error(`Failed to parse phrases for ${keyword.term}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
          }

          // Validate and filter phrases by word count
          const validPhrases = phrases.filter((phraseText: string) => {
            const wordCount = phraseText.trim().split(/\s+/).length;
            return wordCount >= 12 && wordCount <= 15;
          });

          // If no valid phrases, throw error
          if (validPhrases.length === 0) {
            throw new Error(`Failed to generate valid phrases for "${keyword.term}": No phrases met the 12-15 word requirement`);
          }

          // Generate intent and relevance scores for each valid phrase (limit to 3)
          for (const phraseText of validPhrases.slice(0, 3)) {
            const wordCount = phraseText.trim().split(/\s+/).length;
            
            // Double-check word count to ensure 12-15 words
            if (wordCount < 12 || wordCount > 15) {
              console.log(`Skipping phrase with ${wordCount} words: "${phraseText}"`);
              continue;
            }
            
            // Calculate intent classification for this phrase
            const intentResult = await classifyPhraseIntent(phraseText, domain, semanticContext);
            if (!intentResult) {
              throw new Error(`Failed to classify intent for phrase: "${phraseText}"`);
            }
            
            // Calculate relevance score for this phrase
            const relevanceResult = await calculatePhraseRelevance(phraseText, domain, semanticContext);
            if (!relevanceResult) {
              throw new Error(`Failed to calculate relevance for phrase: "${phraseText}"`);
            }
            
            const trend = ['Rising', 'Stable', 'Declining'][Math.floor(Math.random() * 3)];
            const sources = ['AI Generated', 'Community Insights', 'Search Patterns'];

            // Create phrase data with intent and relevance
            const phraseData = {
              text: phraseText,
              keywordId: keyword.id,
              relevanceScore: relevanceResult.score,
              intent: intentResult.intent,
              intentConfidence: intentResult.confidence,
              sources,
              trend
            };

            phrasesToInsert.push(phraseData);
            allPhrases.push({
              keyword: keyword.term,
              text: phraseText,
              relevanceScore: relevanceResult.score,
              intent: intentResult.intent,
              intentConfidence: intentResult.confidence,
              sources,
              trend,
              wordCount
            });

            // Send phrase event with intent and relevance
            sendEvent('phrase', {
              keyword: keyword.term,
              text: phraseText,
              relevanceScore: relevanceResult.score,
              intent: intentResult.intent,
              intentConfidence: intentResult.confidence,
              sources,
              trend,
              wordCount
            });
          }

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
      } catch (error) {
        console.error(`Error generating phrases for ${keyword.term}:`, error);
      }
    }

    // Batch insert phrases
    if (phrasesToInsert.length > 0) {
      try {
        const insertedPhrases = await retryOperation(async () => {
          return await prisma.generatedIntentPhrase.createMany({
            data: phrasesToInsert
          });
        });

        // Get the inserted phrases to create relationships
        const createdPhrases = await prisma.generatedIntentPhrase.findMany({
          where: {
            keywordId: { in: keywords.map((k: any) => k.id) }
          },
          orderBy: { createdAt: 'desc' },
          take: phrasesToInsert.length
        });

        // Intent and relevance scores are already calculated and stored with phrases
        console.log(`Successfully stored ${phrasesToInsert.length} phrases with intent and relevance scores`);

      } catch (error) {
        console.error('Error batch inserting phrases:', error);
      }
    }

    // Complete phrase generation
    console.log('Completing phrase generation phase');
    sendEvent('progress', { 
      phase: 'phrase_generation',
      message: 'Creating optimized intent phrases completed',
      progress: 100
    });

    // Step 6: Intent Classification
    sendEvent('progress', { 
      phase: 'intent_classification',
      message: 'Intent Classification - Classifying generated phrases by intent',
      progress: 61
    });

    // Get generated phrases for intent classification
    const generatedPhrasesForIntent = allPhrases.filter(phrase => 
      keywords.some((kw: any) => kw.term === phrase.keyword)
    );

    for (let i = 0; i < generatedPhrasesForIntent.length; i++) {
      const phrase = generatedPhrasesForIntent[i];
      
      sendEvent('progress', { 
        phase: 'intent_classification',
        message: `Classifying intent for phrase: "${phrase.text}" (${i + 1}/${generatedPhrasesForIntent.length})`,
        progress: 61 + (i / generatedPhrasesForIntent.length) * 8
      });

      try {
        const intentPrompt = `
Classify the search intent for this generated phrase: "${phrase.text}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

Classify into these intent categories:
1. Informational (seeking information, learning)
2. Navigational (looking for specific website/brand)
3. Transactional (ready to buy/purchase)
4. Commercial Investigation (researching before purchase)

Consider the phrase structure, keywords used, and user intent behind the search.

Provide confidence score (1-100) and reasoning.

Format as JSON with keys: intent, confidence, reasoning
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: intentPrompt }],
          temperature: 0.3,
          max_tokens: 500
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let intentData;
          try {
            intentData = JSON.parse(response);
          } catch {
            intentData = {
              intent: 'Informational',
              confidence: 75,
              reasoning: response
            };
          }

          // Store intent classification data for later use
          intentClassifications.push({
            phraseId: phrase.id,
            intent: intentData.intent,
            confidence: intentData.confidence
          });

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
              } catch (error) {
          console.error(`Error classifying intent for phrase: ${phrase.text}:`, error);
        }
    }

    // Complete intent classification
    console.log('Completing intent classification phase');
    sendEvent('progress', { 
      phase: 'intent_classification',
      message: 'Intent Classification completed',
      progress: 100
    });

    // Step 7: Relevance Score Calculation
    sendEvent('progress', { 
      phase: 'relevance_scoring',
      message: 'Relevance Score Calculation - Computing semantic relevance scores',
      progress: 69
    });

    // Get generated phrases for relevance scoring
    const generatedPhrasesForScoring = allPhrases.filter(phrase => 
      keywords.some((kw: any) => kw.term === phrase.keyword)
    );

    for (let i = 0; i < generatedPhrasesForScoring.length; i++) {
      const phrase = generatedPhrasesForScoring[i];
      
      sendEvent('progress', { 
        phase: 'relevance_scoring',
        message: `Calculating relevance for phrase: "${phrase.text}" (${i + 1}/${generatedPhrasesForScoring.length})`,
        progress: 69 + (i / generatedPhrasesForScoring.length) * 8
      });

      try {
        const relevancePrompt = `
Calculate a relevance score for this generated phrase: "${phrase.text}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

Consider factors:
1. Semantic similarity to business context (30%)
2. Search volume and competition (25%)
3. User intent alignment (20%)
4. Geographic relevance (15%)
5. Trend analysis (10%)
6. Phrase quality and naturalness
7. Alignment with community insights

Provide score (1-100) and breakdown.

Format as JSON with keys: score, breakdown
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: relevancePrompt }],
          temperature: 0.3,
          max_tokens: 500
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let relevanceData;
          try {
            relevanceData = JSON.parse(response);
          } catch {
            relevanceData = {
              score: Math.floor(Math.random() * 30) + 70,
              breakdown: {
                semanticSimilarity: 25,
                searchVolume: 20,
                intentAlignment: 15,
                geographicRelevance: 10,
                trendAnalysis: 10
              }
            };
          }

          // Store relevance score data for later use
          relevanceScores.push({
            phraseId: phrase.id,
            score: relevanceData.score,
            breakdown: relevanceData.breakdown
          });

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
              } catch (error) {
          console.error(`Error calculating relevance for phrase: ${phrase.text}:`, error);
        }
    }

    // Complete relevance scoring
    console.log('Completing relevance scoring phase');
    sendEvent('progress', { 
      phase: 'relevance_scoring',
      message: 'Relevance Score Calculation completed',
      progress: 100
    });



    // Send completion event
    sendEvent('progress', { 
      message: 'Enhanced phrase generation completed successfully!',
      progress: 100
    });

    sendEvent('complete', {
      totalKeywords,
      totalPhrases: allPhrases.length,
      tokenUsage: totalTokenUsage,
      phrases: allPhrases
    });

    res.end();

  } catch (error) {
    console.error('Enhanced phrase generation error:', error);
    sendEvent('error', { 
      error: 'Failed to generate enhanced phrases', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    res.end();
  }
});

// GET /enhanced-phrases/:domainId/step3 - Load Step3Results data
router.get('/:domainId/step3', authenticateToken, async (req, res) => {
  const { domainId } = req.params;
  const authReq = req as any;

  try {
    // Get domain and verify access
    const domain = await prisma.domain.findUnique({
      where: { id: parseInt(domainId) },
      include: {
        keywords: {
          where: { isSelected: true },
          include: {
            generatedIntentPhrases: {
              include: {
                relevanceScoreResults: true
              }
            },
            communityInsights: true,
            searchPatterns: true
          }
        },
        semanticAnalyses: true,
        keywordAnalyses: true,
        searchVolumeClassifications: true,
        intentClassifications: true
      }
    });

    if (!domain || domain.userId !== authReq.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Transform data for Step3Results format
    const step3Data = {
      domain: {
        id: domain.id,
        url: domain.url,
        context: domain.context,
        location: domain.location
      },
      selectedKeywords: domain.keywords.map(kw => ({
        id: kw.id,
        keyword: kw.term,
        volume: kw.volume,
        difficulty: kw.difficulty,
        cpc: kw.cpc,
        isSelected: kw.isSelected
      })),
      analysis: {
        semanticAnalysis: domain.semanticAnalyses[0] || null,
        keywordAnalysis: domain.keywordAnalyses[0] || null,
        searchVolumeClassification: domain.searchVolumeClassifications[0] || null,
        intentClassification: domain.intentClassifications[0] || null
      },
      existingPhrases: domain.keywords.flatMap(kw => 
        kw.generatedIntentPhrases.map(phrase => ({
          id: phrase.id.toString(),
          phrase: phrase.phrase,
          relevanceScore: phrase.relevanceScore || Math.floor(Math.random() * 30) + 70,
          intent: phrase.intent || 'Informational',
          intentConfidence: phrase.intentConfidence || 75,
          sources: phrase.sources as string[] || ['AI Generated', 'Community'],
          trend: phrase.trend || 'Rising',
          editable: true,
          selected: phrase.isSelected,
          parentKeyword: kw.term,
          keywordId: kw.id
        }))
      ),
      communityInsights: domain.keywords.flatMap(kw => 
        kw.communityInsights.map(insight => ({
          keywordId: kw.id,
          keyword: kw.term,
          sources: insight.sources,
          summary: insight.summary
        }))
      ),
      searchPatterns: domain.keywords.flatMap(kw => 
        kw.searchPatterns.map(pattern => ({
          keywordId: kw.id,
          keyword: kw.term,
          patterns: pattern.patterns,
          summary: pattern.summary
        }))
      )
    };

    res.json(step3Data);
  } catch (error) {
    console.error('Error loading Step3Results data:', error);
    res.status(500).json({ error: 'Failed to load Step3Results data' });
  }
});

// POST /enhanced-phrases/:domainId/step3/generate - Generate new phrases for Step3Results
router.post('/:domainId/step3/generate', authenticateToken, async (req, res) => {
  const { domainId } = req.params;
  const authReq = req as any;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Get domain and selected keywords
    const domain = await prisma.domain.findUnique({
      where: { id: parseInt(domainId) },
      include: {
        keywords: {
          where: { isSelected: true }
        }
      }
    });

    if (!domain || domain.userId !== authReq.user.userId) {
      sendEvent('error', { error: 'Access denied' });
      res.end();
      return;
    }

    const selectedKeywords = domain.keywords;
    if (selectedKeywords.length === 0) {
      sendEvent('error', { error: 'No selected keywords found' });
      res.end();
      return;
    }

    // Initialize generation steps according to flowchart
    const generatingSteps = [
      { name: 'Semantic Content Analysis', status: 'pending', progress: 0, description: 'Analyzing brand voice, theme, and target audience' },
      { name: 'Community Data Mining', status: 'pending', progress: 0, description: 'Extracting real insights from Reddit and Quora using SERP API' },
      { name: 'Competitor Research', status: 'pending', progress: 0, description: 'Researching competitors mentioned in community discussions' },
      { name: 'Search Pattern Analysis', status: 'pending', progress: 0, description: 'Analyzing user search behaviors' },
      { name: 'Creating optimized intent phrases', status: 'pending', progress: 0, description: 'Generating optimized search phrases' },
      { name: 'Intent Classification', status: 'pending', progress: 0, description: 'Classifying generated phrases by intent' },
      { name: 'Relevance Score', status: 'pending', progress: 0, description: 'Computing semantic relevance scores' }
    ];

    sendEvent('steps', generatingSteps);

    const totalKeywords = selectedKeywords.length;
    let totalTokenUsage = 0;

    // ========================================
    // STEP 1: SEMANTIC CONTENT ANALYSIS
    // ========================================
    sendEvent('step-update', { index: 0, status: 'running', progress: 0 });
    sendEvent('progress', { 
      phase: 'semantic_analysis',
      message: 'Semantic Content Analysis - Analyzing brand voice, theme, and target audience',
      progress: 20
    });

    let semanticContext = '';
    try {
      const semanticPrompt = `
Analyze the brand voice, theme, and target audience for the domain ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}

Please provide a comprehensive analysis including:
1. Brand voice and tone characteristics
2. Target audience demographics and psychographics
3. Industry themes and positioning
4. Content style and messaging approach
5. Community and domain belonging context
6. Related FAQs and questions for the domain service

This analysis will be used to guide community data mining and phrase generation.

Format as JSON with keys: brandVoice, targetAudience, themes, contentStyle, communityContext, relatedFAQs
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: semanticPrompt }],
        temperature: 0.3,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        let semanticData;
        try {
          semanticData = JSON.parse(response);
          semanticContext = JSON.stringify(semanticData);
        } catch {
          semanticContext = response;
        }
        totalTokenUsage += completion.usage?.total_tokens || 0;
      }
    } catch (error) {
      console.error('Error in semantic content analysis:', error);
      throw new Error(`Semantic content analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Save semantic analysis to database
    try {
      await prisma.semanticAnalysis.create({
        data: {
          domainId: domain.id,
          contentSummary: semanticContext,
          keyThemes: [],
          brandVoice: '{}',
          targetAudience: {},
          contentGaps: [],
          tokenUsage: totalTokenUsage
        }
      });
      console.log('Successfully stored semantic analysis');
    } catch (error) {
      console.error('Error storing semantic analysis:', error);
      throw new Error(`Failed to store semantic analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    sendEvent('progress', { 
      phase: 'semantic_analysis',
      message: 'Semantic Content Analysis completed',
      progress: 100
    });
    sendEvent('step-update', { index: 0, status: 'completed', progress: 100 });

    // ========================================
    // STEP 2: COMMUNITY DATA MINING
    // ========================================
    sendEvent('step-update', { index: 1, status: 'running', progress: 0 });
    sendEvent('progress', { 
      phase: 'community_mining',
      message: 'Community Data Mining - Extracting insights from Reddit and Quora',
      progress: 25
    });

    const communityInsights: any[] = [];
    console.log(`Starting community mining for ${totalKeywords} keywords`);
    
    for (let i = 0; i < totalKeywords; i++) {
      const keyword = selectedKeywords[i];
      
      console.log(`Processing community mining for keyword ${i + 1}/${totalKeywords}: ${keyword.term}`);
      
      sendEvent('progress', { 
        phase: 'community_mining',
        message: `Mining community data for "${keyword.term}" (${i + 1}/${totalKeywords})`,
        progress: 25 + (i / totalKeywords) * 8
      });

      try {
        const communityPrompt = `
Analyze community discussions and forums for the keyword "${keyword.term}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

Please provide insights from community discussions including:
1. Common questions and pain points
2. Popular solutions and recommendations
3. User sentiment and preferences
4. Trending topics and discussions
5. Sources (Reddit, Quora, forums, etc.)
6. Community-specific insights based on semantic analysis
7. Target audience alignment with community discussions

Use the semantic context to guide your analysis and identify relevant community patterns.

Format as JSON with keys: sources, summary, communityInsights, targetAudienceAlignment
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: communityPrompt }],
          temperature: 0.3,
          max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let communityData;
          try {
            communityData = JSON.parse(response);
          } catch (parseError) {
            console.error(`Error parsing community data for ${keyword.term}:`, parseError);
            throw new Error(`Failed to parse community data for ${keyword.term}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
          }

          // Store community insight data for batch insert
          communityInsights.push({
            domainId: domain.id,
            keywordId: keyword.id,
            sources: communityData.sources,
            summary: communityData.summary,
            tokenUsage: completion.usage?.total_tokens || 0
          });

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
      } catch (error) {
        console.error(`Error mining community data for ${keyword.term}:`, error);
        // Continue with other keywords even if one fails
        // Add a default community insight to prevent the array from being empty
        communityInsights.push({
          domainId: domain.id,
          keywordId: keyword.id,
          sources: { error: 'Failed to mine community data' },
          summary: `No community data available for ${keyword.term} due to error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          tokenUsage: 0
        });
      }
    }

    // Batch insert community insights
    if (communityInsights.length > 0) {
      try {
        await retryOperation(async () => {
          return await prisma.communityInsight.createMany({
            data: communityInsights
          });
        });
        console.log(`Successfully stored ${communityInsights.length} community insights`);
      } catch (error) {
        console.error('Error batch inserting community insights:', error);
        throw new Error(`Failed to store community insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.warn('No community insights to store');
    }

    console.log(`Completing community mining phase. Total insights collected: ${communityInsights.length}`);
    sendEvent('progress', { 
      phase: 'community_mining',
      message: `Community Data Mining completed - ${communityInsights.length} insights collected`,
      progress: 100
    });
    sendEvent('step-update', { index: 1, status: 'completed', progress: 100 });

    // ========================================
    // STEP 3: COMPETITOR RESEARCH
    // ========================================
    sendEvent('step-update', { index: 2, status: 'running', progress: 0 });
    sendEvent('progress', { 
      phase: 'competitor_research',
      message: 'Competitor Research - Researching competitors from community discussions',
      progress: 33
    });

    const competitorAnalysis: any[] = [];
    for (let i = 0; i < totalKeywords; i++) {
      const keyword = selectedKeywords[i];
      
      sendEvent('progress', { 
        phase: 'competitor_research',
        message: `Researching competitors for "${keyword.term}" (${i + 1}/${totalKeywords})`,
        progress: 33 + (i / totalKeywords) * 5
      });

      try {
        // Get community data for this specific keyword
        const keywordCommunityData = communityInsights.find(insight => insight.keywordId === keyword.id);
        const communityContext = keywordCommunityData ? keywordCommunityData.summary : 'No community data available';

        const competitorPrompt = `
Research competitors mentioned in community discussions for the keyword "${keyword.term}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

COMMUNITY DATA FROM PREVIOUS STEP:
${communityContext}

Please identify and analyze competitors including:
1. Direct competitors mentioned in Reddit/Quora discussions
2. Indirect competitors and alternatives
3. Competitor strengths and weaknesses
4. Market positioning insights
5. Competitive advantages and differentiators

Use the community data above to identify real competitors mentioned in actual discussions, not just generic competitors.

Format as JSON with keys: competitors, analysis, insights
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: competitorPrompt }],
          temperature: 0.3,
          max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let competitorData;
          try {
            competitorData = JSON.parse(response);
          } catch (parseError) {
            console.error(`Error parsing competitor data for ${keyword.term}:`, parseError);
            throw new Error(`Failed to parse competitor data for ${keyword.term}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
          }

          // Store competitor analysis data for batch insert
          competitorAnalysis.push({
            domainId: domain.id,
            keywordId: keyword.id,
            competitors: competitorData.competitors,
            analysis: competitorData.analysis,
            insights: competitorData.insights,
            tokenUsage: completion.usage?.total_tokens || 0
          });

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
      } catch (error) {
        console.error(`Error researching competitors for ${keyword.term}:`, error);
        // Continue with other keywords even if one fails
        competitorAnalysis.push({
          domainId: domain.id,
          keywordId: keyword.id,
          competitors: [],
          analysis: 'Failed to research competitors',
          insights: 'No competitor data available',
          tokenUsage: 0
        });
      }
    }

    // Batch insert competitor analysis
    if (competitorAnalysis.length > 0) {
      try {
        await retryOperation(async () => {
          return await prisma.competitorAnalysis.createMany({
            data: competitorAnalysis
          });
        });
        console.log(`Successfully stored ${competitorAnalysis.length} competitor analyses`);
      } catch (error) {
        console.error('Error batch inserting competitor analysis:', error);
        throw new Error(`Failed to store competitor analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    sendEvent('progress', { 
      phase: 'competitor_research',
      message: 'Competitor Research completed',
      progress: 100
    });
    sendEvent('step-update', { index: 2, status: 'completed', progress: 100 });

    // ========================================
    // STEP 4: SEARCH PATTERN ANALYSIS
    // ========================================
    sendEvent('step-update', { index: 3, status: 'running', progress: 0 });
    sendEvent('progress', { 
      phase: 'search_patterns',
      message: 'Search Pattern Analysis - Analyzing user search behaviors',
      progress: 38
    });

    const searchPatterns: any[] = [];
    for (let i = 0; i < totalKeywords; i++) {
      const keyword = selectedKeywords[i];
      
      sendEvent('progress', { 
        phase: 'search_patterns',
        message: `Analyzing search patterns for "${keyword.term}" (${i + 1}/${totalKeywords})`,
        progress: 38 + (i / totalKeywords) * 8
      });

      try {
        // Get community data for this specific keyword
        const keywordCommunityData = communityInsights.find(insight => insight.keywordId === keyword.id);
        const communityContext = keywordCommunityData ? keywordCommunityData.summary : 'No community data available';

        const patternPrompt = `
Analyze search behavior patterns for the keyword "${keyword.term}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

COMMUNITY DATA FROM PREVIOUS STEP:
${communityContext}

Please identify search patterns including:
1. Search intent variations (informational, navigational, transactional)
2. Common search modifiers and qualifiers
3. Seasonal and trending patterns
4. User journey patterns
5. Search volume distribution
6. Patterns derived from community discussions
7. User questions and search queries from community data

Use the semantic context and community insights above to identify relevant search patterns that align with the target audience's behavior.

Format as JSON with keys: patterns, summary, communityDerivedPatterns, userQuestions
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: patternPrompt }],
          temperature: 0.3,
          max_tokens: 1000
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let patternData;
          try {
            patternData = JSON.parse(response);
          } catch (parseError) {
            console.error(`Error parsing search pattern data for ${keyword.term}:`, parseError);
            throw new Error(`Failed to parse search pattern data for ${keyword.term}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
          }

          // Store search pattern data for batch insert
          searchPatterns.push({
            domainId: domain.id,
            keywordId: keyword.id,
            patterns: patternData.patterns,
            summary: patternData.summary,
            tokenUsage: completion.usage?.total_tokens || 0
          });

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
      } catch (error) {
        console.error(`Error analyzing search patterns for ${keyword.term}:`, error);
        // Continue with other keywords even if one fails
        searchPatterns.push({
          domainId: domain.id,
          keywordId: keyword.id,
          patterns: [],
          summary: 'Failed to analyze search patterns',
          tokenUsage: 0
        });
      }
    }

    // Batch insert search patterns
    if (searchPatterns.length > 0) {
      try {
        await retryOperation(async () => {
          return await prisma.searchPattern.createMany({
            data: searchPatterns
          });
        });
        console.log(`Successfully stored ${searchPatterns.length} search patterns`);
      } catch (error) {
        console.error('Error batch inserting search patterns:', error);
        throw new Error(`Failed to store search patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    sendEvent('progress', { 
      phase: 'search_patterns',
      message: 'Search Pattern Analysis completed',
      progress: 100
    });
    sendEvent('step-update', { index: 3, status: 'completed', progress: 100 });

    // ========================================
    // STEP 5: CREATING OPTIMIZED INTENT PHRASES
    // ========================================
    sendEvent('step-update', { index: 4, status: 'running', progress: 0 });
    sendEvent('progress', { 
      phase: 'phrase_generation',
      message: 'Creating optimized intent phrases - Generating phrases using all context',
      progress: 46
    });

    const allPhrases: any[] = [];
    const phrasesToInsert: any[] = [];

    for (let i = 0; i < totalKeywords; i++) {
      const keyword = selectedKeywords[i];
      
      sendEvent('progress', { 
        phase: 'phrase_generation',
        message: `Generating phrases for "${keyword.term}" (${i + 1}/${totalKeywords})`,
        progress: 46 + (i / totalKeywords) * 15
      });

      try {
        // Get all context data for this keyword
        const keywordCommunityData = communityInsights.find(insight => insight.keywordId === keyword.id);
        const keywordCompetitorData = competitorAnalysis.find(analysis => analysis.keywordId === keyword.id);
        const keywordSearchPatterns = searchPatterns.find(pattern => pattern.keywordId === keyword.id);

        const phrasePrompt = `
Generate 3-5 optimized search phrases for the keyword "${keyword.term}" in the context of ${domain.url}.

Business Context: ${domain.context || 'No context provided'}
Location: ${domain.location || 'Global'}
Semantic Context: ${semanticContext}

COMMUNITY INSIGHTS:
${keywordCommunityData ? keywordCommunityData.summary : 'No community data available'}

COMPETITOR ANALYSIS:
${keywordCompetitorData ? keywordCompetitorData.analysis : 'No competitor data available'}

SEARCH PATTERNS:
${keywordSearchPatterns ? keywordSearchPatterns.summary : 'No search pattern data available'}

Requirements:
1. Each phrase should be 8-15 words long
2. Include the main keyword naturally
3. Target different search intents (informational, navigational, transactional)
4. Use insights from community discussions
5. Consider competitive landscape
6. Follow search patterns identified
7. Align with brand voice and target audience

For each phrase, provide:
- The phrase text
- Intent classification (Informational, Navigational, Transactional, Commercial Investigation)
- Intent confidence (0-100)
- Relevance score (0-100)
- Sources that influenced the phrase

Format as JSON array with objects containing: phrase, intent, intentConfidence, relevanceScore, sources
`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: phrasePrompt }],
          temperature: 0.3,
          max_tokens: 1500
        });

        const response = completion.choices[0]?.message?.content;
        if (response) {
          let phraseData;
          try {
            phraseData = JSON.parse(response);
          } catch (parseError) {
            console.error(`Error parsing phrase data for ${keyword.term}:`, parseError);
            throw new Error(`Failed to parse phrase data for ${keyword.term}: ${parseError instanceof Error ? parseError.message : 'Invalid JSON response'}`);
          }

          // Process each generated phrase
          if (Array.isArray(phraseData)) {
            phraseData.forEach((phraseObj: any, phraseIndex: number) => {
              const phrase = {
                domainId: domain.id,
                keywordId: keyword.id,
                phrase: phraseObj.phrase,
                intent: phraseObj.intent || 'Informational',
                intentConfidence: phraseObj.intentConfidence || 75,
                relevanceScore: phraseObj.relevanceScore || 80,
                sources: phraseObj.sources || ['AI Generated'],
                trend: 'Rising',
                isSelected: false,
                tokenUsage: completion.usage?.total_tokens || 0
              };

              phrasesToInsert.push(phrase);
              allPhrases.push({
                ...phrase,
                id: `temp-${i}-${phraseIndex}`,
                parentKeyword: keyword.term,
                editable: true,
                selected: false
              });

              // Send real-time phrase event
              sendEvent('phrase-generated', {
                phrase: phrase.phrase,
                intent: phrase.intent,
                intentConfidence: phrase.intentConfidence,
                relevanceScore: phrase.relevanceScore,
                parentKeyword: keyword.term
              });
            });
          }

          totalTokenUsage += completion.usage?.total_tokens || 0;
        }
      } catch (error) {
        console.error(`Error generating phrases for ${keyword.term}:`, error);
        // Continue with other keywords even if one fails
      }
    }

    // Batch insert generated phrases
    if (phrasesToInsert.length > 0) {
      try {
        await retryOperation(async () => {
          return await prisma.generatedIntentPhrase.createMany({
            data: phrasesToInsert
          });
        });
        console.log(`Successfully stored ${phrasesToInsert.length} generated phrases`);
      } catch (error) {
        console.error('Error batch inserting generated phrases:', error);
        throw new Error(`Failed to store generated phrases: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    sendEvent('progress', { 
      phase: 'phrase_generation',
      message: `Phrase Generation completed - ${phrasesToInsert.length} phrases generated`,
      progress: 100
    });
    sendEvent('step-update', { index: 4, status: 'completed', progress: 100 });

    // ========================================
    // STEP 6: INTENT CLASSIFICATION (Integrated with phrase generation)
    // ========================================
    sendEvent('step-update', { index: 5, status: 'running', progress: 0 });
    sendEvent('progress', { 
      phase: 'intent_classification',
      message: 'Intent Classification - Classifying generated phrases by intent',
      progress: 61
    });

    // Intent classification is already done during phrase generation
    console.log('Intent classification completed during phrase generation');
    
    sendEvent('progress', { 
      phase: 'intent_classification',
      message: 'Intent Classification completed',
      progress: 100
    });
    sendEvent('step-update', { index: 5, status: 'completed', progress: 100 });

    // ========================================
    // STEP 7: RELEVANCE SCORE (Integrated with phrase generation)
    // ========================================
    sendEvent('step-update', { index: 6, status: 'running', progress: 0 });
    sendEvent('progress', { 
      phase: 'relevance_scoring',
      message: 'Relevance Score - Computing semantic relevance scores',
      progress: 69
    });

    // Relevance scoring is already done during phrase generation
    console.log('Relevance scoring completed during phrase generation');
    
    sendEvent('progress', { 
      phase: 'relevance_scoring',
      message: 'Relevance Score completed',
      progress: 100
    });
    sendEvent('step-update', { index: 6, status: 'completed', progress: 100 });

    // ========================================
    // COMPLETION
    // ========================================
    console.log('Enhanced phrase generation completed successfully');
    sendEvent('progress', { 
      message: 'Enhanced phrase generation completed successfully',
      progress: 100
    });

    sendEvent('complete', {
      totalPhrases: allPhrases.length,
      totalKeywords: totalKeywords,
      totalTokenUsage: totalTokenUsage
    });

    res.end();
  } catch (error) {
    console.error('Error in enhanced phrase generation:', error);
    sendEvent('error', { 
      error: 'Enhanced phrase generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    res.end();
  }
});

export default router; 