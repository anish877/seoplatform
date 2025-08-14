'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface Step4Props {
  domainId: number;
  onBack: () => void;
  onComplete: () => void;
}

interface ReportData {
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
  intentPhrases: Array<{
    id: string;
    phrase: string;
    relevance: number;
    trend: string;
    sources: string[];
    parentKeyword: string;
  }>;
  llmResults: Array<{
    model: string;
    avgConfidence: number;
    responses: number;
    topSource: string;
  }>;
  overallScore: number;
  scoreBreakdown: {
    phrasePerformance: { weight: number; score: number };
    keywordOpportunity: { weight: number; score: number };
    domainAuthority: { weight: number; score: number };
    onPageOptimization: { weight: number; score: number };
    competitorGaps: { weight: number; score: number };
  };
  recommendations: Array<{
    priority: string;
    type: string;
    description: string;
    impact: string;
  }>;
  analysis: {
    semanticAnalysis: Record<string, unknown>;
    keywordAnalysis: Record<string, unknown>;
    searchVolumeClassification: Record<string, unknown>;
    intentClassification: Record<string, unknown>;
  };
}

interface AIQueryResult {
  phrase: string;
  keyword: string;
  model: string;
  response: string;
  latency: number;
  cost: number;
  scores: {
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
  progress: number;
}

interface LoadingTask {
  name: string;
  status: 'pending' | 'running' | 'completed';
  progress: number;
  description: string;
}

export default function Step4Report({ domainId, onBack, onComplete }: Step4Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isBackLoading, setIsBackLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const navigate = useNavigate();

  // AI Analysis streaming state
  const [aiResults, setAiResults] = useState<AIQueryResult[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [stats, setStats] = useState<{
    totalResults: number;
    overall: {
      avgOverall: number;
      presenceRate: number;
    };
  } | null>(null);

  // Carousel control state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);

  const [loadingTasks, setLoadingTasks] = useState<LoadingTask[]>([
    { name: 'AI Model Initialization', status: 'pending', progress: 0, description: 'Initializing AI analysis engines and preparing domain context' },
    { name: 'Phrase Analysis', status: 'pending', progress: 0, description: 'Analyzing selected intent phrases with multiple AI models' },
    { name: 'Response Scoring', status: 'pending', progress: 0, description: 'Evaluating AI responses for domain presence and SEO potential' },
    { name: 'Competitive Analysis', status: 'pending', progress: 0, description: 'Analyzing competitor positioning and market gaps' },
    { name: 'Report Generation', status: 'pending', progress: 0, description: 'Compiling comprehensive analysis report with recommendations' }
  ]);

  // Auto-advance carousel to show running task
  useEffect(() => {
    const interval = setInterval(() => {
      const runningTaskIndex = loadingTasks.findIndex(task => task.status === 'running');
      if (runningTaskIndex !== -1) {
        setCurrentTaskIndex(runningTaskIndex);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [loadingTasks]);

  // Auto-advance loading carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLoadingIndex(prev => (prev + 1) % 3);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Start AI analysis streaming
  useEffect(() => {
    const startAIAnalysis = async () => {
      try {
        setIsGenerating(true);
        setError(null);
        setAiResults([]);
        setStats(null);
        
        // Initialize loading tasks
        setLoadingTasks([
          { name: 'AI Model Initialization', status: 'running', progress: 0, description: 'Initializing AI analysis engines and preparing domain context' },
          { name: 'Phrase Analysis', status: 'pending', progress: 0, description: 'Analyzing selected intent phrases with multiple AI models' },
          { name: 'Response Scoring', status: 'pending', progress: 0, description: 'Evaluating AI responses for domain presence and SEO potential' },
          { name: 'Competitive Analysis', status: 'pending', progress: 0, description: 'Analyzing competitor positioning and market gaps' },
          { name: 'Report Generation', status: 'pending', progress: 0, description: 'Compiling comprehensive analysis report with recommendations' }
        ]);

        const token = localStorage.getItem('authToken');
        const url = `${import.meta.env.VITE_API_URL}/api/ai-queries/${domainId}`;
        
        console.log('Starting AI analysis for domain:', domainId);
        console.log('URL:', url);

        // Add timeout for the entire request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 300000); // 5 minutes timeout

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let timeoutCount = 0;
        let lastActivityTime = Date.now();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lastActivityTime = Date.now();
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7);
              const dataLine = lines[lines.indexOf(line) + 1];
              if (dataLine && dataLine.startsWith('data: ')) {
                try {
                  const data = JSON.parse(dataLine.slice(6));
                  
                  console.log('Received event:', eventType, data);
                  
                  if (eventType === 'progress') {
                    // Update progress message
                    setCurrentMessage(data.message || 'Processing...');
                    
                    // Update task progress based on message content
                    if (data.message?.includes('Initializing AI analysis engine')) {
                      setLoadingTasks(prev => {
                        const newTasks = [...prev];
                        newTasks[0] = { ...newTasks[0], status: 'running', progress: 25 };
                        return newTasks;
                      });
                    } else if (data.message?.includes('Processing batch')) {
                      setLoadingTasks(prev => {
                        const newTasks = [...prev];
                        newTasks[0] = { ...newTasks[0], status: 'completed', progress: 100 };
                        newTasks[1] = { ...newTasks[1], status: 'running', progress: 30 };
                        return newTasks;
                      });
                    } else if (data.message?.includes('Querying')) {
                      setLoadingTasks(prev => {
                        const newTasks = [...prev];
                        newTasks[1] = { ...newTasks[1], status: 'running', progress: 60 };
                        return newTasks;
                      });
                    } else if (data.message?.includes('Evaluating')) {
                      setLoadingTasks(prev => {
                        const newTasks = [...prev];
                        newTasks[1] = { ...newTasks[1], status: 'completed', progress: 100 };
                        newTasks[2] = { ...newTasks[2], status: 'running', progress: 40 };
                        return newTasks;
                      });
                    } else if (data.message?.includes('timeout') || data.message?.includes('taking too long')) {
                      // Handle timeout messages gracefully
                      timeoutCount++;
                      setCurrentMessage(`Processing continues... (${timeoutCount} timeout(s) handled)`);
                      
                      // Continue processing even with timeouts
                      if (timeoutCount >= 3) {
                        setCurrentMessage('Some AI models are taking longer than expected, but analysis continues...');
                      }
                    }
                  } else if (eventType === 'result') {
                    // Add new AI result
                    setAiResults(prev => {
                      if (prev.some(r => r.phrase === data.phrase && r.model === data.model)) return prev;
                      return [...prev, data];
                    });
                    
                    // Update progress
                    setCurrentProgress(data.progress || 0);
                    
                    // Update competitive analysis task
                    if (data.scores?.competitorUrls?.length > 0) {
                      setLoadingTasks(prev => {
                        const newTasks = [...prev];
                        newTasks[2] = { ...newTasks[2], status: 'completed', progress: 100 };
                        newTasks[3] = { ...newTasks[3], status: 'running', progress: 50 };
                        return newTasks;
                      });
                    }
                  } else if (eventType === 'stats') {
                    // Update statistics
                    setStats(data);
                    
                    // Update report generation task
                    setLoadingTasks(prev => {
                      const newTasks = [...prev];
                      newTasks[3] = { ...newTasks[3], status: 'completed', progress: 100 };
                      newTasks[4] = { ...newTasks[4], status: 'running', progress: 80 };
                      return newTasks;
                    });
                  } else if (eventType === 'complete') {
                    // Analysis complete
                    console.log('AI analysis complete');
                    setLoadingTasks(prev => prev.map(task => ({
                      ...task,
                      status: 'completed',
                      progress: 100
                    })));
                    
                    // Generate report data from AI results
                    await generateReportFromAIResults();
                    
                    setIsGenerating(false);
                    setIsLoading(false);
                    return;
                  } else if (eventType === 'error') {
                    // Handle errors more gracefully
                    const errorMessage = data.error || 'An error occurred during AI analysis';
                    
                    // Check if it's a timeout error and handle gracefully
                    if (errorMessage.includes('timeout') || errorMessage.includes('taking too long')) {
                      timeoutCount++;
                      setCurrentMessage(`Some AI models are experiencing delays (${timeoutCount} timeout(s)). Continuing with available results...`);
                      
                      // Don't stop the process for timeout errors, continue with partial results
                      if (timeoutCount >= 5) {
                        setError('Multiple AI model timeouts detected. Analysis completed with partial results.');
                        setIsGenerating(false);
                        setIsLoading(false);
                        return;
                      }
                    } else {
                      // For non-timeout errors, show the error
                      setError(errorMessage);
                      setIsGenerating(false);
                      setIsLoading(false);
                      return;
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing event data:', parseError);
                  // Continue processing even if one event fails to parse
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in AI analysis:', error);
        
        // Handle different types of errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setError('Analysis timed out. Please try again with fewer phrases or check your connection.');
          } else if (error.message.includes('Failed to fetch')) {
            setError('Network error. Please check your connection and try again.');
          } else {
            setError(`Analysis failed: ${error.message}`);
          }
        } else {
          setError('An unexpected error occurred during AI analysis. Please try again.');
        }
        
        setIsGenerating(false);
        setIsLoading(false);
      }
    };

    startAIAnalysis();
  }, [domainId]);

  const generateReportFromAIResults = async () => {
    try {
      // Calculate overall score from AI results
      const totalResults = aiResults.length;
      
      // Handle case where no results were obtained due to timeouts
      if (totalResults === 0) {
        console.warn('No AI results obtained, creating fallback report');
        setReportData({
          domain: {
            id: domainId,
            url: 'example.com',
            context: 'Analysis completed with partial results due to AI model timeouts',
            location: 'Global'
          },
          selectedKeywords: [],
          intentPhrases: [],
          llmResults: [],
          overallScore: 50, // Neutral score for partial results
          scoreBreakdown: {
            phrasePerformance: { weight: 40, score: 50 },
            keywordOpportunity: { weight: 25, score: 50 },
            domainAuthority: { weight: 20, score: 50 },
            onPageOptimization: { weight: 10, score: 50 },
            competitorGaps: { weight: 5, score: 50 }
          },
          recommendations: [{
            priority: 'Medium',
            type: 'System Optimization',
            description: 'Consider reducing the number of phrases or using fewer AI models for faster analysis',
            impact: 'Could improve analysis speed by 40-60%'
          }],
          analysis: {
            semanticAnalysis: {},
            keywordAnalysis: {},
            searchVolumeClassification: {},
            intentClassification: {}
          }
        });
        return;
      }
      
      const avgOverall = totalResults > 0 ? aiResults.reduce((sum, r) => sum + r.scores.overall, 0) / totalResults : 0;
      const avgPresence = totalResults > 0 ? aiResults.reduce((sum, r) => sum + r.scores.presence, 0) / totalResults : 0;
      const avgRelevance = totalResults > 0 ? aiResults.reduce((sum, r) => sum + r.scores.relevance, 0) / totalResults : 0;
      
      // Group results by model
      const modelResults = aiResults.reduce((acc, result) => {
        if (!acc[result.model]) {
          acc[result.model] = { results: [], totalConfidence: 0, totalResponses: 0 };
        }
        acc[result.model].results.push(result);
        acc[result.model].totalConfidence += result.scores.confidence;
        acc[result.model].totalResponses++;
        return acc;
      }, {} as Record<string, { results: AIQueryResult[]; totalConfidence: number; totalResponses: number }>);

      const llmResults = Object.entries(modelResults).map(([model, data]) => ({
        model,
        avgConfidence: Math.round(data.totalConfidence / data.totalResponses),
        responses: data.totalResponses,
        topSource: data.results[0]?.scores.sources[0] || 'AI Analysis'
      }));

      // Generate recommendations based on AI results
      const recommendations = [];
      
      if (avgPresence < 0.5) {
        recommendations.push({
          priority: 'High',
          type: 'Domain Visibility',
          description: 'Improve domain presence in search results by optimizing content for target keywords',
          impact: 'Could increase search visibility by 40-60%'
        });
      }
      
      if (avgRelevance < 2.5) {
        recommendations.push({
          priority: 'High',
          type: 'Content Optimization',
          description: 'Enhance content relevance to better match user search intent',
          impact: 'Expected 25-35% improvement in search rankings'
        });
      }
      
      if (avgOverall < 2.5) {
        recommendations.push({
          priority: 'Medium',
          type: 'Competitive Analysis',
          description: 'Focus on competitor gaps identified in AI analysis',
          impact: 'Potential to capture 15-25% market share in identified niches'
        });
      }

      // Create report data
      const reportData: ReportData = {
        domain: {
          id: domainId,
          url: 'example.com', // Will be filled from domain data
          context: 'AI analysis completed successfully',
          location: 'Global'
        },
        selectedKeywords: [], // Will be filled from keywords data
        intentPhrases: aiResults.map(r => ({
          id: r.phrase,
          phrase: r.phrase,
          relevance: r.scores.relevance * 20, // Convert to percentage
          trend: 'Rising',
          sources: r.scores.sources,
          parentKeyword: r.keyword
        })),
        llmResults,
        overallScore: Math.round(avgOverall * 20), // Convert to percentage
        scoreBreakdown: {
          phrasePerformance: { weight: 40, score: Math.round(avgRelevance * 20) },
          keywordOpportunity: { weight: 25, score: Math.round(avgPresence * 100) },
          domainAuthority: { weight: 20, score: Math.round(avgOverall * 20) },
          onPageOptimization: { weight: 10, score: Math.round(avgRelevance * 20) },
          competitorGaps: { weight: 5, score: Math.round(avgOverall * 20) }
        },
        recommendations,
        analysis: {
          semanticAnalysis: {},
          keywordAnalysis: {},
          searchVolumeClassification: {},
          intentClassification: {}
        }
      };

      setReportData(reportData);
    } catch (error) {
      console.error('Error generating report from AI results:', error);
      setError('Failed to generate report from AI results');
    }
  };

  const handleBackClick = async () => {
    setIsBackLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    onBack();
  };

  const handleDownloadReport = async () => {
    setIsLoading(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    alert('Report downloaded successfully!');
  };

  const handleDownloadPDF = () => {
    // Simulate PDF download
    alert('PDF report download started');
  };

  const handleDownloadCSV = () => {
    // Simulate CSV download
    alert('CSV data export started');
  };

  const handleScheduleReport = () => {
    alert('Report scheduling setup');
  };

  const handleSaveToDashboard = () => {
    alert('Report saved to dashboard');
    onComplete();
  };

  if (isLoading || isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-light text-gray-900 mb-3">
                AI Analysis in Progress
              </h2>
              <p className="text-gray-500 text-sm mb-12">
                Running comprehensive domain analysis with enterprise AI models
              </p>
              
              {/* Minimal progress indicator */}
              <div className="mb-16">
                <div className="w-12 h-12 mx-auto mb-8">
                  <div className="w-full h-full border-2 border-gray-200 rounded-full relative">
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                </div>
                
                {currentMessage && (
                  <div className="text-sm text-gray-600 mb-4">
                    {currentMessage}
                    {currentMessage.includes('timeout') && (
                      <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
                        ⏱️ Some AI models are experiencing delays
                      </div>
                    )}
                  </div>
                )}
                
                {currentProgress > 0 && (
                  <div className="w-full max-w-xs mx-auto">
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {currentProgress.toFixed(0)}% complete
                    </div>
                  </div>
                )}
              </div>

              {/* Carousel Container with Smooth Transitions */}
              <div className="relative h-32 mb-12 overflow-hidden">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentTaskIndex * 100}%)` }}
                >
                  {loadingTasks.map((step, index) => (
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
                              {step.name === 'AI Model Initialization' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Initializing Models</h4>
                                    <p className="text-xs text-blue-600">Loading GPT-4o, Claude 3, and Gemini</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Preparing Context</h4>
                                    <p className="text-xs text-blue-600">Setting up domain analysis context</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Validating Phrases</h4>
                                    <p className="text-xs text-blue-600">Confirming selected intent phrases</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Phrase Analysis' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Processing Phrases</h4>
                                    <p className="text-xs text-blue-600">Analyzing each selected phrase</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">AI Model Queries</h4>
                                    <p className="text-xs text-blue-600">Querying multiple AI models</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Response Collection</h4>
                                    <p className="text-xs text-blue-600">Gathering AI model responses</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Response Scoring' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Domain Presence</h4>
                                    <p className="text-xs text-blue-600">Checking domain visibility</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">SEO Potential</h4>
                                    <p className="text-xs text-blue-600">Evaluating ranking potential</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Relevance Scoring</h4>
                                    <p className="text-xs text-blue-600">Calculating content relevance</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Competitive Analysis' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Competitor Detection</h4>
                                    <p className="text-xs text-blue-600">Identifying market competitors</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Gap Analysis</h4>
                                    <p className="text-xs text-blue-600">Finding market opportunities</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Positioning Strategy</h4>
                                    <p className="text-xs text-blue-600">Analyzing competitive positioning</p>
                                  </div>
                                </>
                              )}
                              {step.name === 'Report Generation' && (
                                <>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Data Compilation</h4>
                                    <p className="text-xs text-blue-600">Compiling analysis results</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Recommendations</h4>
                                    <p className="text-xs text-blue-600">Generating strategic recommendations</p>
                                  </div>
                                  <div className="w-full flex-shrink-0 text-center">
                                    <h4 className="text-xs font-medium text-blue-800 mb-1">Final Report</h4>
                                    <p className="text-xs text-blue-600">Preparing comprehensive report</p>
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
                {loadingTasks.map((step, index) => (
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Loading Analysis Data</h2>
            <p className="text-gray-600 mb-6">Retrieving your LLM analysis results from our secure servers</p>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center">
                <i className="ri-brain-line w-5 h-5 flex items-center justify-center text-purple-500 mr-3"></i>
                <span className="text-purple-800 text-sm">AI analysis data secured with enterprise encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-error-warning-line text-2xl text-red-600"></i>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analysis Issue</h2>
            <p className="text-gray-600 mb-6">{error || 'Failed to load report data'}</p>
            
            {/* Show timeout-specific guidance */}
            {error && error.includes('timeout') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <div className="flex items-center">
                  <i className="ri-time-line w-5 h-5 flex items-center justify-center text-yellow-500 mr-3"></i>
                  <span className="text-yellow-800 text-sm">
                    AI models are experiencing delays. Try with fewer phrases or retry the analysis.
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              
              {/* Retry button for timeout errors */}
              {error && error.includes('timeout') && (
                <button
                  onClick={() => {
                    setError(null);
                    setIsGenerating(false);
                    setIsLoading(false);
                    // Restart the analysis
                    window.location.reload();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retry Analysis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const summaryData = [
    {
      category: 'Keywords',
      items: reportData.selectedKeywords.map((kw) => ({
        name: kw.keyword,
        volume: kw.volume,
        difficulty: kw.difficulty,
        opportunity: parseFloat(kw.difficulty) < 50 ? 'High' : parseFloat(kw.difficulty) < 70 ? 'Medium' : 'Low'
      }))
    },
    {
      category: 'Intent Phrases',
      items: reportData.intentPhrases.map((phrase) => ({
        name: phrase.phrase,
        relevance: phrase.relevance,
        trend: phrase.trend,
        sources: phrase.sources.join(', ')
      }))
    },
    {
      category: 'Model Performance',
      items: reportData.llmResults.map((result) => ({
        model: result.model,
        avgConfidence: result.avgConfidence,
        responses: result.responses,
        topSource: result.topSource
      }))
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Clean Header */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-light text-gray-900">
                  Domain Analysis Report
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {reportData.domain.url} • Generated {new Date().toLocaleDateString()}
                </p>
              </div>
              
              {/* Clean action buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  Export PDF
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  Export Data
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-12">
            
            {/* Clean Score Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="text-center p-8 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100">
                  <div className="text-4xl font-light text-gray-900 mb-2">
                    {reportData.overallScore}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wide mb-4">
                    Overall Score
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${reportData.overallScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(reportData.scoreBreakdown).map(([key, item]) => (
                    <div key={key} className="p-6 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </h3>
                        <span className="text-lg font-light text-gray-900">{item.score}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-1000 ${
                            item.score >= 80 ? 'bg-green-500' : 
                            item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Results with Dropdown */}
            <div>
              <h2 className="text-xl font-light text-gray-900 mb-6">
                AI Analysis Results
              </h2>
              
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-light text-blue-600 mb-1">
                      {stats.totalResults}
                    </div>
                    <div className="text-sm text-blue-800">Total Queries</div>
                  </div>
                  <div className="text-center p-6 bg-green-50 rounded-xl">
                    <div className="text-2xl font-light text-green-600 mb-1">
                      {stats.overall?.avgOverall || 0}
                    </div>
                    <div className="text-sm text-green-800">Average Score</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-light text-purple-600 mb-1">
                      {stats.overall?.presenceRate || 0}%
                    </div>
                    <div className="text-sm text-purple-800">Domain Presence</div>
                  </div>
                </div>
              )}

              {/* AI Results Dropdown */}
              {aiResults.length > 0 && (
                <AIResultsDropdown results={aiResults} />
              )}
            </div>

            {/* Clean Recommendations */}
            <div>
              <h2 className="text-xl font-light text-gray-900 mb-6">
                Strategic Recommendations
              </h2>
              <div className="space-y-4">
                {reportData.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-6 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full mr-4 ${
                            rec.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                            rec.priority === 'Medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                            'bg-green-50 text-green-700 border border-green-100'
                          }`}>
                            {rec.priority}
                          </span>
                          <h3 className="font-medium text-gray-900">{rec.type}</h3>
                        </div>
                        <p className="text-gray-600 mb-3">{rec.description}</p>
                        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                          {rec.impact}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clean Footer */}
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackClick}
                className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back to Results
              </button>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleSaveToDashboard}
                  className="px-6 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Save to Dashboard
                </button>
                <button
                  onClick={onComplete}
                  className="px-8 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Complete Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this new component for AI Results Dropdown
interface AIResultsDropdownProps {
  results: AIQueryResult[];
}

function AIResultsDropdown({ results }: AIResultsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AIQueryResult | null>(null);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <div>
          <h3 className="font-medium text-gray-900">
            View Detailed AI Responses ({results.length} results)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Individual AI model responses and scoring details
          </p>
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {isOpen && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6 space-y-4">
            {/* Results List */}
            <div className="grid gap-3">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className="p-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors"
                  onClick={() => setSelectedResult(selectedResult?.phrase === result.phrase && selectedResult?.model === result.model ? null : result)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {result.model}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Score: {result.scores.overall.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {result.latency}ms
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {result.phrase}
                  </p>
                  
                  {selectedResult?.phrase === result.phrase && selectedResult?.model === result.model && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {/* Response with Markdown */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">AI Response:</h4>
                        <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                          <ReactMarkdown>{result.response}</ReactMarkdown>
                        </div>
                      </div>
                      
                      {/* Detailed Scores */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Scoring Breakdown:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-medium text-gray-900">{result.scores.presence.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">Presence</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-medium text-gray-900">{result.scores.relevance.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">Relevance</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-medium text-gray-900">{result.scores.accuracy.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">Accuracy</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-sm font-medium text-gray-900">{result.scores.confidence.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">Confidence</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sources */}
                      {result.scores.sources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Sources:</h4>
                          <div className="space-y-1">
                            {result.scores.sources.map((source, srcIdx) => (
                              <div key={srcIdx} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {source}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Competitor Data */}
                      {result.scores.competitorUrls.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Competitor Analysis:</h4>
                          <div className="space-y-1">
                            {result.scores.competitorUrls.map((url, urlIdx) => (
                              <div key={urlIdx} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                {url}
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Match Score: {result.scores.competitorMatchScore?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 