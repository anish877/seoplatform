'use client';

import React, { useState, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { apiService } from '@/services/api';

interface Step3Props {
  domainId: number;
  onNext: (data: { domainId: number; selectedPhrases: IntentPhrase[]; step3Data: Step3Data }) => void;
  onBack: () => void;
}

interface IntentPhrase {
  id: string;
  phrase: string;
  relevanceScore: number;
  intent?: string;
  intentConfidence?: number;
  sources: string[];
  trend: string;
  editable: boolean;
  selected: boolean;
  parentKeyword: string;
  isEditing?: boolean;
  keywordId?: number;
  wordCount?: number;
}



interface Step3Data {
  domain: {
    id: number;
    url: string;
    context: string;
    location: string;
  };
  selectedKeywords: Array<{
    id: number;
    keyword: string;
    volume: number;
    difficulty: string;
    cpc: number;
    isSelected: boolean;
  }>;
  analysis: {
    semanticAnalysis: Record<string, unknown>;
    keywordAnalysis: Record<string, unknown>;
    searchVolumeClassification: Record<string, unknown>;
    intentClassification: Record<string, unknown>;
  };
  existingPhrases: IntentPhrase[];
  communityInsights: Record<string, unknown>[];
  searchPatterns: Record<string, unknown>[];
}

export default function Step3Results({ domainId, onNext, onBack }: Step3Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBackLoading, setIsBackLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);
  
  const [generatingSteps, setGeneratingSteps] = useState([
    { name: 'Semantic Content Analysis', status: 'pending', progress: 0, description: 'Analyzing brand voice, theme, and target audience' },
    { name: 'Community Data Mining', status: 'pending', progress: 0, description: 'Extracting real insights from Reddit and Quora using SERP API' },
    { name: 'Competitor Research', status: 'pending', progress: 0, description: 'Researching competitors mentioned in community discussions' },
    { name: 'Search Pattern Analysis', status: 'pending', progress: 0, description: 'Analyzing user search behaviors' },
    { name: 'Creating optimized intent phrases', status: 'pending', progress: 0, description: 'Generating optimized search phrases' },
    { name: 'Intent Classification', status: 'pending', progress: 0, description: 'Classifying generated phrases by intent' },
    { name: 'Relevance Score', status: 'pending', progress: 0, description: 'Computing semantic relevance scores' }
  ]);

  const [intentPhrases, setIntentPhrases] = useState<IntentPhrase[]>([]);
  const [selectedPhrases, setSelectedPhrases] = useState<string[]>([]);
  const [showFormulaTooltip, setShowFormulaTooltip] = useState(false);
  const [showTableFormulaTooltip, setShowTableFormulaTooltip] = useState(false);
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Load existing Step3Results data
  useEffect(() => {
    const loadStep3Data = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch domain information
        const domainResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/domain/${domainId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!domainResponse.ok) {
          throw new Error('Failed to load domain data');
        }

        const domainData = await domainResponse.json();
        
        console.log('Domain response data:', domainData);
        
        // Fetch only selected keywords
        const keywordsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/keywords/${domainId}?selected=true`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!keywordsResponse.ok) {
          throw new Error('Failed to load selected keywords');
        }

        const keywordsData = await keywordsResponse.json();
        
        console.log('Keywords response data:', keywordsData);
        
        // Create Step3Data structure
        const data: Step3Data = {
          domain: {
            id: domainId,
            url: domainData.url,
            context: domainData.crawlResults?.[0]?.extractedContext || '',
            location: domainData.location || 'Global'
          },
          selectedKeywords: keywordsData.keywords.map((kw: Record<string, unknown>) => ({
            id: kw.id,
            keyword: kw.term,
            volume: kw.volume,
            difficulty: kw.difficulty,
            cpc: kw.cpc,
            isSelected: kw.isSelected
          })),
          analysis: {
            semanticAnalysis: domainData.semanticAnalyses?.[0] || {},
            keywordAnalysis: domainData.keywordAnalyses?.[0] || {},
            searchVolumeClassification: domainData.searchVolumeClassifications?.[0] || {},
            intentClassification: domainData.intentClassifications?.[0] || {}
          },
          existingPhrases: [],
          communityInsights: [],
          searchPatterns: []
        };
        
        setStep3Data(data);
        
        // Check if we have keywords to work with
        if (data.selectedKeywords.length === 0) {
          setError('No keywords found for this domain. Please go back and run the analysis again.');
          setIsLoading(false);
          return;
        }
        
        console.log('Step3Data loaded successfully:', data);
        console.log('Selected keywords:', data.selectedKeywords);
        
        // Check if phrases already exist for this domain
        const existingPhrasesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/enhanced-phrases/${domainId}/step3`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });

        if (existingPhrasesResponse.ok) {
          const existingData = await existingPhrasesResponse.json();
          if (existingData.existingPhrases && existingData.existingPhrases.length > 0) {
            console.log('Found existing phrases:', existingData.existingPhrases.length);
            
            // Always load existing phrases first
            console.log('Loading existing phrases:', existingData.existingPhrases);
            setIntentPhrases(existingData.existingPhrases);
            
            // Check if we have phrases for ALL selected keywords
            const selectedKeywordIds = data.selectedKeywords.map(kw => kw.id);
            const existingKeywordIds = existingData.existingPhrases.map((phrase: IntentPhrase) => phrase.keywordId);
            const missingKeywords = selectedKeywordIds.filter(id => !existingKeywordIds.includes(id));
            
            if (missingKeywords.length === 0) {
              console.log('Phrases already exist for all keywords, loading existing data only...');
              setIsLoading(false);
              setStep3Data(data);
              return; // Don't start generation if phrases exist for all keywords
            } else {
              console.log(`Missing phrases for ${missingKeywords.length} keywords, will generate for missing keywords...`);
              // Continue to generation for missing keywords
            }
          }
        }
        
        // Start phrase generation with selected keywords
        setIsLoading(false); // Set loading to false before starting generation
        setStep3Data(data); // Set the state
        await generateNewPhrases(data); // Pass data directly
      } catch (error) {
        console.error('Error loading Step3Results data:', error);
        setError('Failed to load Step3Results data');
        setIsLoading(false);
      }
    };

    loadStep3Data();
  }, [domainId]);

  // Auto-advance loading carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLoadingIndex(prev => (prev + 1) % 3);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-advance carousel to show running task
  useEffect(() => {
    const interval = setInterval(() => {
      const runningTaskIndex = generatingSteps.findIndex(task => task.status === 'running');
      if (runningTaskIndex !== -1) {
        setCurrentTaskIndex(runningTaskIndex);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [generatingSteps]);

  const generateNewPhrases = async (data?: Step3Data) => {
    setIsGenerating(true);
    setError(null);
    
    // Preserve existing phrases before starting generation
    const currentPhrases = intentPhrases;
    console.log('Preserving current phrases before generation:', currentPhrases.length);
    
    // Add timeout to prevent phases from getting stuck
    const phaseTimeout = setTimeout(() => {
      console.log('Phase timeout - checking for stuck phases');
      setGeneratingSteps(prev => {
        const newSteps = [...prev];
        const runningIndex = newSteps.findIndex(step => step.status === 'running');
        if (runningIndex !== -1 && newSteps[runningIndex].progress > 0) {
          console.log(`Phase ${runningIndex} seems stuck, marking as completed`);
          newSteps[runningIndex] = {
            ...newSteps[runningIndex],
            status: 'completed',
            progress: 100
          };
          if (runningIndex + 1 < newSteps.length) {
            newSteps[runningIndex + 1] = {
              ...newSteps[runningIndex + 1],
              status: 'running',
              progress: 0
            };
          }
        }
        return newSteps;
      });
    }, 30000); // 30 second timeout
    
    // Initialize generating steps
    setGeneratingSteps([
      { name: 'Semantic Content Analysis', status: 'running', progress: 0, description: 'Analyzing brand voice, theme, and target audience' },
      { name: 'Community Data Mining', status: 'pending', progress: 0, description: 'Extracting real insights from Reddit and Quora using SERP API' },
      { name: 'Competitor Research', status: 'pending', progress: 0, description: 'Researching competitors mentioned in community discussions' },
      { name: 'Search Pattern Analysis', status: 'pending', progress: 0, description: 'Analyzing user search behaviors' },
      { name: 'Creating optimized intent phrases', status: 'pending', progress: 0, description: 'Generating optimized search phrases' },
      { name: 'Intent Classification', status: 'pending', progress: 0, description: 'Classifying generated phrases by intent' },
      { name: 'Relevance Score', status: 'pending', progress: 0, description: 'Computing semantic relevance scores' }
    ]);
    
    console.log('Starting phrase generation with steps initialized');
    console.log('Current phrases before generation:', intentPhrases.length);
    
    const token = localStorage.getItem('authToken');
    const url = `${import.meta.env.VITE_API_URL}/api/enhanced-phrases/${domainId}/step3/generate`;
    
    // Get selected keywords for the prompt - use passed data or fallback to state
    const currentData = data || step3Data;
    const selectedKeywords = currentData?.selectedKeywords || [];
    const keywordTerms = selectedKeywords.filter(kw => kw.isSelected).map(kw => kw.keyword);
    
    console.log('Starting phrase generation with keywords:', keywordTerms);
    console.log('Domain context:', currentData?.domain.context);
    console.log('URL being called:', url);
    console.log('Request body:', {
      keywords: keywordTerms,
      domainContext: currentData?.domain.context || '',
      location: currentData?.domain.location || 'Global'
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // No body needed - enhanced phrases endpoint uses domain's top keywords automatically
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          console.log('Processing line:', line);
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine && dataLine.startsWith('data: ')) {
              const data = JSON.parse(dataLine.slice(6));
              
              console.log('Received event:', eventType, data);
              
              if (eventType === 'progress') {
                // Update step progress
                const { phase, step, progress, message } = data;
                
                // If this is the first progress event and no phase is specified, start semantic analysis
                if (!phase && progress !== undefined) {
                  setGeneratingSteps(prev => {
                    const newSteps = [...prev];
                    newSteps[0] = {
                      ...newSteps[0],
                      status: 'running',
                      progress: progress
                    };
                    console.log('Started semantic analysis phase');
                    return newSteps;
                  });
                }
                const phaseMap: { [key: string]: number } = {
                  'semantic_analysis': 0,
                  'community_mining': 1,
                  'competitor_research': 2,
                  'search_patterns': 3,
                  'phrase_generation': 4,
                  'intent_classification': 5,
                  'relevance_scoring': 6
                };
                
                if (phase && phaseMap[phase] !== undefined) {
                  // Phase-specific progress update
                  const stepIndex = phaseMap[phase];
                  setGeneratingSteps(prev => {
                    const newSteps = [...prev];
                    
                    // Mark all previous steps as completed
                    for (let i = 0; i < stepIndex; i++) {
                      newSteps[i] = {
                        ...newSteps[i],
                        status: 'completed',
                        progress: 100
                      };
                    }
                    
                    // If this phase is completing, start the next phase
                    if (progress === 100) {
                      newSteps[stepIndex] = {
                        ...newSteps[stepIndex],
                        status: 'completed',
                        progress: 100
                      };
                      
                      // Start the next phase if it exists
                      if (stepIndex + 1 < newSteps.length) {
                        newSteps[stepIndex + 1] = {
                          ...newSteps[stepIndex + 1],
                          status: 'running',
                          progress: 0
                        };
                      }
                    } else {
                      // Update current phase progress and ensure it's running
                      newSteps[stepIndex] = {
                        ...newSteps[stepIndex],
                        status: 'running',
                        progress: progress
                      };
                      
                      // Mark all future steps as pending
                      for (let i = stepIndex + 1; i < newSteps.length; i++) {
                        newSteps[i] = {
                          ...newSteps[i],
                          status: 'pending',
                          progress: 0
                        };
                      }
                    }
                    
                    console.log(`Updated step ${stepIndex} (${phase}) to status: ${progress === 100 ? 'completed' : 'running'}, progress: ${progress}`);
                    console.log('All steps after update:', newSteps.map((step, idx) => `${idx}: ${step.name} - ${step.status} (${step.progress}%)`));
                    return newSteps;
                  });
                } else if (progress !== undefined) {
                  // Individual keyword processing progress - update current running step
                  setGeneratingSteps(prev => {
                    const newSteps = [...prev];
                    const currentRunningIndex = newSteps.findIndex(step => step.status === 'running');
                    if (currentRunningIndex !== -1) {
                      newSteps[currentRunningIndex] = {
                        ...newSteps[currentRunningIndex],
                        progress: progress
                      };
                      console.log(`Updated running step ${currentRunningIndex} progress to ${progress}`);
                    }
                    return newSteps;
                  });
                }
                
                // Log progress for debugging
                console.log('Progress update:', { phase, progress, message });
                console.log('Current steps state:', generatingSteps);
              } else if (eventType === 'phrase' || eventType === 'phrase-generated') {
                // Add new phrase (handle both old and new event types)
                const phrase = data;
                
                console.log('Received phrase event:', eventType, phrase);
                
                // Ensure all required properties are present
                const validatedPhrase: IntentPhrase = {
                  id: phrase.id || `phrase-${Date.now()}`,
                  phrase: phrase.phrase || 'Generated phrase',
                  relevanceScore: phrase.relevanceScore || 80,
                  intent: phrase.intent || 'Informational',
                  intentConfidence: phrase.intentConfidence || 75,
                  sources: Array.isArray(phrase.sources) ? phrase.sources : ['AI Generated'],
                  trend: phrase.trend || 'Rising',
                  editable: true,
                  selected: false,
                  parentKeyword: phrase.parentKeyword || 'Unknown',
                  keywordId: phrase.keywordId,
                  wordCount: phrase.wordCount || (phrase.phrase ? phrase.phrase.trim().split(/\s+/).length : 0)
                };
                
                setIntentPhrases(prev => {
                  // Check if phrase already exists by ID or by phrase text + keyword combination
                  const existingPhrase = prev.find(p => 
                    p.id === validatedPhrase.id || 
                    (p.phrase === validatedPhrase.phrase && p.parentKeyword === validatedPhrase.parentKeyword)
                  );
                  
                  if (existingPhrase) {
                    console.log('Phrase already exists, skipping:', validatedPhrase.phrase);
                    return prev;
                  }
                  
                  console.log('Adding new phrase:', validatedPhrase.phrase, 'for keyword:', validatedPhrase.parentKeyword);
                  console.log('Total phrases after adding:', prev.length + 1);
                  return [...prev, validatedPhrase];
                });
              } else if (eventType === 'phrase-updated') {
                // Update phrase ID from temporary to database ID
                const { oldId, newId } = data;
                setIntentPhrases(prev => 
                  prev.map(p => p.id === oldId ? { ...p, id: newId } : p)
                );
                setSelectedPhrases(prev => 
                  prev.map(id => id === oldId ? newId : id)
                );
              } else if (eventType === 'complete') {
                // Generation complete
                console.log('Generation complete:', data);
                console.log('Final phrases count:', intentPhrases.length);
                console.log('Expected total phrases:', data.totalPhrases);
                console.log('Expected total keywords:', data.totalKeywords);
                clearTimeout(phaseTimeout);
                setIsGenerating(false);
                return;
              } else if (eventType === 'error') {
                // Error occurred
                setError(data.error || 'An error occurred during generation');
                clearTimeout(phaseTimeout);
                setIsGenerating(false);
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in phrase generation:', error);
      setError('Failed to generate phrases. Please try again.');
      clearTimeout(phaseTimeout);
      setIsGenerating(false);
      
      // Add fallback mock phrases for testing
      console.log('Adding fallback mock phrases for testing');
      const selectedKeywordsForMock = currentData?.selectedKeywords.filter(kw => kw.isSelected) || [];
      const mockPhrases: IntentPhrase[] = keywordTerms.map((keyword, index) => ({
        id: `mock-${index}`,
        phrase: `How to implement ${keyword} for business growth and success`,
        relevanceScore: 85 + Math.floor(Math.random() * 15),
        sources: ['Community Discussions', 'Industry Reports'],
        trend: 'Rising',
        editable: true,
        selected: false,
        parentKeyword: keyword,
        keywordId: selectedKeywordsForMock[index]?.id,
        wordCount: 8
      }));
      
      setIntentPhrases(mockPhrases);
      setIsGenerating(false);
    }
  };

  const handleBackClick = async () => {
    setIsBackLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    onBack();
  };

  const handlePhraseSelect = (phraseId: string) => {
    // Don't allow selection of temporary phrases
    if (phraseId.toString().startsWith('temp-')) {
      alert('This phrase is still being processed and cannot be selected yet. Please wait for it to complete saving.');
      return;
    }
    
    if (selectedPhrases.includes(phraseId)) {
      setSelectedPhrases(prev => prev.filter(id => id !== phraseId));
    } else if (selectedPhrases.length < 3) {
      setSelectedPhrases(prev => [...prev, phraseId]);
    }
  };

  const handleNext = async () => {
    if (selectedPhrases.length === 0) {
      alert('Please select at least 1 intent phrase');
      return;
    }

    try {
      // Filter out temporary IDs (those starting with 'temp-')
      const validSelectedPhrases = selectedPhrases.filter(id => !id.toString().startsWith('temp-'));
      
      if (validSelectedPhrases.length === 0) {
        alert('No valid phrases selected. Please select phrases that have been successfully saved to the database.');
        return;
      }
      
      // Save selected phrases to database
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/intent-phrases/${domainId}/select`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedPhrases: validSelectedPhrases
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save selected phrases');
      }

      const result = await response.json();
      console.log('Selected phrases saved:', result);

      onNext({
        domainId,
        selectedPhrases: intentPhrases.filter(p => selectedPhrases.includes(p.id)),
        step3Data
      });
    } catch (error) {
      console.error('Error saving selected phrases:', error);
      alert('Failed to save selected phrases. Please try again.');
    }
  };

  // Create grouped phrases with proper structure
  const groupedPhrases = [];

  // Add keyword-based groups
  if (step3Data?.selectedKeywords && step3Data.selectedKeywords.length > 0) {
    step3Data.selectedKeywords
      .filter(keyword => keyword.isSelected)
      .forEach((keyword) => {
        const keywordPhrases = intentPhrases.filter(phrase => phrase.parentKeyword === keyword.keyword);
        if (keywordPhrases.length > 0) {
          groupedPhrases.push({
            keyword: keyword.keyword,
            phrases: keywordPhrases
          });
        }
      });
  }

  const handleEditPhrase = (phraseId: string) => {
    setIntentPhrases(prev =>
      prev.map(p =>
        p.id === phraseId ? { ...p, isEditing: !p.isEditing } : p
      )
    );
  };

  const handlePhraseChange = (phraseId: string, newPhrase: string) => {
    setIntentPhrases(prev => {
      let newScore = 50;
      const wordCount = newPhrase.trim().split(/\s+/).length;

      // Base score adjustments
      if (newPhrase.length > 50) newScore += 15;
      if (newPhrase.length > 100) newScore += 10;

      // Word count validation - penalize if outside 8-15 range
      if (wordCount >= 8 && wordCount <= 15) {
        newScore += 20; // Bonus for correct word count
      } else {
        newScore -= 30; // Penalty for incorrect word count
      }

      if (newPhrase.toLowerCase().includes('how') || newPhrase.toLowerCase().includes('what') || newPhrase.toLowerCase().includes('why')) {
        newScore += 10;
      }

      const actionWords = ['implement', 'create', 'build', 'develop', 'optimize', 'improve', 'best practices', 'solution'];
      const hasActionWords = actionWords.some(word => newPhrase.toLowerCase().includes(word));
      if (hasActionWords) newScore += 10;

      if (newPhrase.toLowerCase().includes('business') || newPhrase.toLowerCase().includes('company') || newPhrase.toLowerCase().includes('enterprise')) {
        newScore += 8;
      }

      newScore = Math.min(newScore, 100);
      newScore = Math.max(newScore, 0);

      return prev.map(p => {
        if (p.id === phraseId) {
          return {
            ...p,
            phrase: newPhrase,
            relevanceScore: newScore,
            wordCount: wordCount
          };
        }
        return p;
      });
    });
  };

  const handleSaveEdit = (phraseId: string) => {
    setIntentPhrases(prev => {
      const phrase = prev.find(p => p.id === phraseId);
      if (phrase) {
        const wordCount = phrase.phrase.trim().split(/\s+/).length;
        if (wordCount < 8 || wordCount > 15) {
          alert(`Warning: This phrase has ${wordCount} words. Please ensure it has between 8-15 words for optimal SEO performance.`);
        }
      }
      
      return prev.map(p =>
        p.id === phraseId ? { ...p, isEditing: false } : p
      );
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Loading Step 3 Data</h2>
            <p className="text-gray-600 mb-6">Retrieving your domain analysis and keyword selections</p>

            {/* Carousel Container with Smooth Transitions */}
            <div className="relative h-20 mb-8 overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentLoadingIndex * 100}%)` }}
              >
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Loading Domain Data
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Retrieving your domain analysis results
                  </p>
                </div>
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Fetching Keywords
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Loading your selected keywords
                  </p>
                </div>
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Preparing Analysis
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Setting up intent phrase generation
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2 mb-6">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
                    index === currentLoadingIndex
                      ? 'bg-blue-600 scale-125'
                      : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBackLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Loading Previous Data</h2>
            <p className="text-gray-600 mb-6">Retrieving your keyword selections from secure cloud storage</p>

            {/* Carousel Container with Smooth Transitions */}
            <div className="relative h-20 mb-8 overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentLoadingIndex * 100}%)` }}
              >
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Accessing Cloud Storage
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Connecting to secure data servers
                  </p>
                </div>
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Retrieving Keywords
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Loading your selected keyword data
                  </p>
                </div>
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Preparing Navigation
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Setting up previous step data
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2 mb-6">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
                    index === currentLoadingIndex
                      ? 'bg-blue-600 scale-125'
                      : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center">
                <i className="ri-cloud-line w-5 h-5 flex items-center justify-center text-blue-500 mr-3"></i>
                <span className="text-blue-800 text-sm">Your data is securely stored and encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-error-warning-line text-2xl text-red-600"></i>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Error Loading Data</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Intent Phrase Generation</h2>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Processing Selected Keywords</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {step3Data?.selectedKeywords && step3Data.selectedKeywords.length > 0 ? (
                  step3Data.selectedKeywords
                    .filter(keyword => keyword.isSelected)
                    .map((keyword, idx) => (
                      <div key={`keyword-${idx}`} className="flex items-center justify-between bg-white rounded p-2">
                        <span className="text-sm text-blue-700">{keyword.keyword}</span>
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-blue-500 rounded-full animate-spin border-t-transparent mr-2"></div>
                          <span className="text-xs text-blue-600">Processing</span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-blue-600">No keywords selected for processing</div>
                )}
              </div>
            </div>

            <div className="py-16">
              {/* Minimal Spinner */}
              <div className="flex justify-center mb-8">
                <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-gray-800"></div>
              </div>

              {/* Carousel Container with Smooth Transitions */}
              <div className="relative h-32 mb-12 overflow-hidden">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentTaskIndex * 100}%)` }}
                >
                  {generatingSteps.map((step, index) => (
                    <div key={index} className="w-full flex-shrink-0 text-center">
                      <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                        {step.name}
                      </h3>
                      <p className="text-gray-500 text-sm transition-opacity duration-500">
                        {step.description}
                      </p>
                      
                      {/* Sub-carousel for running steps */}
                      {step.status === 'running' && (
                        <div className="mt-4">
                          <div className="relative h-16 overflow-hidden">
                            <div 
                              className="flex transition-transform duration-700 ease-in-out"
                              style={{ transform: `translateX(-${currentLoadingIndex * 100}%)` }}
                            >
                              {step.name === 'Semantic Content Analysis' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Analyzing Brand Voice</h4>
                                    <p className="text-xs text-blue-600">Extracting brand personality and tone</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Identifying Themes</h4>
                                    <p className="text-xs text-blue-600">Finding recurring content themes</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Target Audience Analysis</h4>
                                    <p className="text-xs text-blue-600">Understanding user demographics</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Community Data Mining' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Reddit Analysis</h4>
                                    <p className="text-xs text-blue-600">Mining community discussions</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Quora Research</h4>
                                    <p className="text-xs text-blue-600">Extracting expert insights</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">SERP API Integration</h4>
                                    <p className="text-xs text-blue-600">Processing search results</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Competitor Research' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Identifying Competitors</h4>
                                    <p className="text-xs text-blue-600">Finding market rivals</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Strategy Analysis</h4>
                                    <p className="text-xs text-blue-600">Analyzing competitor approaches</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Gap Identification</h4>
                                    <p className="text-xs text-blue-600">Finding market opportunities</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Search Pattern Analysis' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">User Behavior Analysis</h4>
                                    <p className="text-xs text-blue-600">Studying search patterns</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Query Analysis</h4>
                                    <p className="text-xs text-blue-600">Understanding search intent</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Trend Identification</h4>
                                    <p className="text-xs text-blue-600">Finding emerging patterns</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Creating optimized intent phrases' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Phrase Generation</h4>
                                    <p className="text-xs text-blue-600">Creating optimized search phrases</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">SEO Optimization</h4>
                                    <p className="text-xs text-blue-600">Applying SEO best practices</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Content Alignment</h4>
                                    <p className="text-xs text-blue-600">Matching brand voice</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Intent Classification' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Intent Analysis</h4>
                                    <p className="text-xs text-blue-600">Classifying user intent</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Confidence Scoring</h4>
                                    <p className="text-xs text-blue-600">Calculating intent confidence</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Category Assignment</h4>
                                    <p className="text-xs text-blue-600">Assigning intent categories</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Relevance Score' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Semantic Analysis</h4>
                                    <p className="text-xs text-blue-600">Computing semantic relevance</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Community Scoring</h4>
                                    <p className="text-xs text-blue-600">Analyzing community frequency</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Final Scoring</h4>
                                    <p className="text-xs text-blue-600">Calculating final relevance scores</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Progress Dots for sub-carousel */}
                          <div className="flex justify-center space-x-1 mt-3">
                            {[0, 1, 2].map((dotIndex) => (
                              <div
                                key={dotIndex}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ease-out ${
                                  dotIndex === currentLoadingIndex
                                    ? 'bg-blue-600 scale-125'
                                    : 'bg-gray-300'
                                }`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center space-x-2 mt-6">
                {generatingSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ease-out ${
                      step.status === 'completed'
                        ? 'bg-gray-800 scale-110'
                        : index === currentTaskIndex
                        ? 'bg-gray-600 scale-125'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            <div className="text-center mt-12 mb-4">
              <p className="text-gray-600">Analyzing community conversations and search patterns to generate the most relevant intent phrases...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {/* Simple Header */}
        <div className="p-8 border-b border-gray-100">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Intent Phrases Selection</h2>
          
          {/* Minimal Selected Keywords Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              {step3Data?.selectedKeywords && step3Data.selectedKeywords.length > 0 ? (
                step3Data.selectedKeywords
                  .filter(keyword => keyword.isSelected)
                  .map((keyword, idx) => (
                    <span key={`selected-keyword-${idx}`} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full">
                      {keyword.keyword}
                    </span>
                  ))
              ) : (
                <span className="text-gray-500 text-sm">No keywords selected</span>
              )}
            </div>
          </div>
        </div>

        {/* Clean Content Area */}
        <div className="p-8">
          {/* Selection Counter */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Select Intent Phrases</h3>
              <p className="text-sm text-gray-600">
                Choose up to 3 phrases for detailed analysis • {selectedPhrases.length}/3 selected
              </p>
            </div>
            
            {selectedPhrases.length >= 3 && (
              <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                Maximum reached
              </div>
            )}
          </div>

          {/* Simplified Phrase Cards */}
          <div className="space-y-6">
            {groupedPhrases.map((group, groupIdx) => (
              <div key={`group-${groupIdx}`} className="space-y-3">
                {/* Minimal Keyword Label */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-600">{group.keyword}</span>
                </div>
                
                {/* Clean Phrase Cards */}
                <div className="space-y-2 pl-4">
                  {group.phrases.map((phrase) => (
                    <div key={phrase.id} className={`group relative border rounded-lg p-4 transition-all ${
                      selectedPhrases.includes(phrase.id)
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      
                      {/* Selection Indicator */}
                      <div className="absolute left-4 top-4">
                        <input
                          type="checkbox"
                          checked={selectedPhrases.includes(phrase.id)}
                          onChange={() => handlePhraseSelect(phrase.id)}
                          disabled={
                            !selectedPhrases.includes(phrase.id) && selectedPhrases.length >= 3 ||
                            phrase.id.toString().startsWith('temp-')
                          }
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-900"
                        />
                      </div>

                      {/* Main Content */}
                      <div className="pl-8">
                        {phrase.isEditing ? (
                          <div className="flex items-start space-x-3">
                            <textarea
                              value={phrase.phrase}
                              onChange={(e) => handlePhraseChange(phrase.id, e.target.value)}
                              className="flex-1 text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                              rows={2}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(phrase.id)}
                              className="text-gray-600 hover:text-gray-900 mt-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Phrase Text */}
                            <p className="text-gray-900 leading-relaxed pr-8">
                              {phrase.phrase}
                            </p>
                            
                            {/* Meta Info - Single Row */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <span>Score:</span>
                                <span className="font-medium text-gray-700">{phrase.relevanceScore}</span>
                              </span>
                              
                              <span className="flex items-center space-x-1">
                                <span>Intent:</span>
                                <span className="font-medium text-gray-700">{phrase.intent || 'Info'}</span>
                              </span>
                              
                              <span className="flex items-center space-x-1">
                                <span>Words:</span>
                                <span className={`font-medium ${
                                  phrase.wordCount && phrase.wordCount >= 12 && phrase.wordCount <= 15 
                                    ? 'text-green-600' 
                                    : 'text-amber-600'
                                }`}>
                                  {phrase.wordCount || phrase.phrase.trim().split(/\s+/).length}
                                </span>
                              </span>
                              
                              {phrase.id.toString().startsWith('temp-') && (
                                <span className="text-amber-600 font-medium">Processing...</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Edit Button - Top Right */}
                      {!phrase.isEditing && (
                        <button
                          onClick={() => handleEditPhrase(phrase.id)}
                          className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Footer */}
        <div className="p-8 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>

          <div className="flex items-center space-x-4">
            {selectedPhrases.length > 0 && (
              <div className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Ready for analysis
              </div>
            )}
            
            <button
              onClick={handleNext}
              disabled={selectedPhrases.length === 0}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 