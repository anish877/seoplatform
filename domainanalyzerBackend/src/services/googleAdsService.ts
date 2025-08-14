import { GoogleAdsApi, enums } from 'google-ads-api';
import OpenAI from 'openai';

interface GoogleAdsConfig {
  client_id: string;
  client_secret: string;
  developer_token: string;
  login_customer_id: string;
  refresh_token: string;
}

interface KeywordIdea {
  term: string;
  volume: number;
  difficulty: string;
  cpc: number;
}

export class GoogleAdsKeywordService {
  private client: GoogleAdsApi;
  private loginCustomerId: string;
  private refreshToken: string;
  private openai: OpenAI;

  constructor(config: GoogleAdsConfig) {
    this.client = new GoogleAdsApi({
      client_id: config.client_id,
      client_secret: config.client_secret,
      developer_token: config.developer_token,
    });
    
    this.loginCustomerId = config.login_customer_id;
    this.refreshToken = config.refresh_token;
    
    // Initialize OpenAI for fallback
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      this.openai = new OpenAI({ apiKey: openaiApiKey });
    }
  }

  /**
   * Generate keyword ideas using Google Ads Keyword Planner API with AI fallback
   */
  async generateKeywordIdeas(
    seedKeywords: string[],
    domain: string,
    location?: string
  ): Promise<KeywordIdea[]> {
    try {
      console.log('Generating keyword ideas for:', { seedKeywords, domain, location });
      
      // First, try Google Ads API
      try {
      const customer = this.client.Customer({
        customer_id: this.loginCustomerId,
        refresh_token: this.refreshToken,
        });

        const processedKeywords: KeywordIdea[] = [];
        
        // Process each seed keyword to get variations and related keywords
        for (const seedKeyword of seedKeywords.slice(0, 5)) {
          try {
            const keywordIdeas = await this.getKeywordIdeasFromPlanner(customer, seedKeyword, location);
            processedKeywords.push(...keywordIdeas);
          } catch (keywordError) {
            console.warn(`Failed to get keyword ideas for "${seedKeyword}":`, keywordError);
          }
        }

        // If we got keywords from the API, filter and return them
        if (processedKeywords.length > 0) {
          console.log(`✅ Successfully generated ${processedKeywords.length} keywords from Google Ads API`);
          return this.filterRelevantKeywords(processedKeywords, seedKeywords, domain);
        }

      } catch (googleAdsError) {
        console.warn('Google Ads API failed, falling back to AI generation:', googleAdsError.message);
      }

      // Fallback to AI generation
      console.log('🔄 Falling back to AI-generated keywords...');
      return await this.generateKeywordsWithAI(seedKeywords, domain, location);

    } catch (error) {
      console.error('All keyword generation methods failed:', error);
      throw new Error(`Failed to generate keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate keywords using AI based on domain and location context - Ahrefs-level quality
   */
  private async generateKeywordsWithAI(
    seedKeywords: string[],
    domain: string,
    location?: string
  ): Promise<KeywordIdea[]> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured for AI fallback');
    }

    try {
      const domainContext = this.extractDetailedDomainContext(domain);
      const locationContext = location ? this.getDetailedLocationContext(location) : '';
      const businessAnalysis = await this.analyzeBusinessDomain(domain, seedKeywords);
      
      const prompt = `You are an expert SEO keyword researcher with Ahrefs-level expertise. Generate 30-40 highly targeted, intent-based keywords for a business website.

BUSINESS ANALYSIS:
Domain: ${domain}
Domain Context: ${domainContext}
Location: ${location || 'Global'}
Location Context: ${locationContext}
Business Type: ${businessAnalysis.businessType}
Industry: ${businessAnalysis.industry}
Target Audience: ${businessAnalysis.targetAudience}
Primary Services: ${businessAnalysis.primaryServices}
Competitive Landscape: ${businessAnalysis.competitiveLandscape}
Seed Keywords: ${seedKeywords.join(', ')}

KEYWORD GENERATION REQUIREMENTS:

1. SEARCH INTENT CLASSIFICATION:
   - Informational: "what is", "how to", "guide", "tutorial"
   - Navigational: brand names, specific company searches
   - Commercial: "best", "review", "compare", "vs"
   - Transactional: "buy", "price", "cost", "near me", "contact"

2. KEYWORD TYPES TO INCLUDE:
   - Short-tail (1-2 words): High volume, competitive
   - Medium-tail (3-4 words): Balanced volume/competition
   - Long-tail (5+ words): Lower volume, less competitive
   - Question-based: "how to", "what is", "why do"
   - Location-based: "[service] near me", "[city] [service]"
   - Comparison: "vs", "alternative to", "better than"
   - Problem-solution: "fix", "solve", "help with"

3. VOLUME ESTIMATION (1-100 scale):
   - 1-10: Very low volume (long-tail, specific)
   - 11-30: Low volume (niche terms)
   - 31-60: Medium volume (moderate competition)
   - 61-80: High volume (competitive terms)
   - 81-100: Very high volume (highly competitive)

4. COMPETITION ANALYSIS:
   - Low: New/emerging terms, specific niches
   - Medium: Established terms, moderate competition
   - High: Popular terms, high competition

5. CPC ESTIMATION ($0.10-$15.00):
   - $0.10-$1.00: Informational, low commercial intent
   - $1.00-$3.00: Mixed intent, moderate commercial value
   - $3.00-$7.00: Commercial intent, high value
   - $7.00-$15.00: High commercial intent, premium services

6. KEYWORD QUALITY CRITERIA:
   - Relevance to business and services
   - Search intent alignment
   - Geographic targeting (if location provided)
   - Seasonal considerations
   - Trending vs evergreen terms
   - Brand vs non-brand terms

Generate keywords that cover all search intents and include:
- 30% Informational keywords
- 20% Commercial keywords  
- 30% Transactional keywords
- 20% Long-tail specific keywords

For each keyword, provide accurate volume, competition, and CPC estimates based on real market data patterns.

Format as JSON array:
[
  {
    "term": "exact keyword phrase",
    "volume": 45,
    "difficulty": "Medium",
    "cpc": 2.50,
    "intent": "Commercial",
    "type": "Medium-tail"
  }
]`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert SEO keyword researcher with 10+ years of experience using Ahrefs, SEMrush, and Google Keyword Planner. You understand search intent, user behavior, and market dynamics. Generate only high-quality, commercially viable keywords with accurate metrics. Focus on keywords that drive real business value and conversions.` 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.3
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      // Parse JSON response
      try {
        const keywords = JSON.parse(responseText);
        if (Array.isArray(keywords)) {
          console.log(`✅ AI generated ${keywords.length} high-quality keywords`);
          return keywords.map(kw => ({
            term: kw.term.toLowerCase(),
            volume: kw.volume || 10,
            difficulty: kw.difficulty || 'Medium',
            cpc: kw.cpc || 1.00
          }));
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response as JSON, using enhanced fallback parsing');
      }

      // Enhanced fallback parsing
      return this.parseEnhancedAIResponse(responseText, seedKeywords, domain, location);

    } catch (error) {
      console.error('AI keyword generation failed:', error);
      throw new Error(`AI keyword generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze business domain for comprehensive keyword generation
   */
  private async analyzeBusinessDomain(domain: string, seedKeywords: string[]): Promise<any> {
    if (!this.openai) {
      return this.getBasicBusinessAnalysis(domain);
    }

    try {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
      
      const prompt = `Analyze this business domain and provide detailed insights for keyword research:

Domain: ${cleanDomain}
Seed Keywords: ${seedKeywords.join(', ')}

Provide analysis in JSON format:
{
  "businessType": "e-commerce/software/consulting/etc",
  "industry": "technology/healthcare/finance/etc", 
  "targetAudience": "B2B/B2C, specific demographics",
  "primaryServices": "main services/products offered",
  "competitiveLandscape": "market competition level",
  "keywordOpportunities": "specific keyword themes to target"
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a business analyst specializing in digital marketing and SEO.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.2
      });

      const responseText = completion.choices[0]?.message?.content || '';
      
      try {
        return JSON.parse(responseText);
      } catch {
        return this.getBasicBusinessAnalysis(domain);
      }

    } catch (error) {
      return this.getBasicBusinessAnalysis(domain);
    }
  }

  /**
   * Get basic business analysis when AI analysis fails
   */
  private getBasicBusinessAnalysis(domain: string): any {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
    const domainWords = cleanDomain.split(/[-_]/);
    
    // Analyze domain words for business type
    const businessIndicators = {
      'shop': 'e-commerce',
      'store': 'e-commerce', 
      'market': 'e-commerce',
      'tech': 'technology',
      'digital': 'digital services',
      'web': 'web development',
      'app': 'software',
      'service': 'professional services',
      'consult': 'consulting',
      'agency': 'marketing agency',
      'studio': 'creative services',
      'lab': 'research',
      'hub': 'platform',
      'platform': 'software platform',
      'tool': 'software tool',
      'solutions': 'business solutions',
      'systems': 'software systems',
      'group': 'business group',
      'partners': 'partnership',
      'team': 'team services'
    };

    let businessType = 'general business';
    for (const [indicator, type] of Object.entries(businessIndicators)) {
      if (cleanDomain.toLowerCase().includes(indicator)) {
        businessType = type;
        break;
      }
    }

    return {
      businessType,
      industry: 'technology',
      targetAudience: 'B2B and B2C',
      primaryServices: domainWords.join(' '),
      competitiveLandscape: 'moderate',
      keywordOpportunities: 'industry-specific terms'
    };
  }

  /**
   * Extract detailed domain context for better keyword generation
   */
  private extractDetailedDomainContext(domain: string): string {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
    const domainWords = cleanDomain.split(/[-_]/).filter(word => word.length > 2);
    
    // Enhanced business type detection
    const businessTypes = {
      'shop': 'e-commerce, retail, online store, product sales',
      'store': 'e-commerce, retail, online store, product sales',
      'market': 'e-commerce, retail, marketplace, product aggregation',
      'tech': 'technology, software, IT services, digital solutions',
      'digital': 'digital marketing, technology, online services, digital transformation',
      'web': 'web development, digital services, website creation, online presence',
      'app': 'mobile app, software development, application development, mobile solutions',
      'service': 'service business, professional services, client solutions',
      'consult': 'consulting, professional services, business advisory, expert guidance',
      'agency': 'marketing agency, professional services, client management, creative services',
      'studio': 'creative services, design, media production, artistic services',
      'lab': 'research, development, innovation, experimental services',
      'hub': 'community, platform, central resource, networking',
      'platform': 'software platform, online service, digital platform, SaaS',
      'tool': 'software tool, utility, productivity, efficiency solutions',
      'solutions': 'business solutions, professional services, problem-solving',
      'systems': 'software systems, technology infrastructure, enterprise solutions',
      'group': 'business group, professional services, collaborative services',
      'partners': 'partnership, professional services, collaborative business',
      'team': 'team services, professional group, collaborative solutions'
    };

    let context = `Domain: ${cleanDomain}`;
    
    // Add business type context
    for (const [indicator, businessType] of Object.entries(businessTypes)) {
      if (cleanDomain.toLowerCase().includes(indicator)) {
        context += `, Business Type: ${businessType}`;
        break;
      }
    }

    // Add domain word context
    if (domainWords.length > 0) {
      context += `, Keywords: ${domainWords.join(', ')}`;
    }

    // Add TLD context
    const tld = domain.split('.').pop();
    if (tld) {
      context += `, TLD: ${tld}`;
    }

    return context;
  }

  /**
   * Get detailed location context for location-specific keywords
   */
  private getDetailedLocationContext(location: string): string {
    const locationMap: { [key: string]: string } = {
      'united states': 'US market, American audience, local SEO, regional targeting, state-specific keywords',
      'us': 'US market, American audience, local SEO, regional targeting, state-specific keywords',
      'usa': 'US market, American audience, local SEO, regional targeting, state-specific keywords',
      'canada': 'Canadian market, local SEO, regional targeting, province-specific keywords, bilingual opportunities',
      'united kingdom': 'UK market, British audience, local SEO, regional targeting, city-specific keywords',
      'uk': 'UK market, British audience, local SEO, regional targeting, city-specific keywords',
      'australia': 'Australian market, local SEO, regional targeting, state-specific keywords, Pacific region',
      'germany': 'German market, local SEO, regional targeting, city-specific keywords, European market',
      'france': 'French market, local SEO, regional targeting, city-specific keywords, European market',
      'spain': 'Spanish market, local SEO, regional targeting, city-specific keywords, European market',
      'italy': 'Italian market, local SEO, regional targeting, city-specific keywords, European market',
      'india': 'Indian market, local SEO, regional targeting, state-specific keywords, emerging market',
      'japan': 'Japanese market, local SEO, regional targeting, city-specific keywords, Asian market',
      'brazil': 'Brazilian market, local SEO, regional targeting, state-specific keywords, Latin American market',
      'mexico': 'Mexican market, local SEO, regional targeting, city-specific keywords, Latin American market',
      'netherlands': 'Dutch market, local SEO, regional targeting, city-specific keywords, European market',
      'sweden': 'Swedish market, local SEO, regional targeting, city-specific keywords, Nordic market',
      'norway': 'Norwegian market, local SEO, regional targeting, city-specific keywords, Nordic market',
      'denmark': 'Danish market, local SEO, regional targeting, city-specific keywords, Nordic market',
      'finland': 'Finnish market, local SEO, regional targeting, city-specific keywords, Nordic market',
      'poland': 'Polish market, local SEO, regional targeting, city-specific keywords, Eastern European market',
      'russia': 'Russian market, local SEO, regional targeting, city-specific keywords, Eastern European market',
      'china': 'Chinese market, local SEO, regional targeting, city-specific keywords, Asian market',
      'south korea': 'Korean market, local SEO, regional targeting, city-specific keywords, Asian market',
      'singapore': 'Singaporean market, local SEO, regional targeting, city-specific keywords, Southeast Asian market',
      'hong kong': 'Hong Kong market, local SEO, regional targeting, city-specific keywords, Asian market',
      'taiwan': 'Taiwanese market, local SEO, regional targeting, city-specific keywords, Asian market',
      'thailand': 'Thai market, local SEO, regional targeting, city-specific keywords, Southeast Asian market',
      'malaysia': 'Malaysian market, local SEO, regional targeting, city-specific keywords, Southeast Asian market',
      'indonesia': 'Indonesian market, local SEO, regional targeting, city-specific keywords, Southeast Asian market',
      'philippines': 'Filipino market, local SEO, regional targeting, city-specific keywords, Southeast Asian market',
      'vietnam': 'Vietnamese market, local SEO, regional targeting, city-specific keywords, Southeast Asian market',
      'new zealand': 'New Zealand market, local SEO, regional targeting, city-specific keywords, Pacific region',
      'south africa': 'South African market, local SEO, regional targeting, city-specific keywords, African market',
      'egypt': 'Egyptian market, local SEO, regional targeting, city-specific keywords, African market',
      'nigeria': 'Nigerian market, local SEO, regional targeting, city-specific keywords, African market',
      'kenya': 'Kenyan market, local SEO, regional targeting, city-specific keywords, African market',
      'morocco': 'Moroccan market, local SEO, regional targeting, city-specific keywords, African market',
      'tunisia': 'Tunisian market, local SEO, regional targeting, city-specific keywords, African market',
      'algeria': 'Algerian market, local SEO, regional targeting, city-specific keywords, African market',
      'ghana': 'Ghanaian market, local SEO, regional targeting, city-specific keywords, African market',
      'ethiopia': 'Ethiopian market, local SEO, regional targeting, city-specific keywords, African market',
      'uganda': 'Ugandan market, local SEO, regional targeting, city-specific keywords, African market',
      'tanzania': 'Tanzanian market, local SEO, regional targeting, city-specific keywords, African market',
      'zimbabwe': 'Zimbabwean market, local SEO, regional targeting, city-specific keywords, African market',
      'zambia': 'Zambian market, local SEO, regional targeting, city-specific keywords, African market',
      'botswana': 'Botswanan market, local SEO, regional targeting, city-specific keywords, African market',
      'namibia': 'Namibian market, local SEO, regional targeting, city-specific keywords, African market',
      'mozambique': 'Mozambican market, local SEO, regional targeting, city-specific keywords, African market',
      'angola': 'Angolan market, local SEO, regional targeting, city-specific keywords, African market',
      'congo': 'Congolese market, local SEO, regional targeting, city-specific keywords, African market',
      'cameroon': 'Cameroonian market, local SEO, regional targeting, city-specific keywords, African market',
      'ivory coast': 'Ivorian market, local SEO, regional targeting, city-specific keywords, African market',
      'senegal': 'Senegalese market, local SEO, regional targeting, city-specific keywords, African market',
      'mali': 'Malian market, local SEO, regional targeting, city-specific keywords, African market',
      'burkina faso': 'Burkinabe market, local SEO, regional targeting, city-specific keywords, African market',
      'niger': 'Nigerien market, local SEO, regional targeting, city-specific keywords, African market',
      'chad': 'Chadian market, local SEO, regional targeting, city-specific keywords, African market',
      'sudan': 'Sudanese market, local SEO, regional targeting, city-specific keywords, African market',
      'south sudan': 'South Sudanese market, local SEO, regional targeting, city-specific keywords, African market',
      'eritrea': 'Eritrean market, local SEO, regional targeting, city-specific keywords, African market',
      'djibouti': 'Djiboutian market, local SEO, regional targeting, city-specific keywords, African market',
      'somalia': 'Somali market, local SEO, regional targeting, city-specific keywords, African market',
      'comoros': 'Comorian market, local SEO, regional targeting, city-specific keywords, African market',
      'madagascar': 'Malagasy market, local SEO, regional targeting, city-specific keywords, African market',
      'mauritius': 'Mauritian market, local SEO, regional targeting, city-specific keywords, African market',
      'seychelles': 'Seychellois market, local SEO, regional targeting, city-specific keywords, African market',
      'cape verde': 'Cape Verdean market, local SEO, regional targeting, city-specific keywords, African market',
      'guinea-bissau': 'Guinea-Bissauan market, local SEO, regional targeting, city-specific keywords, African market',
      'guinea': 'Guinean market, local SEO, regional targeting, city-specific keywords, African market',
      'sierra leone': 'Sierra Leonean market, local SEO, regional targeting, city-specific keywords, African market',
      'liberia': 'Liberian market, local SEO, regional targeting, city-specific keywords, African market',
      'togo': 'Togolese market, local SEO, regional targeting, city-specific keywords, African market',
      'benin': 'Beninese market, local SEO, regional targeting, city-specific keywords, African market',
      'equatorial guinea': 'Equatorial Guinean market, local SEO, regional targeting, city-specific keywords, African market',
      'gabon': 'Gabonese market, local SEO, regional targeting, city-specific keywords, African market',
      'central african republic': 'Central African market, local SEO, regional targeting, city-specific keywords, African market',
      'sao tome and principe': 'São Toméan market, local SEO, regional targeting, city-specific keywords, African market',
      'burundi': 'Burundian market, local SEO, regional targeting, city-specific keywords, African market',
      'rwanda': 'Rwandan market, local SEO, regional targeting, city-specific keywords, African market',
      'malawi': 'Malawian market, local SEO, regional targeting, city-specific keywords, African market',
      'lesotho': 'Basotho market, local SEO, regional targeting, city-specific keywords, African market',
      'eswatini': 'Eswatini market, local SEO, regional targeting, city-specific keywords, African market',
      'mauritania': 'Mauritanian market, local SEO, regional targeting, city-specific keywords, African market',
      'western sahara': 'Western Saharan market, local SEO, regional targeting, city-specific keywords, African market',
      'gambia': 'Gambian market, local SEO, regional targeting, city-specific keywords, African market'
    };

    const normalizedLocation = location.toLowerCase().trim();
    return locationMap[normalizedLocation] || `Local market in ${location}, regional SEO, city-specific keywords, local business targeting`;
  }

  /**
   * Enhanced parsing of AI response when JSON parsing fails
   */
  private parseEnhancedAIResponse(responseText: string, seedKeywords: string[], domain: string, location?: string): KeywordIdea[] {
    const keywords: KeywordIdea[] = [];
    const lines = responseText.split('\n');
    
    // Enhanced keyword extraction patterns
    const patterns = [
      /"([^"]+)"/g,  // Double quotes
      /'([^']+)'/g,  // Single quotes
      /keyword:\s*([^\n,]+)/gi,  // "keyword: term"
      /term:\s*([^\n,]+)/gi,     // "term: phrase"
      /([a-zA-Z]+(?:\s+[a-zA-Z]+){0,4})/g  // General word patterns
    ];
    
    for (const line of lines) {
      for (const pattern of patterns) {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          const term = match[1]?.toLowerCase().trim();
          if (term && term.length > 2 && !seedKeywords.includes(term)) {
            // Enhanced volume estimation based on term characteristics
            const volume = this.estimateSearchVolume(term, domain, location);
            const difficulty = this.estimateCompetition(term, domain);
            const cpc = this.estimateCPC(term, domain);
            
            keywords.push({
              term,
              volume,
              difficulty,
              cpc
            });
          }
        }
      }
    }

    // If no keywords found, generate comprehensive fallback keywords
    if (keywords.length === 0) {
      return this.generateComprehensiveFallbackKeywords(seedKeywords, domain, location);
    }

    // Remove duplicates and sort by volume
    const uniqueKeywords = Array.from(new Map(keywords.map(kw => [kw.term, kw])).values());
    return uniqueKeywords
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 30);
  }

  /**
   * Estimate search volume based on keyword characteristics
   */
  private estimateSearchVolume(term: string, domain: string, location?: string): number {
    const words = term.split(' ');
    const wordCount = words.length;
    
    // Base volume based on word count
    let baseVolume = 50;
    if (wordCount === 1) baseVolume = 80;      // Short-tail
    else if (wordCount === 2) baseVolume = 60; // Medium-tail
    else if (wordCount === 3) baseVolume = 40; // Long-tail
    else baseVolume = 20;                      // Very long-tail
    
    // Adjust for commercial intent
    const commercialTerms = ['buy', 'price', 'cost', 'cheap', 'best', 'review', 'compare'];
    const hasCommercialIntent = commercialTerms.some(term => term.includes(term));
    if (hasCommercialIntent) baseVolume += 20;
    
    // Adjust for location specificity
    if (location && term.toLowerCase().includes(location.toLowerCase())) {
      baseVolume += 15;
    }
    
    // Adjust for domain relevance
    const domainWords = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0].split(/[-_]/);
    const domainRelevance = domainWords.some(word => term.includes(word.toLowerCase()));
    if (domainRelevance) baseVolume += 10;
    
    return Math.min(100, Math.max(1, baseVolume));
  }

  /**
   * Estimate competition level based on keyword characteristics
   */
  private estimateCompetition(term: string, domain: string): string {
    const words = term.split(' ');
    const wordCount = words.length;
    
    // Base competition based on word count
    if (wordCount === 1) return 'High';      // Short-tail = high competition
    else if (wordCount === 2) return 'Medium'; // Medium-tail = medium competition
    else return 'Low';                       // Long-tail = low competition
    
    // Additional factors could be considered here
  }

  /**
   * Estimate CPC based on keyword characteristics
   */
  private estimateCPC(term: string, domain: string): number {
    const words = term.split(' ');
    const wordCount = words.length;
    
    // Base CPC based on word count
    let baseCPC = 1.50;
    if (wordCount === 1) baseCPC = 3.00;     // Short-tail = higher CPC
    else if (wordCount === 2) baseCPC = 2.00; // Medium-tail = medium CPC
    else baseCPC = 1.00;                     // Long-tail = lower CPC
    
    // Adjust for commercial intent
    const commercialTerms = ['buy', 'price', 'cost', 'cheap', 'best', 'review', 'compare'];
    const hasCommercialIntent = commercialTerms.some(term => term.includes(term));
    if (hasCommercialIntent) baseCPC += 1.50;
    
    // Adjust for premium services
    const premiumTerms = ['premium', 'luxury', 'professional', 'expert', 'certified'];
    const hasPremiumIntent = premiumTerms.some(term => term.includes(term));
    if (hasPremiumIntent) baseCPC += 2.00;
    
    return Math.round(baseCPC * 100) / 100;
  }

  /**
   * Generate comprehensive fallback keywords when AI parsing fails
   */
  private generateComprehensiveFallbackKeywords(seedKeywords: string[], domain: string, location?: string): KeywordIdea[] {
    const keywords: KeywordIdea[] = [];
    const domainWords = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0].split(/[-_]/);
    
    // Generate variations for each seed keyword
    for (const seed of seedKeywords.slice(0, 5)) {
      const variations = this.generateKeywordVariations(seed, domainWords, location);
      keywords.push(...variations);
    }
    
    // Generate domain-specific keywords
    const domainKeywords = this.generateDomainSpecificKeywords(domainWords, location);
    keywords.push(...domainKeywords);
    
    // Generate location-specific keywords
    if (location) {
      const locationKeywords = this.generateLocationSpecificKeywords(seedKeywords, location);
      keywords.push(...locationKeywords);
    }
    
    // Remove duplicates and sort by volume
    const uniqueKeywords = Array.from(new Map(keywords.map(kw => [kw.term, kw])).values());
    return uniqueKeywords
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 30);
  }

  /**
   * Generate keyword variations for a seed keyword
   */
  private generateKeywordVariations(seed: string, domainWords: string[], location?: string): KeywordIdea[] {
    const variations: KeywordIdea[] = [];
    const modifiers = ['best', 'top', 'professional', 'expert', 'quality', 'affordable', 'premium'];
    const intents = ['near me', 'online', 'services', 'company', 'agency', 'provider'];
    
    // Base keyword
    variations.push({
      term: seed.toLowerCase(),
      volume: 60,
      difficulty: 'Medium',
      cpc: 2.00
    });
    
    // Add modifiers
    for (const modifier of modifiers.slice(0, 3)) {
      variations.push({
        term: `${modifier} ${seed}`.toLowerCase(),
        volume: 40,
        difficulty: 'Medium',
        cpc: 2.50
      });
    }
    
    // Add intents
    for (const intent of intents.slice(0, 3)) {
      variations.push({
        term: `${seed} ${intent}`.toLowerCase(),
        volume: 30,
        difficulty: 'Low',
        cpc: 1.50
      });
    }
    
    // Add location if provided
    if (location) {
      variations.push({
        term: `${seed} ${location}`.toLowerCase(),
        volume: 25,
        difficulty: 'Low',
        cpc: 1.75
      });
    }
    
    return variations;
  }

  /**
   * Generate domain-specific keywords
   */
  private generateDomainSpecificKeywords(domainWords: string[], location?: string): KeywordIdea[] {
    const keywords: KeywordIdea[] = [];
    
    for (const word of domainWords) {
      if (word.length > 2) {
        keywords.push({
          term: word.toLowerCase(),
          volume: 70,
          difficulty: 'High',
          cpc: 3.00
        });
        
        // Add variations
        keywords.push({
          term: `${word} services`.toLowerCase(),
          volume: 45,
          difficulty: 'Medium',
          cpc: 2.25
        });
        
        if (location) {
          keywords.push({
            term: `${word} ${location}`.toLowerCase(),
            volume: 35,
            difficulty: 'Low',
            cpc: 1.75
          });
        }
      }
    }
    
    return keywords;
  }

  /**
   * Generate location-specific keywords
   */
  private generateLocationSpecificKeywords(seedKeywords: string[], location: string): KeywordIdea[] {
    const keywords: KeywordIdea[] = [];
    
    for (const seed of seedKeywords.slice(0, 3)) {
      keywords.push({
        term: `${seed} ${location}`.toLowerCase(),
        volume: 30,
        difficulty: 'Low',
        cpc: 1.75
      });
      
      keywords.push({
        term: `${location} ${seed}`.toLowerCase(),
        volume: 25,
        difficulty: 'Low',
        cpc: 1.50
      });
      
      keywords.push({
        term: `${seed} near ${location}`.toLowerCase(),
        volume: 20,
        difficulty: 'Low',
        cpc: 1.25
      });
    }
    
    return keywords;
  }

  /**
   * Get keyword ideas from Google Ads Keyword Planner API using the correct service
   */
  private async getKeywordIdeasFromPlanner(customer: any, seedKeyword: string, location?: string): Promise<KeywordIdea[]> {
    try {
      // Build geo target constants
      const geoTargetConstants = location ? [this.getGeoTargetConstant(location)] : ['geoTargetConstants/2840']; // Default to US

      // Build the request object for keyword idea generation
      const request = {
        customer_id: this.loginCustomerId,
        language: 'languageConstants/1000', // English
        geo_target_constants: geoTargetConstants,
        include_adult_keywords: false,
        keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH_AND_PARTNERS,
        keyword_seed: { keywords: [seedKeyword] }
      };

      // Generate keyword ideas using the correct service
      const response = await customer.keywordPlanIdeas.generateKeywordIdeas(request);
        
        const processedKeywords: KeywordIdea[] = [];
        
      for (const result of response.results || []) {
        if (result.text && result.keyword_idea_metrics) {
          const metrics = result.keyword_idea_metrics;
          
          // Get real data from Google API
          const avgMonthlySearches = metrics.avg_monthly_searches || 0;
          const competition = metrics.competition || 'UNSPECIFIED';
          const lowTopOfPageBidMicros = metrics.low_top_of_page_bid_micros || 0;
          const highTopOfPageBidMicros = metrics.high_top_of_page_bid_micros || 0;
          
          // Calculate average CPC from bid range
          const avgCpc = (lowTopOfPageBidMicros + highTopOfPageBidMicros) / 2 / 1000000;
          
          // Determine difficulty based on competition
            let difficulty = 'Medium';
          if (competition === 'LOW') {
              difficulty = 'Low';
          } else if (competition === 'HIGH') {
              difficulty = 'High';
            }
            
            processedKeywords.push({
            term: result.text.toLowerCase(),
            volume: avgMonthlySearches,
              difficulty,
            cpc: Math.round(avgCpc * 100) / 100,
            });
          }
        }

      return processedKeywords;
      
    } catch (error) {
      console.warn(`Keyword Planner API error for "${seedKeyword}":`, error);
      
      // Try alternative method using search volume API
      return this.getKeywordDataFromSearchVolume(customer, seedKeyword, location);
    }
  }

  /**
   * Get keyword data from Search Volume API as fallback
   */
  private async getKeywordDataFromSearchVolume(customer: any, seedKeyword: string, location?: string): Promise<KeywordIdea[]> {
    try {
      // Build geo target constants
      const geoTargetConstants = location ? [this.getGeoTargetConstant(location)] : ['geoTargetConstants/2840'];

      const request = {
        customer_id: this.loginCustomerId,
        language: 'languageConstants/1000',
        geo_target_constants: geoTargetConstants,
        keyword_plan_network: enums.KeywordPlanNetwork.GOOGLE_SEARCH_AND_PARTNERS,
        keyword_seed: { keywords: [seedKeyword] }
      };

      // Use the correct service method for search volume data
      const response = await customer.keywordPlanIdeas.generateKeywordIdeas(request);

      const processedKeywords: KeywordIdea[] = [];
      
      for (const result of response.results || []) {
        if (result.keyword_idea_metrics) {
          const metrics = result.keyword_idea_metrics;
          
          const avgMonthlySearches = metrics.avg_monthly_searches || 0;
          const competition = metrics.competition || 'UNSPECIFIED';
          const lowTopOfPageBidMicros = metrics.low_top_of_page_bid_micros || 0;
          const highTopOfPageBidMicros = metrics.high_top_of_page_bid_micros || 0;
          
          const avgCpc = (lowTopOfPageBidMicros + highTopOfPageBidMicros) / 2 / 1000000;
          
          let difficulty = 'Medium';
          if (competition === 'LOW') {
            difficulty = 'Low';
          } else if (competition === 'HIGH') {
            difficulty = 'High';
          }
          
          processedKeywords.push({
            term: seedKeyword.toLowerCase(),
            volume: avgMonthlySearches,
            difficulty,
            cpc: Math.round(avgCpc * 100) / 100,
          });
        }
      }
      
      return processedKeywords;

    } catch (error) {
      console.warn(`Search Volume API error for "${seedKeyword}":`, error);
      throw error;
    }
  }

  /**
   * Get geo target constant for location
   */
  private getGeoTargetConstant(location: string): string {
    const locationMap: { [key: string]: string } = {
      'united states': 'geoTargetConstants/2840',
      'us': 'geoTargetConstants/2840',
      'usa': 'geoTargetConstants/2840',
      'canada': 'geoTargetConstants/2124',
      'united kingdom': 'geoTargetConstants/2826',
      'uk': 'geoTargetConstants/2826',
      'australia': 'geoTargetConstants/2036',
      'germany': 'geoTargetConstants/2276',
      'france': 'geoTargetConstants/2250',
      'spain': 'geoTargetConstants/2724',
      'italy': 'geoTargetConstants/2380',
      'india': 'geoTargetConstants/2356',
      'japan': 'geoTargetConstants/2392',
      'brazil': 'geoTargetConstants/2076',
      'mexico': 'geoTargetConstants/2484',
      'netherlands': 'geoTargetConstants/2528',
      'sweden': 'geoTargetConstants/2752',
      'norway': 'geoTargetConstants/2578',
      'denmark': 'geoTargetConstants/2208',
      'finland': 'geoTargetConstants/2246',
      'poland': 'geoTargetConstants/2616',
      'russia': 'geoTargetConstants/2643',
      'china': 'geoTargetConstants/2156',
      'south korea': 'geoTargetConstants/2410',
      'singapore': 'geoTargetConstants/2702',
      'hong kong': 'geoTargetConstants/2344',
      'taiwan': 'geoTargetConstants/2158',
      'thailand': 'geoTargetConstants/2764',
      'malaysia': 'geoTargetConstants/2458',
      'indonesia': 'geoTargetConstants/2360',
      'philippines': 'geoTargetConstants/2608',
      'vietnam': 'geoTargetConstants/2704',
      'new zealand': 'geoTargetConstants/2554',
      'south africa': 'geoTargetConstants/2710',
      'egypt': 'geoTargetConstants/2818',
      'nigeria': 'geoTargetConstants/2566',
      'kenya': 'geoTargetConstants/2404',
      'morocco': 'geoTargetConstants/2504',
      'tunisia': 'geoTargetConstants/2788',
      'algeria': 'geoTargetConstants/2012',
      'ghana': 'geoTargetConstants/2288',
      'ethiopia': 'geoTargetConstants/2231',
      'uganda': 'geoTargetConstants/2800',
      'tanzania': 'geoTargetConstants/2834',
      'zimbabwe': 'geoTargetConstants/2716',
      'zambia': 'geoTargetConstants/2894',
      'botswana': 'geoTargetConstants/2072',
      'namibia': 'geoTargetConstants/2516',
      'mozambique': 'geoTargetConstants/2508',
      'angola': 'geoTargetConstants/2024',
      'congo': 'geoTargetConstants/2180',
      'cameroon': 'geoTargetConstants/2120',
      'ivory coast': 'geoTargetConstants/2384',
      'senegal': 'geoTargetConstants/2686',
      'mali': 'geoTargetConstants/2466',
      'burkina faso': 'geoTargetConstants/2854',
      'niger': 'geoTargetConstants/2562',
      'chad': 'geoTargetConstants/2148',
      'sudan': 'geoTargetConstants/2729',
      'south sudan': 'geoTargetConstants/2728',
      'eritrea': 'geoTargetConstants/2232',
      'djibouti': 'geoTargetConstants/2262',
      'somalia': 'geoTargetConstants/2706',
      'comoros': 'geoTargetConstants/2174',
      'madagascar': 'geoTargetConstants/2450',
      'mauritius': 'geoTargetConstants/2480',
      'seychelles': 'geoTargetConstants/2690',
      'cape verde': 'geoTargetConstants/2132',
      'guinea-bissau': 'geoTargetConstants/2624',
      'guinea': 'geoTargetConstants/2324',
      'sierra leone': 'geoTargetConstants/2694',
      'liberia': 'geoTargetConstants/2430',
      'togo': 'geoTargetConstants/2768',
      'benin': 'geoTargetConstants/2204',
      'equatorial guinea': 'geoTargetConstants/2226',
      'gabon': 'geoTargetConstants/2266',
      'central african republic': 'geoTargetConstants/2140',
      'sao tome and principe': 'geoTargetConstants/2678',
      'burundi': 'geoTargetConstants/2108',
      'rwanda': 'geoTargetConstants/2646',
      'malawi': 'geoTargetConstants/2454',
      'lesotho': 'geoTargetConstants/2426',
      'eswatini': 'geoTargetConstants/2748',
      'mauritania': 'geoTargetConstants/2478',
      'western sahara': 'geoTargetConstants/2732',
      'gambia': 'geoTargetConstants/2270'
    };

    const normalizedLocation = location.toLowerCase().trim();
    return locationMap[normalizedLocation] || 'geoTargetConstants/2840'; // Default to US
  }

  /**
   * Filter keywords to find the most relevant ones
   */
  private filterRelevantKeywords(
    keywords: KeywordIdea[],
    seedKeywords: string[],
    domain: string
  ): KeywordIdea[] {
    const domainWords = this.extractDomainWords(domain);
    const allSeedWords = [...seedKeywords, ...domainWords].map(w => w.toLowerCase());
    
    return keywords
      .filter(keyword => {
        const keywordWords = keyword.term.split(/\s+/);
        return keywordWords.some(word => 
          allSeedWords.some(seed => 
            word.includes(seed.toLowerCase()) || seed.toLowerCase().includes(word)
          )
        );
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 30);
  }

  /**
   * Extract meaningful words from domain name
   */
  private extractDomainWords(domain: string): string[] {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
    return cleanDomain.split(/[-_]/).filter(word => word.length > 2);
  }
}

// Helper function to generate seed keywords from domain context
export function generateSeedKeywords(domain: string, context: string): string[] {
  const seedKeywords: string[] = [];
  
  // Extract domain name keywords
  const domainParts = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
  const domainWords = domainParts.split(/[-_]/);
  seedKeywords.push(...domainWords.filter(word => word.length > 2));
  
  // Extract context keywords using simple text analysis
  if (context) {
    const contextWords = context.toLowerCase()
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        word.length < 20 &&
        !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|doesn|now|old|see|two|way|who|boy|did|does|each|like|she|they|make|their|time|very|when|come|here|just|like|long|make|many|over|such|take|than|them|well|were)$/.test(word) &&
        !/^\d+$/.test(word) &&
        /^[a-zA-Z]+$/.test(word)
      );
    
    // Get word frequency and take top ones
    const wordCount: { [key: string]: number } = {};
    contextWords.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    const topWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    seedKeywords.push(...topWords);
  }
  
  // Add some default business keywords
  seedKeywords.push('services', 'business', 'company', 'solutions');
  
  // Remove duplicates and return
  return [...new Set(seedKeywords)].slice(0, 10);
}

// Create and export a configured instance
const createGoogleAdsService = (): GoogleAdsKeywordService | null => {
  const config = {
    client_id: process.env.GOOGLE_ADS_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '',
    refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
  };

  // Check if at least basic config is present
  if (!config.client_id || !config.client_secret || !config.developer_token || !config.login_customer_id || !config.refresh_token) {
    console.warn('Google Ads API configuration missing. Will use AI fallback only.');
    // Return a service that only uses AI fallback
    return new GoogleAdsKeywordService({
      client_id: 'fallback',
      client_secret: 'fallback',
      developer_token: 'fallback',
      login_customer_id: 'fallback',
      refresh_token: 'fallback',
    });
  }

  try {
    return new GoogleAdsKeywordService(config);
  } catch (error) {
    console.error('Failed to initialize Google Ads service:', error);
    return null;
  }
};

export const googleAdsService = createGoogleAdsService(); 