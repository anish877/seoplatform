import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResponseScoring from '@/components/ResponseScoring';
import { Button } from '@/components/ui/button';
import type { AIQueryResult, AIQueryStats } from '@/components/AIQueryResults';
import { useAuth } from '@/contexts/AuthContext';

interface Phrase {
  id: number;
  text: string;
}

interface ModelPerformance {
  model: string;
  presenceRate: number;
  avgRelevance: number;
  avgAccuracy: number;
  avgSentiment: number;
  avgOverall: number;
}

interface Metrics {
  modelPerformance: ModelPerformance[];
  presenceRate: number;
  avgRelevance: number;
  avgAccuracy: number;
  avgSentiment: number;
  avgOverall: number;
}

interface AIQueryResultRaw {
  id: number;
  phraseId: number;
  phrase?: string;
  keyword?: string;
  scores?: {
    presence: number;
    relevance: number;
    accuracy: number;
    sentiment: number;
    overall: number;
  };
  presence?: number;
  relevance?: number;
  accuracy?: number;
  sentiment?: number;
  overall?: number;
  model?: string;
  response?: string;
  latency?: number;
  cost?: number;
  progress?: number;
  severity?: number;
}

const DomainResponseScoring: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [queryResults, setQueryResults] = useState<AIQueryResult[]>([]);
  const [queryStats, setQueryStats] = useState<AIQueryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  
  // Get versionId from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const versionId = urlParams.get('versionId');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!domainId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Build URL with versionId if available
    const url = versionId 
      ? `${import.meta.env.VITE_API_URL}/api/dashboard/${domainId}?versionId=${versionId}`
      : `${import.meta.env.VITE_API_URL}/api/dashboard/${domainId}`;
      
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch domain data');
      return res.json();
    })
    .then((data: { phrases?: Phrase[]; aiQueryResults?: AIQueryResultRaw[]; metrics?: Metrics }) => {
      // Build phraseId -> text map if available
      const phraseMap = Object.fromEntries((data.phrases || []).map((p: Phrase) => [p.id, p.text]));
      setQueryResults(
        (data.aiQueryResults || []).map((r: AIQueryResultRaw) => ({
          model: r.model || '',
          phrase: r.phrase || phraseMap[r.phraseId] || '',
          keyword: r.keyword || '',
          response: r.response || '',
          latency: r.latency || 0,
          cost: r.cost || 0,
          progress: r.progress || 0,
          severity: r.severity || 0,
          scores: r.scores || {
            presence: Number(r.presence) || 0,
            relevance: Number(r.relevance) || 0,
            accuracy: Number(r.accuracy) || 0,
            sentiment: Number(r.sentiment) || 0,
            overall: Number(r.overall) || 0,
          },
        }))
      );
      // Build stats from metrics if available
      if (data.metrics) {
        setQueryStats({
          models: (data.metrics.modelPerformance || []).map((m: ModelPerformance) => ({
            model: m.model,
            presenceRate: Number(m.presenceRate) || 0,
            avgRelevance: Number(m.avgRelevance) || 0,
            avgAccuracy: Number(m.avgAccuracy) || 0,
            avgSentiment: Number(m.avgSentiment) || 0,
            avgOverall: Number(m.avgOverall) || 0,
          })),
          overall: {
            presenceRate: Number(data.metrics.presenceRate) || 0,
            avgRelevance: Number(data.metrics.avgRelevance) || 0,
            avgAccuracy: Number(data.metrics.avgAccuracy) || 0,
            avgSentiment: Number(data.metrics.avgSentiment) || 0,
            avgOverall: Number(data.metrics.avgOverall) || 0,
          },
          totalResults: data.aiQueryResults?.length || 0,
        });
      } else {
        setQueryStats(null);
      }
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [domainId]);

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <h3 className="text-xl font-semibold text-slate-900">Loading Response Scoring...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Response Scoring</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
          Back to Dashboard
        </Button>
        <ResponseScoring
          queryResults={queryResults}
          queryStats={queryStats}
          onNext={async () => {
            // Trigger first-time AI analysis before redirecting to dashboard
            try {
              console.log('Triggering first-time AI analysis for dashboard...');
              const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard/${domainId}/first-time-analysis`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ versionId })
              });
              
              if (response.ok) {
                const result = await response.json();
                console.log('First-time AI analysis completed:', result.message);
              } else {
                console.warn('First-time AI analysis failed, but continuing to dashboard');
              }
            } catch (analysisError) {
              console.warn('Error triggering first-time AI analysis:', analysisError);
              // Continue to dashboard even if analysis fails
            }
            
            // Navigate to dashboard with versionId if available
            const dashboardUrl = versionId ? `/dashboard/${domainId}?versionId=${versionId}` : `/dashboard/${domainId}`;
            navigate(dashboardUrl);
          }}
          onPrev={() => navigate(-1)}
        />
      </div>
    </div>
  );
};

export default DomainResponseScoring; 