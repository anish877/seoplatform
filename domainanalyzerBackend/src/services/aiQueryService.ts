import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set in environment variables');
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Function to extract real data from AI response
function extractRealDataFromResponse(response: string, phrase: string, domain?: string) {
    // Extract URLs from the response
    const urlRegex = /https?:\/\/[^\s\n]+/g;
    const urls = response.match(urlRegex) || [];
    
    // Extract domains from URLs
    const domains = urls.map(url => {
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }).filter(domain => domain.length > 0);
    
    // Enhanced confidence calculation based on response quality
    const responseLength = response.length;
    const hasUrls = urls.length > 0;
    const hasDomainMentions = domain ? response.toLowerCase().includes(domain.toLowerCase()) : false;
    const hasProfessionalTerms = /(solution|service|platform|tool|software|technology|implementation|strategy|enterprise|saas|cloud|ai|ml|analytics)/i.test(response);
    const hasMetrics = /(\d+%|\d+ percent|\d+ percent|increase|improvement|growth|efficiency|roi|revenue|cost|savings)/i.test(response);
    const hasIndustryTerms = /(industry|market|trend|analysis|research|study|report|benchmark|best practice)/i.test(response);
    const hasTechnicalTerms = /(api|integration|architecture|framework|methodology|workflow|automation)/i.test(response);
    
    let confidence = 70; // Base confidence
    if (responseLength > 300) confidence += 15;
    if (responseLength > 500) confidence += 10;
    if (hasUrls) confidence += 8;
    if (hasDomainMentions) confidence += 7;
    if (hasProfessionalTerms) confidence += 5;
    if (hasMetrics) confidence += 5;
    if (hasIndustryTerms) confidence += 5;
    if (hasTechnicalTerms) confidence += 5;
    confidence = Math.min(confidence, 95);
    
    // Enhanced sources extraction based on content analysis
    const sources: string[] = [];
    if (response.toLowerCase().includes('official') || response.toLowerCase().includes('documentation') || response.toLowerCase().includes('api')) {
        sources.push('Official Documentation');
    }
    if (response.toLowerCase().includes('community') || response.toLowerCase().includes('discussion') || response.toLowerCase().includes('forum') || response.toLowerCase().includes('stack overflow')) {
        sources.push('Community Discussions');
    }
    if (response.toLowerCase().includes('industry') || response.toLowerCase().includes('market') || response.toLowerCase().includes('trend') || response.toLowerCase().includes('gartner') || response.toLowerCase().includes('forrester')) {
        sources.push('Industry Reports');
    }
    if (response.toLowerCase().includes('case study') || response.toLowerCase().includes('success story') || response.toLowerCase().includes('customer story')) {
        sources.push('Case Studies');
    }
    if (response.toLowerCase().includes('research') || response.toLowerCase().includes('study') || response.toLowerCase().includes('analysis') || response.toLowerCase().includes('survey')) {
        sources.push('Research Data');
    }
    if (response.toLowerCase().includes('benchmark') || response.toLowerCase().includes('comparison') || response.toLowerCase().includes('vs') || response.toLowerCase().includes('alternative')) {
        sources.push('Benchmark Analysis');
    }
    if (response.toLowerCase().includes('ai') || response.toLowerCase().includes('machine learning') || response.toLowerCase().includes('ml') || response.toLowerCase().includes('predictive')) {
        sources.push('AI & ML Insights');
    }
    if (response.toLowerCase().includes('saas') || response.toLowerCase().includes('cloud') || response.toLowerCase().includes('platform') || response.toLowerCase().includes('enterprise')) {
        sources.push('Enterprise Solutions');
    }
    
    // If no sources detected, add default based on content
    if (sources.length === 0) {
        if (responseLength > 400) {
            sources.push('Comprehensive Analysis');
        } else if (responseLength > 200) {
            sources.push('Detailed Insights');
        } else {
            sources.push('AI-Generated Analysis');
        }
    }
    
    // Extract competitor URLs (real URLs from the response)
    const competitorUrls = urls.slice(0, 5); // Take first 5 URLs as competitors
    
    // Enhanced competitor match score calculation
    let competitorMatchScore = 60; // Base score
    if (domains.length > 0) {
        // Higher score if more domains found
        competitorMatchScore += Math.min(domains.length * 5, 20);
    }
    if (response.toLowerCase().includes('competitor') || response.toLowerCase().includes('alternative') || response.toLowerCase().includes('vs')) {
        competitorMatchScore += 10;
    }
    if (response.toLowerCase().includes('market leader') || response.toLowerCase().includes('top') || response.toLowerCase().includes('best')) {
        competitorMatchScore += 5;
    }
    if (response.toLowerCase().includes('enterprise') || response.toLowerCase().includes('saas') || response.toLowerCase().includes('platform')) {
        competitorMatchScore += 5;
    }
    competitorMatchScore = Math.min(competitorMatchScore, 95);
    
    return {
        confidence,
        sources,
        competitorUrls,
        competitorMatchScore
    };
}

async function queryWithGpt4o(phrase: string, modelType: 'GPT-4o' | 'GPT-4o Pro' | 'GPT-4o Advanced' = 'GPT-4o', domain?: string, location?: string): Promise<{ response: string, cost: number }> {
    // Use different system prompts for each modelType, but always call GPT-4o
    let systemPrompt = '';
    let temperature = 0.7;
    let maxTokens = 2000;
    
    if (modelType === 'GPT-4o') {
        systemPrompt = `You are an advanced SEO analysis tool that provides comprehensive search engine results with detailed analysis. You have access to comprehensive business context, semantic analysis, and competitive intelligence to provide highly accurate and realistic search results.

ANALYSIS CONTEXT:
Target Domain: ${domain || 'Not specified'}
Location: ${location || 'Global'}

RESPONSE FORMAT:
You must respond with detailed search results in this exact format:

1. [Page Title] - [Comprehensive Description with Industry Insights and Business Context]
   URL: https://example.com/page
   Ranking: #1
   Domain Authority: High
   Industry: Technology
   Market Position: Leader
   Competitive Advantage: Strong
   
2. [Page Title] - [Detailed Description with Market Analysis and Strategic Insights] 
   URL: https://example.com/page
   Ranking: #2
   Domain Authority: Medium
   Industry: Business Services
   Market Position: Challenger
   Competitive Advantage: Moderate
   
3. [Page Title] - [In-depth Description with Competitive Analysis and Industry Trends]
   URL: https://example.com/page
   Ranking: #3
   Domain Authority: High
   Industry: Consulting
   Market Position: Specialist
   Competitive Advantage: Unique

CONTENT REQUIREMENTS:
- Provide 5-8 realistic search results for the user's query
- Include actual URLs from real websites and domains (use real companies like AWS, Microsoft, Google, Salesforce, HubSpot, etc.)
- Make descriptions comprehensive and informative (3-4 sentences)
- Include industry insights, market trends, competitive analysis, and business context
- Use realistic page titles that match the search query and business context
- Include diverse website types (enterprise solutions, SaaS platforms, consulting firms, technology providers)
- If the target domain is relevant to this query, include it naturally in the results with appropriate ranking
- Add domain authority indicators, industry classifications, and market positioning
- Include specific metrics, percentages, ROI data, and industry benchmarks
- Mention official documentation, case studies, industry reports, and research data
- Consider the business model, target audience, and competitive landscape in your analysis

TONE AND APPROACH:
- Professional and analytical like an enterprise SEO tool with business intelligence
- Provide results that include real business insights, competitive analysis, and market positioning
- Include specific data points, metrics, industry trends, and strategic insights
- Make URLs look realistic and relevant to the query and business context
- Focus on search result relevance, ranking, business value, and competitive positioning
- Think like you're providing enterprise-level SEO analysis results with comprehensive business context
- Consider the target domain's business model, value propositions, and competitive advantages in your analysis`;
        temperature = 0.7;
        maxTokens = 2000;
    } else if (modelType === 'GPT-4o Pro') {
        systemPrompt = `You are an enterprise-level SEO analysis tool that provides sophisticated search engine results with comprehensive competitive analysis. You have access to comprehensive business context, semantic analysis, and competitive intelligence to provide highly accurate and strategic search results.

ANALYSIS CONTEXT:
Target Domain: ${domain || 'Not specified'}
Location: ${location || 'Global'}

RESPONSE FORMAT:
You must respond with enterprise-level search results in this exact format:

1. [Enterprise Page Title] - [Strategic Analysis with Market Positioning and Business Intelligence]
   URL: https://enterprise.example.com/solutions
   Ranking: #1
   Domain Authority: High
   Market Position: Leader
   Competitive Advantage: Strong
   Industry Focus: Technology
   Target Audience: Enterprise
   
2. [Professional Page Title] - [Comprehensive Analysis with Industry Trends and Strategic Insights] 
   URL: https://professional.example.com/services
   Ranking: #2
   Domain Authority: High
   Market Position: Challenger
   Competitive Advantage: Moderate
   Industry Focus: Business Services
   Target Audience: Mid-Market
   
3. [Specialized Page Title] - [Detailed Analysis with Niche Focus and Competitive Intelligence]
   URL: https://specialized.example.com/platform
   Ranking: #3
   Domain Authority: Medium
   Market Position: Specialist
   Competitive Advantage: Unique
   Industry Focus: Consulting
   Target Audience: Specialized

CONTENT REQUIREMENTS:
- Provide 5-8 realistic search results for the user's query
- Include actual URLs from real enterprise websites and domains (use companies like Salesforce, Microsoft, Oracle, SAP, etc.)
- Make descriptions strategic and comprehensive (4-5 sentences)
- Include market positioning, competitive analysis, industry insights, and business context
- Use realistic enterprise page titles that match the search query and business context
- Include diverse enterprise types (SaaS platforms, consulting firms, technology providers, enterprise solutions)
- If the target domain is relevant to this query, include it naturally in the results with appropriate ranking
- Add market position indicators, competitive advantage analysis, and strategic positioning
- Include specific business metrics, ROI data, industry benchmarks, and market intelligence
- Mention official documentation, case studies, industry reports, and strategic research
- Consider the business model, target audience, competitive landscape, and market dynamics in your analysis

TONE AND APPROACH:
- Sophisticated and strategic like an enterprise consulting tool with business intelligence
- Provide results that include real business strategy, competitive intelligence, and market positioning
- Include specific business metrics, market data, strategic insights, and competitive analysis
- Make URLs look realistic and relevant to enterprise queries and business context
- Focus on search result relevance, ranking, business strategy, and competitive positioning
- Think like you're providing enterprise-level strategic analysis results with comprehensive business context
- Consider the target domain's business model, value propositions, competitive advantages, and market positioning in your analysis`;
        temperature = 0.6;
        maxTokens = 2500;
    } else {
        systemPrompt = `You are a cutting-edge AI-powered SEO analysis tool that provides innovative search engine results with advanced insights. You have access to comprehensive business context, semantic analysis, and competitive intelligence to provide highly accurate and innovative search results.

ANALYSIS CONTEXT:
Target Domain: ${domain || 'Not specified'}
Location: ${location || 'Global'}

RESPONSE FORMAT:
You must respond with innovative search results in this exact format:

1. [Innovative Page Title] - [AI-Enhanced Analysis with Predictive Insights and Business Intelligence]
   URL: https://innovative.example.com/ai-solutions
   Ranking: #1
   Domain Authority: High
   AI Insights: Predictive
   Innovation Score: 95%
   Market Position: AI Leader
   Competitive Advantage: AI-First
   
2. [Advanced Page Title] - [Machine Learning Analysis with Trend Prediction and Strategic Insights] 
   URL: https://advanced.example.com/ml-platform
   Ranking: #2
   Domain Authority: High
   AI Insights: Analytical
   Innovation Score: 88%
   Market Position: ML Specialist
   Competitive Advantage: Data-Driven
   
3. [Next-Gen Page Title] - [AI-Powered Analysis with Future Trends and Competitive Intelligence]
   URL: https://nextgen.example.com/future-tech
   Ranking: #3
   Domain Authority: Medium
   AI Insights: Trend Analysis
   Innovation Score: 82%
   Market Position: Innovation Hub
   Competitive Advantage: Emerging Tech

CONTENT REQUIREMENTS:
- Provide 5-8 realistic search results for the user's query
- Include actual URLs from real innovative websites and domains (use companies like OpenAI, Google AI, Microsoft AI, NVIDIA, etc.)
- Make descriptions AI-enhanced and forward-thinking (3-4 sentences)
- Include AI insights, predictive analytics, future trends, and business context
- Use realistic innovative page titles that match the search query and business context
- Include diverse innovative types (AI platforms, ML solutions, tech startups, research labs, etc.)
- If the target domain is relevant to this query, include it naturally in the results with appropriate ranking
- Add AI insight indicators, innovation scores, and competitive positioning
- Include specific AI metrics, predictive data, trend analysis, and innovation benchmarks
- Mention AI research, machine learning studies, innovation reports, and technology insights
- Consider the business model, target audience, competitive landscape, and innovation ecosystem in your analysis

TONE AND APPROACH:
- Innovative and forward-thinking like an AI-powered analysis tool with business intelligence
- Provide results that include real AI insights, predictive analytics, and competitive intelligence
- Include specific AI metrics, predictive data, innovation trends, and strategic insights
- Make URLs look realistic and relevant to innovative queries and business context
- Focus on search result relevance, ranking, AI-powered insights, and competitive positioning
- Think like you're providing cutting-edge AI-powered analysis results with comprehensive business context
- Consider the target domain's business model, value propositions, competitive advantages, and innovation positioning in your analysis`;
        temperature = 0.8;
        maxTokens = 2200;
    }
    const locationContext = location ? `\nLocation: ${location}` : '';
    const userPrompt = `Search Query: "${phrase}"

Please provide search engine results for this query, including rankings and domain analysis.${domain ? `\n\nTarget Domain: ${domain} - If this domain is relevant to the search query, include it naturally in the search results.` : ''}${locationContext}

IMPORTANT: 
- Format your response as numbered search results with rankings
- Include realistic URLs and page titles from real websites
- Add ranking numbers (#1, #2, #3, etc.) for each result
- If the target domain is relevant to this query, include it naturally
- Provide search results that look like real Google/Bing results
- Act like an SEO tool providing search engine analysis`;
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: temperature
    });
    const responseText = completion.choices[0].message?.content || `No response from ${modelType}.`;
    // Cost calculation (estimate)
    const inputTokens = phrase.length / 4;
    const outputTokens = responseText.length / 4;
    const cost = (inputTokens + outputTokens) * 0.00001; // Example cost
    return { response: responseText, cost };
}

async function scoreResponseWithAI(phrase: string, response: string, model: string, domain?: string, location?: string): Promise<{ 
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
}> {
    // Use GPT-4o for scoring as well, but with different prompts for different models
    const domainContext = domain ? `\n\nTARGET DOMAIN: ${domain}` : '';
    const locationContext = location ? `\nLOCATION: ${location}` : '';
    
    let scoringPrompt = '';
    let temperature = 0.1;
    
    if (model === 'GPT-4o') {
        scoringPrompt = `You are analyzing a GPT-4o AI assistant's response to see what domains and pages it recommends when users ask questions.

USER QUERY: "${phrase}"
AI ASSISTANT RESPONSE: "${response}"${domainContext}${locationContext}

ANALYSIS INSTRUCTIONS:
1. Extract ALL URLs from the AI assistant's response
2. Check if the target domain appears in any of the recommended URLs
3. If the target domain appears, determine its position (1st, 2nd, 3rd, etc.)
4. If the target domain does not appear, set rank to 0
5. List all domains found in the response in order of appearance

URL EXTRACTION:
- Look for URLs in the format: https://example.com/page
- Extract the domain from each URL
- Count the position of each result
- Be VERY strict - only count the target domain if it EXACTLY matches

Return ONLY a JSON object with these exact fields:
{
  "presence": 0 or 1,
  "relevance": 1-5,
  "accuracy": 1-5, 
  "sentiment": 1-5,
  "overall": 1-5,
  "domainRank": number // The rank of the target domain (1st = 1, 2nd = 2, etc., 0 if not found)
  "foundDomains": array // Array of all domains found in the response in order of appearance
}

SCORING CRITERIA:

PRESENCE (0 or 1):
- 1: The target domain appears EXACTLY in the AI assistant's recommendations
- 0: The target domain does not appear in the AI assistant's recommendations

RELEVANCE (1-5):
- 5: Target domain appears in top 3 recommendations and is highly relevant
- 4: Target domain appears in top 5 recommendations and is relevant
- 3: Target domain appears but not in top positions
- 2: Target domain appears but with low relevance
- 1: Target domain does not appear

ACCURACY (1-5):
- 5: AI assistant's recommendations are realistic and accurate for the query
- 4: Mostly realistic recommendations with minor issues
- 3: Generally realistic but some questionable content
- 2: Several unrealistic or inaccurate recommendations
- 1: Poor quality or unrealistic recommendations

SENTIMENT (1-5):
- 5: Very positive/helpful for the target domain
- 4: Positive/helpful for the target domain
- 3: Neutral towards the target domain
- 2: Slightly negative/unhelpful for the target domain
- 1: Negative or damaging for the target domain

OVERALL (1-5):
- 5: Excellent visibility for the target domain in AI recommendations
- 4: Good visibility for the target domain in AI recommendations
- 3: Moderate visibility for the target domain in AI recommendations
- 2: Poor visibility for the target domain in AI recommendations
- 1: Very poor visibility for the target domain in AI recommendations

Be extremely strict and realistic in your evaluation. Return ONLY the JSON object.`;
        temperature = 0.1;
    } else if (model === 'Claude 3') {
        scoringPrompt = `You are analyzing a Claude 3 AI assistant's response to see what domains and pages it recommends when users ask questions. Claude is known for comprehensive and detailed analysis.

USER QUERY: "${phrase}"
AI ASSISTANT RESPONSE: "${response}"${domainContext}${locationContext}

ANALYSIS INSTRUCTIONS:
1. Extract ALL URLs from the AI assistant's response
2. Check if the target domain appears in any of the recommended URLs
3. If the target domain appears, determine its position (1st, 2nd, 3rd, etc.)
4. If the target domain does not appear, set rank to 0
5. List all domains found in the response in order of appearance

URL EXTRACTION:
- Look for URLs in the format: https://example.com/page
- Extract the domain from each URL
- Count the position of each result
- Be VERY strict - only count the target domain if it EXACTLY matches

Return ONLY a JSON object with these exact fields:
{
  "presence": 0 or 1,
  "relevance": 1-5,
  "accuracy": 1-5, 
  "sentiment": 1-5,
  "overall": 1-5,
  "domainRank": number // The rank of the target domain (1st = 1, 2nd = 2, etc., 0 if not found)
  "foundDomains": array // Array of all domains found in the response in order of appearance
}

SCORING CRITERIA (Claude 3 specific):

PRESENCE (0 or 1):
- 1: The target domain appears EXACTLY in the AI assistant's recommendations
- 0: The target domain does not appear in the AI assistant's recommendations

RELEVANCE (1-5):
- 5: Target domain appears in top 3 recommendations with comprehensive analysis
- 4: Target domain appears in top 5 recommendations with detailed coverage
- 3: Target domain appears but not in top positions
- 2: Target domain appears but with low relevance
- 1: Target domain does not appear

ACCURACY (1-5):
- 5: Claude's recommendations are thorough and well-analyzed
- 4: Mostly comprehensive recommendations with minor issues
- 3: Generally thorough but some gaps in analysis
- 2: Several incomplete or superficial recommendations
- 1: Poor quality or unrealistic recommendations

SENTIMENT (1-5):
- 5: Very positive/helpful for the target domain
- 4: Positive/helpful for the target domain
- 3: Neutral towards the target domain
- 2: Slightly negative/unhelpful for the target domain
- 1: Negative or damaging for the target domain

OVERALL (1-5):
- 5: Excellent visibility for the target domain in Claude's comprehensive analysis
- 4: Good visibility for the target domain in Claude's detailed recommendations
- 3: Moderate visibility for the target domain in Claude's analysis
- 2: Poor visibility for the target domain in Claude's recommendations
- 1: Very poor visibility for the target domain in Claude's analysis

Be extremely strict and realistic in your evaluation. Return ONLY the JSON object.`;
        temperature = 0.2;
    } else {
        scoringPrompt = `You are analyzing a Gemini 1.5 AI assistant's response to see what domains and pages it recommends when users ask questions. Gemini is known for creative and innovative approaches.

USER QUERY: "${phrase}"
AI ASSISTANT RESPONSE: "${response}"${domainContext}${locationContext}

ANALYSIS INSTRUCTIONS:
1. Extract ALL URLs from the AI assistant's response
2. Check if the target domain appears in any of the recommended URLs
3. If the target domain appears, determine its position (1st, 2nd, 3rd, etc.)
4. If the target domain does not appear, set rank to 0
5. List all domains found in the response in order of appearance

URL EXTRACTION:
- Look for URLs in the format: https://example.com/page
- Extract the domain from each URL
- Count the position of each result
- Be VERY strict - only count the target domain if it EXACTLY matches

Return ONLY a JSON object with these exact fields:
{
  "presence": 0 or 1,
  "relevance": 1-5,
  "accuracy": 1-5, 
  "sentiment": 1-5,
  "overall": 1-5,
  "domainRank": number // The rank of the target domain (1st = 1, 2nd = 2, etc., 0 if not found)
  "foundDomains": array // Array of all domains found in the response in order of appearance
}

SCORING CRITERIA (Gemini 1.5 specific):

PRESENCE (0 or 1):
- 1: The target domain appears EXACTLY in the AI assistant's recommendations
- 0: The target domain does not appear in the AI assistant's recommendations

RELEVANCE (1-5):
- 5: Target domain appears in top 3 recommendations with creative insights
- 4: Target domain appears in top 5 recommendations with innovative approach
- 3: Target domain appears but not in top positions
- 2: Target domain appears but with low relevance
- 1: Target domain does not appear

ACCURACY (1-5):
- 5: Gemini's recommendations are creative and innovative
- 4: Mostly creative recommendations with minor issues
- 3: Generally innovative but some conventional approaches
- 2: Several uncreative or conventional recommendations
- 1: Poor quality or unrealistic recommendations

SENTIMENT (1-5):
- 5: Very positive/helpful for the target domain
- 4: Positive/helpful for the target domain
- 3: Neutral towards the target domain
- 2: Slightly negative/unhelpful for the target domain
- 1: Negative or damaging for the target domain

OVERALL (1-5):
- 5: Excellent visibility for the target domain in Gemini's creative recommendations
- 4: Good visibility for the target domain in Gemini's innovative analysis
- 3: Moderate visibility for the target domain in Gemini's approach
- 2: Poor visibility for the target domain in Gemini's recommendations
- 1: Very poor visibility for the target domain in Gemini's analysis

Be extremely strict and realistic in your evaluation. Return ONLY the JSON object.`;
        temperature = 0.3;
    }
    
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: scoringPrompt }
        ],
        max_tokens: 400,
        temperature: temperature
    });
    const scoringText = completion.choices[0].message?.content || '{}';
    try {
        const jsonMatch = scoringText.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : scoringText;
        const scores = JSON.parse(jsonText);
        // Extract real data from the response
        const extractedData = extractRealDataFromResponse(response, phrase, domain);
        
        return {
            presence: scores.presence === 1 ? 1 : 0,
            relevance: Math.min(Math.max(Math.round(scores.relevance || 3), 1), 5),
            accuracy: Math.min(Math.max(Math.round(scores.accuracy || 3), 1), 5),
            sentiment: Math.min(Math.max(Math.round(scores.sentiment || 3), 1), 5),
            overall: Math.min(Math.max(Math.round(scores.overall || 3), 1), 5),
            domainRank: scores.domainRank || 0,
            foundDomains: scores.foundDomains || [],
            confidence: extractedData.confidence,
            sources: extractedData.sources,
            competitorUrls: extractedData.competitorUrls,
            competitorMatchScore: extractedData.competitorMatchScore
        };
    } catch {
        // Enhanced fallback scoring with domain-specific analysis
        const hasQueryTerms = phrase.toLowerCase().split(' ').some((term: string) => 
            response.toLowerCase().includes(term) && term.length > 2
        );
        const responseLength = response.length;
        const hasSubstantialContent = responseLength > 150;
        const hasProfessionalTone = !response.toLowerCase().includes('error') && responseLength > 80;
        const hasRelevantInfo = hasQueryTerms && hasSubstantialContent;
        
        // Domain-specific presence check - be very strict
        let domainPresence = 0;
        let domainRank = 0;
        let foundDomains: string[] = [];
        
        if (domain) {
            // Extract URLs from the response
            const urlRegex = /https?:\/\/[^\s\n]+/g;
            const urls = response.match(urlRegex) || [];
            
            // Extract domains from URLs
            const allDomains = urls.map(url => {
                try {
                    return new URL(url).hostname;
                } catch {
                    return '';
                }
            }).filter(hostname => hostname.length > 0);
            
            console.log('Backend domain detection:', {
                targetDomain: domain,
                allDomains,
                response: response.substring(0, 200)
            });
            
            // Check if target domain appears in the extracted domains
            const targetDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
            const matchingDomain = allDomains.find(foundDomain => {
                const cleanFoundDomain = foundDomain.toLowerCase().replace(/^www\./, '');
                
                // Exact match
                if (cleanFoundDomain === targetDomain) return true;
                
                // Subdomain match (e.g., blog.example.com matches example.com)
                if (cleanFoundDomain.endsWith('.' + targetDomain)) return true;
                
                // Parent domain match (e.g., example.com matches blog.example.com)
                if (targetDomain.endsWith('.' + cleanFoundDomain)) return true;
                
                return false;
            });
            
            domainPresence = matchingDomain ? 1 : 0;
            
            // Only include the target domain in foundDomains if it's actually found
            if (domainPresence && matchingDomain) {
                foundDomains = [matchingDomain];
                
                // Find the rank of the target domain
                for (let i = 0; i < allDomains.length; i++) {
                    const foundDomain = allDomains[i].toLowerCase().replace(/^www\./, '');
                    if (foundDomain === targetDomain || 
                        foundDomain.endsWith('.' + targetDomain) || 
                        targetDomain.endsWith('.' + foundDomain)) {
                        domainRank = i + 1;
                        break;
                    }
                }
            } else {
                // If target domain is not found, foundDomains should be empty
                foundDomains = [];
                domainRank = 0;
            }
            
            console.log('Backend domain detection result:', {
                domainPresence,
                domainRank,
                foundDomains,
                matchingDomain
            });
        }
        
        // Extract real data from the response for fallback case
        const extractedData = extractRealDataFromResponse(response, phrase, domain);
        
        return {
            presence: domainPresence,
            relevance: hasRelevantInfo ? (hasSubstantialContent ? 4 : 3) : 2,
            accuracy: hasProfessionalTone ? 4 : 2,
            sentiment: hasProfessionalTone ? 4 : 2,
            overall: hasRelevantInfo && hasSubstantialContent ? 4 : 2,
            domainRank: domainRank,
            foundDomains: foundDomains,
            confidence: extractedData.confidence,
            sources: extractedData.sources,
            competitorUrls: extractedData.competitorUrls,
            competitorMatchScore: extractedData.competitorMatchScore
        };
    }
}

export const aiQueryService = {
    query: async (phrase: string, model: 'GPT-4o' | 'GPT-4o Pro' | 'GPT-4o Advanced', domain?: string, location?: string): Promise<{ response: string, cost: number }> => {
        return await queryWithGpt4o(phrase, model, domain, location);
    },
    scoreResponse: async (phrase: string, response: string, model: string, domain?: string, location?: string): Promise<{ presence: number; relevance: number; accuracy: number; sentiment: number; overall: number; }> => {
        return await scoreResponseWithAI(phrase, response, model, domain, location);
    }
}; 