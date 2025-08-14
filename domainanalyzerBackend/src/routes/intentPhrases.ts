import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import IntentPhraseService, { IntentPhraseProgress } from '../services/intentPhraseService';

const router = Router();
const prisma = new PrismaClient();

// POST /api/intent-phrases/:domainId/stream - Stream AI-powered intent phrase generation with selected keywords
router.post('/:domainId/stream', authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const domainId = Number(req.params.domainId);
  const { keywords: selectedKeywordTerms, domainContext, location } = req.body;
  
  if (!domainId) {
    return res.status(400).json({ error: 'Invalid domainId' });
  }

  console.log('Received request:', { domainId, selectedKeywordTerms, domainContext, location });
  
  if (!selectedKeywordTerms || !Array.isArray(selectedKeywordTerms) || selectedKeywordTerms.length === 0) {
    console.log('No keywords provided, will use fallback');
    // Don't return error, let the fallback logic handle it
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Verify domain access
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: { id: true, url: true, context: true, location: true, userId: true }
    });

    if (!domain || domain.userId !== authReq.user.userId) {
      sendEvent('error', { error: 'Access denied' });
      res.end();
      return;
    }

    // Get selected keywords from database that match the provided terms
    let keywords = await prisma.keyword.findMany({
      where: { 
        domainId, 
        isSelected: true,
        ...(selectedKeywordTerms && selectedKeywordTerms.length > 0 && { term: { in: selectedKeywordTerms } })
      },
      orderBy: { volume: 'desc' },
      select: { id: true, term: true, volume: true }
    });

    if (keywords.length === 0) {
      // Try to get all keywords for this domain as fallback
      const allKeywords = await prisma.keyword.findMany({
        where: { domainId },
        orderBy: { volume: 'desc' },
        take: 5, // Limit to top 5 keywords
        select: { id: true, term: true, volume: true }
      });

      if (allKeywords.length === 0) {
        sendEvent('error', { error: 'No keywords found for this domain' });
        res.end();
        return;
      }

      // Use all keywords as fallback
      keywords = allKeywords;
      console.log('Using fallback keywords:', keywords);
    }

    // Check if generation is already in progress
    const existingGeneration = await prisma.intentPhraseGeneration.findFirst({
      where: { domainId, status: 'running' }
    });

    if (existingGeneration) {
      sendEvent('error', { error: 'Intent phrase generation already in progress' });
      res.end();
      return;
    }

    // Create generation record
    await prisma.intentPhraseGeneration.create({
      data: {
        domainId,
        phase: 'semantic_analysis',
        status: 'running',
        progress: 0
      }
    });

    // Initialize progress tracking
    let currentPhase = 'semantic_analysis';
    let phaseProgress = 0;
    const phases = [
      'semantic_analysis',
      'community_mining',
      'competitor_analysis',
      'search_patterns', 
      'phrase_generation',
      'intent_classification',
      'relevance_scoring'
    ];

    const progressCallback = (progress: IntentPhraseProgress) => {
      // Update generation record
      prisma.intentPhraseGeneration.updateMany({
        where: { domainId, phase: progress.phase },
        data: {
          status: progress.progress === 100 ? 'completed' : 'running',
          progress: progress.progress,
          result: progress.data
        }
      }).catch(console.error);

      // Send progress event
      sendEvent('progress', {
        phase: progress.phase,
        step: progress.step,
        progress: progress.progress,
        message: progress.message,
        data: progress.data
      });

      // Update overall progress
      if (progress.phase !== currentPhase) {
        currentPhase = progress.phase;
        phaseProgress = phases.indexOf(currentPhase);
      }
    };

    // Callback for when phrases are generated
    const phraseGeneratedCallback = (phrase: any) => {
      sendEvent('phrase', phrase);
    };

    // Create domain object with context from request
    const domainObj = {
      ...domain,
      context: domainContext || domain.context || '',
      location: location || domain.location || 'Global'
    };

    // Start AI-powered generation
    const intentPhraseService = new IntentPhraseService(
      domainId,
      keywords,
      domainObj,
      progressCallback,
      phraseGeneratedCallback
    );

    try {
      const phrases = await intentPhraseService.generateIntentPhrases();
      
      // Send completion event
      sendEvent('complete', {
        message: 'Intent phrase generation completed successfully',
        totalPhrases: phrases.length,
        phases: phases.length
      });

      // Update final status
      await prisma.intentPhraseGeneration.updateMany({
        where: { domainId },
        data: {
          status: 'completed',
          progress: 100,
          endTime: new Date()
        }
      });

    } catch (error) {
      console.error('Intent phrase generation error:', error);
      
      // Update error status
      await prisma.intentPhraseGeneration.updateMany({
        where: { domainId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          endTime: new Date()
        }
      });

      sendEvent('error', { 
        error: 'Intent phrase generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    res.end();
  } catch (error) {
    console.error('Error in intent phrase generation:', error);
    sendEvent('error', { 
      error: 'Failed to start intent phrase generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    res.end();
  }
});

// GET /api/intent-phrases/:domainId - Get generated intent phrases
router.get('/:domainId', authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const domainId = Number(req.params.domainId);
  
  if (!domainId) {
    return res.status(400).json({ error: 'Invalid domainId' });
  }

  try {
    // Verify domain access
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: { id: true, userId: true }
    });

    if (!domain || domain.userId !== authReq.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get generated phrases with keyword information
    const phrases = await prisma.generatedIntentPhrase.findMany({
      where: { domainId },
      include: {
        keyword: {
          select: { term: true, volume: true }
        },
        relevanceScoreResults: {
          select: { score: true, breakdown: true }
        }
      },
      orderBy: { relevanceScore: 'desc' }
    });

    // Group phrases by keyword
    const groupedPhrases = phrases.reduce((acc, phrase) => {
      const keyword = phrase.keyword?.term || 'Unknown';
      if (!acc[keyword]) {
        acc[keyword] = [];
      }
      acc[keyword].push({
        id: phrase.id,
        phrase: phrase.phrase,
        relevanceScore: phrase.relevanceScore,
        sources: phrase.sources,
        trend: phrase.trend,
        intent: phrase.intent,
        isSelected: phrase.isSelected,
        communityInsights: phrase.communityInsights,
        searchPatterns: phrase.searchPatterns
      });
      return acc;
    }, {} as Record<string, any[]>);

    res.json({
      success: true,
      phrases: groupedPhrases,
      totalPhrases: phrases.length,
      totalKeywords: Object.keys(groupedPhrases).length
    });

  } catch (error) {
    console.error('Error fetching intent phrases:', error);
    res.status(500).json({ error: 'Failed to fetch intent phrases' });
  }
});

// POST /api/intent-phrases/:domainId/select - Select/deselect phrases
router.post('/:domainId/select', authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const domainId = Number(req.params.domainId);
  const { selectedPhrases } = req.body;

  console.log('Select phrases request:', { domainId, selectedPhrases, userId: authReq.user?.userId });

  if (!domainId || !selectedPhrases || !Array.isArray(selectedPhrases)) {
    return res.status(400).json({ error: 'DomainId and selectedPhrases array are required' });
  }

  try {
    // Verify domain access
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: { id: true, userId: true }
    });

    console.log('Domain found:', domain);

    if (!domain || domain.userId !== authReq.user.userId) {
      console.log('Access denied:', { domainUserId: domain?.userId, requestUserId: authReq.user.userId });
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('Saving selected phrases:', { domainId, selectedPhrases });

    // First, unselect all phrases for this domain
    const unselectResult = await prisma.generatedIntentPhrase.updateMany({
      where: {
        domainId: domainId
      },
      data: {
        isSelected: false
      }
    });
    console.log('Unselected phrases count:', unselectResult.count);

    // Then select the specified phrases
    const updatePromises = selectedPhrases.map(async (phraseId: any) => {
      const id = typeof phraseId === 'string' ? parseInt(phraseId) : phraseId;
      console.log('Selecting phrase with ID:', id);
      
      // First verify the phrase exists and belongs to this domain
      const existingPhrase = await prisma.generatedIntentPhrase.findFirst({
        where: { 
          id: id,
          domainId: domainId 
        }
      });
      
      if (!existingPhrase) {
        console.log(`Phrase with ID ${id} not found or doesn't belong to domain ${domainId}`);
        return null; // Skip this phrase
      }
      
      return prisma.generatedIntentPhrase.update({
        where: { id },
        data: { isSelected: true }
      });
    });

    const updateResults = await Promise.all(updatePromises);
    const successfulUpdates = updateResults.filter(result => result !== null);
    console.log('Updated phrases count:', successfulUpdates.length);

    res.json({
      success: true,
      message: `Successfully selected ${successfulUpdates.length} phrases`,
      selectedCount: successfulUpdates.length,
      requestedCount: selectedPhrases.length,
      skippedCount: selectedPhrases.length - successfulUpdates.length
    });

  } catch (error) {
    console.error('Error updating phrase selection:', error);
    res.status(500).json({ error: 'Failed to update phrase selection' });
  }
});

// GET /api/intent-phrases/:domainId/status - Get generation status
router.get('/:domainId/status', authenticateToken, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const domainId = Number(req.params.domainId);
  
  if (!domainId) {
    return res.status(400).json({ error: 'Invalid domainId' });
  }

  try {
    // Verify domain access
    const domain = await prisma.domain.findUnique({
      where: { id: domainId },
      select: { id: true, userId: true }
    });

    if (!domain || domain.userId !== authReq.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get generation status
    const generations = await prisma.intentPhraseGeneration.findMany({
      where: { domainId },
      orderBy: { createdAt: 'desc' }
    });

    const phases = [
      'semantic_analysis',
      'community_mining',
      'search_patterns',
      'intent_classification', 
      'relevance_scoring',
      'phrase_generation'
    ];

    const status = phases.map(phase => {
      const generation = generations.find(g => g.phase === phase);
      return {
        phase,
        status: generation?.status || 'pending',
        progress: generation?.progress || 0,
        startTime: generation?.startTime,
        endTime: generation?.endTime,
        error: generation?.error
      };
    });

    const isRunning = status.some(s => s.status === 'running');
    const isCompleted = status.every(s => s.status === 'completed');
    const hasError = status.some(s => s.status === 'failed');

    res.json({
      success: true,
      status,
      isRunning,
      isCompleted,
      hasError,
      totalPhases: phases.length,
      completedPhases: status.filter(s => s.status === 'completed').length
    });

  } catch (error) {
    console.error('Error fetching generation status:', error);
    res.status(500).json({ error: 'Failed to fetch generation status' });
  }
});



export default router; 