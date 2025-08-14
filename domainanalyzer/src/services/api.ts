const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:3002/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Global error handler for API responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 403) {
    // Access denied - user may be trying to access unauthorized resources
    console.warn('Access denied - user may be trying to access unauthorized resources');
    // Clear auth token and redirect to login
    localStorage.removeItem('authToken');
    window.location.href = '/auth';
    throw new Error('Access denied - please log in again');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.details || error.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

export interface DomainResponse {
  domain: {
    id: number;
    url: string;
    context: string | null;
    createdAt: string;
    updatedAt: string;
  };
  extraction: {
    pagesScanned: number;
    analyzedUrls: string[];
    extractedContext: string;
  } | null;
}

export interface Keyword {
  id: number;
  term: string;
  volume: number;
  difficulty: string;
  cpc: number;
  category: string;
  isSelected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KeywordAnalysis {
  semanticAnalysis?: Record<string, unknown>;
  keywordAnalysis?: Record<string, unknown>;
  searchVolumeClassification?: Record<string, unknown>;
  intentClassification?: Record<string, unknown>;
}

export const apiService = {
  async submitDomain(url: string): Promise<DomainResponse> {
    const response = await fetch(`${API_BASE_URL}/domain`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url }),
    });

    return handleApiResponse(response);
  },

  async getDomain(id: number): Promise<DomainResponse> {
    const response = await fetch(`${API_BASE_URL}/domain/${id}`, {
      headers: getAuthHeaders(),
    });

    return handleApiResponse(response);
  },

  async submitDomainForStreaming(url: string): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}/domain`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url }),
    });

    return handleApiResponse(response);
  },

  async getKeywords(domainId: number): Promise<{ keywords: Keyword[], analysis?: KeywordAnalysis }> {
    const response = await fetch(`${API_BASE_URL}/keywords/${domainId}`, {
      headers: getAuthHeaders(),
    });
    console.log('getKeywords response:', response);
    return handleApiResponse(response);
  },

  async updateKeywordSelection(domainId: number, selectedKeywords: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/keywords/${domainId}/selection`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ selectedKeywords }),
    });

    return handleApiResponse(response);
  },

  async getGeneratedPhrases(domainId: number): Promise<{ generatedPhrases: Array<{keyword: string, phrases: string[]}> }> {
    const response = await fetch(`${API_BASE_URL}/phrases/${domainId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch generated phrases');
    return handleApiResponse(response);
  },

  async addPhrase(domainId: number, keyword: string, phrase: string): Promise<{ success: boolean, phrase: { id: number, text: string, keywordId: number } }> {
    const response = await fetch(`${API_BASE_URL}/phrases/${domainId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ keyword, phrase }),
    });

    return handleApiResponse(response);
  },
};