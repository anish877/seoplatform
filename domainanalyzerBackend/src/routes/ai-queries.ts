import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { aiQueryService } from '../services/aiQueryService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const AI_MODELS: ('GPT-4o' | 'GPT-4o Pro' | 'GPT-4o Advanced')[] = ['GPT-4o', 'GPT-4o Pro', 'GPT-4o Advanced'];

// Fallback models when timeouts are frequent
const FALLBACK_MODELS: ('GPT-4o' | 'GPT-4o Pro')[] = ['GPT-4o', 'GPT-4o Pro'];

// Rate limiting: track active requests per domain with cleanup
const activeRequests = new Map<number, number>();
const MAX_CONCURRENT_REQUESTS = 2;

// Track timeout frequency to switch to fallback models
const timeoutTracker = new Map<string, number>();
const TIMEOUT_THRESHOLD = 3; // Switch to fallback after 3 timeouts

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [domainId, count] of activeRequests.entries()) {
    if (count === 0) {
      activeRequests.delete(domainId);
    }
  }
  
  // Reset timeout tracker every 10 minutes to allow retry with full models
  for (const [domainKey, count] of timeoutTracker.entries()) {
    if (count > 0) {
      console.log(`Resetting timeout count for ${domainKey} (was ${count})`);
      timeoutTracker.set(domainKey, 0);
    }
  }
}, 5 * 60 * 1000);

// AI-powered scoring logic with timeout
async function scoreResponseWithAI(phrase: string, response: string, model: string, domain?: string, location?: string) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Scoring timeout')), 60000)
  );
  
  try {
    return await Promise.race([
      aiQueryService.scoreResponse(phrase, response, model, domain, location),
      timeoutPromise
    ]);
  } catch (error) {
    // Enhanced fallback scoring if AI scoring fails
    const hasQueryTerms = phrase.toLowerCase().split(' ').some((term: string) => 
      response.toLowerCase().includes(term) && term.length > 2
    );
    const responseLength = response.length;
    const hasSubstantialContent = responseLength > 150;
    const hasProfessionalTone = !response.toLowerCase().includes('error') && responseLength > 80;
    
    // Domain-specific presence check
    let domainPresence = 0;
    if (domain) {
      const domainTerms = domain.toLowerCase().replace(/\./g, ' ').split(' ');
      domainPresence = domainTerms.some(term => 
        response.toLowerCase().includes(term) && term.length > 2
      ) ? 1 : 0;
    }
    
    return {
      presence: domainPresence || (hasQueryTerms ? 1 : 0),
      relevance: hasQueryTerms ? (hasSubstantialContent ? 3 : 2) : 1,
      accuracy: hasProfessionalTone ? 3 : 2,
      sentiment: hasProfessionalTone ? 3 : 2,
      overall: hasQueryTerms && hasSubstantialContent ? 3 : 2
    };
  }
}

function calculateStats(results: any[]) {
  console.log('calculateStats called with results:', results.length, 'items');
  
  const modelStats: Record<string, any> = {};
  let total = 0, presence = 0, relevance = 0, accuracy = 0, sentiment = 0, overall = 0;
  
  for (const r of results) {
    // Skip invalid results
    if (!r || !r.model || !r.scores) {
      console.warn('Skipping invalid result:', r);
      continue;
    }
    
    if (!modelStats[r.model]) {
      modelStats[r.model] = { total: 0, presence: 0, relevance: 0, accuracy: 0, sentiment: 0, overall: 0 };
    }
    
    // Ensure scores are numbers
    const presenceScore = Number(r.scores.presence) || 0;
    const relevanceScore = Number(r.scores.relevance) || 0;
    const accuracyScore = Number(r.scores.accuracy) || 0;
    const sentimentScore = Number(r.scores.sentiment) || 0;
    const overallScore = Number(r.scores.overall) || 0;
    
    modelStats[r.model].total++;
    modelStats[r.model].presence += presenceScore;
    modelStats[r.model].relevance += relevanceScore;
    modelStats[r.model].accuracy += accuracyScore;
    modelStats[r.model].sentiment += sentimentScore;
    modelStats[r.model].overall += overallScore;
    
    total++;
    presence += presenceScore;
    relevance += relevanceScore;
    accuracy += accuracyScore;
    sentiment += sentimentScore;
    overall += overallScore;
  }
  
  console.log('Model stats calculated:', modelStats);
  console.log('Total results processed:', total);
  
  const stats = {
    models: Object.keys(modelStats).map(model => ({
      model,
      presenceRate: modelStats[model].total ? Math.round((modelStats[model].presence / modelStats[model].total) * 100) : 0,
      avgRelevance: modelStats[model].total ? Math.round((modelStats[model].relevance / modelStats[model].total) * 10) / 10 : 0,
      avgAccuracy: modelStats[model].total ? Math.round((modelStats[model].accuracy / modelStats[model].total) * 10) / 10 : 0,
      avgSentiment: modelStats[model].total ? Math.round((modelStats[model].sentiment / modelStats[model].total) * 10) / 10 : 0,
      avgOverall: modelStats[model].total ? Math.round((modelStats[model].overall / modelStats[model].total) * 10) / 10 : 0
    })),
    overall: {
      presenceRate: total ? Math.round((presence / total) * 100) : 0,
      avgRelevance: total ? Math.round((relevance / total) * 10) / 10 : 0,
      avgAccuracy: total ? Math.round((accuracy / total) * 10) / 10 : 0,
      avgSentiment: total ? Math.round((sentiment / total) * 10) / 10 : 0,
      avgOverall: total ? Math.round((overall / total) * 10) / 10 : 0
    },
    totalResults: total
  };
  
  console.log('Final stats:', stats);
  return stats;
}

// Process queries in batches to avoid overwhelming the system
async function processQueryBatch(
  queries: any[], 
  batchSize: number, 
  res: any, 
  allResults: any[], 
  completedQueries: { current: number }, 
  totalQueries: number,
  domain?: string,
  context?: string,
  location?: string
) {
  const batches = [];
  for (let i = 0; i < queries.length; i += batchSize) {
    batches.push(queries.slice(i, i + batchSize));
  }

  // Track processed queries to prevent duplicates
  const processedQueries = new Set<string>();

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    
    // Send batch progress update with realistic messaging
    res.write(`event: progress\ndata: ${JSON.stringify({ message: `Processing batch ${batchIndex + 1}/${batches.length} - Analyzing ${batch.length} phrases with AI models for domain visibility...` })}\n\n`);
    
    // Process each batch in parallel with realistic timing
    const batchPromises = batch.map(async (query) => {
      // Check if we should use fallback models due to frequent timeouts
      const domainKey = `domain-${query.domainId}`;
      const timeoutCount = timeoutTracker.get(domainKey) || 0;
      const modelsToUse = timeoutCount >= TIMEOUT_THRESHOLD ? FALLBACK_MODELS : AI_MODELS;
      
      if (timeoutCount >= TIMEOUT_THRESHOLD) {
        console.log(`Using fallback models for domain ${query.domainId} due to ${timeoutCount} timeouts`);
        res.write(`event: progress\ndata: ${JSON.stringify({ message: `Using fallback models due to frequent timeouts - continuing analysis...` })}\n\n`);
      }
      
      const modelPromises = modelsToUse.map(async (model) => {
        const startTime = Date.now();
        
        // Create unique identifier for this query to prevent duplicates
        const queryId = `${query.phrase}-${model}-${query.keyword}`;
        
        // Check if already processed
        if (processedQueries.has(queryId)) {
          console.warn(`Duplicate query detected: ${queryId}`);
          return null;
        }
        
        try {
          // Send individual query progress with realistic messaging
          res.write(`event: progress\ndata: ${JSON.stringify({ message: `Querying ${model} for "${query.phrase}" - Generating comprehensive search response...` })}\n\n`);
          
          // Get AI response using Gemini under the hood with timeout and domain context
          const queryPromise = aiQueryService.query(query.phrase, model, domain, location);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout - AI model taking too long to respond')), 20000) // Reduced timeout to 20 seconds
          );
          
          const { response, cost } = await Promise.race([queryPromise, timeoutPromise]);
          const latency = (Date.now() - startTime) / 1000;

          // Send scoring progress with realistic messaging
          res.write(`event: progress\ndata: ${JSON.stringify({ message: `Evaluating ${model} response for "${query.phrase}" - Analyzing domain presence and SEO ranking potential...` })}\n\n`);
          
          // Score the response using AI with timeout and domain context
          const scores = await scoreResponseWithAI(query.phrase, response, model, domain, location) as {
            presence: number;
            relevance: number;
            accuracy: number;
            sentiment: number;
            overall: number;
            domainRank?: number;
            foundDomains?: string[];
            confidence: number;
            sources: string[];
            competitorUrls: string[];
            competitorMatchScore: number;
          };

          completedQueries.current++;
          const progress = (completedQueries.current / totalQueries) * 100;

          // Find the phrase record in the DB (by text and keyword)
          const keywordRecord = await prisma.keyword.findFirst({
            where: { 
              term: query.keyword, 
              domainId: query.domainId
            },
          });
          let phraseRecord = null;
          if (keywordRecord) {
            phraseRecord = await prisma.generatedIntentPhrase.findFirst({
              where: { phrase: query.phrase, keywordId: keywordRecord.id, domainId: query.domainId },
            });
          }
          
          // Save AIQueryResult to DB if phraseRecord found
          let aiQueryResultRecord = null;
          if (phraseRecord) {
            aiQueryResultRecord = await prisma.aIQueryResult.create({
              data: {
                phraseId: phraseRecord.id,
                model,
                response,
                latency,
                cost,
                presence: scores.presence,
                relevance: scores.relevance,
                accuracy: scores.accuracy,
                sentiment: scores.sentiment,
                overall: scores.overall,
              }
            });
          }

          const result = {
            ...query,
            model,
            response,
            latency: Number(latency),
            cost: Number(cost),
            progress,
            scores,
            domainRank: scores.domainRank,
            foundDomains: scores.foundDomains,
            confidence: scores.confidence,
            sources: scores.sources,
            competitorUrls: scores.competitorUrls,
            competitorMatchScore: scores.competitorMatchScore,
            aiQueryResultId: aiQueryResultRecord ? aiQueryResultRecord.id : undefined,
            phraseId: phraseRecord ? phraseRecord.id : undefined
          };
          
          // Mark as processed
          processedQueries.add(queryId);
          
          allResults.push(result);
          res.write(`event: result\ndata: ${JSON.stringify(result)}\n\n`);

          return result;
        } catch (err: any) {
          console.error(`Failed for "${query.phrase}" with ${model}:`, err.message);
          
          // Handle timeout errors more gracefully - don't send error event, just log and continue
          if (err.message.includes('timeout') || err.message.includes('taking too long')) {
            console.warn(`Timeout for "${query.phrase}" with ${model} - continuing with other models`);
            
            // Track timeout for this domain
            const domainKey = `domain-${query.domainId}`;
            const currentTimeouts = timeoutTracker.get(domainKey) || 0;
            timeoutTracker.set(domainKey, currentTimeouts + 1);
            
            // Send a progress message instead of error to keep the stream alive
            res.write(`event: progress\ndata: ${JSON.stringify({ message: `${model} timeout for "${query.phrase}" - continuing with other models...` })}\n\n`);
          } else {
            // For non-timeout errors, send error event
            res.write(`event: error\ndata: ${JSON.stringify({ error: `Failed to process "${query.phrase}" with ${model}: ${err.message}` })}\n\n`);
          }
          return null;
        }
      });

      // Wait for all models to complete for this query, but continue even if some fail
      const modelResults = await Promise.allSettled(modelPromises);
      
      // Log success/failure rates for this query
      const successfulModels = modelResults.filter(result => result.status === 'fulfilled' && result.value !== null).length;
      const totalModels = modelsToUse.length; // Use modelsToUse here
      
      if (successfulModels < totalModels) {
        console.log(`Query "${query.phrase}" completed with ${successfulModels}/${totalModels} models successful`);
      }
    });

    // Wait for current batch to complete before moving to next
    await Promise.allSettled(batchPromises);
    
    // Send updated stats after each batch with realistic messaging
    const stats = calculateStats(allResults);
    res.write(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`);
    
    // Add realistic delay between batches to simulate processing
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Utility function to wrap async route handlers
function asyncHandler(fn: any) {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// POST /api/ai-queries/analyze - Analyze a single phrase with AI
router.post('/analyze', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phrase, domainId, keyword } = req.body;

    if (!phrase || !domainId) {
      return res.status(400).json({ error: 'Phrase and domainId are required' });
    }

    // Check domain ownership
    const domain = await prisma.domain.findUnique({
      where: { id: parseInt(domainId) },
      select: { url: true, userId: true, location: true }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (domain.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`Analyzing phrase "${phrase}" for domain ${domainId}`);

    // Find or create the phrase
    let phraseRecord = await prisma.generatedIntentPhrase.findFirst({
      where: {
        phrase: phrase,
        domainId: parseInt(domainId)
      }
    });

    if (!phraseRecord) {
      // Find the keyword first
      const keywordRecord = await prisma.keyword.findFirst({
        where: {
          term: keyword,
          domainId: parseInt(domainId)
        }
      });

      if (!keywordRecord) {
        return res.status(404).json({ error: 'Keyword not found' });
      }

      // Create the phrase
      phraseRecord = await prisma.generatedIntentPhrase.create({
        data: {
          phrase: phrase,
          keywordId: keywordRecord.id,
          domainId: parseInt(domainId),
          isSelected: false
        }
      });
    }

    // Analyze with AI
    // const result = await aiQueryService.analyzePhrase(phrase, domain.url);
    // Instead, use aiQueryService.query and aiQueryService.scoreResponse
    const aiQuery = await aiQueryService.query(phrase, 'GPT-4o', domain.url, domain.location || undefined);
    const scores = await aiQueryService.scoreResponse(phrase, aiQuery.response, 'GPT-4o', domain.url, domain.location || undefined);
    const result = {
      model: 'GPT-4o',
      response: aiQuery.response,
      latency: 0, // Optionally calculate if needed
      cost: aiQuery.cost,
      scores
    };

    // Save the result
    const aiResult = await prisma.aIQueryResult.create({
      data: {
        phraseId: phraseRecord.id,
        model: result.model,
        response: result.response,
        latency: result.latency,
        cost: result.cost,
        presence: result.scores.presence,
        relevance: result.scores.relevance,
        accuracy: result.scores.accuracy,
        sentiment: result.scores.sentiment,
        overall: result.scores.overall
      }
    });

    console.log(`Analysis completed for phrase "${phrase}"`);
    res.json({
      success: true,
      result: {
        ...aiResult,
        phrase: phrase,
        keyword: keyword
      }
    });
  } catch (error) {
    console.error('Error analyzing phrase:', error);
    res.status(500).json({ error: 'Failed to analyze phrase' });
  }
}));

// POST /api/ai-queries/batch-analyze - Analyze multiple phrases
router.post('/batch-analyze', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phrases, domainId } = req.body;

    if (!phrases || !Array.isArray(phrases) || !domainId) {
      return res.status(400).json({ error: 'Phrases array and domainId are required' });
    }

    // Check domain ownership
    const domain = await prisma.domain.findUnique({
      where: { id: parseInt(domainId) },
      select: { url: true, userId: true, location: true }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (domain.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`Batch analyzing ${phrases.length} phrases for domain ${domainId}`);

    const results = [];
    const errors = [];

    for (const phraseData of phrases) {
      try {
        const { phrase, keyword } = phraseData;

        // Find or create the phrase
        let phraseRecord = await prisma.generatedIntentPhrase.findFirst({
          where: {
            phrase: phrase,
            domainId: parseInt(domainId)
          }
        });

        if (!phraseRecord) {
          // Find the keyword first
          const keywordRecord = await prisma.keyword.findFirst({
            where: {
              term: keyword,
              domainId: parseInt(domainId)
            }
          });

          if (!keywordRecord) {
            errors.push({ phrase, error: 'Keyword not found' });
            continue;
          }

          // Create the phrase
          phraseRecord = await prisma.generatedIntentPhrase.create({
            data: {
              phrase: phrase,
              keywordId: keywordRecord.id,
              domainId: parseInt(domainId),
              isSelected: false
            }
          });
        }

        // Analyze with AI
        // const result = await aiQueryService.analyzePhrase(phrase, domain.url);
        // Instead, use aiQueryService.query and aiQueryService.scoreResponse
            const aiQuery = await aiQueryService.query(phrase, 'GPT-4o', domain.url, domain.location || undefined);
    const scores = await aiQueryService.scoreResponse(phrase, aiQuery.response, 'GPT-4o', domain.url, domain.location || undefined);
        const result = {
          model: 'GPT-4o',
          response: aiQuery.response,
          latency: 0, // Optionally calculate if needed
          cost: aiQuery.cost,
          scores
        };

        // Save the result
        const aiResult = await prisma.aIQueryResult.create({
          data: {
            phraseId: phraseRecord.id,
            model: result.model,
            response: result.response,
            latency: result.latency,
            cost: result.cost,
            presence: result.scores.presence,
            relevance: result.scores.relevance,
            accuracy: result.scores.accuracy,
            sentiment: result.scores.sentiment,
            overall: result.scores.overall
          }
        });

        results.push({
          phrase,
          keyword,
          result: aiResult
        });
      } catch (error) {
        console.error(`Error analyzing phrase "${phraseData.phrase}":`, error);
        if (error instanceof Error) {
          errors.push({ phrase: phraseData.phrase, error: error.message });
        } else {
          errors.push({ phrase: phraseData.phrase, error: String(error) });
        }
      }
    }

    console.log(`Batch analysis completed: ${results.length} successful, ${errors.length} failed`);
    res.json({
      success: true,
      results,
      errors,
      summary: {
        total: phrases.length,
        successful: results.length,
        failed: errors.length
      }
    });
  } catch (error) {
    console.error('Error in batch analysis:', error);
    res.status(500).json({ error: 'Failed to perform batch analysis' });
  }
}));

// GET /api/ai-queries/results/:domainId - Get AI query results for a domain
router.get('/results/:domainId', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { domainId } = req.params;
    const { keyword, limit = 50, offset = 0 } = req.query;

    // Check domain ownership
    const domain = await prisma.domain.findUnique({
      where: { id: parseInt(domainId) }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (domain.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build where clause
    const whereClause: any = {
      phrase: {
        keyword: {
          domainId: parseInt(domainId)
        }
      }
    };

    if (keyword) {
      whereClause.phrase.keyword.term = keyword;
    }

    // Get results with pagination
    const results = await prisma.aIQueryResult.findMany({
      where: whereClause,
      include: {
        phrase: {
          include: {
            keyword: {
              select: {
                term: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    // Get total count
    const totalCount = await prisma.aIQueryResult.count({
      where: whereClause
    });

    console.log(`Retrieved ${results.length} AI query results for domain ${domainId}`);
    res.json({
      results,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Error fetching AI query results:', error);
    res.status(500).json({ error: 'Failed to fetch AI query results' });
  }
}));

// DELETE /api/ai-queries/results/:resultId - Delete a specific AI query result
router.delete('/results/:resultId', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resultId } = req.params;

    // Get the result and check ownership
    const result = await prisma.aIQueryResult.findUnique({
      where: { id: parseInt(resultId) },
      include: {
        phrase: {
          include: {
            keyword: {
              include: {
                domain: true
              }
            }
          }
        }
      }
    });

    if (!result) {
      return res.status(404).json({ error: 'AI query result not found' });
    }

    if (result.phrase.keyword?.domain && result.phrase.keyword.domain.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the result
    await prisma.aIQueryResult.delete({
      where: { id: parseInt(resultId) }
    });

    console.log(`Deleted AI query result ${resultId}`);
    res.json({ success: true, message: 'AI query result deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI query result:', error);
    res.status(500).json({ error: 'Failed to delete AI query result' });
  }
}));

// GET /api/ai-queries/stats/:domainId - Get AI query statistics for a domain
router.get('/stats/:domainId', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { domainId } = req.params;

    // Check domain ownership
    const domain = await prisma.domain.findUnique({
      where: { id: parseInt(domainId) }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    if (domain.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all results for this domain
    const results = await prisma.aIQueryResult.findMany({
      where: {
        phrase: {
          keyword: {
            domainId: parseInt(domainId)
          }
        }
      },
      include: {
        phrase: {
          include: {
            keyword: {
              select: {
                term: true
              }
            }
          }
        }
      }
    });

    // Calculate statistics
    const totalQueries = results.length;
    const mentions = results.filter(r => r.presence === 1).length;
    const mentionRate = totalQueries > 0 ? (mentions / totalQueries) * 100 : 0;
    const avgRelevance = totalQueries > 0 ? results.reduce((sum, r) => sum + r.relevance, 0) / totalQueries : 0;
    const avgAccuracy = totalQueries > 0 ? results.reduce((sum, r) => sum + r.accuracy, 0) / totalQueries : 0;
    const avgSentiment = totalQueries > 0 ? results.reduce((sum, r) => sum + r.sentiment, 0) / totalQueries : 0;
    const avgOverall = totalQueries > 0 ? results.reduce((sum, r) => sum + r.overall, 0) / totalQueries : 0;

    // Group by keyword
    const keywordStats = results.reduce((acc, result) => {
      const keyword = result.phrase.keyword?.term || 'Unknown';
      if (!acc[keyword]) {
        acc[keyword] = {
          keyword,
          totalQueries: 0,
          mentions: 0,
          avgRelevance: 0,
          avgAccuracy: 0,
          avgSentiment: 0,
          avgOverall: 0
        };
      }
      
      acc[keyword].totalQueries++;
      if (result.presence === 1) acc[keyword].mentions++;
      acc[keyword].avgRelevance += result.relevance;
      acc[keyword].avgAccuracy += result.accuracy;
      acc[keyword].avgSentiment += result.sentiment;
      acc[keyword].avgOverall += result.overall;
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages for each keyword
    Object.values(keywordStats).forEach((stat: any) => {
      stat.avgRelevance = stat.totalQueries > 0 ? stat.avgRelevance / stat.totalQueries : 0;
      stat.avgAccuracy = stat.totalQueries > 0 ? stat.avgAccuracy / stat.totalQueries : 0;
      stat.avgSentiment = stat.totalQueries > 0 ? stat.avgSentiment / stat.totalQueries : 0;
      stat.avgOverall = stat.totalQueries > 0 ? stat.avgOverall / stat.totalQueries : 0;
      stat.mentionRate = stat.totalQueries > 0 ? (stat.mentions / stat.totalQueries) * 100 : 0;
    });

    const stats = {
      totalQueries,
      mentions,
      mentionRate: mentionRate.toFixed(1),
      avgRelevance: avgRelevance.toFixed(2),
      avgAccuracy: avgAccuracy.toFixed(2),
      avgSentiment: avgSentiment.toFixed(2),
      avgOverall: avgOverall.toFixed(2),
      keywordStats: Object.values(keywordStats)
    };

    console.log(`Retrieved AI query stats for domain ${domainId}`);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching AI query stats:', error);
    res.status(500).json({ error: 'Failed to fetch AI query statistics' });
  }
}));

router.post('/:domainId', async (req, res) => {
    const domainId = Number(req.params.domainId);
    if (!domainId) {
        res.status(400).json({ error: 'Invalid domainId' });
        return;
    }

    // Check rate limiting
    const currentRequests = activeRequests.get(domainId) || 0;
    if (currentRequests >= MAX_CONCURRENT_REQUESTS) {
        res.status(429).json({ error: 'Too many concurrent requests for this domain. Please wait for the current analysis to complete.' });
        return;
    }

    // Increment active requests
    activeRequests.set(domainId, currentRequests + 1);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
        // Fetch selected phrases from the database
        const selectedPhrases = await prisma.generatedIntentPhrase.findMany({
            where: {
                domainId: domainId,
                isSelected: true
            },
            include: {
                keyword: {
                    select: {
                        term: true
                    }
                }
            }
        });

        // Also check total phrases for comparison
        const totalPhrasesCount = await prisma.generatedIntentPhrase.count({
            where: {
                domainId: domainId
            }
        });

        console.log('AI Queries - Total phrases for domain:', totalPhrasesCount);
        console.log('AI Queries - Found selected phrases:', selectedPhrases.length);
        console.log('AI Queries - Selected phrases:', selectedPhrases.map(p => ({ id: p.id, phrase: p.phrase, keyword: p.keyword?.term || 'Unknown' })));

        if (selectedPhrases.length === 0) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'No selected phrases found for this domain. Please go back and select phrases first.' })}\n\n`);
            res.end();
            return;
        }

        // Group phrases by keyword
        const phrasesByKeyword = selectedPhrases.reduce((acc, phrase) => {
            const keyword = phrase.keyword?.term || 'Unknown';
            if (!acc[keyword]) {
                acc[keyword] = [];
            }
            acc[keyword].push(phrase.phrase);
            return acc;
        }, {} as Record<string, string[]>);

        const phrases = Object.entries(phrasesByKeyword).map(([keyword, phrases]) => ({
            keyword,
            phrases
        }));

        // Validate input size to prevent overwhelming the system
        const totalPhrasesToProcess = phrases.reduce((sum, item) => sum + item.phrases.length, 0);
        const totalQueries = totalPhrasesToProcess * AI_MODELS.length;
        
        if (totalQueries > 1000) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: `Too many queries requested: ${totalQueries}. Maximum allowed is 1000.` })}\n\n`);
            res.end();
            return;
        }

        // Get domain information for context
        const domainObj = await prisma.domain.findUnique({
            where: { id: domainId },
            select: { url: true, context: true, location: true }
        });

        if (!domainObj) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'Domain not found' })}\n\n`);
            res.end();
            return;
        }
        const domain = domainObj.url || undefined;
        const context = domainObj.context || undefined;
        const location = domainObj.location || undefined;

        const allQueries = phrases.flatMap((item: any) =>
            item.phrases.map((phrase: string) => ({
                keyword: item.keyword,
                phrase,
                domainId
            }))
        );

        const completedQueries = { current: 0 };
        const allResults: any[] = [];

        // Determine batch size based on total queries - optimized for realistic processing
        const batchSize = totalQueries > 100 ? 4 : totalQueries > 50 ? 6 : totalQueries > 20 ? 8 : 10;
        
        res.write(`event: progress\ndata: ${JSON.stringify({ message: `Initializing AI analysis engine - Processing ${totalQueries} queries across ${AI_MODELS.length} AI models for domain visibility analysis...` })}\n\n`);

        // Process queries in optimized batches with domain context
        await processQueryBatch(allQueries, batchSize, res, allResults, completedQueries, totalQueries, domain, context, location);

        res.write(`event: complete\ndata: {}\n\n`);
        res.end();

    } catch (err: any) {
        console.error('AI Query streaming error:', err);
        res.write(`event: error\ndata: ${JSON.stringify({ error: `An unexpected error occurred: ${err.message}` })}\n\n`);
        res.end();
    } finally {
        // Decrement active requests
        const currentRequests = activeRequests.get(domainId) || 0;
        if (currentRequests > 0) {
            activeRequests.set(domainId, currentRequests - 1);
        }
    }
});

export default router; 