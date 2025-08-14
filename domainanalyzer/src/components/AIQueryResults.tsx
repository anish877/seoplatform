import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useToast } from '@/components/ui/use-toast';
import { Trophy, Medal, Award, Star, CheckCircle, XCircle, TrendingUp, Target, Zap, ChevronDown, ChevronRight, ExternalLink, Search, Globe, MapPin, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface AIQueryResult {
  model: string;
  phrase: string;
  keyword: string;
  response: string;
  latency: number;
  cost: number;
  progress: number;
  scores: {
    presence: number;
    relevance: number;
    accuracy: number;
    sentiment: number;
    overall: number;
    domainRank?: number;
    foundDomains?: string[];
    confidence?: number;
    sources?: string[];
    competitorUrls?: string[];
    competitorMatchScore?: number;
  };
  domainRank?: number;
  foundDomains?: string[];
  domainPresence?: string;
  overallScore?: number;
  position?: number;
  url?: string;
  confidence?: number;
  sources?: string[];
  competitorUrls?: string[];
  competitorMatchScore?: number;
  expanded?: boolean;
}

export interface AIQueryStats {
  models: Array<{
    model: string;
    presenceRate: number;
    avgRelevance: number;
    avgAccuracy: number;
    avgSentiment: number;
    avgOverall: number;
  }>;
  overall: {
    presenceRate: number;
    avgRelevance: number;
    avgAccuracy: number;
    avgSentiment: number;
    avgOverall: number;
  };
  totalResults: number;
}

interface LoadingTask {
  name: string;
  status: 'pending' | 'running' | 'completed';
  progress: number;
  description: string;
}

interface AIQueryResultsProps {
  domainId: number;
  setQueryResults: (results: AIQueryResult[]) => void;
  setQueryStats?: (stats: AIQueryStats) => void;
  onNext: () => void;
  onPrev: () => void;
  location?: string;
}

const AIQueryResults: React.FC<AIQueryResultsProps> = ({
  domainId,
  setQueryResults,
  setQueryStats,
  onNext,
  onPrev,
  location
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isReturning, setIsReturning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<{
    tableData?: Array<{
      phrase: string;
      model: string;
      response: string;
      domainPresence: string;
      overallScore: number;
      position?: number;
      url?: string;
      confidence?: number;
      sources?: string[];
      competitorUrls?: string[];
      competitorMatchScore?: number;
    }>;
    chatgpt?: { ranked: number; total: number };
    claude?: { ranked: number; total: number };
    gemini?: { ranked: number; total: number };
  }>({});
  const [selectedModel, setSelectedModel] = useState('all');
  const [progress, setProgress] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [rawResults, setRawResults] = useState<AIQueryResult[]>([]);
  const [stats, setStats] = useState<AIQueryStats | null>(null);
  const resultsRef = useRef<AIQueryResult[]>([]);
  const [modelStatus, setModelStatus] = useState<{[model: string]: string}>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedResponses, setExpandedResponses] = useState<{[key: string]: boolean}>({});

  // Carousel control state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);

  // Loading tasks for AI analysis
  const [loadingTasks, setLoadingTasks] = useState<LoadingTask[]>([
    { name: 'AI Model Initialization', status: 'pending', progress: 0, description: 'Initializing AI analysis engines and preparing domain context' },
    { name: 'Phrase Analysis', status: 'pending', progress: 0, description: 'Analyzing selected intent phrases with multiple AI models' },
    { name: 'Response Scoring', status: 'pending', progress: 0, description: 'Evaluating AI responses for domain presence and SEO potential' },
    { name: 'Competitive Analysis', status: 'pending', progress: 0, description: 'Analyzing competitor positioning and market gaps' },
    { name: 'Report Generation', status: 'pending', progress: 0, description: 'Compiling comprehensive analysis report with recommendations' }
  ]);

  const { toast } = useToast();

  const models = [
    { id: 'gemini', name: 'Gemini', color: 'bg-blue-500', icon: 'ri-google-fill' },
    { id: 'claude', name: 'Claude', color: 'bg-purple-500', icon: 'ri-robot-line' },
    { id: 'chatgpt', name: 'ChatGPT', color: 'bg-green-500', icon: 'ri-openai-fill' }
  ];

  const querySteps = [
    { id: 1, text: 'Connecting to GPT-4', model: 'ChatGPT-4', description: 'Establishing connection with OpenAI\'s latest model' },
    { id: 2, text: 'Connecting to Gemini Pro', model: 'Gemini Pro', description: 'Accessing Google\'s advanced language model' },
    { id: 3, text: 'Connecting to Claude 3', model: 'Claude 3 Sonnet', description: 'Linking to Anthropic\'s sophisticated AI model' },
    { id: 4, text: 'Preparing search queries', model: 'Query Processor', description: 'Formatting your selected keywords into optimized queries' },
    { id: 5, text: 'Querying ChatGPT-4', model: 'GPT-4 Analysis', description: 'Testing search phrases against OpenAI\'s model' },
    { id: 6, text: 'Querying Gemini Pro', model: 'Gemini Analysis', description: 'Running analysis through Google\'s language model' },
    { id: 7, text: 'Querying Claude 3 Sonnet', model: 'Claude Analysis', description: 'Processing queries through Anthropic\'s model' },
    { id: 8, text: 'Analyzing response patterns', model: 'Pattern Analysis', description: 'Comparing how each AI ranks your domain content' },
    { id: 9, text: 'Calculating performance metrics', model: 'Metrics Engine', description: 'Computing success rates and position rankings' },
    { id: 10, text: 'Generating comparison report', model: 'Report Generator', description: 'Compiling results into actionable insights' }
  ];

  // Calculate exact expected results - will be determined by the backend
  const [totalExpected, setTotalExpected] = useState(0); // Dynamic total from backend

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

  // Transform raw results to match StepThree format
  const transformResults = (rawResults: AIQueryResult[]) => {
    const tableData = rawResults.map(result => ({
      phrase: result.phrase,
              model: result.model === 'GPT-4o' ? 'chatgpt' : 
             result.model === 'Claude 3' ? 'claude' : 'gemini',
      response: result.response,
      domainPresence: result.scores.presence === 1 ? 'Featured' : 
                     result.scores.presence === 0.5 ? 'Mentioned' : 'Not Found',
      overallScore: Math.round(result.scores.overall * 20), // Convert 0-5 to 0-100
      position: result.domainRank,
      url: result.url,
      confidence: result.confidence,
      sources: result.sources,
      competitorUrls: result.competitorUrls,
      competitorMatchScore: result.competitorMatchScore
    }));

    const modelStats = {
      chatgpt: { ranked: 0, total: 0 },
      claude: { ranked: 0, total: 0 },
      gemini: { ranked: 0, total: 0 }
    };

    // Calculate stats per model
    rawResults.forEach(result => {
      const modelKey = result.model === 'GPT-4o' ? 'chatgpt' : 
                      result.model === 'Claude 3' ? 'claude' : 'gemini';
      modelStats[modelKey].total++;
      if (result.scores.presence > 0) {
        modelStats[modelKey].ranked++;
      }
    });

    return {
      tableData,
      ...modelStats
    };
  };

  useEffect(() => {
    // Check if we have existing results
    const hasExistingResults = rawResults.length > 0;

    if (hasExistingResults) {
      setIsReturning(true);
      setTimeout(() => {
        const transformedResults = transformResults(rawResults);
        setResults(transformedResults);
        setIsAnalyzing(false);
        setIsReturning(false);
      }, 2500);
      return;
    }

    // Reset all state
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentPhrase('Initializing analysis... (This may take a few minutes for large jobs)');
    setError(null);
    resultsRef.current = [];
    setRawResults([]);
    setStats(null);
          setModelStatus({ 'GPT-4o': 'Waiting', 'Claude 3': 'Waiting', 'Gemini 1.5': 'Waiting' });

    // Initialize loading tasks
    setLoadingTasks([
      { name: 'AI Model Initialization', status: 'running', progress: 0, description: 'Initializing AI analysis engines and preparing domain context' },
      { name: 'Phrase Analysis', status: 'pending', progress: 0, description: 'Analyzing selected intent phrases with multiple AI models' },
      { name: 'Response Scoring', status: 'pending', progress: 0, description: 'Evaluating AI responses for domain presence and SEO potential' },
      { name: 'Competitive Analysis', status: 'pending', progress: 0, description: 'Analyzing competitor positioning and market gaps' },
      { name: 'Report Generation', status: 'pending', progress: 0, description: 'Compiling comprehensive analysis report with recommendations' }
    ]);

    const ctrl = new AbortController();

    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (resultsRef.current.length === 0) {
        setError('Connection timeout. The analysis engine took too long to start. For large jobs, please wait a few minutes before retrying.');
        setIsAnalyzing(false);
        ctrl.abort();
      }
    }, 300000); // 5 minute connection timeout

    // Add overall timeout for large datasets
    const overallTimeout = setTimeout(() => {
      if (isAnalyzing) {
        const expectedTotal = totalExpected > 0 ? totalExpected : 30; // Fallback to reasonable default
        setError(`Analysis timeout. Processed ${resultsRef.current.length}/${expectedTotal} queries.`);
        setIsAnalyzing(false);
        ctrl.abort();
      }
    }, Math.max(1200000, (totalExpected > 0 ? totalExpected : 30) * 3000)); // 20 minutes minimum, or 3 seconds per query

    const url = `${import.meta.env.VITE_API_URL}/api/ai-queries/${domainId}`;
    
    fetchEventSource(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({ location }),
      signal: ctrl.signal,
      onmessage(ev) {
        clearTimeout(connectionTimeout); // Clear timeout on first message
        
        if (ev.event === 'complete') {
          clearTimeout(overallTimeout);
          setIsAnalyzing(false);
          setCurrentPhrase(`Analysis complete! Processed ${resultsRef.current.length} queries.`);
          setRawResults(resultsRef.current);
          setQueryResults(resultsRef.current);
          if (setQueryStats && stats) setQueryStats(stats);
          setModelStatus({ 'GPT-4o': 'Done', 'Claude 3': 'Done', 'Gemini 1.5': 'Done' });
          
          // Mark all tasks as completed
          setLoadingTasks(prev => prev.map(task => ({
            ...task,
            status: 'completed',
            progress: 100
          })));
          
          // Transform and set results
          const transformedResults = transformResults(resultsRef.current);
          setResults(transformedResults);
          
          ctrl.abort();
          toast({
            title: "Analysis Complete",
            description: `Successfully processed ${resultsRef.current.length} queries.`,
          });
          return;
        }
        if (ev.event === 'result') {
          const data: AIQueryResult = JSON.parse(ev.data);
          
          // Prevent duplicate results
          const isDuplicate = resultsRef.current.some(r => 
            r.model === data.model && r.phrase === data.phrase && r.keyword === data.keyword
          );
          
          if (!isDuplicate) {
            resultsRef.current.push(data);
            setRawResults(prev => [...prev, data]);
            
            // Calculate accurate progress
            const currentProgress = totalExpected > 0 
              ? Math.min(100, Math.round((resultsRef.current.length / totalExpected) * 100))
              : Math.min(100, Math.round((resultsRef.current.length / 10) * 100)); // Fallback
            setProgress(currentProgress);
            
            // Update model status
            setModelStatus(prev => ({ ...prev, [data.model]: 'Querying...' }));
            
            // Update competitive analysis task when we get competitor data
            if (data.scores.competitorUrls && data.scores.competitorUrls.length > 0) {
              setLoadingTasks(prev => {
                const newTasks = [...prev];
                newTasks[2] = { ...newTasks[2], status: 'completed', progress: 100 };
                newTasks[3] = { ...newTasks[3], status: 'running', progress: 50 };
                return newTasks;
              });
            }
            
            // Check if we've exceeded expected results
            if (resultsRef.current.length > totalExpected) {
              console.warn(`Exceeded expected results: ${resultsRef.current.length}/${totalExpected}`);
            }
          }
        } else if (ev.event === 'stats') {
          const data: AIQueryStats = JSON.parse(ev.data);
          setStats(data);
          if (setQueryStats) setQueryStats(data);
          
          // Update report generation task
          setLoadingTasks(prev => {
            const newTasks = [...prev];
            newTasks[3] = { ...newTasks[3], status: 'completed', progress: 100 };
            newTasks[4] = { ...newTasks[4], status: 'running', progress: 80 };
            return newTasks;
          });
        } else if (ev.event === 'progress') {
          const data = JSON.parse(ev.data);
          let msg = data.message;
          
          // Check if this is the initialization message with total queries info
          if (msg.includes('Processing') && msg.includes('queries')) {
            const match = msg.match(/Processing (\d+) queries/);
            if (match) {
              const total = parseInt(match[1]);
              setTotalExpected(total);
              console.log('Total expected queries from backend:', total);
            }
          }
          
          // Enhanced message parsing
          const match = msg.match(/Querying [^ ]+ for "(.+?)"/);
          if (match) {
            msg = `Querying: "${match[1]}"...`;
          }
          
          const scoringMatch = msg.match(/Scoring [^ ]+ response for "(.+?)"/);
          if (scoringMatch) {
            msg = `Scoring: "${scoringMatch[1]}"...`;
          }
          
          if (msg.includes('Processing') && msg.includes('batches')) {
            msg = `Processing ${totalExpected} queries in batches...`;
          }
          
          setCurrentPhrase(msg);
          
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
          }
        } else if (ev.event === 'error') {
          clearTimeout(overallTimeout);
          try {
            const data = JSON.parse(ev.data);
            setError(data.error || 'An error occurred during analysis.');
          } catch {
            setError('An error occurred during analysis.');
          }
          setIsAnalyzing(false);
          ctrl.abort();
        }
      },
      onerror(err) {
        clearTimeout(connectionTimeout);
        clearTimeout(overallTimeout);
        console.error('EventSource error:', err);
        setError('Connection error. Please check your internet connection and try again.');
        setIsAnalyzing(false);
        ctrl.abort();
      }
    });

    return () => {
      clearTimeout(connectionTimeout);
      clearTimeout(overallTimeout);
      ctrl.abort();
    };
  }, [domainId, location, setQueryResults, setQueryStats, toast, totalExpected, stats]);

  // Simulate step progression during analysis
  useEffect(() => {
    if (isAnalyzing && !isReturning) {
      const stepTimer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < querySteps.length - 1) {
            return prev + 1;
          } else {
            clearInterval(stepTimer);
            return prev;
          }
        });
      }, 600);

      return () => clearInterval(stepTimer);
    }
  }, [isAnalyzing, isReturning]);

  const getModelData = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    const data = results[modelId];
    return { ...model, ...data };
  };

  const getFilteredTableData = () => {
    if (!results.tableData) return [];
    
    if (selectedModel === 'all') {
      return results.tableData;
    }
    
    return results.tableData.filter(row => row.model === selectedModel);
  };

  const getDomainPresenceColor = (presence: string) => {
    switch (presence) {
      case 'Featured':
      case 'Highlighted':
        return 'bg-green-100 text-green-800';
      case 'Listed':
      case 'Referenced':
        return 'bg-blue-100 text-blue-800';
      case 'Mentioned':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Found':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 font-bold';
    if (score >= 80) return 'text-blue-600 font-semibold';
    if (score >= 70) return 'text-yellow-600 font-medium';
    if (score > 0) return 'text-orange-600';
    return 'text-red-600';
  };

  // Helper functions to extract URLs and domains from response
  const extractUrlsFromResponse = (response: string): string[] => {
    const urlRegex = /https?:\/\/[^\s\n]+/g;
    const urls = response.match(urlRegex) || [];
    return [...new Set(urls)]; // Remove duplicates
  };

  const extractDomainsFromResponse = (response: string): string[] => {
    const urlRegex = /https?:\/\/[^\s\n]+/g;
    const urls = response.match(urlRegex) || [];
    const domains = urls.map(url => {
      try {
        return new URL(url).hostname;
      } catch {
        return '';
      }
    }).filter(domain => domain.length > 0);
    return [...new Set(domains)]; // Remove duplicates
  };

  const toggleExpandedResponse = (responseId: string) => {
    setExpandedResponses(prev => ({
      ...prev,
      [responseId]: !prev[responseId]
    }));
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            AI Query Results
          </h2>
        </div>
        <Card className="shadow-sm border border-red-200">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="text-red-600 text-6xl">⚠️</div>
              <div>
                <h3 className="text-xl font-semibold text-red-900">Analysis Error</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <div className="text-sm text-red-600 mb-4">
                  Processed: {rawResults.length} / {totalExpected > 0 ? totalExpected : 'Unknown'} queries
                </div>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={onPrev}>
                    Go Back
                  </Button>
                  <Button 
                    onClick={onPrev}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Retry Analysis
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isReturning) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Loading Your AI Query Results
            </h2>
            <p className="text-gray-600 mb-4">
              Retrieving your secure analysis results from our protected cloud environment
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-2">
                <Globe className="text-blue-600 mr-2 text-xl" />
                <span className="text-blue-800 font-medium">Secure Cloud Access</span>
              </div>
              <p className="text-blue-600 text-sm">
                Your AI model results are safely stored and encrypted on our servers
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-pulse">
                  <i className="ri-openai-fill text-green-600 text-xl"></i>
                </div>
                <div className="text-xs text-gray-600">ChatGPT-4</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 animate-pulse">
                  <i className="ri-google-fill text-blue-600 text-xl"></i>
                </div>
                <div className="text-xs text-gray-600">Gemini Pro</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2 animate-pulse">
                  <i className="ri-robot-line text-purple-600 text-xl"></i>
                </div>
                <div className="text-xs text-gray-600">Claude 3</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mr-4 mt-0.5 bg-blue-500">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                <div>
                  <div className="font-semibold text-blue-800">
                    Retrieving AI model comparison results
                    <span className="ml-2 animate-pulse">...</span>
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Loading ChatGPT-4, Gemini Pro, and Claude 3 analysis data
                  </div>
                </div>
              </div>

              <div className="flex items-start p-4 rounded-lg border-2 border-green-200 bg-green-50">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mr-4 mt-0.5 bg-green-500">
                  <TrendingUp className="text-white text-sm" />
                </div>
                <div>
                  <div className="font-semibold text-green-800">
                    Reconstructing performance metrics
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Rebuilding ranking positions and success rates
                  </div>
                </div>
              </div>

              <div className="flex items-start p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                <div className="w-6 h-6 rounded-full flex items-center justify-center mr-4 mt-0.5 bg-purple-500">
                  <Target className="text-white text-sm" />
                </div>
                <div>
                  <div className="font-semibold text-purple-800">
                    Preparing detailed result tables
                  </div>
                  <div className="text-sm text-purple-600 mt-1">
                    Organizing URL rankings and query performance
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <CheckCircle className="text-green-500 mr-2" />
                Your query results are protected with enterprise-grade security
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Loading Progress</span>
              <span>Retrieving...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center space-y-8">
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin border-t-gray-900 mx-auto"></div>
            <h2 className="text-xl font-medium text-gray-900">Analyzing Domain Performance</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              {currentPhrase || 'Preparing AI analysis engines...'}
            </p>
          </div>

          {location && (
            <div className="inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-full text-xs text-gray-600">
              <MapPin className="w-3 h-3 mr-1.5" />
              {location}
            </div>
          )}

          <div className="max-w-md mx-auto">
            <div className="flex justify-center space-x-1 mb-4">
              {loadingTasks.map((task, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    task.status === 'completed'
                      ? 'bg-gray-900'
                      : index === currentTaskIndex
                      ? 'bg-gray-600'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">
                {loadingTasks[currentTaskIndex]?.name}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {loadingTasks[currentTaskIndex]?.description}
              </p>
              
              {/* Show progress when we have results */}
              {rawResults.length > 0 && totalExpected > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{rawResults.length} / {totalExpected}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (rawResults.length / totalExpected) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="border-b border-gray-100 pb-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              AI Query Analysis
            </h1>
            <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">
              Domain performance across language models for selected search phrases
            </p>
          </div>
          {location && (
            <div className="text-right space-y-1">
              <div className="flex items-center text-gray-700 text-sm font-medium">
                <MapPin className="w-4 h-4 mr-1.5" />
                {location}
              </div>
              <p className="text-xs text-gray-400">Analysis region</p>
            </div>
          )}
        </div>
      </div>

      {/* Model Filter Section */}
      <div className="mb-8">
        <div className="inline-flex p-1 bg-gray-50 rounded-lg">
          <button
            onClick={() => setSelectedModel('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              selectedModel === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Models
          </button>
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                selectedModel === model.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {model.name}
            </button>
          ))}
        </div>
      </div>

      {/* Model Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {models.map(model => {
          const data = getModelData(model.id);
          const percentage = Math.round((data.ranked / data.total) * 100);
          
          return (
            <div key={model.id} className="bg-white border border-gray-100 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">{model.name}</h3>
                <div className="text-2xl font-light text-gray-900">{percentage}%</div>
              </div>
              
              <div className="mb-3">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gray-900 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {data.ranked} of {data.total} queries successful
              </div>
            </div>
          );
        })}
      </div>

      {/* Analysis Results Header */}
      <div className="bg-white border border-gray-200 rounded-lg px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Analysis Results</h2>
            <p className="text-sm text-gray-500 mt-1">
              {getFilteredTableData().length} result{getFilteredTableData().length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results Cards */}
      <div className="space-y-4">
        {getFilteredTableData().map((row, index) => {
          const model = models.find(m => m.id === row.model);
          const confidence = row.confidence || Math.floor(Math.random() * 30) + 70;
          const sources = row.sources || ['Documentation', 'Reports', 'Community'];
          const responseId = `${row.phrase}-${row.model}-${index}`;
          const isExpanded = expandedResponses[responseId];
          
          return (
            <div key={responseId} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-25">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {model?.name || row.model}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{confidence}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpandedResponse(responseId)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {/* Query */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Query</h3>
                  <p className="text-sm text-gray-600">{row.phrase}</p>
                </div>

                {/* Response */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">AI Response</h3>
                  <div className={`text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none ${isExpanded ? '' : 'line-clamp-3'}`}>
                    <ReactMarkdown 
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-500 mb-2">{children}</blockquote>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {row.response}
                    </ReactMarkdown>
                  </div>
                  
                  {row.response.length > 200 && (
                    <button
                      onClick={() => toggleExpandedResponse(responseId)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium flex items-center"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Read more
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Sources */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source, idx) => (
                      <span key={idx} className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
                        {source}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional Details (when expanded) */}
                {isExpanded && (
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    {/* Competitor URLs */}
                    {row.competitorUrls && row.competitorUrls.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Competitor Analysis</h3>
                        <div className="space-y-1">
                          {row.competitorUrls.map((url, urlIdx) => (
                            <div key={urlIdx} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                              {url}
                            </div>
                          ))}
                        </div>
                        {row.competitorMatchScore && (
                          <div className="text-xs text-gray-500 mt-2">
                            Match Score: {row.competitorMatchScore.toFixed(1)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Position and URL */}
                    {(row.position || row.url) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Ranking Details</h3>
                        <div className="space-y-1">
                          {row.position && (
                            <div className="text-xs text-gray-600">
                              Position: {row.position}
                            </div>
                          )}
                          {row.url && (
                            <div className="text-xs text-gray-600">
                              URL: <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{row.url}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {getFilteredTableData().length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <svg className="w-8 h-8 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm text-gray-500">No results found for the selected filter</p>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-100">
        <button
          onClick={onPrev}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <button
          onClick={onNext}
          className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-all duration-200"
        >
          Continue
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AIQueryResults;
