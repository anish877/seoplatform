import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { crawlAndExtractWithGpt4o, ProgressCallback, generateKeywordsForDomain } from '../services/geminiService';
import { generateSeedKeywords } from '../services/googleAdsService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Add asyncHandler utility at the top if not present
function asyncHandler(fn: (req: Request, res: Response, next: any) => Promise<any>) {
  return function (req: Request, res: Response, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// GET /domain/check/:url - Check if domain exists
router.get('/check/:url', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { url } = req.params;
    const authReq = req as AuthenticatedRequest;
    
    // Try multiple URL formats to find the domain
    const possibleUrls = [
      url, // Original URL as provided
      url.startsWith('http') ? url : `https://${url}`, // With https://
      url.startsWith('http') ? url : `http://${url}`, // With http://
      url.replace(/^https?:\/\//, '') // Without protocol
    ];
    
    let domain: any = null;
    
    // Try to find the domain with any of the possible URL formats
    for (const possibleUrl of possibleUrls) {
      domain = await prisma.domain.findUnique({
        where: { url: possibleUrl },
        include: {
          dashboardAnalyses: true,
          crawlResults: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });
      
      if (domain) {
        break; // Found the domain, stop searching
      }
    }

    if (!domain || domain.userId !== authReq.user.userId) {
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      domainId: domain.id,
      url: domain.url,
      hasAnalysis: !!domain.dashboardAnalyses[0],
      lastAnalyzed: domain.dashboardAnalyses[0]?.updatedAt || domain.updatedAt
    });
  } catch (error) {
    console.error('Domain check error:', error);
    res.status(500).json({ error: 'Failed to check domain' });
  }
}));

// POST /domain - create/find domain, run multi-phase analysis, and stream progress
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { url, subdomains, customPaths, priorityUrls, location } = req.body;
  
  // Validate input before setting SSE headers
  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const sendErrorAndEnd = (error: string, details?: string) => {
    sendEvent({ type: 'error', error, details });
    res.end();
  };

  // Helper function to update analysis phase
  const updateAnalysisPhase = async (domainId: number, phase: string, status: string, progress: number, result?: any, error?: string) => {
    try {
      await prisma.analysisPhase.upsert({
        where: { domainId_phase: { domainId, phase } },
        update: {
          status,
          progress,
          result: result ? JSON.stringify(result) : undefined,
          error,
          endTime: status === 'completed' || status === 'failed' ? new Date() : undefined,
        },
        create: {
          domainId,
          phase,
          status,
          progress,
          startTime: new Date(),
          result: result ? JSON.stringify(result) : undefined,
          error,
        },
      });
    } catch (err) {
      console.error(`Error updating analysis phase ${phase}:`, err);
    }
  };

  try {
    // 1. Normalize URL and find/create domain
    let normalizedUrl = url;
    if (!url.startsWith('http')) {
      normalizedUrl = `https://${url}`;
    }

    sendEvent({ type: 'progress', phase: 'domain_extraction', step: 'Validating domain and checking existing analysis...', progress: 5 });

    // Check if domain already exists
    let domain = await prisma.domain.findUnique({
      where: { url: normalizedUrl }
    });

    let isNewDomain = false;
    if (!domain) {
      // Create new domain
      domain = await prisma.domain.create({
        data: {
          url: normalizedUrl,
          userId: authReq.user.userId,
          location: location || null
        }
      });
      isNewDomain = true;
    } else if (domain.userId !== authReq.user.userId) {
      sendErrorAndEnd('Domain already exists and is owned by another user');
      return;
    }
    
    sendEvent({ type: 'domain_created', domainId: domain.id, isNewDomain });

    // Initialize only domain extraction and keyword generation phases
    const phases = ['domain_extraction', 'keyword_generation'];
    for (const phase of phases) {
      await updateAnalysisPhase(domain.id, phase, 'pending', 0);
    }

    let totalTokenUsage = 0;
    let keywordResult: any = null;

    // PHASE 1: Domain Extraction (Existing functionality)
    sendEvent({ type: 'progress', phase: 'domain_extraction', step: 'Starting domain extraction and content crawling...', progress: 10 });
    await updateAnalysisPhase(domain.id, 'domain_extraction', 'running', 10);

    const onProgress: ProgressCallback = (progressData) => {
      let enhancedMessage = progressData.step;
      
      if (progressData.phase === 'discovery') {
        if (progressData.step.includes('Validating')) {
          enhancedMessage = 'Validating domain accessibility and technical requirements...';
        } else if (progressData.step.includes('Scanning')) {
          enhancedMessage = 'Scanning website architecture and content structure...';
        } else if (progressData.step.includes('Mapping')) {
          enhancedMessage = 'Mapping content hierarchy and navigation patterns...';
        }
      } else if (progressData.phase === 'content') {
        if (progressData.step.includes('Extracting')) {
          enhancedMessage = 'Extracting and analyzing page content with advanced parsing...';
        } else if (progressData.step.includes('Processing')) {
          enhancedMessage = 'Processing metadata and structured data for comprehensive analysis...';
        }
      } else if (progressData.phase === 'ai_processing') {
        if (progressData.step.includes('Running')) {
          enhancedMessage = 'Running advanced AI analysis for brand context extraction...';
        } else if (progressData.step.includes('Extracting')) {
          enhancedMessage = 'Extracting brand context and market positioning insights...';
        } else if (progressData.step.includes('Generating')) {
          enhancedMessage = 'Generating comprehensive business intelligence and SEO insights...';
        }
      } else if (progressData.phase === 'validation') {
        if (progressData.step.includes('Validating')) {
          enhancedMessage = 'Validating analysis results and quality assurance checks...';
        } else if (progressData.step.includes('Quality')) {
          enhancedMessage = 'Quality assurance and data validation in progress...';
        } else if (progressData.step.includes('Finalizing')) {
          enhancedMessage = 'Finalizing comprehensive brand analysis and preparing insights...';
        }
      }
      
      const phaseProgress = Math.min(90, 10 + (progressData.progress * 0.8)); // Domain extraction gets 10-90%
      sendEvent({ type: 'progress', phase: 'domain_extraction', step: enhancedMessage, progress: phaseProgress, stats: progressData.stats });
    };

    // Determine crawl mode
    const hasPriorityUrls = Array.isArray(priorityUrls) && priorityUrls.length > 0;
    const hasCustomPaths = Array.isArray(customPaths) && customPaths.length > 0;
    let extraction;
    
    const domainName = domain.url.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    try {
      if (!hasPriorityUrls && !hasCustomPaths) {
        extraction = await crawlAndExtractWithGpt4o(domainName, onProgress, undefined, undefined, location);
      } else {
        extraction = await crawlAndExtractWithGpt4o(domainName, onProgress, customPaths, priorityUrls, location);
      }
      totalTokenUsage += extraction.tokenUsage || 0;
    } catch (extractionError) {
      console.error('Extraction error:', extractionError);
      await updateAnalysisPhase(domain.id, 'domain_extraction', 'failed', 0, null, extractionError instanceof Error ? extractionError.message : 'Unknown extraction error');
      sendErrorAndEnd('Extraction failed', extractionError instanceof Error ? extractionError.message : 'Unknown extraction error');
      return;
    }
    
    // Save crawl result
    sendEvent({ type: 'progress', phase: 'domain_extraction', step: 'Saving domain extraction results...', progress: 95 });
    
    const crawlResult = await prisma.crawlResult.create({
      data: {
        domainId: domain.id,
        pagesScanned: extraction.pagesScanned,
        analyzedUrls: JSON.stringify(extraction.analyzedUrls),
        extractedContext: extraction.extractedContext,
        tokenUsage: extraction.tokenUsage || 0,
      },
    });

    await updateAnalysisPhase(domain.id, 'domain_extraction', 'completed', 100, crawlResult, undefined);
    sendEvent({ type: 'progress', phase: 'domain_extraction', step: 'Domain extraction completed successfully!', progress: 100 });

    // Update domain context
    await prisma.domain.update({
      where: { id: domain.id },
      data: { context: extraction.extractedContext },
    });

    // PHASE 2: Enhanced AI Keyword Generation
    sendEvent({ type: 'progress', phase: 'keyword_generation', step: 'Starting enhanced AI keyword generation...', progress: 10 });
    await updateAnalysisPhase(domain.id, 'keyword_generation', 'running', 10);

    try {
      sendEvent({ type: 'progress', phase: 'keyword_generation', step: 'Analyzing domain context for keyword generation...', progress: 30 });
      
      // Use enhanced AI keyword generation with location context
      let keywords = [];
      try {
        const aiKeywordResult = await generateKeywordsForDomain(domain.url, extraction.extractedContext, location);
        keywords = aiKeywordResult.keywords.map((kw: any) => ({
          term: kw.term,
          volume: kw.volume,
          difficulty: kw.difficulty,
          cpc: kw.cpc,
          intent: kw.intent || 'Commercial',
        }));
        totalTokenUsage += aiKeywordResult.tokenUsage || 0;
        
        console.log(`✅ AI generated ${keywords.length} keywords with intent classification`);
      } catch (aiError) {
        console.error('AI keyword generation failed:', aiError);
        throw new Error('Failed to generate keywords using AI. Please try again.');
      }

      sendEvent({ type: 'progress', phase: 'keyword_generation', step: 'Saving keywords to database...', progress: 70 });

      // Save keywords to database
      const keywordData = keywords.map((keyword: any) => ({
        term: keyword.term,
        volume: keyword.volume,
        difficulty: keyword.difficulty,
        cpc: keyword.cpc,
        intent: keyword.intent || 'Commercial',
        domainId: domain.id,
        isSelected: false,
      }));

      await prisma.keyword.createMany({
        data: keywordData,
        skipDuplicates: true,
      });

      const keywordAnalysis = await prisma.keywordAnalysis.create({
        data: {
          domainId: domain.id,
          keywords: keywords,
          searchVolumeData: {},
          intentClassification: {},
          competitiveAnalysis: {},
          tokenUsage: 0, // Google API doesn't use tokens
        },
      });

      await updateAnalysisPhase(domain.id, 'keyword_generation', 'completed', 100, keywordAnalysis, undefined);
      sendEvent({ type: 'progress', phase: 'keyword_generation', step: 'Google API keyword generation completed successfully!', progress: 100 });

    } catch (keywordError) {
      console.error('Keyword generation error:', keywordError);
      await updateAnalysisPhase(domain.id, 'keyword_generation', 'failed', 0, null, keywordError instanceof Error ? keywordError.message : 'Unknown keyword generation error');
      sendEvent({ type: 'progress', phase: 'keyword_generation', step: 'Keyword generation failed, finalizing analysis...', progress: 0 });
    }

    // Final completion
    sendEvent({ type: 'progress', step: 'Finalizing comprehensive analysis...', progress: 98 });
    
    // Send final result and close connection
    sendEvent({ 
      type: 'complete', 
      result: { 
        domain, 
        extraction: crawlResult,
        isNewDomain,
        tokenUsage: totalTokenUsage,
        phases: {
          domain_extraction: 'completed',
          keyword_generation: keywordResult ? 'completed' : 'failed'
        }
      } 
    });
    res.end();

  } catch (error) {
    console.error('Domain processing error:', error);
    sendErrorAndEnd('Processing failed', error instanceof Error ? error.message : 'Unknown error');
  }
}));

// GET /api/domain/:id - Get domain information
router.get('/:id', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const domainId = Number(req.params.id);

  if (!domainId) {
    return res.status(400).json({ error: 'Invalid domain ID' });
  }

  try {
    const domain = await prisma.domain.findFirst({
      where: {
        id: domainId,
        userId: authReq.user.userId
      },
      include: {
        crawlResults: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        keywordAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!domain) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json({
      success: true,
      ...domain
    });

  } catch (error) {
    console.error('Error fetching domain:', error);
    res.status(500).json({ error: 'Failed to fetch domain information' });
  }
}));

export default router; 