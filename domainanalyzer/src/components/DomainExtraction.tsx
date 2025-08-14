'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Globe, Brain, FileText, AlertCircle, Loader2, ChevronDown, ChevronUp, ExternalLink, ArrowRight, Search, Users, TrendingUp, Target, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DomainExtractionProps {
  domain: string;
  subdomains?: string[];
  setDomainId: (id: number) => void;
  domainId: number;
  setBrandContext: (context: string) => void;
  onNext: () => void;
  onPrev: () => void;
  customPaths?: string[];
  priorityUrls?: string[];
  priorityPaths?: string[];
  location?: string;
}

interface Keyword {
  id: string;
  keyword: string;
  intent: string;
  volume: number;
  kd: number;
  competition: string;
  cpc: number;
  organic: number;
  paid: number;
  trend: string;
  position: number;
  url: string;
  updated: string;
  isCustom?: boolean;
  selected?: boolean;
}

interface ApiKeyword {
  id: number;
  term: string;
  volume: number;
  difficulty: string;
  cpc: number;
  domainId: number;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoadingTask {
  name: string;
  status: 'pending' | 'running' | 'completed';
  progress: number;
  description: string;
}

const DomainExtraction: React.FC<DomainExtractionProps> = ({ 
  domain, 
  subdomains = [],
  setDomainId,
  domainId,
  setBrandContext, 
  onNext, 
  onPrev,
  customPaths,
  priorityUrls,
  priorityPaths,
  location
}) => {

  const [isLoading, setIsLoading] = useState(false); // Start as false, will be set to true only if analysis is needed
  const [isCheckingData, setIsCheckingData] = useState(domainId === 0); // Only check data if no domainId provided
  const [isBackLoading, setIsBackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedContext, setExtractedContext] = useState('');
  const [responseTime, setResponseTime] = useState(0);
  const startTimeRef = useRef(Date.now());
  const { toast } = useToast();

  // Simplified loading tasks - only domain extraction and keyword generation
  const [loadingTasks, setLoadingTasks] = useState<LoadingTask[]>([
    { name: 'Domain Discovery & Crawling', status: 'pending', progress: 0, description: 'Scanning website structure and extracting content' },
    { name: 'Enhanced AI Keyword Generation', status: 'pending', progress: 0, description: 'Generating keywords using advanced AI with location context' }
  ]);

  // Keyword management (Step2Analysis-style)
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    competition: '',
    intent: '',
    volume: '',
    trends: '',
    date: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    keyword: true,
    intent: true,
    volume: true,
    kd: true,
    competition: true,
    cpc: true,
    organic: true,
    paid: true,
    trend: true,
    position: true,
    url: true,
    updated: true
  });

  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);

  // Carousel control state
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);



  // Helper functions to check for existing data at each phase
  const checkExistingData = async (domainId: number) => {
    const existingData = {
      domainExtraction: false,
      keywords: false,
      keywordsCount: 0
    };

    try {
      // Check for existing keywords
      const keywordsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/keywords/${domainId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (keywordsResponse.ok) {
        const keywordsData = await keywordsResponse.json();
        if (keywordsData.keywords && keywordsData.keywords.length > 0) {
          existingData.keywords = true;
          existingData.keywordsCount = keywordsData.keywords.length;
        }
      }

      // Check for domain extraction data by looking at the domain table and analysis phases
      const domainResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/domain/${domainId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (domainResponse.ok) {
        const domainData = await domainResponse.json();
        
        // Check if domain has been processed (has context, location, etc.)
        if (domainData.domain && (domainData.domain.context || domainData.domain.location || domainData.domain.processedAt)) {
          existingData.domainExtraction = true;
          console.log('Domain extraction detected via domain context/location/processedAt');
        }
        
        // Check analysis phases to see if domain_extraction is completed
        if (domainData.analysisPhases && Array.isArray(domainData.analysisPhases)) {
          const domainExtractionPhase = domainData.analysisPhases.find((phase: { phase: string; status: string }) => 
            phase.phase === 'domain_extraction' && phase.status === 'completed'
          );
          if (domainExtractionPhase) {
            existingData.domainExtraction = true;
            console.log('Domain extraction detected via analysis phase');
          }
          
          const keywordGenerationPhase = domainData.analysisPhases.find((phase: { phase: string; status: string }) => 
            phase.phase === 'keyword_generation' && phase.status === 'completed'
          );
          if (keywordGenerationPhase) {
            existingData.keywords = true;
            console.log('Keywords detected via analysis phase');
          }
        }
        
        // Check if there are crawl results (indicates domain extraction was done)
        if (domainData.crawlResults && domainData.crawlResults.length > 0) {
          existingData.domainExtraction = true;
          console.log('Domain extraction detected via crawl results');
        }
        
        // Check if there are semantic analyses (indicates domain extraction was done)
        if (domainData.semanticAnalyses && domainData.semanticAnalyses.length > 0) {
          existingData.domainExtraction = true;
          console.log('Domain extraction detected via semantic analyses');
        }
      }

      // If we have keywords but no domain extraction data, assume domain extraction is complete
      // (since keywords can't be generated without domain extraction)
      if (existingData.keywords && !existingData.domainExtraction) {
        existingData.domainExtraction = true;
      }

    } catch (error) {
      console.error('Error checking existing data:', error);
    }

    console.log('Existing data check result for domain', domainId, ':', existingData);
    return existingData;
  };

  const loadExistingKeywords = async (domainId: number) => {
    console.log('Loading existing keywords for domain:', domainId);
    try {
      const keywordsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/keywords/${domainId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      console.log('Keywords response status:', keywordsResponse.status);

      if (keywordsResponse.ok) {
        const keywordsData = await keywordsResponse.json();
        console.log('Keywords data:', keywordsData);
        
        if (keywordsData.keywords && keywordsData.keywords.length > 0) {
          console.log('Found', keywordsData.keywords.length, 'keywords');
          // Convert API keywords to the format expected by the component
          const realKeywords: Keyword[] = keywordsData.keywords.map((kw: ApiKeyword, index: number) => ({
            id: kw.id.toString(),
            keyword: kw.term,
            intent: 'Commercial', // Default intent
            volume: kw.volume,
            kd: parseInt(kw.difficulty) || 50, // Use difficulty as KD score
            competition: kw.difficulty === 'High' ? 'High' : kw.difficulty === 'Low' ? 'Low' : 'Medium',
            cpc: kw.cpc,
            organic: Math.floor(kw.volume * 0.1), // Estimate organic traffic based on volume
            paid: Math.floor(kw.volume * 0.05), // Estimate paid traffic based on volume
            trend: 'Stable', // Default trend (no random data)
            position: 0, // No position data from Google API
            url: `https://${domain}/${kw.term.toLowerCase().replace(/\s+/g, '-')}`,
            updated: new Date().toISOString().split('T')[0],
            selected: kw.isSelected || false
          }));

          setKeywords(realKeywords);
          
          // Mark all loading tasks as completed since we're loading existing data
          setLoadingTasks(prev => prev.map(task => ({
            ...task,
            status: 'completed',
            progress: 100
          })));
          
          setIsLoading(false);
          setIsCheckingData(false);
          setResponseTime(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
          
          toast({
            title: "Keywords Loaded",
            description: `Loaded ${realKeywords.length} existing keywords for ${domain}`,
          });
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading existing keywords:', error);
    }
    return false;
  };

  // Main analysis effect
  useEffect(() => {
    if (!domain) {
      setError('Domain not provided.');
      setIsLoading(false);
      setIsCheckingData(false);
      return;
    }

    const runAnalysis = async () => {
      try {
        console.log('Starting analysis with domainId:', domainId, 'domain:', domain);
        
        // If we have a domain ID, check for existing data first
        if (domainId > 0) {
          console.log('Domain ID found:', domainId, 'checking for existing data...');
          
          const existingData = await checkExistingData(domainId);
          console.log('Existing data check result:', existingData);

          // If we have complete data, load it and skip analysis entirely
          if (existingData.domainExtraction && existingData.keywords) {
            console.log('Complete existing data found, loading and skipping analysis...');
            const loaded = await loadExistingKeywords(domainId);
            if (loaded) {
              setIsCheckingData(false);
              return; // Exit early, no need to run analysis
            }
          }

          // If we have domain extraction but no keywords, skip domain extraction and only run keyword generation
          if (existingData.domainExtraction && !existingData.keywords) {
            console.log('Domain extraction completed but no keywords found, skipping domain extraction...');
            setLoadingTasks(prev => {
              const newTasks = [...prev];
              newTasks[0] = { ...newTasks[0], status: 'completed', progress: 100 };
              return newTasks;
            });
          }

          // If we have keywords but no domain extraction, load keywords and skip analysis
          if (existingData.keywords && !existingData.domainExtraction) {
            console.log('Keywords found but domain extraction incomplete, loading keywords and skipping analysis...');
            const loaded = await loadExistingKeywords(domainId);
            if (loaded) {
              setIsCheckingData(false);
              return; // Exit early, no need to run analysis
            }
          }

          // If we have domain extraction (context exists), skip analysis entirely and just load keywords if they exist
          if (existingData.domainExtraction) {
            console.log('Domain extraction detected, skipping analysis and loading existing data...');
            if (existingData.keywords) {
              const loaded = await loadExistingKeywords(domainId);
              if (loaded) {
                setIsCheckingData(false);
                return; // Exit early, no need to run analysis
              }
            } else {
              // No keywords but domain extraction exists, just skip analysis
              setIsCheckingData(false);
              setKeywords([]);
              toast({
                title: "Domain Already Analyzed",
                description: "Domain extraction completed but no keywords found. Please add custom keywords.",
              });
              return; // Exit early, no need to run analysis
            }
          }
        } else {
          console.log('No domain ID found, checking if domain already exists...');
          
          // Try to find existing domain by URL
          try {
            const domainCheckResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/domain/check/${encodeURIComponent(domain)}`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            });
            
            if (domainCheckResponse.ok) {
              const domainCheck = await domainCheckResponse.json();
              if (domainCheck.exists && domainCheck.domainId) {
                console.log('Found existing domain with ID:', domainCheck.domainId);
                setDomainId(domainCheck.domainId);
                
                // Check for existing data with the found domainId
                const existingData = await checkExistingData(domainCheck.domainId);
                console.log('Existing data check result for found domain:', existingData);
                
                if (existingData.domainExtraction) {
                  console.log('Domain extraction detected for existing domain, skipping analysis...');
                  if (existingData.keywords) {
                    const loaded = await loadExistingKeywords(domainCheck.domainId);
                    if (loaded) {
                      setIsCheckingData(false);
                      return; // Exit early, no need to run analysis
                    }
                  } else {
                    // No keywords but domain extraction exists, just skip analysis
                    setIsCheckingData(false);
                    setKeywords([]);
                    toast({
                      title: "Domain Already Analyzed",
                      description: "Domain extraction completed but no keywords found. Please add custom keywords.",
                    });
                    return; // Exit early, no need to run analysis
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error checking for existing domain:', error);
          }
        }

        // Only run analysis if we don't have complete data
        console.log('Running analysis for missing data...');
        
        // Set loading state only if we need to run analysis
        setIsLoading(true);
        setIsCheckingData(false);
        
        // Run the actual analysis (either full or partial based on existing data)
        const runRealAnalysis = async () => {
          try {
            // Start real analysis with backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/domain`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              },
              body: JSON.stringify({
                url: domain,
                location: location || 'Global',
                customPaths: customPaths || [],
                priorityUrls: priorityUrls || [],
                priorityPaths: priorityPaths || []
              })
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
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.type === 'progress') {
                      // Update task progress based on phase
                      const phase = data.phase;
                      const step = data.step;
                      const progress = data.progress;
                      
                      // Map backend phases to frontend tasks - simplified for domain extraction and Google API
                      const phaseToTaskMap: { [key: string]: number } = {
                        'domain_extraction': 0,
                        'keyword_generation': 1
                      };

                      // Mark all previous phases as completed when a new phase starts
                      if (phase && phaseToTaskMap[phase] !== undefined) {
                        const currentPhaseIndex = phaseToTaskMap[phase];
                        
                        // Mark all previous phases as completed
                        setLoadingTasks(prev => {
                          const newTasks = [...prev];
                          for (let i = 0; i < currentPhaseIndex; i++) {
                            if (newTasks[i].status !== 'completed') {
                              newTasks[i] = {
                                ...newTasks[i],
                                status: 'completed',
                                progress: 100
                              };
                            }
                          }
                          return newTasks;
                        });
                      }

                      if (phase && phaseToTaskMap[phase] !== undefined) {
                        const taskIndex = phaseToTaskMap[phase];
                        setLoadingTasks(prev => {
                          const newTasks = [...prev];
                          newTasks[taskIndex] = {
                            ...newTasks[taskIndex],
                            status: progress === 100 ? 'completed' : 'running',
                            progress: progress
                          };
                          return newTasks;
                        });

                      }
                    } else if (data.type === 'complete') {
                        // Analysis completed, process results - simplified metrics

                        // Set domain ID if available
                        if (data.result && data.result.domain && data.result.domain.id) {
                          setDomainId(data.result.domain.id);
                          
                          // Set extracted context and brand context
                          if (data.result.extraction) {
                            setExtractedContext(data.result.extraction.extractedContext || 'Analysis completed successfully.');
                            setBrandContext(data.result.extraction.extractedContext || 'Analysis completed successfully.');
                          }

                          // Wait a moment for all phases to be properly marked as completed
                          await new Promise(resolve => setTimeout(resolve, 1000));
                          
                          // Ensure all phases are marked as completed
                          setLoadingTasks(prev => prev.map(task => ({
                            ...task,
                            status: 'completed',
                            progress: 100
                          })));
                          
                          // Fetch keywords from the keywords API
                          try {
                            const keywordsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/keywords/${data.result.domain.id}`, {
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                              }
                            });

                            if (keywordsResponse.ok) {
                              const keywordsData = await keywordsResponse.json();
                              
                              if (keywordsData.keywords && keywordsData.keywords.length > 0) {
                                // Convert API keywords to the format expected by the component
                                const realKeywords: Keyword[] = keywordsData.keywords.map((kw: ApiKeyword, index: number) => ({
                                  id: kw.id.toString(),
                                  keyword: kw.term,
                                  intent: 'Commercial', // Default intent
                                  volume: kw.volume,
                                  kd: parseInt(kw.difficulty) || 50, // Use difficulty as KD score
                                  competition: kw.difficulty === 'High' ? 'High' : kw.difficulty === 'Low' ? 'Low' : 'Medium',
                                  cpc: kw.cpc,
                                  organic: Math.floor(kw.volume * 0.1), // Estimate organic traffic based on volume
                                  paid: Math.floor(kw.volume * 0.05), // Estimate paid traffic based on volume
                                  trend: 'Stable', // Default trend (no random data)
                                  position: 0, // No position data from Google API
                                  url: `https://${domain}/${kw.term.toLowerCase().replace(/\s+/g, '-')}`,
                                  updated: new Date().toISOString().split('T')[0],
                                  selected: kw.isSelected || false
                                }));

                                setKeywords(realKeywords);
                                
                                // Only now set loading to false and show keywords
                                setIsLoading(false);
                                setResponseTime(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));

                                // Show success toast
                                toast({
                                  title: "Analysis Complete",
                                  description: `Domain extraction and enhanced AI keyword generation completed successfully. Found ${realKeywords.length} keywords.`,
                                });
                              } else {
                                // No keywords found
                                setKeywords([]);
                                setIsLoading(false);
                                setResponseTime(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
                                
                                toast({
                                  title: "Analysis Complete",
                                  description: "Analysis completed but no keywords were generated.",
                                });
                              }
                            } else {
                              console.error('Failed to fetch keywords:', keywordsResponse.status);
                              setKeywords([]);
                              setIsLoading(false);
                              setResponseTime(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
                              
                              toast({
                                title: "Analysis Complete",
                                description: "Analysis completed but failed to fetch keywords.",
                              });
                            }
                          } catch (error) {
                            console.error('Error fetching keywords:', error);
                            setKeywords([]);
                            setIsLoading(false);
                            setResponseTime(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
                            
                            toast({
                              title: "Analysis Complete",
                              description: "Analysis completed but failed to load keywords.",
                            });
                          }
                        } else {
                          // No domain ID available
                          setKeywords([]);
                          setIsLoading(false);
                          setResponseTime(Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1)));
                          
                          toast({
                            title: "Analysis Complete",
                            description: "Analysis completed successfully.",
                          });
                        }
                    }
                  } catch (parseError) {
                    console.error('Error parsing SSE data:', parseError);
                  }
                }
              }

            }

          } catch (error) {
            console.error('Analysis error:', error);
            setError(error instanceof Error ? error.message : 'Analysis failed');
            setIsLoading(false);
            
            toast({
              title: "Analysis Failed",
              description: "Failed to complete analysis. Please try again.",
              variant: "destructive",
            });
          }
        };

        runRealAnalysis();
      } catch (error) {
        console.error('Main analysis error:', error);
        setError(error instanceof Error ? error.message : 'Analysis failed');
        setIsLoading(false);
        setIsCheckingData(false);
        
        toast({
          title: "Analysis Failed",
          description: "Failed to start analysis. Please try again.",
          variant: "destructive",
        });
      }
    };

    runAnalysis();
  }, [domain, location, customPaths, priorityUrls, priorityPaths, setBrandContext, setDomainId, toast]);

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

  // Step2Analysis-style handlers
  const handleBackClick = async () => {
    setIsBackLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onPrev();
  };

  const handleKeywordSelect = (keywordId: string) => {
    if (selectedKeywords.includes(keywordId)) {
      setSelectedKeywords(prev => prev.filter(id => id !== keywordId));
    } else if (selectedKeywords.length < 5) {
      setSelectedKeywords(prev => [...prev, keywordId]);
    }
  };

  const handleNext = async () => {
    if (selectedKeywords.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one keyword to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save selected keywords to database
      console.log('Saving selected keywords:', selectedKeywords);
      console.log('Domain ID:', domainId);
      
      const requestBody = {
        keywordIds: selectedKeywords,
        selected: true
      };
      
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/keywords/${domainId}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const selectedKeywordData = keywords.filter(kw => selectedKeywords.includes(kw.id));
      
      toast({
        title: "Keywords Saved",
        description: `Successfully saved ${selectedKeywordData.length} selected keywords`,
      });

    onNext();
    } catch (error) {
      console.error('Error saving selected keywords:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save selected keywords. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddCustomKeyword = async () => {
    if (!newKeyword.trim()) return;

    setIsAddingKeyword(true);

    try {
      // Step 1: Analyze the custom keyword using AI
      const analyzeResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/keywords/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          domain: domain,
          location: location || 'Global',
          domainId: domainId
        })
      });

      if (!analyzeResponse.ok) {
        throw new Error(`Analysis failed! status: ${analyzeResponse.status}`);
      }

      const analysisResult = await analyzeResponse.json();
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      // Step 2: Save the analyzed keyword to the database
      const saveResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/keywords/${domainId}/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          keyword: analysisResult.keyword,
          volume: analysisResult.volume,
          kd: analysisResult.kd,
          competition: analysisResult.competition,
          cpc: analysisResult.cpc,
          intent: analysisResult.intent,
          organic: analysisResult.organic,
          paid: analysisResult.paid,
          trend: analysisResult.trend,
          position: analysisResult.position,
          url: analysisResult.url,
          analysis: analysisResult.analysis
        })
      });

      if (!saveResponse.ok) {
        throw new Error(`Save failed! status: ${saveResponse.status}`);
      }

      const saveResult = await saveResponse.json();
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Save failed');
      }

      // Add the new keyword to the list
      setKeywords(prev => [saveResult.keyword, ...prev]);
      setNewKeyword('');
      setShowAddKeyword(false);
      setIsAddingKeyword(false);

      toast({
        title: "Keyword Added Successfully",
        description: `Successfully analyzed and added "${newKeyword.trim()}" with comprehensive AI data`,
      });

    } catch (error) {
      console.error('Custom keyword analysis error:', error);
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze keyword with AI. Please try again.",
        variant: "destructive",
      });
      
      setNewKeyword('');
      setShowAddKeyword(false);
      setIsAddingKeyword(false);
    }
  };

  const filteredKeywords = keywords.filter(keyword => {
    const matchesSearch = keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompetition = !filters.competition || keyword.competition === filters.competition;
    const matchesIntent = !filters.intent || keyword.intent === filters.intent;
    return matchesSearch && matchesCompetition && matchesIntent;
  });

  // Step2Analysis-style back loading state
  if (isBackLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Fetching Your Data</h2>
            <p className="text-gray-600 mb-6">Retrieving your saved configuration from our secure cloud servers</p>

            {/* Carousel Container with Smooth Transitions */}
            <div className="relative h-24 mb-8 overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentLoadingIndex * 100}%)` }}
              >
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Connecting to Cloud Storage
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Establishing secure connection to our servers
                  </p>
                </div>
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Retrieving Configuration
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Loading your saved domain settings
                  </p>
                </div>
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Preparing Data
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Organizing your analysis results
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

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <span className="text-green-800 text-sm">Your data is secured with 256-bit encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step2Analysis-style loading state
  if (isCheckingData) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Checking Existing Data</h2>
            <p className="text-gray-600 mb-6">Looking for existing analysis data for {domain}</p>

            {/* Carousel Container with Smooth Transitions */}
            <div className="relative h-24 mb-8 overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentLoadingIndex * 100}%)` }}
              >
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Checking Domain Database
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Searching for existing domain analysis records
                  </p>
                </div>
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Verifying Keywords
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Checking for previously generated keywords
                  </p>
                </div>
                <div className="w-full flex-shrink-0 text-center">
                  <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                    Loading Analysis Data
                  </h3>
                  <p className="text-gray-500 text-sm transition-opacity duration-500">
                    Retrieving cached analysis results
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
                <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                <span className="text-blue-800 text-sm">Checking for existing domain extraction and keywords</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step2Analysis-style loading state
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Domain Extraction & Enhanced AI Analysis</h2>

          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Analyzing: {domain}</span>
              <span className="text-sm text-blue-600">{location || 'Global'}</span>
            </div>
            {(customPaths?.length > 0 || priorityUrls?.length > 0) && (
              <div className="text-sm text-blue-700">
                Custom Configuration: {customPaths?.length || 0} paths, {priorityUrls?.length || 0} priority URLs
              </div>
            )}
          </div>

          <div className="py-16">
            {/* Minimal Spinner */}
            <div className="flex justify-center mb-8">
              <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin border-t-gray-800"></div>
            </div>

            {/* Carousel Container with Smooth Transitions */}
            <div className="relative h-40 mb-12 overflow-hidden">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentTaskIndex * 100}%)` }}
              >
                {loadingTasks.map((task, index) => (
                  <div key={index} className="w-full flex-shrink-0 text-center">
                    <h3 className="text-lg text-gray-900 mb-2 transition-opacity duration-500">
                      {task.name}
                    </h3>
                    <p className="text-gray-500 text-sm transition-opacity duration-500">
                      {task.description}
                    </p>
                    
                    {/* Sub-carousel for running tasks */}
                    {task.status === 'running' && (
                      <div className="mt-4">
                        <div className="relative h-20 overflow-hidden">
                          <div 
                            className="flex transition-transform duration-700 ease-in-out"
                            style={{ transform: `translateX(-${currentLoadingIndex * 100}%)` }}
                          >
                            {task.name === 'Domain Discovery & Crawling' && (
                              <>
                                <div className="w-full flex-shrink-0 text-center">
                                  <h4 className="text-xs font-medium text-blue-800 mb-1">Website Crawling</h4>
                                  <p className="text-xs text-blue-600">Scanning website structure</p>
                                </div>
                                <div className="w-full flex-shrink-0 text-center">
                                  <h4 className="text-xs font-medium text-blue-800 mb-1">Content Extraction</h4>
                                  <p className="text-xs text-blue-600">Extracting page content</p>
                                </div>
                                <div className="w-full flex-shrink-0 text-center">
                                  <h4 className="text-xs font-medium text-blue-800 mb-1">Meta Analysis</h4>
                                  <p className="text-xs text-blue-600">Analyzing metadata</p>
                                </div>
                              </>
                            )}
                            {task.name === 'Enhanced AI Keyword Generation' && (
                              <>
                                <div className="w-full flex-shrink-0 text-center">
                                  <h4 className="text-xs font-medium text-blue-800 mb-1">AI Analysis</h4>
                                  <p className="text-xs text-blue-600">Processing with AI models</p>
                                </div>
                                <div className="w-full flex-shrink-0 text-center">
                                  <h4 className="text-xs font-medium text-blue-800 mb-1">Keyword Research</h4>
                                  <p className="text-xs text-blue-600">Finding relevant keywords</p>
                                </div>
                                <div className="w-full flex-shrink-0 text-center">
                                  <h4 className="text-xs font-medium text-blue-800 mb-1">Volume Analysis</h4>
                                  <p className="text-xs text-blue-600">Calculating search volumes</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress Dots for sub-carousel */}
                        <div className="flex justify-center space-x-1 mt-4">
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

            {/* Minimal Progress Dots */}
            <div className="flex justify-center space-x-2">
              {loadingTasks.map((task, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ease-out ${
                      task.status === 'completed'
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
    );
  }

  // Step2Analysis-style results view
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Keyword Selection</h2>
            <div className="text-sm text-gray-500">
              {selectedKeywords.length}/5 selected
            </div>
          </div>

          {/* Add Custom Keywords Section - Simplified */}
          <div className="mb-6 border-t border-gray-200 pt-6">
            <button
              onClick={() => setShowAddKeyword(!showAddKeyword)}
              className="flex items-center text-gray-600 hover:text-gray-900 font-medium text-sm mb-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Keyword
            </button>

            {showAddKeyword && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Enter keyword to analyze"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                    disabled={isAddingKeyword}
                  />
                  <button
                    onClick={handleAddCustomKeyword}
                    disabled={!newKeyword.trim() || isAddingKeyword}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    {isAddingKeyword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
                        Analyzing...
                      </>
                    ) : (
                      'Add'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddKeyword(false);
                      setNewKeyword('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search and Filters - Simplified */}
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            />

            <select
              value={filters.competition}
              onChange={(e) => setFilters(prev => ({ ...prev, competition: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            >
              <option value="">All Competition</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <select
              value={filters.intent}
              onChange={(e) => setFilters(prev => ({ ...prev, intent: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
            >
              <option value="">All Intent</option>
              <option value="Informational">Informational</option>
              <option value="Commercial">Commercial</option>
              <option value="Transactional">Transactional</option>
            </select>
          </div>

          {/* Warning Message - Simplified */}
          {selectedKeywords.length >= 5 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">Maximum 5 keywords can be selected</p>
            </div>
          )}
        </div>

        {/* Keywords Table - Simplified */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Competition</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPC</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredKeywords.map((keyword) => (
                <tr key={keyword.id} className={`hover:bg-gray-50 ${keyword.isCustom ? 'bg-gray-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedKeywords.includes(keyword.id)}
                      onChange={() => handleKeywordSelect(keyword.id)}
                      disabled={!selectedKeywords.includes(keyword.id) && selectedKeywords.length >= 5}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className={`text-sm ${keyword.isCustom ? 'font-medium' : ''} text-gray-900`}>
                        {keyword.keyword}
                      </span>
                      {keyword.isCustom && (
                        <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                          Custom
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{keyword.volume.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{keyword.kd}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        keyword.competition === 'High' ? 'bg-red-100 text-red-800' :
                        keyword.competition === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {keyword.competition}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">${keyword.cpc.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer - Simplified */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>

          <div className="flex items-center space-x-4">
            {selectedKeywords.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedKeywords.length} keywords selected
              </span>
            )}
            <button
              onClick={handleNext}
              disabled={selectedKeywords.length === 0}
              className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainExtraction;