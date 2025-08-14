import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Target, Users, Globe, AlertCircle } from 'lucide-react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useToast } from '@/components/ui/use-toast';

interface DashboardProps {
  domain: string;
  brandContext: string;
  keywords: string[];
  phrases: Array<{keyword: string, phrases: string[]}>;
  queryResults: Array<{
    id: number;
    model: string;
    response: string;
    latency: number;
    cost: number;
    presence: number;
    relevance: number;
    accuracy: number;
    sentiment: number;
    overall: number;
    phraseId: number;
  }>;
  onPrev: () => void;
}

interface DomainData {
  id: number;
  url: string;
  context: string;
  crawlResults: Array<{
    pagesScanned: number;
    analyzedUrls: string[];
    extractedContext: string;
  }>;
  keywords: Array<{
    id: number;
    term: string;
    volume: number;
    difficulty: string;
    cpc: number;
    category: string;
    isSelected: boolean;
  }>;
  phrases: Array<{
    id: number;
    text: string;
    keywordId: number;
  }>;
  aiQueryResults: Array<{
    id: number;
    model: string;
    response: string;
    latency: number;
    cost: number;
    presence: number;
    relevance: number;
    accuracy: number;
    sentiment: number;
    overall: number;
    phraseId: number;
  }>;
}

interface CompetitorAnalysis {
  domain?: string;
  visibilityScore?: number;
  mentionRate?: number;
  avgRelevance?: number;
  avgAccuracy?: number;
  avgSentiment?: number;
  keyStrengths?: string[];
  keyWeaknesses?: string[];
  comparison?: {
    better: string[];
    worse: string[];
    similar: string[];
  };
  summary?: string;
  metricsTable?: Array<Record<string, unknown>>;
  keywordOverlap?: { percent: number; keywords: string[] };
  phraseOverlap?: { percent: number; phrases: string[] };
  aiVisibility?: Array<{ domain: string; score: number; mentionRate: number }>;
  swot?: {
    target: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
    competitor: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };
  };
  recommendations?: Array<{ action: string; impact: string; effort: string }>;
  marketMap?: Array<{ domain: string; position: string; justification: string }>;
  recentNews?: Array<{ domain: string; headline: string; url: string }>;
}

const Dashboard: React.FC<DashboardProps> = ({
  domain,
  brandContext,
  keywords,
  phrases,
  queryResults,
  onPrev
}) => {
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [competitorDomain, setCompetitorDomain] = useState('');
  const [isAnalyzingCompetitor, setIsAnalyzingCompetitor] = useState(false);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [competitorError, setCompetitorError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch domain data from database
  useEffect(() => {
    const fetchDomainData = async () => {
      try {
        setIsLoading(true);
        
        // Get domain ID from the current domain
        const domainResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/domain/search?url=${encodeURIComponent(domain)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!domainResponse.ok) throw new Error('Failed to fetch domain data');
        
        const domainInfo = await domainResponse.json();
        const domainId = domainInfo.domain?.id;
        
        if (!domainId) throw new Error('Domain not found in database');

        // Fetch comprehensive domain data
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${domainId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data = await response.json();
        setDomainData(data);
        toast({
          title: "Dashboard Data Loaded",
          description: "Successfully loaded dashboard data from the database.",
        });
      } catch (error) {
        console.error('Error fetching domain data:', error);
        toast({
          title: "Dashboard Data Load Error",
          description: "Failed to load dashboard data from the database. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDomainData();
  }, [domain, toast]);

  // Calculate real AI Visibility Score from actual data
  const calculateVisibilityScore = () => {
    if (!domainData?.aiQueryResults?.length) return 0;
    
    const totalResponses = domainData.aiQueryResults.length;
    const mentionedResponses = domainData.aiQueryResults.filter(r => r.presence === 1).length;
    const avgQuality = domainData.aiQueryResults.reduce((sum, r) => sum + r.overall, 0) / totalResponses;
    
    return Math.round(((mentionedResponses / totalResponses) * 100 * (avgQuality / 5)) * 10) / 10;
  };

  const visibilityScore = calculateVisibilityScore();

  // Real data for charts
  const modelPerformanceData = domainData?.aiQueryResults ? 
    Object.entries(
      domainData.aiQueryResults.reduce((acc, result) => {
        if (!acc[result.model]) {
          acc[result.model] = { responses: 0, mentions: 0, totalScore: 0 };
        }
        acc[result.model].responses++;
        if (result.presence === 1) acc[result.model].mentions++;
        acc[result.model].totalScore += result.overall;
        return acc;
      }, {} as Record<string, { responses: number; mentions: number; totalScore: number }>)
    ).map(([model, data]) => ({
      model,
      score: Math.round((data.mentions / data.responses) * 100),
      responses: data.responses,
      mentions: data.mentions,
      avgScore: Math.round((data.totalScore / data.responses) * 10) / 10
    })) : [];

  const keywordPerformanceData = domainData?.keywords?.slice(0, 8).map(keyword => {
    const keywordResults = domainData.aiQueryResults?.filter(r => {
      const phrase = domainData.phrases?.find(p => p.id === r.phraseId);
      return phrase && phrase.text.toLowerCase().includes(keyword.term.toLowerCase());
    }) || [];
    
    const visibility = keywordResults.length > 0 ? 
      (keywordResults.filter(r => r.presence === 1).length / keywordResults.length) * 100 : 0;
    const avgSentiment = keywordResults.length > 0 ? 
      keywordResults.reduce((sum, r) => sum + r.sentiment, 0) / keywordResults.length : 0;
    
    return {
      keyword: keyword.term.length > 15 ? keyword.term.substring(0, 15) + '...' : keyword.term,
      visibility: Math.round(visibility),
      mentions: keywordResults.filter(r => r.presence === 1).length,
      sentiment: Math.round(avgSentiment * 10) / 10,
      volume: keyword.volume,
      difficulty: keyword.difficulty
    };
  }) || [];

  const pieData = domainData?.aiQueryResults ? [
    { 
      name: 'Domain Present', 
      value: domainData.aiQueryResults.filter(r => r.presence === 1).length,
      color: '#10b981' 
    },
    { 
      name: 'Domain Not Found', 
      value: domainData.aiQueryResults.filter(r => r.presence === 0).length,
      color: '#ef4444' 
    }
  ] : [];

  const trendData = [
    { month: 'Jan', score: 45 },
    { month: 'Feb', score: 52 },
    { month: 'Mar', score: 58 },
    { month: 'Apr', score: 65 },
    { month: 'May', score: 71 },
    { month: 'Jun', score: visibilityScore }
  ];

  const topPhrases = domainData?.aiQueryResults
    ?.filter(r => r.presence === 1)
    ?.sort((a, b) => b.overall - a.overall)
    ?.slice(0, 5)
    ?.map(result => {
      const phrase = domainData.phrases?.find(p => p.id === result.phraseId);
      return {
        phrase: phrase?.text || 'Unknown phrase',
        score: Math.round(result.overall * 20), // Convert 1-5 to 0-100
        mentions: result.presence === 1 ? 1 : 0,
        model: result.model,
        relevance: result.relevance,
        accuracy: result.accuracy
      };
    }) || [];

  const improvementOpportunities = domainData?.aiQueryResults
    ?.filter(r => r.presence === 0 || r.overall < 3)
    ?.sort((a, b) => a.overall - b.overall)
    ?.slice(0, 5)
    ?.map(result => {
      const phrase = domainData.phrases?.find(p => p.id === result.phraseId);
      return {
        phrase: phrase?.text || 'Unknown phrase',
        score: Math.round(result.overall * 20),
        mentions: result.presence === 1 ? 1 : 0,
        model: result.model,
        issue: result.presence === 0 ? 'Domain not found' : 'Low quality response'
      };
    }) || [];

  // Competitor analysis function
  const analyzeCompetitor = async () => {
    if (!competitorDomain.trim()) {
      setCompetitorError('Please enter a competitor domain');
      return;
    }

    setIsAnalyzingCompetitor(true);
    setCompetitorError(null);
    setCompetitorAnalysis(null);

    try {
      const ctrl = new AbortController();
      
      fetchEventSource(`${import.meta.env.VITE_API_URL}/api/competitor/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ 
          targetDomain: domain,
          competitorDomain: competitorDomain.trim(),
          context: brandContext,
          keywords: keywords,
          phrases: phrases.flatMap(p => p.phrases)
        }),
        signal: ctrl.signal,
        onmessage(ev) {
          if (ev.event === 'analysis') {
            const data = JSON.parse(ev.data);
            setCompetitorAnalysis(data);
            toast({
              title: "Competitor Analysis Completed",
              description: "Successfully completed competitor analysis."
            });
          } else if (ev.event === 'error') {
            const data = JSON.parse(ev.data);
            setCompetitorError(data.error || 'Analysis failed');
          }
        },
        onclose() {
          setIsAnalyzingCompetitor(false);
          ctrl.abort();
        },
        onerror(err) {
          setCompetitorError('Failed to analyze competitor');
          setIsAnalyzingCompetitor(false);
          ctrl.abort();
          throw err;
        }
      });
    } catch (error) {
      setCompetitorError('Failed to start competitor analysis');
      setIsAnalyzingCompetitor(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading Dashboard</h2>
          <p className="text-slate-600">Fetching real-time data from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          AI Visibility Dashboard
        </h2>
        <p className="text-lg text-slate-600">
          Real-time insights into your brand's AI visibility performance
        </p>
      </div>

      {/* Main Visibility Score */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white mb-8">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="text-6xl font-bold mb-4">{visibilityScore}</div>
            <div className="text-xl opacity-90 mb-2">AI Visibility Score</div>
            <div className="text-sm opacity-75">
              Based on analysis of {domainData?.aiQueryResults?.length || 0} AI responses across {domainData?.keywords?.length || 0} keywords
            </div>
            <div className="flex justify-center mt-6">
              <div className="w-64">
                <Progress 
                  value={visibilityScore} 
                  className="h-3 bg-white/20"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="phrases">Phrases</TabsTrigger>
          <TabsTrigger value="competitor">Competitor</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {domainData?.aiQueryResults ? 
                    Math.round((domainData.aiQueryResults.filter(r => r.presence === 1).length / domainData.aiQueryResults.length) * 100) : 0}%
                </div>
                <div className="text-sm text-slate-600">Domain Presence Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {domainData?.aiQueryResults ? 
                    Math.round((domainData.aiQueryResults.reduce((sum, r) => sum + r.relevance, 0) / domainData.aiQueryResults.length) * 10) / 10 : 0}/5
                </div>
                <div className="text-sm text-slate-600">Avg Search Relevance</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {domainData?.phrases?.length || 0}
                </div>
                <div className="text-sm text-slate-600">Total Phrases Analyzed</div>
              </CardContent>
            </Card>
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {domainData?.keywords?.filter(k => k.isSelected).length || 0}
                </div>
                <div className="text-sm text-slate-600">Selected Keywords</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visibility Trend */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Visibility Trend</CardTitle>
                <CardDescription>AI visibility score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Mention Distribution */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Domain Presence Distribution</CardTitle>
                <CardDescription>Brand presence across AI responses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">
                      Present ({pieData[0]?.value || 0} responses)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm">
                      Not Found ({pieData[1]?.value || 0} responses)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>AI Model Performance Comparison</CardTitle>
              <CardDescription>How different AI models perform for your brand</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modelPerformanceData.map((model) => (
              <Card key={model.model} className="bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">{model.model}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Visibility Score:</span>
                    <span className="font-bold">{model.score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Responses:</span>
                    <span className="font-medium">{model.responses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Domain Mentions:</span>
                    <span className="font-medium">{model.mentions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Avg Quality:</span>
                    <span className="font-medium">{model.avgScore}/5</span>
                  </div>
                  <Progress value={model.score} className="h-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Keyword Performance</CardTitle>
              <CardDescription>AI visibility by keyword</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={keywordPerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="keyword" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="visibility" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phrases" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Phrases */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-green-600">High Visibility Phrases</CardTitle>
                <CardDescription>Phrases where your domain appears in AI responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPhrases.map((phrase, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{phrase.phrase}</div>
                        <div className="text-xs text-slate-600">
                          {phrase.model} • Relevance: {phrase.relevance}/5 • Accuracy: {phrase.accuracy}/5
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {phrase.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Improvement Opportunities */}
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-600">Improvement Opportunities</CardTitle>
                <CardDescription>Phrases where your domain needs better visibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {improvementOpportunities.map((phrase, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{phrase.phrase}</div>
                        <div className="text-xs text-slate-600">
                          {phrase.model} • {phrase.issue}
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {phrase.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitor" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
              <CardDescription>Compare your AI visibility with competitors using AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter competitor domain (e.g., competitor.com)"
                  value={competitorDomain}
                  onChange={(e) => setCompetitorDomain(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={analyzeCompetitor}
                  disabled={isAnalyzingCompetitor}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {isAnalyzingCompetitor ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Competitor'
                  )}
                </Button>
              </div>

              {competitorError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-700">{competitorError}</span>
                  </div>
                </div>
              )}

              {competitorAnalysis && (
                <div className="space-y-6">
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="mb-4 grid grid-cols-8">
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                      <TabsTrigger value="metrics">Metrics</TabsTrigger>
                      <TabsTrigger value="keywordOverlap">Keyword Overlap</TabsTrigger>
                      <TabsTrigger value="phraseOverlap">Phrase Overlap</TabsTrigger>
                      <TabsTrigger value="aiVisibility">AI Visibility</TabsTrigger>
                      <TabsTrigger value="swot">SWOT</TabsTrigger>
                      <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                      <TabsTrigger value="marketMap">Market Map</TabsTrigger>
                      <TabsTrigger value="recentNews">News</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary">
                      <p className="text-slate-700 whitespace-pre-line">{competitorAnalysis?.summary || 'No summary available.'}</p>
                    </TabsContent>
                    <TabsContent value="metrics">
                      <table className="min-w-full text-sm border">
                        <thead>
                          <tr>
                            {competitorAnalysis?.metricsTable && competitorAnalysis.metricsTable[0] && Object.keys(competitorAnalysis.metricsTable[0]).map((key) => (
                              <th key={key} className="px-2 py-1 border-b bg-slate-100 text-slate-700">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {competitorAnalysis?.metricsTable?.map((row, i) => (
                            <tr key={i} className="border-b">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="px-2 py-1">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TabsContent>
                    <TabsContent value="keywordOverlap">
                      <div>
                        <div className="font-semibold mb-2">{competitorAnalysis?.keywordOverlap?.percent || 0}% overlap</div>
                        <ul className="list-disc ml-6">
                          {competitorAnalysis?.keywordOverlap?.keywords?.map((kw, i) => <li key={i}>{kw}</li>)}
                        </ul>
                      </div>
                    </TabsContent>
                    <TabsContent value="phraseOverlap">
                      <div>
                        <div className="font-semibold mb-2">{competitorAnalysis?.phraseOverlap?.percent || 0}% overlap</div>
                        <ul className="list-disc ml-6">
                          {competitorAnalysis?.phraseOverlap?.phrases?.map((ph, i) => <li key={i}>{ph}</li>)}
                        </ul>
                      </div>
                    </TabsContent>
                    <TabsContent value="aiVisibility">
                      <table className="min-w-full text-sm border">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 border-b bg-slate-100 text-slate-700">Domain</th>
                            <th className="px-2 py-1 border-b bg-slate-100 text-slate-700">Score</th>
                            <th className="px-2 py-1 border-b bg-slate-100 text-slate-700">Mention Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {competitorAnalysis?.aiVisibility?.map((row, i) => (
                            <tr key={i} className="border-b">
                              <td className="px-2 py-1">{row.domain}</td>
                              <td className="px-2 py-1">{row.score}</td>
                              <td className="px-2 py-1">{row.mentionRate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TabsContent>
                    <TabsContent value="swot">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="font-bold mb-2">Your Domain</div>
                          <div className="mb-1 font-semibold">Strengths</div>
                          <ul className="list-disc ml-6 mb-2">{competitorAnalysis?.swot?.target?.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          <div className="mb-1 font-semibold">Weaknesses</div>
                          <ul className="list-disc ml-6 mb-2">{competitorAnalysis?.swot?.target?.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          <div className="mb-1 font-semibold">Opportunities</div>
                          <ul className="list-disc ml-6 mb-2">{competitorAnalysis?.swot?.target?.opportunities?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          <div className="mb-1 font-semibold">Threats</div>
                          <ul className="list-disc ml-6">{competitorAnalysis?.swot?.target?.threats?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        <div>
                          <div className="font-bold mb-2">Competitor</div>
                          <div className="mb-1 font-semibold">Strengths</div>
                          <ul className="list-disc ml-6 mb-2">{competitorAnalysis?.swot?.competitor?.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          <div className="mb-1 font-semibold">Weaknesses</div>
                          <ul className="list-disc ml-6 mb-2">{competitorAnalysis?.swot?.competitor?.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          <div className="mb-1 font-semibold">Opportunities</div>
                          <ul className="list-disc ml-6 mb-2">{competitorAnalysis?.swot?.competitor?.opportunities?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                          <div className="mb-1 font-semibold">Threats</div>
                          <ul className="list-disc ml-6">{competitorAnalysis?.swot?.competitor?.threats?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="recommendations">
                      <ul className="space-y-2">
                        {(competitorAnalysis?.recommendations ?? []).map((rec, i) => (
                          typeof rec === 'object' && rec !== null && 'action' in rec ? (
                            <li key={i} className="flex items-center gap-2">
                              <span className="font-medium">{rec.action}</span>
                              <Badge className={rec.impact === 'high' ? 'bg-green-100 text-green-800' : rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>{rec.impact}</Badge>
                              <Badge className={rec.effort === 'low' ? 'bg-green-50 text-green-700' : rec.effort === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}>{rec.effort}</Badge>
                            </li>
                          ) : null
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="marketMap">
                      <ul className="space-y-2">
                        {competitorAnalysis?.marketMap?.map((m, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="font-medium">{m.domain}</span>
                            <Badge className={m.position === 'leader' ? 'bg-green-100 text-green-800' : m.position === 'challenger' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>{m.position}</Badge>
                            <span className="text-xs text-slate-500">{m.justification}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    <TabsContent value="recentNews">
                      <ul className="space-y-2">
                        {competitorAnalysis?.recentNews?.map((n, i) => (
                          <li key={i}>
                            <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline font-medium">{n.headline}</a>
                            <span className="ml-2 text-xs text-slate-500">({n.domain})</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Button variant="outline" onClick={onPrev}>
          Back to Scoring
        </Button>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Start New Analysis
        </Button>
        <Button 
          variant="outline"
          onClick={() => alert('Export functionality would be implemented here')}
        >
          Export Report
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
