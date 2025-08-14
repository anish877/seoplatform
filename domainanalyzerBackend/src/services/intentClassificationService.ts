import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set in environment variables');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export interface IntentResult {
  informationalKeywords: Array<{
    term: string;
    intent: string;
    userJourneyStage: string;
    contentType: string;
    opportunity: string;
  }>;
  navigationalKeywords: Array<{
    term: string;
    intent: string;
    userJourneyStage: string;
    contentType: string;
    opportunity: string;
  }>;
  transactionalKeywords: Array<{
    term: string;
    intent: string;
    userJourneyStage: string;
    contentType: string;
    opportunity: string;
  }>;
  commercialKeywords: Array<{
    term: string;
    intent: string;
    userJourneyStage: string;
    contentType: string;
    opportunity: string;
  }>;
  intentDistribution: {
    informational: number;
    navigational: number;
    transactional: number;
    commercial: number;
    total: number;
  };
  userJourneyMapping: {
    awareness: string[];
    consideration: string[];
    decision: string[];
    action: string[];
  };
  tokenUsage: number;
}

export async function classifyIntent(
  keywords: any[],
  domain: string,
  location?: string
): Promise<IntentResult> {
  try {
    const prompt = `You are an expert user experience strategist and search intent specialist. Conduct a comprehensive intent classification and user journey mapping analysis for strategic content planning.

**ANALYSIS CONTEXT:**
Domain: ${domain}
Location: ${location || 'Global'}
Keywords: ${JSON.stringify(keywords.slice(0, 30))}

**INTENT CLASSIFICATION FRAMEWORK:**

1. **Search Intent Categories**:
   - **Informational**: Users seeking knowledge, education, problem understanding
   - **Navigational**: Users looking for specific brands, companies, or locations
   - **Transactional**: Users ready to purchase, sign up, or take specific actions
   - **Commercial**: Users comparing options, evaluating alternatives, researching solutions

2. **User Journey Stages**:
   - **Awareness**: Problem recognition, initial discovery, learning about solutions
   - **Consideration**: Evaluating options, comparing alternatives, researching features
   - **Decision**: Making final choices, selecting providers, choosing solutions
   - **Action**: Taking specific actions, purchasing, contacting, signing up

3. **Content Type Mapping**:
   - **Informational**: Blog posts, guides, tutorials, FAQs, educational videos
   - **Navigational**: Landing pages, contact pages, about pages, service pages
   - **Transactional**: Product pages, pricing pages, checkout flows, signup forms
   - **Commercial**: Comparison pages, reviews, case studies, testimonials

4. **Opportunity Analysis**:
   - Content gaps and underserved intents
   - Conversion optimization opportunities
   - User experience improvements
   - SEO strategy recommendations

**OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:
{
  "informationalKeywords": [
    {
      "term": "keyword",
      "intent": "Learn|Understand|Research|Discover",
      "userJourneyStage": "Awareness|Consideration",
      "contentType": "Blog|Guide|FAQ|Video|Tutorial",
      "opportunity": "Detailed content opportunity description"
    }
  ],
  "navigationalKeywords": [
    {
      "term": "keyword",
      "intent": "Find|Visit|Access|Contact",
      "userJourneyStage": "Awareness|Consideration",
      "contentType": "Landing Page|Contact|About|Service Page",
      "opportunity": "Detailed brand visibility opportunity"
    }
  ],
  "transactionalKeywords": [
    {
      "term": "keyword",
      "intent": "Buy|Purchase|Order|Sign Up|Get Started",
      "userJourneyStage": "Decision|Action",
      "contentType": "Product Page|Pricing|Checkout|Signup Form",
      "opportunity": "Detailed conversion opportunity"
    }
  ],
  "commercialKeywords": [
    {
      "term": "keyword",
      "intent": "Compare|Evaluate|Review|Choose",
      "userJourneyStage": "Consideration|Decision",
      "contentType": "Comparison|Review|Case Study|Testimonial",
      "opportunity": "Detailed comparison content opportunity"
    }
  ],
  "intentDistribution": {
    "informational": 0,
    "navigational": 0,
    "transactional": 0,
    "commercial": 0,
    "total": 0
  },
  "userJourneyMapping": {
    "awareness": ["keyword1", "keyword2"],
    "consideration": ["keyword3", "keyword4"],
    "decision": ["keyword5", "keyword6"],
    "action": ["keyword7", "keyword8"]
  }
}

**CLASSIFICATION REQUIREMENTS:**
- Accurately identify user search intent based on keyword characteristics
- Map keywords to appropriate user journey stages
- Suggest relevant content types for each intent
- Provide specific, actionable opportunities
- Consider the domain's business model and target audience
- Focus on conversion optimization and user experience improvements`;

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

    // Process keywords into intent categories
    const informationalKeywords = keywords
      .filter((k: any) => k.intent === 'Informational')
      .map((k: any) => ({
        term: k.term,
        intent: 'Learn/Understand/Research',
        userJourneyStage: 'Awareness',
        contentType: 'Blog/Guide/FAQ',
        opportunity: 'Educational content creation'
      }));

    const navigationalKeywords = keywords
      .filter((k: any) => k.intent === 'Navigational')
      .map((k: any) => ({
        term: k.term,
        intent: 'Find/Visit/Access',
        userJourneyStage: 'Awareness',
        contentType: 'Landing Page/Contact',
        opportunity: 'Brand visibility improvement'
      }));

    const transactionalKeywords = keywords
      .filter((k: any) => k.intent === 'Transactional')
      .map((k: any) => ({
        term: k.term,
        intent: 'Buy/Purchase/Order',
        userJourneyStage: 'Action',
        contentType: 'Product Page/Pricing',
        opportunity: 'Conversion optimization'
      }));

    const commercialKeywords = keywords
      .filter((k: any) => k.intent === 'Commercial')
      .map((k: any) => ({
        term: k.term,
        intent: 'Compare/Evaluate/Review',
        userJourneyStage: 'Consideration',
        contentType: 'Comparison/Review',
        opportunity: 'Comparison content development'
      }));

    const intentDistribution = {
      informational: informationalKeywords.length,
      navigational: navigationalKeywords.length,
      transactional: transactionalKeywords.length,
      commercial: commercialKeywords.length,
      total: keywords.length
    };

    const userJourneyMapping = {
      awareness: [...informationalKeywords, ...navigationalKeywords].slice(0, 5).map((k: any) => k.term),
      consideration: [...commercialKeywords].slice(0, 5).map((k: any) => k.term),
      decision: [...commercialKeywords].slice(5, 10).map((k: any) => k.term),
      action: [...transactionalKeywords].slice(0, 5).map((k: any) => k.term)
    };

    return {
      informationalKeywords: result.informationalKeywords || informationalKeywords,
      navigationalKeywords: result.navigationalKeywords || navigationalKeywords,
      transactionalKeywords: result.transactionalKeywords || transactionalKeywords,
      commercialKeywords: result.commercialKeywords || commercialKeywords,
      intentDistribution: result.intentDistribution || intentDistribution,
      userJourneyMapping: result.userJourneyMapping || userJourneyMapping,
      tokenUsage
    };

  } catch (error) {
    console.error('Intent classification error:', error);
    
    // Fallback classification
    const informationalKeywords = keywords
      .filter((k: any) => k.intent === 'Informational')
      .map((k: any) => ({
        term: k.term,
        intent: 'Learn/Understand/Research',
        userJourneyStage: 'Awareness',
        contentType: 'Blog/Guide/FAQ',
        opportunity: 'Educational content creation'
      }));

    const navigationalKeywords = keywords
      .filter((k: any) => k.intent === 'Navigational')
      .map((k: any) => ({
        term: k.term,
        intent: 'Find/Visit/Access',
        userJourneyStage: 'Awareness',
        contentType: 'Landing Page/Contact',
        opportunity: 'Brand visibility improvement'
      }));

    const transactionalKeywords = keywords
      .filter((k: any) => k.intent === 'Transactional')
      .map((k: any) => ({
        term: k.term,
        intent: 'Buy/Purchase/Order',
        userJourneyStage: 'Action',
        contentType: 'Product Page/Pricing',
        opportunity: 'Conversion optimization'
      }));

    const commercialKeywords = keywords
      .filter((k: any) => k.intent === 'Commercial')
      .map((k: any) => ({
        term: k.term,
        intent: 'Compare/Evaluate/Review',
        userJourneyStage: 'Consideration',
        contentType: 'Comparison/Review',
        opportunity: 'Comparison content development'
      }));

    const intentDistribution = {
      informational: informationalKeywords.length,
      navigational: navigationalKeywords.length,
      transactional: transactionalKeywords.length,
      commercial: commercialKeywords.length,
      total: keywords.length
    };

    const userJourneyMapping = {
      awareness: [...informationalKeywords, ...navigationalKeywords].slice(0, 5).map((k: any) => k.term),
      consideration: [...commercialKeywords].slice(0, 5).map((k: any) => k.term),
      decision: [...commercialKeywords].slice(5, 10).map((k: any) => k.term),
      action: [...transactionalKeywords].slice(0, 5).map((k: any) => k.term)
    };

    return {
      informationalKeywords,
      navigationalKeywords,
      transactionalKeywords,
      commercialKeywords,
      intentDistribution,
      userJourneyMapping,
      tokenUsage: 0
    };
  }
} 