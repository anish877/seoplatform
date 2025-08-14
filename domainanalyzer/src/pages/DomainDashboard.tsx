import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Globe, BarChart3, Eye, MessageSquare, Star, Users, Target, AlertTriangle, Lightbulb, RefreshCw, Activity, Shield, Award, Zap, Link as LinkIcon, FileText, LayoutDashboard, Search, Target as TargetIcon, BarChart3 as BarChart3Icon, Cpu, FileText as FileTextIcon, Users as UsersIcon, MessageSquare as MessageSquareIcon, History, Settings, ChevronRight, Home, Layers, TrendingUp as TrendingUpIcon, Activity as ActivityIcon, Globe as GlobeIcon, Zap as ZapIcon, Shield as ShieldIcon, Award as AwardIcon, Calculator, Lock, CreditCard, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import type { Keyword } from '@/services/api';
import type { AIQueryResult } from '@/components/AIQueryResults';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart as ReLineChart, Line as ReLine, XAxis as ReXAxis, YAxis as ReYAxis, Tooltip as ReTooltip, Legend as ReLegend, ResponsiveContainer as ReResponsiveContainer, CartesianGrid as ReCartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DomainData {
  id: number;
  url: string;
  context: string;
  lastAnalyzed: string;
  industry: string;
  description: string;
  crawlResults: Array<{
    pagesScanned: number;
    analyzedUrls: string[];
    extractedContext: string;
  }>;
  keywords: Keyword[];
  phrases: Array<{ id: number; text: string; keywordId: number }>;
  aiQueryResults: AIQueryResult[];
  metrics: {
    visibilityScore: number;
    mentionRate: string;
    avgRelevance: string;
    avgAccuracy: string;
    avgSentiment: string;
    avgOverall: string;
    totalQueries: number;
    keywordCount: number;
    phraseCount: number;
    modelPerformance: Array<{ model: string; score: number; responses: number; mentions: number; avgScore: number; avgLatency?: string; avgCost?: string; avgRelevance?: string; avgAccuracy?: string; avgSentiment?: string; avgOverall?: string }>;
    keywordPerformance: Array<{ keyword: string; visibility: number; mentions: number; sentiment: number; volume: number; difficulty: string; cpc?: number }>;
    topPhrases: Array<{ phrase: string; count: number }>;
    performanceData: Array<{ month: string; score: number; mentions?: number; queries?: number; organicTraffic?: number; backlinks?: number; domainAuthority?: number }>;
    // Enhanced SEO metrics
    seoMetrics?: {
      organicTraffic: number;
      backlinks: number;
      domainAuthority: number;
      pageSpeed: number;
      mobileScore: number;
      coreWebVitals: { lcp: number; fid: number; cls: number };
      technicalSeo: { ssl: boolean; mobile: boolean; sitemap: boolean; robots: boolean };
      contentQuality: { readability: number; depth: number; freshness: number };
    };
    keywordAnalytics?: {
      highVolume: number;
      mediumVolume: number;
      lowVolume: number;
      highDifficulty: number;
      mediumDifficulty: number;
      lowDifficulty: number;
      longTail: number;
      branded: number;
      nonBranded: number;
    };
    competitiveAnalysis?: {
      marketShare: number;
      competitorCount: number;
      avgCompetitorScore: number;
      marketPosition: string;
      competitiveGap: number;
    };
    contentPerformance?: {
      totalPages: number;
      indexedPages: number;
      avgPageScore: number;
      topPerformingPages: Array<{ url: string; score: number; traffic: number }>;
      contentGaps: string[];
    };
    technicalMetrics?: {
      crawlability: number;
      indexability: number;
      mobileFriendliness: number;
      pageSpeedScore: number;
      securityScore: number;
    };
  };
  insights: {
    strengths: Array<{
      title: string;
      description: string;
      metric: string;
    }>;
    weaknesses: Array<{
      title: string;
      description: string;
      metric: string;
    }>;
    recommendations: Array<{
      category: string;
      priority: string;
      action: string;
      expectedImpact: string;
      timeline: string;
    }>;
  };
  industryAnalysis: {
    marketPosition: string;
    competitiveAdvantage: string;
    marketTrends: string[];
    growthOpportunities: string[];
    threats: string[];
  };
  extraction?: {
    tokenUsage: number;
  };
}

interface CompetitorData {
  competitors: Array<{
    name: string;
    domain: string;
    strength: string;
    marketShare: string;
    keyStrengths: string[];
    weaknesses: string[];
    threatLevel: string;
    recommendations: string[];
    comparisonToDomain: {
      keywordOverlap: string;
      marketPosition: string;
      competitiveAdvantage: string;
      vulnerabilityAreas: string[];
    };
  }>;
  marketInsights: {
    totalCompetitors: string;
    marketLeader: string;
    emergingThreats: string[];
    opportunities: string[];
    marketTrends: string[];
    marketSize: string;
    growthRate: string;
  };
  strategicRecommendations: Array<{
    category: string;
    priority: string;
    action: string;
    expectedImpact: string;
    timeline: string;
    resourceRequirement: string;
  }>;
  competitiveAnalysis: {
    domainAdvantages: string[];
    domainWeaknesses: string[];
    competitiveGaps: string[];
    marketOpportunities: string[];
    threatMitigation: string[];
  };
  dbStats: Record<string, unknown>;
}

interface SuggestedCompetitor {
  name: string;
  domain: string;
  reason: string;
  type: 'direct' | 'indirect';
}

// Helper to pick the first available numeric key in priority order
function pickKeywordBarKey(arr: Record<string, unknown>[]): string {
  const keys = ['mentions', 'visibility', 'volume', 'cpc', 'sentiment'];
  if (!arr || arr.length === 0) return 'mentions';
  for (const key of keys) {
    const val = arr[0][key];
    if (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))) return key;
  }
  return 'mentions';
}

// Helper to pick the first available numeric key for top phrases
function pickPhraseBarKey(arr: Record<string, unknown>[]): string {
  const keys = ['score', 'count'];
  if (!arr || arr.length === 0) return 'score';
  for (const key of keys) {
    const val = arr[0][key];
    if (typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)))) return key;
  }
  return 'score';
}

const modelColors: Record<string, string> = {
          'GPT-4o': 'bg-blue-100 text-blue-800',
  'Claude 3': 'bg-green-100 text-green-800',
  'Gemini 1.5': 'bg-slate-100 text-slate-800',
};

interface Phrase { id: number; text: string; keywordId: number; }

// Define a type for the AI results as returned by the backend
interface FlatAIQueryResult {
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
  keyword?: string;
}

const AIResultsTable: React.FC<{ results: FlatAIQueryResult[], phrases: Phrase[] }> = ({ results, phrases }) => {
  // Debug: log the first result to inspect fields
  if (results && results.length > 0) {
    // eslint-disable-next-line no-console
    console.log('AIResultsTable first result:', results[0]);
  }
  const [page, setPage] = useState(1);
  const perPage = 25;
  const totalPages = Math.ceil(results.length / perPage);
  const startIdx = (page - 1) * perPage;
  const endIdx = startIdx + perPage;
  const currentResults = results.slice(startIdx, endIdx);

  // Helper for score cell
  function renderScoreCell(value: number | undefined, type: 'relevance' | 'accuracy' | 'sentiment' | 'overall') {
    if (typeof value !== 'number') return <span>-</span>;
    let color = 'text-red-600', label = 'Low';
    if (type === 'relevance') {
      if (value >= 4) { color = 'text-green-600'; label = 'High'; }
      else if (value >= 3) { color = 'text-yellow-600'; label = 'Medium'; }
    } else if (type === 'accuracy') {
      if (value >= 4) { color = 'text-green-600'; label = 'Trusted'; }
      else if (value >= 3) { color = 'text-yellow-600'; label = 'Good'; }
      else { label = 'Poor'; }
    } else if (type === 'sentiment') {
      if (value >= 4) { color = 'text-green-600'; label = 'Positive'; }
      else if (value >= 3) { color = 'text-yellow-600'; label = 'Neutral'; }
      else { label = 'Negative'; }
    } else if (type === 'overall') {
      if (value >= 4) { color = 'text-green-600'; label = 'Excellent'; }
      else if (value >= 3) { color = 'text-yellow-600'; label = 'Good'; }
      else { label = 'Poor'; }
    }
    return (
      <div className="flex flex-col items-center">
        <span className={`font-bold text-lg ${color}`}>{value}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
    );
  }

  // Helper to get phrase text from phraseId
  function getPhraseText(phraseId: number | undefined) {
    if (!phraseId) return '-';
    const phraseObj = phrases.find(p => p.id === phraseId);
    return phraseObj ? phraseObj.text : '-';
  }

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader>
        <div className="flex flex-col items-center justify-center mb-2">
          <CardTitle className="text-2xl font-bold text-slate-900 mb-1">AI Query Results</CardTitle>
          <CardDescription className="text-slate-600 text-center max-w-2xl">
            Every raw AI model response for this domain, with full scoring breakdown. Use this for deep debugging and transparency.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700 font-medium">Phrase</TableHead>
                <TableHead className="text-slate-700 font-medium">Keyword</TableHead>
                <TableHead className="text-slate-700 font-medium">Model</TableHead>
                <TableHead className="text-slate-700 font-medium">Response Preview</TableHead>
                <TableHead className="text-slate-700 font-medium">Latency</TableHead>
                <TableHead className="text-slate-700 font-medium">Domain Presence</TableHead>
                <TableHead className="text-slate-700 font-medium">Relevance</TableHead>
                <TableHead className="text-slate-700 font-medium">Accuracy</TableHead>
                <TableHead className="text-slate-700 font-medium">Sentiment</TableHead>
                <TableHead className="text-slate-700 font-medium">Overall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentResults.map((r, i) => {
                return (
                  <TableRow key={i} className="border-slate-100">
                    <TableCell className="font-medium max-w-xs">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate text-slate-900 cursor-pointer" title={getPhraseText(r.phraseId)}>
                              {getPhraseText(r.phraseId)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-lg whitespace-pre-line">
                            {getPhraseText(r.phraseId)}
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                      <div className="text-xs text-slate-500">{r.keyword || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={modelColors[r.model] || 'bg-slate-100 text-slate-800'}>{r.model}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm text-slate-700 line-clamp-2 cursor-pointer">
                              {r.response ? String(r.response).slice(0, 80) + (r.response.length > 80 ? '...' : '') : '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-lg whitespace-pre-line">
                            {r.response || '-'}
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-mono text-slate-700">{typeof r.latency === 'number' ? r.latency.toFixed(2) + 's' : '-'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {r.presence === 1 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-green-600 text-lg">✓</span>
                          <span className="text-xs text-green-600">Present</span>
                        </div>
                      ) : r.presence === 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-red-600 text-lg">✗</span>
                          <span className="text-xs text-red-600">Not Found</span>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{typeof r.relevance === 'number' ? renderScoreCell(r.relevance, 'relevance') : '-'}</TableCell>
                    <TableCell className="text-center">{typeof r.accuracy === 'number' ? renderScoreCell(r.accuracy, 'accuracy') : '-'}</TableCell>
                    <TableCell className="text-center">{typeof r.sentiment === 'number' ? renderScoreCell(r.sentiment, 'sentiment') : '-'}</TableCell>
                    <TableCell className="text-center">{typeof r.overall === 'number' ? renderScoreCell(r.overall, 'overall') : '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-slate-600">
              Showing {startIdx + 1} to {Math.min(endIdx, results.length)} of {results.length} results
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(1)} disabled={page === 1}>First</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</Button>
              <span className="text-sm px-2">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Payment Popup Component
const PaymentPopup: React.FC<{ isOpen: boolean; onClose: () => void; featureName: string; onUnlockAll?: () => void }> = ({ isOpen, onClose, featureName, onUnlockAll }) => {
  console.log('PaymentPopup props:', { isOpen, featureName });
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl z-[9999] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl shadow-slate-900/10">
        {/* Header - Matching dashboard header style */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-md">
                <Crown className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-slate-800">Upgrade to Pro</DialogTitle>
                <DialogDescription className="text-sm text-slate-600">
                  Unlock <span className="font-semibold text-blue-600">{featureName}</span> and access premium analytics
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-slate-100 hover:scale-110 transition-all duration-300"
            >
              <ChevronRight className="h-4 w-4 text-slate-600 rotate-45" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Feature Benefits - Matching dashboard card style */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Star className="h-4 w-4 text-blue-600" />
              </div>
              <span>Premium Features</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Advanced Analytics</p>
                      <p className="text-2xl font-bold text-slate-800">Deep Insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Users className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Competitor Analysis</p>
                      <p className="text-2xl font-bold text-slate-800">Market Intel</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">AI Insights</p>
                      <p className="text-2xl font-bold text-slate-800">Smart Data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pricing - Matching dashboard card style */}
          <Card className="bg-gradient-to-br from-slate-50 via-white to-slate-100/50 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-4xl font-bold text-slate-800">$29</span>
                  <span className="text-lg text-slate-600">/month</span>
                </div>
                <div className="text-sm text-slate-600">Start your free trial today</div>
                <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>No setup fees</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer - Matching dashboard button style */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-slate-200/60 px-6 py-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 sm:flex-none border-slate-200/60 hover:bg-slate-50 transition-all duration-300"
            >
              Maybe Later
            </Button>
            <Button 
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20 transition-all duration-300"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Start Free Trial
            </Button>
            {onUnlockAll && (
              <Button 
                variant="outline" 
                onClick={() => {
                  onUnlockAll();
                  onClose();
                }} 
                className="flex-1 sm:flex-none border-emerald-500 text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
              >
                🔓 Test: Unlock All
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DomainDashboard = () => {
  const { domain } = useParams<{ domain: string }>();
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [competitorData, setCompetitorData] = useState<CompetitorData | null>(null);
  const [suggestedCompetitors, setSuggestedCompetitors] = useState<SuggestedCompetitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [showingFallbackData, setShowingFallbackData] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paymentPopupOpen, setPaymentPopupOpen] = useState(false);
  const [lockedFeature, setLockedFeature] = useState('');
  const [allUnlocked, setAllUnlocked] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Debug state
  console.log('Current state:', { paymentPopupOpen, lockedFeature, allUnlocked });

  // Extract domain ID from URL - handle different URL patterns
  const getDomainId = () => {
    if (!domain) return 1;
    
    // Try different patterns to extract domain ID
    const patterns = [
      /domain-(\d+)/,           // domain-123
      /(\d+)$/,                 // just a number at the end
      /-(\d+)$/,                // -123 at the end
      /(\d+)/                   // any number
    ];
    
    for (const pattern of patterns) {
      const match = domain.match(pattern);
      if (match) {
        const id = parseInt(match[1]);
        if (!isNaN(id) && id > 0) {
          return id;
        }
      }
    }
    
    // If no pattern matches, try to parse the entire string as a number
    const parsed = parseInt(domain);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    
    // Default fallback
    return 1;
  };

  const domainId = getDomainId();

  // All useEffect hooks must be called before any conditional returns
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (domainId) {
      fetchDomainData(domainId);
    }
  }, [domainId]);

  // Fetch competitor analysis from DB on initial load
  useEffect(() => {
    if (domainData) {
      fetchCompetitorDataFromDB();
      fetchSuggestedCompetitors();
    }
  }, [domainData, domainId]);

  // Show loading while checking authentication - moved after all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const fetchDomainData = async (domainId: number) => {
    try {
      setLoading(true);
      setError(null);
      setDomainData(null); // Clear previous data to prevent showing stale data
      
      console.log('Fetching domain data for ID:', domainId);
      
      // Fetch domain data directly without version
      const url = `${import.meta.env.VITE_API_URL}/api/dashboard/${domainId}`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Domain fetch failed:', errorText);
        throw new Error(`Domain fetch failed: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Domain data received:', data);
      console.log('Data keys:', Object.keys(data));
      console.log('Metrics keys:', Object.keys(data.metrics || {}));
      setShowingFallbackData(false);
      
      // Debug keyword analytics specifically
      if (data.metrics?.keywordAnalytics) {
        console.log('Keyword analytics data:', data.metrics.keywordAnalytics);
        console.log('High volume keywords:', data.metrics.keywordAnalytics.highVolume);
        console.log('Medium volume keywords:', data.metrics.keywordAnalytics.mediumVolume);
        console.log('Low volume keywords:', data.metrics.keywordAnalytics.lowVolume);
      }
      
      // Ensure all metrics are properly formatted
      if (data.metrics) {
        // Ensure visibility score is a number
        data.metrics.visibilityScore = typeof data.metrics.visibilityScore === 'string' 
          ? parseFloat(data.metrics.visibilityScore) 
          : data.metrics.visibilityScore;
        
        // Ensure mention rate is a string with % symbol
        data.metrics.mentionRate = typeof data.metrics.mentionRate === 'number' 
          ? data.metrics.mentionRate.toFixed(1) 
          : data.metrics.mentionRate;
        
        // Ensure all averages are properly formatted
        ['avgRelevance', 'avgAccuracy', 'avgSentiment', 'avgOverall'].forEach(key => {
          if (data.metrics[key]) {
            data.metrics[key] = typeof data.metrics[key] === 'number' 
              ? data.metrics[key].toFixed(1) 
              : data.metrics[key];
          }
        });
        
        // Ensure arrays exist
        data.metrics.modelPerformance = data.metrics.modelPerformance || [];
        data.metrics.keywordPerformance = data.metrics.keywordPerformance || [];
        data.metrics.topPhrases = data.metrics.topPhrases || [];
        data.metrics.performanceData = data.metrics.performanceData || [];
      }
      
      // Ensure insights exist
      if (!data.insights) {
        data.insights = {
          strengths: [],
          weaknesses: [],
          recommendations: []
        };
      }
      
      // Ensure industry analysis exists
      if (!data.industryAnalysis) {
        data.industryAnalysis = {
          marketPosition: 'challenger',
          competitiveAdvantage: 'Based on current performance data',
          marketTrends: [],
          growthOpportunities: [],
          threats: []
        };
      }
      
      // Add a small delay to prevent rapid loading states
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setDomainData(data);
      console.log('Domain data set successfully');
      // Debug: log token usage after setting domain data
      console.log('Token usage from API:', data.extraction?.tokenUsage);
    } catch (err) {
      console.error('Error fetching domain data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load domain data');
      setDomainData(null);
    } finally {
      setLoading(false);
      console.log('Loading state set to false');
    }
  };

  // Fetch competitor analysis from DB (GET)
  const fetchCompetitorDataFromDB = async () => {
    try {
      setCompetitorLoading(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${domainId}/competitors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('No competitor analysis found');
      }
      const data = await response.json();
      setCompetitorData(data);
      // Set competitors state from the analysis's competitorListArr
      if (Array.isArray(data.competitorListArr)) {
        setCompetitors(data.competitorListArr);
      }
    } catch (err) {
      console.error('Error fetching competitor analysis from DB:', err);
      // Don't set error for missing analysis, just log it
    } finally {
      setCompetitorLoading(false);
    }
  };

  const fetchSuggestedCompetitors = async () => {
    try {
      setSuggestionsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${domainId}/suggested-competitors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch suggested competitors');
      }
      const data = await response.json();
      setSuggestedCompetitors(data.suggestedCompetitors || []);
    } catch (err) {
      console.error('Error fetching suggested competitors:', err);
      // Don't set error for suggestions, just log it
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // POST to reanalyze competitors only when user triggers
  const fetchCompetitorData = async (customCompetitors?: string[]) => {
    try {
      setCompetitorLoading(true);
      setError(null);
      const compList = typeof customCompetitors !== 'undefined' ? customCompetitors : competitors;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${domainId}/competitors`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ competitors: compList })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch competitor analysis');
      }
      const data = await response.json();
      setCompetitorData(data);
      // Update competitors state from the analysis's competitorListArr
      if (Array.isArray(data.competitorListArr)) {
        setCompetitors(data.competitorListArr);
      }
    } catch (err) {
      console.error('Error fetching competitor data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load competitor analysis');
    } finally {
      setCompetitorLoading(false);
    }
  };

  // Add competitor
  const handleAddCompetitor = () => {
    if (newCompetitor.trim() && !competitors.includes(newCompetitor.trim())) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor('');
    }
  };

  // Add suggested competitor
  const handleAddSuggestedCompetitor = (suggested: SuggestedCompetitor) => {
    const competitorString = `${suggested.name} (${suggested.domain})`;
    if (!competitors.includes(competitorString)) {
      setCompetitors([...competitors, competitorString]);
    }
  };

  // Remove competitor
  const handleRemoveCompetitor = (name: string) => {
    setCompetitors(competitors.filter(c => c !== name));
  };

  // Reanalyze competitors (POST) only when user clicks
  const handleReanalyze = () => {
    fetchCompetitorData(competitors);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-rose-600" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getVisibilityScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Navigation items for sidebar
  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Key metrics and insights',
      locked: false
    },
    {
      id: 'seo',
      label: 'SEO Metrics',
      icon: Search,
      description: 'Search engine optimization',
      locked: false
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: TrendingUpIcon,
      description: 'Performance analytics',
      locked: false
    },
    {
      id: 'keywords',
      label: 'Keywords',
      icon: TargetIcon,
      description: 'Keyword analysis',
      locked: !allUnlocked
    },
    {
      id: 'technical',
      label: 'Technical',
      icon: Cpu,
      description: 'Technical SEO',
      locked: !allUnlocked
    },
    {
      id: 'content',
      label: 'Content',
      icon: FileTextIcon,
      description: 'Content performance',
      locked: !allUnlocked
    },
    {
      id: 'models',
      label: 'AI Models',
      icon: ActivityIcon,
      description: 'AI model performance',
      locked: !allUnlocked
    },
    {
      id: 'phrases',
      label: 'Top Phrases',
      icon: MessageSquareIcon,
      description: 'Best performing phrases',
      locked: !allUnlocked
    },
    {
      id: 'airesults',
      label: 'AI Results',
      icon: GlobeIcon,
      description: 'Raw AI query results',
      locked: !allUnlocked
    },
    {
      id: 'competitors',
      label: 'Competitors',
      icon: UsersIcon,
      description: 'Competitive analysis',
      locked: !allUnlocked
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: Lightbulb,
      description: 'AI-generated insights',
      locked: !allUnlocked
    },
    {
      id: 'history',
      label: 'Version History',
      icon: History,
      description: 'Version comparison',
      locked: !allUnlocked
    }
  ];

  // Handle navigation item click
  const handleNavigationClick = (item: typeof navigationItems[0]) => {
    console.log('Navigation clicked:', item.label, 'Locked:', item.locked);
    if (item.locked) {
      console.log('Opening payment popup for:', item.label);
      setLockedFeature(item.label);
      setPaymentPopupOpen(true);
    } else {
      console.log('Setting active section to:', item.id);
      setActiveSection(item.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/10 to-transparent animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-800">Loading Dashboard</h3>
            <p className="text-slate-600">
              Analyzing domain performance data...
            </p>
            <p className="text-sm text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-full inline-block">
              Domain ID: {domainId}
              
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !domainData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-rose-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-rose-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-800">Unable to Load Dashboard</h2>
            <p className="text-slate-600">{error || 'Domain data not found'}</p>
            <p className="text-sm text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-full inline-block">
              Domain ID: {domainId}
            </p>
          </div>
                          <Button onClick={() => fetchDomainData(domainId)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { metrics } = domainData;

  // Debug: log token usage in render
  console.log('Token usage in render:', domainData.extraction?.tokenUsage);

  // Safety check to ensure metrics exists
  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-amber-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-800">Metrics Not Available</h2>
            <p className="text-slate-600">Domain data loaded but metrics are missing</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare pie chart data with real values
  const mentionRateValue = parseFloat(metrics.mentionRate) || 0;
  const pieData = [
    { name: 'Mentioned', value: mentionRateValue, color: '#059669' },
    { name: 'Not Mentioned', value: Math.max(0, 100 - mentionRateValue), color: '#e5e7eb' }
  ];

  return (
    <TooltipProvider>
      <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex overflow-hidden">
        {/* Payment Popup */}
        <PaymentPopup 
          isOpen={paymentPopupOpen} 
          onClose={() => setPaymentPopupOpen(false)} 
          featureName={lockedFeature}
          onUnlockAll={() => setAllUnlocked(true)}
        />
      {/* Sidebar Navigation */}
      <div className={cn(
        "bg-white/95 backdrop-blur-xl border-r border-white/20 shadow-xl shadow-slate-900/10 transition-all duration-300 ease-in-out flex flex-col h-full z-50 relative",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="p-4 border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              {!sidebarCollapsed && (
                <span className="font-semibold text-slate-800">Dashboard</span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0 hover:bg-slate-100 hover:scale-110 transition-all duration-300"
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-all duration-300 ease-out",
                sidebarCollapsed ? "rotate-180 text-blue-600" : "text-slate-600"
              )} />
            </Button>
          </div>
        </div>

        {/* Domain Info */}
        <div className="p-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50/50 to-transparent">
          <div className="space-y-3">
            {!sidebarCollapsed && (
              <>
                <div className="flex items-center space-x-3 p-2 rounded-lg bg-white/50 backdrop-blur-sm">
                  <Globe className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-800 truncate">{domainData.url}</span>
                </div>
                <div className="flex items-center space-x-3 px-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                  <span className="text-xs text-slate-600 font-medium">Active Analysis</span>
                </div>
                {allUnlocked && (
                  <div className="flex items-center space-x-3 px-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="text-xs text-green-600 font-medium">🔓 Test Mode: All Unlocked</span>
                  </div>
                )}
              </>
            )}
            {sidebarCollapsed && (
              <div className="flex justify-center">
                <Globe className="h-5 w-5 text-slate-600" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <UITooltip key={item.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavigationClick(item)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-300 group relative",
                      isActive 
                        ? "bg-gradient-to-r from-blue-50 to-blue-50/80 text-blue-700 border border-blue-200/50 shadow-lg shadow-blue-500/20 ring-1 ring-blue-200/30" 
                        : item.locked
                        ? "text-slate-400 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-slate-50/30 hover:text-slate-500 cursor-pointer"
                        : "text-slate-600 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-50/80 hover:text-slate-800 hover:shadow-md transition-all duration-300"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg transition-all duration-300 transform relative",
                      isActive 
                        ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 scale-110 shadow-md" 
                        : item.locked
                        ? "bg-slate-100/50 text-slate-400"
                        : "bg-slate-100 text-slate-500 group-hover:bg-gradient-to-br group-hover:from-slate-200 group-hover:to-slate-300 group-hover:text-slate-600 group-hover:scale-105"
                    )}>
                      <Icon className="h-4 w-4" />
                      {item.locked && sidebarCollapsed && (
                        <Lock className="h-3 w-3 absolute -top-1 -right-1 text-slate-400" />
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center space-x-2">
                          <span>{item.label}</span>
                          {item.locked && (
                            <Crown className="h-3 w-3 text-purple-400" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                      </div>
                    )}
                    {isActive && !sidebarCollapsed && (
                      <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                </TooltipTrigger>
                                  {item.locked && (
                    <TooltipContent 
                      side="right" 
                      className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-xl shadow-slate-900/10 p-4"
                      sideOffset={8}
                      align="center"
                      style={{ zIndex: 999999 }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                            <Crown className="h-3 w-3 text-blue-600" />
                          </div>
                          <span className="text-slate-800 font-semibold text-sm">Pro Feature</span>
                        </div>
                        <p className="text-slate-600 text-xs">Unlock {item.label} and access premium analytics</p>
                        <Button 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/20 transition-all duration-300"
                          onClick={() => {
                            setLockedFeature(item.label);
                            setPaymentPopupOpen(true);
                          }}
                        >
                          <Crown className="h-3 w-3 mr-2" />
                          Upgrade Now
                        </Button>
                      </div>
                    </TooltipContent>
                  )}
              </UITooltip>
            );
          })}
        </nav>

        {/* Visibility Score */}
        <div className="p-4 border-t border-slate-200/60">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Visibility Score</span>
                <span className={`text-lg font-bold transition-all duration-500 ${
                  metrics.visibilityScore >= 80 ? 'text-emerald-600 animate-pulse' :
                  metrics.visibilityScore >= 60 ? 'text-blue-600' :
                  metrics.visibilityScore >= 40 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {metrics.visibilityScore}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${
                    metrics.visibilityScore >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/50' :
                    metrics.visibilityScore >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50' :
                    metrics.visibilityScore >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-lg shadow-amber-500/50' : 
                    'bg-gradient-to-r from-rose-400 to-rose-600 shadow-lg shadow-rose-500/50'
                  }`}
                  style={{ width: `${metrics.visibilityScore}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="text-center">
                <div className={`text-lg font-bold transition-all duration-500 ${
                  metrics.visibilityScore >= 80 ? 'text-emerald-600 animate-pulse' :
                  metrics.visibilityScore >= 60 ? 'text-blue-600' :
                  metrics.visibilityScore >= 40 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {metrics.visibilityScore}%
                </div>
                <div className="text-xs text-slate-500">Score</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 z-30 flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-800">
                  {navigationItems.find(item => item.id === activeSection)?.label}
                </h1>
                <p className="text-sm text-slate-600">
                  {navigationItems.find(item => item.id === activeSection)?.description}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {showingFallbackData && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Showing main data
                  </Badge>
                )}
                {!showingFallbackData && domainData?.metrics?.visibilityScore === 0 && (
                  <Badge className="bg-red-50 text-red-700 border-red-200">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    No analysis data
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Eye className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Mention Rate</p>
                        <p className="text-2xl font-bold text-slate-800">{metrics.mentionRate}%</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 relative">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray={`${parseFloat(metrics.mentionRate)}, 100`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Avg Relevance</p>
                      <p className="text-2xl font-bold text-slate-800">{metrics.avgRelevance}<span className="text-lg text-slate-500">/5</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Avg Sentiment</p>
                      <p className="text-2xl font-bold text-slate-800">{metrics.avgSentiment}<span className="text-lg text-slate-500">/5</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Queries</p>
                      <p className="text-2xl font-bold text-slate-800">{metrics.totalQueries?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-50 rounded-lg">
                      <Activity className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Overall Score</p>
                      <p className="text-2xl font-bold text-slate-800">{metrics.avgOverall}<span className="text-lg text-slate-500">/5</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Add this at the end of the grid */}
              {domainData.extraction?.tokenUsage !== undefined && (
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <Calculator className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Total GPT Token Usage</p>
                        <p className="text-2xl font-bold text-slate-800">{domainData.extraction.tokenUsage.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {activeSection === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Trend */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-slate-800">AI Visibility Score Trend</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600">Monthly progression of AI model visibility and mention rates</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.performanceData && metrics.performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={metrics.performanceData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis 
                          dataKey="month" 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'Visibility Score (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${value}%`, 'AI Visibility Score']}
                          labelFormatter={(label) => `Month: ${label}`}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                          strokeWidth={2}
                          name="AI Visibility Score"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-slate-500 py-12 space-y-3">
                      <Activity className="h-12 w-12 mx-auto text-slate-300" />
                      <div>
                        <p className="font-medium">Historical trend data not available</p>
                        <p className="text-sm">Current AI visibility score: <span className="font-semibold text-blue-600">{metrics.visibilityScore}%</span></p>
                        <p className="text-xs text-slate-400">Based on {metrics.totalQueries} AI model queries</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mention Distribution */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-emerald-50 rounded-lg">
                      <Eye className="h-4 w-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-slate-800">AI Model Mention Rate</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600">Domain presence in AI model responses across {metrics.totalQueries} queries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value}% of queries`, name]}
                          labelFormatter={() => `AI Model Responses`}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-8 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">
                        Domain Mentioned ({mentionRateValue}% - {Math.round(metrics.totalQueries * mentionRateValue / 100)} queries)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                      <span className="text-sm font-medium text-slate-700">
                        Not Mentioned ({(100 - mentionRateValue).toFixed(1)}% - {Math.round(metrics.totalQueries * (100 - mentionRateValue) / 100)} queries)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
               {/* Industry Analysis */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-50 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-slate-800">Industry Position</CardTitle>
                </div>
                <CardDescription className="text-slate-600">Market analysis and competitive positioning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>Market Position</span>
                    </h4>
                    <p className="text-slate-600 capitalize font-medium bg-slate-50 px-3 py-2 rounded-lg">
                      {domainData.industryAnalysis?.marketPosition || 'Challenger'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <span>Competitive Advantage</span>
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {domainData.industryAnalysis?.competitiveAdvantage || 'Based on current performance metrics'}
                    </p>
                  </div>
                </div>

                {domainData.industryAnalysis?.marketTrends && domainData.industryAnalysis.marketTrends.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-amber-600" />
                      <span>Market Trends</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {domainData.industryAnalysis.marketTrends.map((trend, index) => (
                        <Badge key={index} className="bg-amber-50 text-amber-700 border-amber-200">
                          {trend}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {domainData.industryAnalysis?.growthOpportunities && domainData.industryAnalysis.growthOpportunities.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-emerald-600" />
                        <span>Growth Opportunities</span>
                      </h4>
                      <ul className="space-y-2">
                        {domainData.industryAnalysis.growthOpportunities.map((opportunity, index) => (
                          <li key={index} className="text-sm text-slate-600 flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {domainData.industryAnalysis?.threats && domainData.industryAnalysis.threats.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        <span>Potential Threats</span>
                      </h4>
                      <ul className="space-y-2">
                        {domainData.industryAnalysis.threats.map((threat, index) => (
                          <li key={index} className="text-sm text-slate-600 flex items-start space-x-2">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span>{threat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
            
            )
            }

           
          </div>

        {activeSection === 'seo' && (
          <div>
            {/* SEO Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Monthly Organic Traffic</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.seoMetrics?.organicTraffic ? metrics.seoMetrics.organicTraffic.toLocaleString() : '—'}
                      </p>
                      <p className="text-xs text-slate-500">Estimated monthly visitors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <LinkIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Backlinks</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.seoMetrics?.backlinks ? metrics.seoMetrics.backlinks.toLocaleString() : '—'}
                      </p>
                      <p className="text-xs text-slate-500">Referring domains</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Domain Authority</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.seoMetrics?.domainAuthority ? `${metrics.seoMetrics.domainAuthority}/100` : '—'}
                      </p>
                      <p className="text-xs text-slate-500">SEO ranking power</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Zap className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Page Speed Score</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.seoMetrics?.pageSpeed ? `${metrics.seoMetrics.pageSpeed}/100` : '—'}
                      </p>
                      <p className="text-xs text-slate-500">Google PageSpeed Insights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SEO Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Organic Traffic Trend */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Monthly Organic Traffic</CardTitle>
                  <CardDescription className="text-slate-600">Estimated organic search traffic progression (6-month trend)</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.performanceData && metrics.performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={metrics.performanceData}>
                        <defs>
                          <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis 
                          dataKey="month" 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'Monthly Visitors', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${value?.toLocaleString()} visitors`, 'Organic Traffic']}
                          labelFormatter={(label) => `Month: ${label}`}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="organicTraffic" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorTraffic)" 
                          strokeWidth={2}
                          name="Organic Traffic"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-slate-500 py-12">
                      <TrendingUp className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="font-medium">Organic traffic data not available</p>
                      <p className="text-sm text-slate-400">
                        {metrics.seoMetrics?.organicTraffic ? 
                          `Current estimated traffic: ${metrics.seoMetrics?.organicTraffic?.toLocaleString() || '0'} monthly visitors` : 
                          'No traffic data available'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Backlinks Growth */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Backlink Portfolio Growth</CardTitle>
                  <CardDescription className="text-slate-600">Monthly backlink acquisition and domain authority progression</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.performanceData && metrics.performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics.performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis 
                          dataKey="month" 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'Backlinks Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'backlinks' ? `${value?.toLocaleString()} backlinks` : `${value}/100`,
                            name === 'backlinks' ? 'Total Backlinks' : 'Domain Authority'
                          ]}
                          labelFormatter={(label) => `Month: ${label}`}
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="backlinks" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          name="Total Backlinks"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="domainAuthority" 
                          stroke="#8b5cf6" 
                          strokeWidth={2} 
                          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                          name="Domain Authority"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-slate-500 py-12">
                      <LinkIcon className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="font-medium">Backlink data not available</p>
                      <p className="text-sm text-slate-400">
                        {metrics.seoMetrics?.backlinks && metrics.seoMetrics?.domainAuthority ? 
                          `Current backlinks: ${metrics.seoMetrics?.backlinks?.toLocaleString() || '0'} | Domain Authority: ${metrics.seoMetrics?.domainAuthority || 0}/100` : 
                          'No backlink data available'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Core Web Vitals */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Google Core Web Vitals</CardTitle>
                <CardDescription className="text-slate-600">Real user experience metrics that impact search rankings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Largest Contentful Paint (LCP)</span>
                      <span className={`text-lg font-bold ${(metrics.seoMetrics?.coreWebVitals?.lcp || 0) <= 2.5 ? 'text-green-600' : 'text-red-600'}`}>
                        {(metrics.seoMetrics?.coreWebVitals?.lcp || 0).toFixed(2)}s
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, ((metrics.seoMetrics?.coreWebVitals?.lcp || 0) / 2.5) * 100))} 
                      className="h-2"
                      color={metrics.seoMetrics?.coreWebVitals?.lcp <= 2.5 ? 'green' : 'red'}
                    />
                    <p className="text-xs text-slate-500">
                      {(metrics.seoMetrics?.coreWebVitals?.lcp || 0) <= 2.5 ? 'Good (≤2.5s)' : 'Needs improvement (>2.5s)'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">First Input Delay (FID)</span>
                      <span className={`text-lg font-bold ${(metrics.seoMetrics?.coreWebVitals?.fid || 0) <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {(metrics.seoMetrics?.coreWebVitals?.fid || 0).toFixed(0)}ms
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, ((metrics.seoMetrics?.coreWebVitals?.fid || 0) / 100) * 100))} 
                      className="h-2"
                      color={metrics.seoMetrics?.coreWebVitals?.fid <= 100 ? 'green' : 'red'}
                    />
                    <p className="text-xs text-slate-500">
                      {(metrics.seoMetrics?.coreWebVitals?.fid || 0) <= 100 ? 'Good (≤100ms)' : 'Needs improvement (>100ms)'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Cumulative Layout Shift (CLS)</span>
                      <span className={`text-lg font-bold ${(metrics.seoMetrics?.coreWebVitals?.cls || 0) <= 0.1 ? 'text-green-600' : 'text-red-600'}`}>
                        {(metrics.seoMetrics?.coreWebVitals?.cls || 0).toFixed(3)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, Math.max(0, ((metrics.seoMetrics?.coreWebVitals?.cls || 0) / 0.1) * 100))} 
                      className="h-2"
                      color={metrics.seoMetrics?.coreWebVitals?.cls <= 0.1 ? 'green' : 'red'}
                    />
                    <p className="text-xs text-slate-500">
                      {(metrics.seoMetrics?.coreWebVitals?.cls || 0) <= 0.1 ? 'Good (≤0.1)' : 'Needs improvement (>0.1)'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Quality Metrics */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Content Quality Analysis</CardTitle>
                <CardDescription className="text-slate-600">Content quality and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Readability Score</span>
                      <span className="text-lg font-bold text-slate-800">
                        {metrics.seoMetrics?.contentQuality?.readability ? `${metrics.seoMetrics.contentQuality.readability}/100` : '—'}
                      </span>
                    </div>
                    <Progress value={metrics.seoMetrics?.contentQuality?.readability || 0} className="h-2" />
                    <p className="text-xs text-slate-500">
                      {metrics.seoMetrics?.contentQuality?.readability ? 
                        (metrics.seoMetrics.contentQuality.readability >= 80 ? 'Excellent' : 
                         metrics.seoMetrics.contentQuality.readability >= 60 ? 'Good' : 'Needs improvement') : 
                        'No data available'
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Content Depth</span>
                      <span className="text-lg font-bold text-slate-800">
                        {metrics.seoMetrics?.contentQuality?.depth ? `${metrics.seoMetrics.contentQuality.depth}/100` : '—'}
                      </span>
                    </div>
                    <Progress value={metrics.seoMetrics?.contentQuality?.depth || 0} className="h-2" />
                    <p className="text-xs text-slate-500">
                      {metrics.seoMetrics?.contentQuality?.depth ? 
                        (metrics.seoMetrics.contentQuality.depth >= 80 ? 'Comprehensive' : 
                         metrics.seoMetrics.contentQuality.depth >= 60 ? 'Good' : 'Shallow') : 
                        'No data available'
                      }
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Content Freshness</span>
                      <span className="text-lg font-bold text-slate-800">
                        {metrics.seoMetrics?.contentQuality?.freshness ? `${metrics.seoMetrics.contentQuality.freshness}/100` : '—'}
                      </span>
                    </div>
                    <Progress value={metrics.seoMetrics?.contentQuality?.freshness || 0} className="h-2" />
                    <p className="text-xs text-slate-500">
                      {metrics.seoMetrics?.contentQuality?.freshness ? 
                        (metrics.seoMetrics.contentQuality.freshness >= 80 ? 'Very Fresh' : 
                         metrics.seoMetrics.contentQuality.freshness >= 60 ? 'Recent' : 'Outdated') : 
                        'No data available'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'performance' && (
          <div>
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Growth Rate</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.performanceData && metrics.performanceData.length > 1 ? 
                          Math.round(((metrics.performanceData[metrics.performanceData.length - 1].score - metrics.performanceData[0].score) / metrics.performanceData[0].score) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Avg Response Time</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.modelPerformance && metrics.modelPerformance.length > 0 ? 
                          (metrics.modelPerformance.reduce((sum, m) => sum + parseFloat(m.avgLatency || '0'), 0) / metrics.modelPerformance.length).toFixed(1) : '—'}s
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Success Rate</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.totalQueries > 0 ? Math.round((metrics.totalQueries - (metrics.totalQueries * 0.1)) / metrics.totalQueries * 100) : '—'}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Market Share</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.competitiveAnalysis?.marketShare ? `${metrics.competitiveAnalysis.marketShare.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Performance Metrics Over Time */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">AI Model Performance Trends</CardTitle>
                <CardDescription className="text-slate-600">6-month progression of AI visibility, mentions, and query volume</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.performanceData && metrics.performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={metrics.performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#64748b" 
                        fontSize={12}
                        label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={12}
                        label={{ value: 'Count / Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'score' ? `${value}%` : value?.toLocaleString(),
                          name === 'score' ? 'AI Visibility Score' : name === 'mentions' ? 'Domain Mentions' : 'Total Queries'
                        ]}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        name="AI Visibility Score"
                      />
                      {metrics.performanceData.every(d => 'mentions' in d) && (
                        <Line 
                          type="monotone" 
                          dataKey="mentions" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                          name="Domain Mentions"
                        />
                      )}
                      {metrics.performanceData.every(d => 'queries' in d) && (
                        <Line 
                          type="monotone" 
                          dataKey="queries" 
                          stroke="#f59e42" 
                          strokeWidth={2} 
                          dot={{ fill: '#f59e42', strokeWidth: 2, r: 3 }}
                          name="Total Queries"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="font-medium">Performance trend data not available</p>
                    <p className="text-sm text-slate-400">Current metrics: {metrics.visibilityScore}% visibility, {Math.round(metrics.totalQueries * parseFloat(metrics.mentionRate) / 100)} mentions</p>
                  </div>
                )}
              </CardContent>
            </Card>

              {/* Current Metrics Breakdown */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Current Metrics</CardTitle>
                  <CardDescription className="text-slate-600">Latest performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {['avgRelevance', 'avgAccuracy', 'avgSentiment', 'avgOverall'].map((key) => (
                    metrics[key] !== undefined && (
                      <div className="space-y-4" key={key}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">{key.replace('avg', '').replace(/([A-Z])/g, ' $1').trim()} Score</span>
                          <span className="text-lg font-bold text-slate-800">{metrics[key]}/5</span>
                        </div>
                        <Progress value={parseFloat(metrics[key]) * 20} className="h-2" />
                      </div>
                    )
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Domain Authority Trend */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Domain Authority Progression</CardTitle>
                <CardDescription className="text-slate-600">6-month domain authority score progression (0-100 scale)</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.performanceData && metrics.performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics.performanceData}>
                      <defs>
                        <linearGradient id="colorAuthority" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#64748b" 
                        fontSize={12}
                        label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={12}
                        domain={[0, 100]}
                        label={{ value: 'Domain Authority Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value}/100`, 'Domain Authority']}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="domainAuthority" 
                        stroke="#8b5cf6" 
                        fillOpacity={1} 
                        fill="url(#colorAuthority)" 
                        strokeWidth={2}
                        name="Domain Authority"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <Shield className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="font-medium">Domain authority trend data not available</p>
                    <p className="text-sm text-slate-400">
                      {metrics.seoMetrics?.domainAuthority ? 
                        `Current domain authority: ${metrics.seoMetrics.domainAuthority}/100` : 
                        'No domain authority data available'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'models' && (
          <div>
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">AI Model Performance Analysis</CardTitle>
                <CardDescription className="text-slate-600">Domain mention performance across different AI language models</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.modelPerformance && metrics.modelPerformance.length > 0 ? (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={metrics.modelPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="model" 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'AI Model', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'Domain Mentions', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${value} mentions`, 'Domain Mentions']}
                          labelFormatter={(label) => `Model: ${label}`}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} 
                        />
                        <Bar dataKey="mentions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {metrics.modelPerformance.map((model, index) => (
                        <Card key={index} className="bg-slate-50 border-slate-200">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-slate-800">{model.model}</h4>
                              <div className="text-2xl font-bold text-blue-600">{model.mentions}</div>
                              <p className="text-sm text-slate-600">mentions</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <Activity className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p>Model performance data not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'technical' && (
          <div>
            {/* Technical SEO Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Crawlability</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.technicalMetrics?.crawlability ? `${metrics.technicalMetrics.crawlability}%` : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Eye className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Indexability</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.technicalMetrics?.indexability ? `${metrics.technicalMetrics.indexability}%` : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Mobile Friendly</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.technicalMetrics?.mobileFriendliness ? `${metrics.technicalMetrics.mobileFriendliness}%` : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Security Score</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.technicalMetrics?.securityScore ? `${metrics.technicalMetrics.securityScore}%` : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Technical SEO Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Technical SEO Radar Chart */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Technical SEO Overview</CardTitle>
                  <CardDescription className="text-slate-600">Comprehensive technical SEO metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">SSL Certificate</span>
                      <Badge className={metrics.seoMetrics?.technicalSeo?.ssl ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                        {metrics.seoMetrics?.technicalSeo?.ssl ? 'Active' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Mobile Optimization</span>
                      <Badge className={metrics.seoMetrics?.technicalSeo?.mobile ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                        {metrics.seoMetrics?.technicalSeo?.mobile ? 'Optimized' : 'Not Optimized'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">XML Sitemap</span>
                      <Badge className={metrics.seoMetrics?.technicalSeo?.sitemap ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                        {metrics.seoMetrics?.technicalSeo?.sitemap ? 'Present' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Robots.txt</span>
                      <Badge className={metrics.seoMetrics?.technicalSeo?.robots ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                        {metrics.seoMetrics?.technicalSeo?.robots ? 'Present' : 'Missing'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Page Speed Distribution */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Performance Metrics</CardTitle>
                  <CardDescription className="text-slate-600">Page speed and performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Page Speed Score</span>
                        <span className={`text-lg font-bold ${metrics.seoMetrics?.pageSpeed ? 
                          (metrics.seoMetrics.pageSpeed >= 90 ? 'text-green-600' : metrics.seoMetrics.pageSpeed >= 70 ? 'text-yellow-600' : 'text-red-600') : 
                          'text-slate-400'}`}>
                          {metrics.seoMetrics?.pageSpeed ? `${metrics.seoMetrics.pageSpeed}/100` : '—'}
                        </span>
                      </div>
                      <Progress value={metrics.seoMetrics?.pageSpeed || 0} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Mobile Score</span>
                        <span className={`text-lg font-bold ${metrics.seoMetrics?.mobileScore ? 
                          (metrics.seoMetrics.mobileScore >= 90 ? 'text-green-600' : metrics.seoMetrics.mobileScore >= 70 ? 'text-yellow-600' : 'text-red-600') : 
                          'text-slate-400'}`}>
                          {metrics.seoMetrics?.mobileScore ? `${metrics.seoMetrics.mobileScore}/100` : '—'}
                        </span>
                      </div>
                      <Progress value={metrics.seoMetrics?.mobileScore || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Technical Issues */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Technical SEO Issues</CardTitle>
                <CardDescription className="text-slate-600">Issues that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(!metrics.seoMetrics?.technicalSeo?.ssl || !metrics.seoMetrics?.technicalSeo?.sitemap || !metrics.seoMetrics?.technicalSeo?.robots || (metrics.seoMetrics?.pageSpeed || 0) < 70) ? (
                    <div className="space-y-3">
                      {!metrics.seoMetrics?.technicalSeo?.ssl && (
                        <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-800">SSL Certificate Missing</p>
                            <p className="text-sm text-red-600">Install SSL certificate for better security and SEO</p>
                          </div>
                        </div>
                      )}
                      {!metrics.seoMetrics?.technicalSeo?.sitemap && (
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-800">XML Sitemap Missing</p>
                            <p className="text-sm text-yellow-600">Create and submit XML sitemap to search engines</p>
                          </div>
                        </div>
                      )}
                      {!metrics.seoMetrics?.technicalSeo?.robots && (
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-yellow-800">Robots.txt Missing</p>
                            <p className="text-sm text-yellow-600">Create robots.txt file for better crawl control</p>
                          </div>
                        </div>
                      )}
                      {(metrics.seoMetrics?.pageSpeed || 0) < 70 && (
                        <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                          <Zap className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium text-orange-800">Page Speed Needs Improvement</p>
                            <p className="text-sm text-orange-600">Optimize images, minify CSS/JS, and use CDN</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto text-green-600 mb-4" />
                      <p className="text-green-800 font-medium">All technical SEO issues resolved!</p>
                      <p className="text-sm text-green-600">Your site is technically optimized</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'content' && (
          <div>
            {/* Content Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Pages</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.contentPerformance?.totalPages ? metrics.contentPerformance.totalPages : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Eye className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Indexed Pages</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.contentPerformance?.indexedPages ? metrics.contentPerformance.indexedPages : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Avg Page Score</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.contentPerformance?.avgPageScore ? `${metrics.contentPerformance.avgPageScore}/100` : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Target className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Content Gaps</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.contentPerformance?.contentGaps ? metrics.contentPerformance.contentGaps.length : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Pages */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Top Performing Pages</CardTitle>
                <CardDescription className="text-slate-600">Pages with highest traffic and engagement</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.contentPerformance?.topPerformingPages && metrics.contentPerformance.topPerformingPages.length > 0 ? (
                  <div className="space-y-4">
                    {metrics.contentPerformance.topPerformingPages.map((page, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{page.url}</p>
                          <p className="text-sm text-slate-600">{page.traffic?.toLocaleString() || '0'} monthly visitors</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-800">{page.score}/100</p>
                          <p className="text-sm text-slate-600">Page Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p>No page performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Gaps */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Content Opportunities</CardTitle>
                <CardDescription className="text-slate-600">Identified content gaps and opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.contentPerformance?.contentGaps && metrics.contentPerformance.contentGaps.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.contentPerformance.contentGaps.map((gap, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800">{gap}</p>
                          <p className="text-sm text-blue-600">High potential for organic traffic growth</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p>No content gaps identified</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'keywords' && (
          <div>
            {/* Keyword Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Hard Keywords</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.keywordAnalytics?.highVolume ? metrics.keywordAnalytics.highVolume : '—'}
                      </p>
                      <p className="text-xs text-slate-500">10K+ monthly searches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <Target className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Medium Keywords</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.keywordAnalytics?.mediumVolume ? metrics.keywordAnalytics.mediumVolume : '—'}
                      </p>
                      <p className="text-xs text-slate-500">1K-10K monthly searches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Easy Keywords</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.keywordAnalytics?.lowVolume ? metrics.keywordAnalytics.lowVolume : '—'}
                      </p>
                      <p className="text-xs text-slate-500">&lt;1K monthly searches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Star className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Branded</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {metrics.keywordAnalytics?.branded ? metrics.keywordAnalytics.branded : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Keyword Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Volume Distribution */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Keyword Difficulty by Volume</CardTitle>
                  <CardDescription className="text-slate-600">Distribution of {metrics.keywordCount} keywords by search volume (Ahrefs-style)</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const pieData = [
                      { name: 'Hard (10K+)', value: metrics.keywordAnalytics?.highVolume || 0, color: '#ef4444' },
                      { name: 'Medium (1K-10K)', value: metrics.keywordAnalytics?.mediumVolume || 0, color: '#f59e0b' },
                      { name: 'Easy (<1K)', value: metrics.keywordAnalytics?.lowVolume || 0, color: '#10b981' }
                    ];
                    console.log('Pie chart data:', pieData);
                    console.log('Keyword analytics object:', metrics.keywordAnalytics);
                    
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            labelLine={false}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} keywords`, name]}
                            labelFormatter={() => `Keyword Portfolio`}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Difficulty Distribution */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800">Keyword Competition Difficulty</CardTitle>
                  <CardDescription className="text-slate-600">Distribution by SEO competition level and ranking difficulty</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { difficulty: 'High (70-100)', count: metrics.keywordAnalytics?.highDifficulty || 0, color: '#ef4444' },
                      { difficulty: 'Medium (30-70)', count: metrics.keywordAnalytics?.mediumDifficulty || 0, color: '#f59e0b' },
                      { difficulty: 'Low (0-30)', count: metrics.keywordAnalytics?.lowDifficulty || 0, color: '#10b981' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="difficulty" 
                        stroke="#64748b" 
                        fontSize={11}
                        label={{ value: 'Competition Level', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={12}
                        label={{ value: 'Number of Keywords', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value} keywords`, 'Keyword Count']}
                        labelFormatter={(label) => `Difficulty: ${label}`}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} 
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Keyword Performance Table */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Keyword Performance Analysis</CardTitle>
                <CardDescription className="text-slate-600">Detailed keyword performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.keywordPerformance && metrics.keywordPerformance.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Visibility</TableHead>
                          <TableHead>Mentions</TableHead>
                          <TableHead>Sentiment</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>CPC</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.keywordPerformance.map((keyword, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{keyword.keyword}</TableCell>
                                                         <TableCell>
                               <div className="flex items-center space-x-2">
                                 <span className="text-sm font-medium">{keyword.visibility}%</span>
                                 <Progress value={keyword.visibility} className="w-16 h-2" />
                               </div>
                             </TableCell>
                             <TableCell>{keyword.mentions}</TableCell>
                             <TableCell>
                               <Badge className={
                                 keyword.sentiment >= 4 ? 'bg-green-50 text-green-700 border-green-200' :
                                 keyword.sentiment >= 3 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                 'bg-red-50 text-red-700 border-red-200'
                               }>
                                 {keyword.sentiment}/5
                               </Badge>
                             </TableCell>
                             <TableCell>{keyword.volume?.toLocaleString()}</TableCell>
                             <TableCell>
                               <Badge className={
                                 keyword.difficulty === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                                 keyword.difficulty === 'Medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                 'bg-green-50 text-green-700 border-green-200'
                               }>
                                 {keyword.difficulty}
                               </Badge>
                             </TableCell>
                             <TableCell>${keyword.cpc || '0.00'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p>No keywords configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'phrases' && (
          <div>
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Top Performing AI Query Phrases</CardTitle>
                <CardDescription className="text-slate-600">Phrases that generate the highest AI model mention rates and scores</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics.topPhrases && metrics.topPhrases.length > 0 ? (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics.topPhrases.slice(0, 8).map(p => {
                        const phraseObj = p as Record<string, unknown>;
                        return {
                          ...p,
                          ...(typeof phraseObj.score !== 'undefined' ? { score: Number(phraseObj.score) } : {}),
                          ...(typeof phraseObj.count !== 'undefined' ? { count: Number(phraseObj.count) } : {})
                        };
                      })} margin={{ left: 40, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="phrase" 
                          stroke="#64748b" 
                          fontSize={11} 
                          angle={-45} 
                          textAnchor="end" 
                          height={80} 
                          interval={0}
                          label={{ value: 'AI Query Phrases', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12}
                          label={{ value: 'Performance Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${value}`, 'Performance Score']}
                          labelFormatter={(label) => `Phrase: ${label}`}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }} 
                        />
                        <Bar dataKey={pickPhraseBarKey(metrics.topPhrases)} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {metrics.topPhrases.slice(0, 10).map((phrase, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">{phrase.phrase}</span>
                          <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                            {Object.entries(phrase).filter(([k]) => k !== 'phrase').map(([k, v]) => `${k}: ${v}`).join(' | ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p>Phrase performance data not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'airesults' && (
          <div>
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">All AI Query Results</CardTitle>
                <CardDescription className="text-slate-600">Raw results from all AI model queries for this domain</CardDescription>
              </CardHeader>
              <CardContent>
                {domainData.aiQueryResults && domainData.aiQueryResults.length > 0 ? (
                  <AIResultsTable results={domainData.aiQueryResults as unknown as FlatAIQueryResult[]} phrases={domainData.phrases || []} />
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <p>No AI query results available for this domain.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === 'competitors' && (
          <div>
            {/* Competitor Management */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Competitor Analysis</CardTitle>
                <CardDescription className="text-slate-600">Manage and analyze your competitors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Competitor */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    placeholder="Enter competitor name or domain"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCompetitor()}
                  />
                  <Button onClick={handleAddCompetitor} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Add Competitor
                  </Button>
                </div>

                {/* Current Competitors */}
                {competitors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800">Current Competitors</h4>
                    <div className="flex flex-wrap gap-2">
                      {competitors.map((competitor, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-slate-100 px-3 py-2 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">{competitor}</span>
                          <button
                            onClick={() => handleRemoveCompetitor(competitor)}
                            className="text-slate-500 hover:text-rose-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={handleReanalyze}
                      disabled={competitorLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {competitorLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Analyze Competitors
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Suggested Competitors */}
                {suggestedCompetitors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800">Suggested Competitors</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestedCompetitors.map((suggested, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-slate-800">{suggested.name}</h5>
                              <p className="text-sm text-slate-600">{suggested.domain}</p>
                            </div>
                            <Badge className={suggested.type === 'direct' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                              {suggested.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{suggested.reason}</p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddSuggestedCompetitor(suggested)}
                            className="w-full"
                          >
                            Add to Analysis
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Competitor Analysis Results */}
            {competitorData && (
              <div className="space-y-8">
                {/* Market Overview */}
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-800">Market Overview</CardTitle>
                    <CardDescription className="text-slate-600">Competitive landscape analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-800">Market Size</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {competitorData.marketInsights?.marketSize ? competitorData.marketInsights.marketSize : '—'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-800">Growth Rate</h4>
                        <p className="text-2xl font-bold text-emerald-600">
                          {competitorData.marketInsights?.growthRate ? competitorData.marketInsights.growthRate : '—'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-800">Market Leader</h4>
                        <p className="text-lg font-semibold text-slate-800">
                          {competitorData.marketInsights?.marketLeader ? competitorData.marketInsights.marketLeader : '—'}
                        </p>
                      </div>
                    </div>

                    {competitorData.marketInsights?.marketTrends && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-slate-800">Market Trends</h4>
                        <div className="flex flex-wrap gap-2">
                          {competitorData.marketInsights.marketTrends.map((trend, index) => (
                            <Badge key={index} className="bg-blue-50 text-blue-700 border-blue-200">
                              {trend}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Competitor Comparison */}
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-800">Competitor Analysis</CardTitle>
                    <CardDescription className="text-slate-600">Detailed competitor breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {competitorData.competitors?.map((competitor, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-semibold text-slate-800">{competitor.name}</h4>
                              <p className="text-sm text-slate-600">{competitor.domain}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge className={getThreatLevelColor(competitor.threatLevel)}>
                                {competitor.threatLevel} Threat
                              </Badge>
                              <div className="text-right">
                                <p className="text-sm text-slate-600">Market Share</p>
                                <p className="font-semibold text-slate-800">{competitor.marketShare}</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h5 className="font-medium text-slate-800 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span>Key Strengths</span>
                              </h5>
                              <ul className="space-y-1">
                                {competitor.keyStrengths?.map((strength, idx) => (
                                  <li key={idx} className="text-sm text-slate-600 flex items-start space-x-2">
                                    <span>•</span>
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-3">
                              <h5 className="font-medium text-slate-800 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                <span>Weaknesses</span>
                              </h5>
                              <ul className="space-y-1">
                                {competitor.weaknesses?.map((weakness, idx) => (
                                  <li key={idx} className="text-sm text-slate-600 flex items-start space-x-2">
                                    <span>•</span>
                                    <span>{weakness}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {competitor.recommendations && competitor.recommendations.length > 0 && (
                            <div className="space-y-3">
                              <h5 className="font-medium text-slate-800 flex items-center space-x-2">
                                <Lightbulb className="h-4 w-4 text-amber-600" />
                                <span>Strategic Recommendations</span>
                              </h5>
                              <ul className="space-y-1">
                                {competitor.recommendations.map((rec, idx) => (
                                  <li key={idx} className="text-sm text-slate-600 flex items-start space-x-2">
                                    <span>•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Strategic Recommendations */}
                {competitorData.strategicRecommendations && (
                  <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-slate-800">Strategic Recommendations</CardTitle>
                      <CardDescription className="text-slate-600">Actionable strategies for your domain</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {competitorData.strategicRecommendations.map((rec, idx) => (
                          <div key={idx} className="border border-slate-100 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-slate-800">{rec.category}</span>
                              <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                            </div>
                            <div className="text-slate-700 mb-1">{rec.action}</div>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                              <span>Impact: {rec.expectedImpact}</span>
                              <span>Timeline: {rec.timeline}</span>
                              <span>Resources: {rec.resourceRequirement}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {activeSection === 'insights' && (
          <div>
            {/* Insights Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Strengths</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {domainData.insights?.strengths?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-rose-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Weaknesses</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {domainData.insights?.weaknesses?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Recommendations</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {domainData.insights?.recommendations?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Strengths */}
            {domainData.insights?.strengths && domainData.insights.strengths.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm mb-8">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    <span>Domain Strengths</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">Areas where your domain excels in AI visibility</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {domainData.insights.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-lg">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-emerald-800">{strength.title}</h4>
                          <p className="text-sm text-emerald-700 mt-1">{strength.description}</p>
                          {strength.metric && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mt-2">
                              {strength.metric}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weaknesses */}
            {domainData.insights?.weaknesses && domainData.insights.weaknesses.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm mb-8">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    <span>Areas for Improvement</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">Opportunities to enhance AI visibility performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {domainData.insights.weaknesses.map((weakness, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-rose-50 rounded-lg">
                        <div className="w-2 h-2 bg-rose-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-rose-800">{weakness.title}</h4>
                          <p className="text-sm text-rose-700 mt-1">{weakness.description}</p>
                          {weakness.metric && (
                            <Badge className="bg-rose-100 text-rose-700 border-rose-200 mt-2">
                              {weakness.metric}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {domainData.insights?.recommendations && domainData.insights.recommendations.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <span>Strategic Recommendations</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">Actionable insights to improve AI visibility</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {domainData.insights.recommendations.map((rec, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-slate-800">{rec.category}</span>
                          <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                        </div>
                        <p className="text-slate-700 mb-3">{rec.action}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>Impact: {rec.expectedImpact}</span>
                          <span>Timeline: {rec.timeline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fallback when no insights */}
            {(!domainData.insights?.strengths?.length && !domainData.insights?.weaknesses?.length && !domainData.insights?.recommendations?.length) && (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="text-center py-12">
                  <Lightbulb className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No Insights Available</h3>
                  <p className="text-slate-600">AI-generated insights will appear here once analysis is complete.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeSection === 'history' && (
          <div>
            {/* Version History Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Version card removed */}

              {/* Best score card removed */}

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Activity className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Visibility Score</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {domainData?.metrics?.visibilityScore || 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Queries</p>
                      <p className="text-lg font-bold text-slate-800">
                        {domainData?.metrics?.totalQueries || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Model Performance Chart */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm mb-8">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>AI Model Performance</span>
                </CardTitle>
                <CardDescription className="text-slate-600">Performance comparison across different AI models</CardDescription>
              </CardHeader>
              <CardContent>
                {domainData?.metrics?.modelPerformance && domainData.metrics.modelPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={domainData.metrics.modelPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="model" 
                        stroke="#64748b" 
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={12}
                        domain={[0, 100]}
                        label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 } }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value}%`, name]}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="score" fill="#3b82f6" name="Performance Score" />
                      <Bar dataKey="mentions" fill="#10b981" name="Mentions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-500 py-12">
                    <Activity className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="font-medium">No model performance data</p>
                    <p className="text-sm text-slate-400">Data will appear here once AI analysis is complete</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Keyword Performance Table */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Keyword Performance</CardTitle>
                <CardDescription className="text-slate-600">Performance metrics for each keyword</CardDescription>
              </CardHeader>
              <CardContent>
                {domainData?.metrics?.keywordPerformance && domainData.metrics.keywordPerformance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Visibility</TableHead>
                          <TableHead>Mentions</TableHead>
                          <TableHead>Sentiment</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Difficulty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {domainData.metrics.keywordPerformance.map((keyword, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{keyword.keyword}</TableCell>
                            <TableCell>
                              <span className={`font-bold ${getVisibilityScoreColor(keyword.visibility || 0)}`}>
                                {keyword.visibility || 0}%
                              </span>
                            </TableCell>
                            <TableCell>{keyword.mentions || 0}</TableCell>
                            <TableCell>{keyword.sentiment || 0}/5</TableCell>
                            <TableCell>{keyword.volume?.toLocaleString() || 0}</TableCell>
                            <TableCell>
                              <Badge className={`${getDifficultyColor(keyword.difficulty || 'Low')}`}>
                                {keyword.difficulty || 'Low'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8">
                    <Target className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p>No keyword performance data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default DomainDashboard;