import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Plus, TrendingUp, Calendar, Globe, BarChart3, Sparkles, Target, Zap, ArrowUpRight, Filter, SortDesc, Clock, Play, User, LogOut } from 'lucide-react';
// Onboarding service removed
import { useAuth } from '@/contexts/AuthContext';

interface DashboardDomain {
  id: number;
  url: string;
  context?: string;
  lastAnalyzed: string;
  metrics?: {
    visibilityScore: number;
  keywordCount: number;
  phraseCount: number;
    totalQueries?: number;
    topPhrases?: { phrase: string; score: number }[];
    modelPerformance?: { model: string; score: number }[];
  };
  industry?: string;
}

interface ActiveOnboardingSession {
  domain: {
    id: number;
    url: string;
    context?: string;
    industry?: string;
  };
  currentStep: number;
  lastActivity: string;
}

const ProfessionalDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [domains, setDomains] = useState<DashboardDomain[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveOnboardingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch completed domains
        const domainsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/all`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (domainsResponse.status === 403) {
          // Access denied - user may be trying to access unauthorized resources
          console.warn('Access denied - redirecting to login');
          navigate('/auth');
          return;
        }
        
        if (!domainsResponse.ok) {
          throw new Error('Failed to fetch dashboard analyses');
        }
        
        const domainsData = await domainsResponse.json();
        setDomains(domainsData.domains || []);

        // Onboarding sessions removed
        setActiveSessions([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchData();
    }
  }, [token, navigate]);

  // Show loading while checking authentication
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

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const activeSessionIds = new Set(activeSessions.map(s => s.domain.id));
  const filteredDomains = domains
    .filter(domain =>
      ((domain.url?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (domain.context?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
      && !activeSessionIds.has(domain.id) // Exclude active sessions
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-teal-600';
    if (score >= 80) return 'from-blue-500 to-indigo-600';
    if (score >= 70) return 'from-amber-500 to-orange-600';
    return 'from-rose-500 to-pink-600';
  };

  const getScoreBadgeStyle = (score: number) => {
    if (score >= 90) return 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200';
    if (score >= 80) return 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200';
    if (score >= 70) return 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200';
    return 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 border-rose-200';
  };

  const getStatusBadge = (domain: DashboardDomain) => {
    if (domain.metrics) {
      return <Badge className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200">Analyzed</Badge>;
    }
    return <Badge className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 animate-pulse">Processing</Badge>;
  };

  const getStepName = (step: number) => {
    const steps = [
      'Domain Submission',
      'Context Extraction', 
      'Keyword Discovery',
      'Phrase Generation',
      'AI Query Results',
      'Response Scoring'
    ];
    return steps[step] || 'Unknown Step';
  };

  const totalDomains = domains.length;
  const completedDomains = domains.filter(d => d.metrics).length;
  const avgVisibilityScore = domains
    .filter(d => d.metrics)
    .reduce((acc, d) => acc + (d.metrics?.visibilityScore || 0), 0) / (completedDomains || 1);

  const totalKeywords = domains
    .filter(d => d.metrics)
    .reduce((acc, d) => acc + (d.metrics?.keywordCount || 0), 0);

  // Calculate previous month domain count for growth stat
  // For demo, assume domains have a lastAnalyzed date and count those from previous month
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const domainsThisMonth = domains.filter(d => {
    if (!d.lastAnalyzed) return false;
    const date = new Date(d.lastAnalyzed);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;
  const domainsLastMonth = domains.filter(d => {
    if (!d.lastAnalyzed) return false;
    const date = new Date(d.lastAnalyzed);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  }).length;
  const domainGrowth = domainsLastMonth > 0 ? Math.round(((domainsThisMonth - domainsLastMonth) / domainsLastMonth) * 100) : 0;

  // Industry average for visibility
  const industryAvgVisibility = 65;
  const aboveIndustryAvg = avgVisibilityScore > industryAvgVisibility;

  // High coverage threshold for keywords
  const highCoverageThreshold = 1000;
  const highCoverage = totalKeywords >= highCoverageThreshold;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto bg-blue-100 flex items-center justify-center"></div>
          <p className="mt-4 text-gray-600">Loading dashboard analyses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Premium Header with Gradient Background */}
      <header className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/ %3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
            <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                    AI Visibility Intelligence
              </h1>
                  <p className="text-slate-400 text-lg font-medium">
                    Advanced brand monitoring & competitive intelligence platform
              </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" onClick={() => navigate('/analyze')}>
                <Plus className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <User className="h-4 w-4 text-white" />
                  <span className="text-white font-medium">
                    {user.name || user.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      logout();
                      // Small delay to ensure state updates are processed
                      await new Promise(resolve => setTimeout(resolve, 100));
                      navigate('/auth');
                    } catch (error) {
                      console.error('Logout error:', error);
                      // Fallback: force navigation even if logout fails
                      navigate('/auth');
                    }
                  }}
                  className="text-white border-white/30 hover:bg-white/20 hover:border-white/50 hover:text-white transition-all duration-200 bg-transparent"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-slate-600 font-medium">Total Domains</p>
                  <p className="text-3xl font-bold text-slate-900">{totalDomains}</p>
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {domainGrowth > 0 ? `+${domainGrowth}% this month` : domainGrowth < 0 ? `${domainGrowth}% this month` : '0% this month'}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-slate-600 font-medium">Analyzed</p>
                  <p className="text-3xl font-bold text-slate-900">{completedDomains}</p>
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {Math.round((completedDomains/totalDomains)*100)}% completion
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-slate-600 font-medium">Avg Visibility</p>
                  <p className="text-3xl font-bold text-slate-900">{avgVisibilityScore.toFixed(1)}%</p>
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {aboveIndustryAvg ? 'Above industry avg' : 'Below industry avg'}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-slate-600 font-medium">Keywords Tracked</p>
                  <p className="text-3xl font-bold text-slate-900">{totalKeywords.toLocaleString()}</p>
                  <div className="flex items-center text-emerald-600 text-sm font-medium">
                    <Zap className="h-3 w-3 mr-1" />
                    {highCoverage ? 'High coverage' : 'Low coverage'}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Controls */}
        <div className="bg-white rounded-2xl shadow-lg border-0 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
                placeholder="Search domains, brands, or industries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-slate-50 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="border-2 border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                <SortDesc className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>
        </div>

        {/* Premium Domain Cards Grid - Combined with Active Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Active Sessions Cards */}
          {activeSessions.map((session) => {
            const domain = session.domain;
            const currentStepName = getStepName(session.currentStep);
            const progressPercentage = Math.round(((session.currentStep + 1) / 6) * 100);
            const industry = domain.industry ?? 'General';
            const contextPreview = domain.context
              ? domain.context.split(' ').slice(0, 28).join(' ') + (domain.context.split(' ').length > 28 ? '...' : '')
              : '';

            return (
              <Card
                key={`session-${session.domain.id}`}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-white to-slate-50 overflow-hidden cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/analyze?domainId=${session.domain.id}`)}
                                  onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/analyze?domainId=${session.domain.id}`); }}
                aria-label={`Resume analysis for ${domain.url}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative space-y-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
                        <Clock className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {domain.url}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 animate-pulse">
                            In Progress
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                            {industry}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  {contextPreview && (
                    <CardDescription className="text-slate-600 leading-relaxed text-sm">
                      {contextPreview}
                  </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="relative space-y-6">
                  {/* Current Step Display */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">Current Step</span>
                      <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div className="relative">
                      <div className="text-2xl font-bold text-blue-700 mb-2">
                        {currentStepName}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Progress Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                          <Play className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-blue-700">Progress</span>
                      </div>
                      <p className="text-xl font-bold text-blue-900">{progressPercentage}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
                          <Clock className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700">Steps Left</span>
                      </div>
                      <p className="text-xl font-bold text-emerald-900">{6 - (session.currentStep + 1)}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">
                      Last activity: {new Date(session.lastActivity).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                    <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Resume
                      <Play className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Completed Domain Cards */}
          {filteredDomains.map((domain) => {
            const status = domain.metrics ? 'completed' : 'analyzing';
            const visibilityScore = domain.metrics?.visibilityScore ?? 0;
            const keywordCount = domain.metrics?.keywordCount ?? 0;
            const phraseCount = domain.metrics?.phraseCount ?? 0;
            const industry = domain.industry ?? 'General';
            const contextPreview = domain.context
              ? domain.context.split(' ').slice(0, 28).join(' ') + (domain.context.split(' ').length > 28 ? '...' : '')
              : '';

            return (
              <Card
                key={domain.id}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-white to-slate-50 overflow-hidden cursor-pointer min-h-[340px]"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/${domain.id}`)}
                onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/dashboard/${domain.id}`); }}
                aria-label={`View dashboard for ${domain.url}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="relative space-y-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg flex items-center justify-center group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
                        <Globe className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate" title={domain.url}>
                          {domain.url}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusBadge(domain)}
                          <Badge variant="outline" className="text-xs border-slate-200 text-slate-600">
                            {industry}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4 max-h-[420px] md:max-h-[380px] overflow-hidden p-4 md:p-6">
                  {/* Visibility Score Display */}
                  {status === 'completed' ? (
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">AI Visibility Score</span>
                        <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="relative">
                        <div className={`text-4xl font-bold bg-gradient-to-r ${getScoreColor(visibilityScore)} bg-clip-text text-transparent mb-2`}>
                          {visibilityScore}%
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 bg-gradient-to-r ${getScoreColor(visibilityScore)} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${visibilityScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-blue-600"></div>
                        <span className="text-slate-600 font-medium">Analyzing domain...</span>
                      </div>
                    </div>
                  )}
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                          <Search className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-blue-700">Keywords</span>
                      </div>
                      <p className="text-xl font-bold text-blue-900">{keywordCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
                          <TrendingUp className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-emerald-700">Phrases</span>
                      </div>
                      <p className="text-xl font-bold text-emerald-900">{phraseCount.toLocaleString()}</p>
                    </div>
                  </div>
                  {/* AI Query Result Summary */}
                  {status === 'completed' && domain.metrics && (
                    <div className="mt-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="flex flex-col gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-slate-600">AI Queries:</span>
                          <span className="font-bold text-blue-700 truncate" title={domain.metrics.totalQueries?.toLocaleString?.() ?? '-'}>{domain.metrics.totalQueries?.toLocaleString?.() ?? '-'}</span>
                        </div>
                        {domain.metrics.topPhrases && domain.metrics.topPhrases.length > 0 && (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-slate-600">Top Phrase:</span>
                            <span
                              className="font-medium text-slate-900 truncate max-w-[120px] md:max-w-[180px] lg:max-w-[220px]"
                              title={domain.metrics.topPhrases[0].phrase}
                            >
                              {domain.metrics.topPhrases[0].phrase.length > 32
                                ? domain.metrics.topPhrases[0].phrase.slice(0, 32) + '...'
                                : domain.metrics.topPhrases[0].phrase}
                            </span>
                            <span className="text-xs text-slate-500 ml-1">Score: {domain.metrics.topPhrases[0].score ?? '-'}</span>
                          </div>
                        )}
                        {domain.metrics.modelPerformance && domain.metrics.modelPerformance.length > 0 && (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-slate-600">Best Model:</span>
                            <span className="font-medium text-slate-900 truncate max-w-[100px]" title={domain.metrics.modelPerformance[0].model}>{domain.metrics.modelPerformance[0].model}</span>
                            <span className="text-xs text-slate-500 ml-1">Score: {domain.metrics.modelPerformance[0].score ?? '-'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-medium truncate">
                      Last analyzed: {domain.lastAnalyzed ? new Date(domain.lastAnalyzed).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                    <div className="flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      View Details
                      <ArrowUpRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Empty State */}
        {filteredDomains.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No domains found</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              {searchTerm ? 'Try adjusting your search terms or filters to find what you\'re looking for' : 'Start building your AI visibility intelligence by analyzing your first domain'}
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5" onClick={() => navigate('/analyze')}>
                <Plus className="h-4 w-4 mr-2" />
              Analyze Your First Domain
              </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDashboard;