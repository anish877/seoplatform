import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set in environment variables');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export interface VolumeResult {
  highVolumeKeywords: Array<{
    term: string;
    volume: number;
    trend: string;
    seasonality: string;
    opportunity: string;
  }>;
  mediumVolumeKeywords: Array<{
    term: string;
    volume: number;
    trend: string;
    seasonality: string;
    opportunity: string;
  }>;
  lowVolumeKeywords: Array<{
    term: string;
    volume: number;
    trend: string;
    seasonality: string;
    opportunity: string;
  }>;
  volumeTrends: {
    overallTrend: string;
    seasonalPatterns: string[];
    marketInsights: string[];
    recommendations: string[];
  };
  seasonalPatterns: {
    highSeason: string;
    lowSeason: string;
    peakMonths: string[];
    offPeakMonths: string[];
    seasonalKeywords: string[];
  };
  tokenUsage: number;
}

export async function classifySearchVolumes(
  keywords: any[],
  domain: string,
  location?: string
): Promise<VolumeResult> {
  try {
    const prompt = `You are an expert SEO analyst and search volume specialist. Conduct a comprehensive search volume analysis and trend classification for strategic SEO planning.

**ANALYSIS CONTEXT:**
Domain: ${domain}
Location: ${location || 'Global'}
Keywords: ${JSON.stringify(keywords.slice(0, 20))}

**SEARCH VOLUME CLASSIFICATION FRAMEWORK:**

1. **Volume Classification** (Based on realistic search data):
   - **High Volume** (>10,000 searches): Broad industry terms, major brand keywords, popular services
   - **Medium Volume** (1,000-10,000 searches): Specific service terms, industry-specific keywords, moderate competition
   - **Low Volume** (<1,000 searches): Long-tail phrases, niche terms, local keywords, specific use cases

2. **Trend Analysis** (Based on market dynamics):
   - **Rising**: Growing market interest, emerging trends, increasing demand
   - **Stable**: Consistent market demand, established terms, reliable traffic
   - **Declining**: Decreasing interest, outdated terms, market saturation

3. **Seasonality Assessment**:
   - **High**: Strong seasonal patterns (holidays, business cycles, weather-dependent)
   - **Medium**: Moderate seasonal variations (quarterly patterns, industry cycles)
   - **Low**: Consistent year-round demand (core services, evergreen content)

4. **Opportunity Analysis**:
   - Market gaps and underserved segments
   - Competitive advantages and differentiation opportunities
   - Content strategy recommendations
   - SEO optimization opportunities

**OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:
{
  "highVolumeKeywords": [
    {
      "term": "keyword",
      "volume": 15000,
      "trend": "Rising|Stable|Declining",
      "seasonality": "High|Medium|Low",
      "opportunity": "Detailed opportunity description"
    }
  ],
  "mediumVolumeKeywords": [
    {
      "term": "keyword",
      "volume": 5000,
      "trend": "Rising|Stable|Declining",
      "seasonality": "High|Medium|Low",
      "opportunity": "Detailed opportunity description"
    }
  ],
  "lowVolumeKeywords": [
    {
      "term": "keyword",
      "volume": 500,
      "trend": "Rising|Stable|Declining",
      "seasonality": "High|Medium|Low",
      "opportunity": "Detailed opportunity description"
    }
  ],
  "volumeTrends": {
    "overallTrend": "Comprehensive market trend analysis",
    "seasonalPatterns": ["pattern1", "pattern2", "pattern3"],
    "marketInsights": ["insight1", "insight2", "insight3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
  },
  "seasonalPatterns": {
    "highSeason": "Q1|Q2|Q3|Q4",
    "lowSeason": "Q1|Q2|Q3|Q4",
    "peakMonths": ["January", "February"],
    "offPeakMonths": ["July", "August"],
    "seasonalKeywords": ["keyword1", "keyword2", "keyword3"]
  }
}

**ANALYSIS REQUIREMENTS:**
- Provide realistic volume estimates based on keyword characteristics
- Include specific market insights and trends
- Offer actionable recommendations for SEO strategy
- Consider industry-specific seasonal patterns
- Focus on opportunities for competitive advantage`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2500,
    });

    let content = response.choices[0].message.content || '{}';
    
    // Extract JSON from markdown if present
    if (content.includes('```json')) {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
    } else if (content.includes('```')) {
      const jsonMatch = content.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
    }
    
    // Additional cleanup for any remaining markdown artifacts
    content = content.trim();
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.warn('JSON parse error, using fallback:', parseError);
      result = {};
    }
    
    const tokenUsage = response.usage?.total_tokens || 0;

    // Process keywords into volume categories
    const highVolumeKeywords = keywords
      .filter((k: any) => k.volume > 10000)
      .map((k: any) => ({
        term: k.term,
        volume: k.volume,
        trend: k.trend || 'Stable',
        seasonality: 'Medium',
        opportunity: 'High volume keywords offer significant traffic potential'
      }));

    const mediumVolumeKeywords = keywords
      .filter((k: any) => k.volume >= 1000 && k.volume <= 10000)
      .map((k: any) => ({
        term: k.term,
        volume: k.volume,
        trend: k.trend || 'Stable',
        seasonality: 'Medium',
        opportunity: 'Balanced competition and traffic potential'
      }));

    const lowVolumeKeywords = keywords
      .filter((k: any) => k.volume < 1000)
      .map((k: any) => ({
        term: k.term,
        volume: k.volume,
        trend: k.trend || 'Rising',
        seasonality: 'Low',
        opportunity: 'Low competition, high conversion potential'
      }));

    return {
      highVolumeKeywords: result.highVolumeKeywords || highVolumeKeywords,
      mediumVolumeKeywords: result.mediumVolumeKeywords || mediumVolumeKeywords,
      lowVolumeKeywords: result.lowVolumeKeywords || lowVolumeKeywords,
      volumeTrends: result.volumeTrends || {
        overallTrend: 'Growing market with increasing search demand',
        seasonalPatterns: ['Q4 peak for commercial terms', 'Q1-Q2 growth for informational content'],
        marketInsights: ['High competition in primary keywords', 'Opportunities in long-tail variations'],
        recommendations: ['Focus on medium-volume keywords', 'Develop seasonal content strategy']
      },
      seasonalPatterns: result.seasonalPatterns || {
        highSeason: 'Q4',
        lowSeason: 'Q2',
        peakMonths: ['November', 'December', 'January'],
        offPeakMonths: ['June', 'July', 'August'],
        seasonalKeywords: ['holiday services', 'year-end solutions', 'new year planning']
      },
      tokenUsage
    };

  } catch (error) {
    console.error('Search volume classification error:', error);
    
    // Fallback classification
    const highVolumeKeywords = keywords
      .filter((k: any) => k.volume > 10000)
      .map((k: any) => ({
        term: k.term,
        volume: k.volume,
        trend: 'Stable',
        seasonality: 'Medium',
        opportunity: 'High traffic potential with strong competition'
      }));

    const mediumVolumeKeywords = keywords
      .filter((k: any) => k.volume >= 1000 && k.volume <= 10000)
      .map((k: any) => ({
        term: k.term,
        volume: k.volume,
        trend: 'Rising',
        seasonality: 'Medium',
        opportunity: 'Balanced opportunity for growth'
      }));

    const lowVolumeKeywords = keywords
      .filter((k: any) => k.volume < 1000)
      .map((k: any) => ({
        term: k.term,
        volume: k.volume,
        trend: 'Rising',
        seasonality: 'Low',
        opportunity: 'Low competition niche opportunity'
      }));

    return {
      highVolumeKeywords,
      mediumVolumeKeywords,
      lowVolumeKeywords,
      volumeTrends: {
        overallTrend: 'Market shows steady growth with seasonal variations',
        seasonalPatterns: ['Q4 commercial peak', 'Q1 informational growth'],
        marketInsights: ['Competitive primary keywords', 'Long-tail opportunities'],
        recommendations: ['Target medium-volume keywords', 'Develop seasonal content']
      },
      seasonalPatterns: {
        highSeason: 'Q4',
        lowSeason: 'Q2',
        peakMonths: ['November', 'December', 'January'],
        offPeakMonths: ['June', 'July', 'August'],
        seasonalKeywords: ['holiday services', 'year-end planning', 'new year solutions']
      },
      tokenUsage: 0
    };
  }
} 