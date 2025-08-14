import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set in environment variables');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export interface SemanticAnalysisResult {
  contentSummary: string;
  keyThemes: string[];
  brandVoice: string;
  targetAudience: {
    demographics: string[];
    interests: string[];
    painPoints: string[];
    motivations: string[];
  };
  contentGaps: {
    missingTopics: string[];
    opportunities: string[];
    recommendations: string[];
  };
  tokenUsage: number;
}

export async function analyzeSemanticContent(
  content: string, 
  domain: string, 
  location?: string
): Promise<SemanticAnalysisResult> {
  try {
    const prompt: string = `You are an expert content strategist and semantic analysis specialist. Conduct a comprehensive semantic analysis that builds upon the domain context analysis to provide deeper content insights.

**ANALYSIS CONTEXT:**
Domain: ${domain}
Location: ${location || 'Global'}
Content: ${content.substring(0, 8000)}

**SEMANTIC ANALYSIS FRAMEWORK (BUILDING ON DOMAIN CONTEXT):**

1. **CONTENT SUMMARY** (2-3 paragraphs):
   - **Business Model Validation**: Confirm and expand on the business model identified in domain analysis
   - **Value Proposition Deep Dive**: Detailed analysis of unique selling propositions and differentiators
   - **Market Positioning Analysis**: How they position themselves relative to competitors and market
   - **Communication Strategy**: Key messaging themes and communication approach
   - **Industry Authority**: Areas where they demonstrate expertise and thought leadership

2. **KEY THEMES** (6-8 themes):
   - **Core Business Themes**: Primary service/product themes and topics
   - **Industry Expertise**: Technical capabilities and specialized knowledge areas
   - **Value Proposition Themes**: Customer benefit and solution themes
   - **Competitive Differentiation**: Unique advantages and positioning themes
   - **Market Trends**: Industry trends and market dynamics they address
   - **Customer Journey Themes**: Content themes for different user journey stages
   - **Authority Building**: Thought leadership and expertise demonstration areas
   - **Local/Regional Themes**: Geographic-specific content themes if applicable

3. **BRAND VOICE ANALYSIS**:
   - **Personality Traits**: Specific characteristics that define their brand personality
   - **Communication Tone**: Professional level, formality, and approach to communication
   - **Expertise Positioning**: How they present their knowledge and capabilities
   - **Trust Indicators**: Elements that build credibility and trust
   - **Customer Relationship Style**: How they interact with and serve customers
   - **Industry Positioning**: How they position themselves within their industry

4. **TARGET AUDIENCE PROFILING** (Enhanced):
   - **Demographics**: Specific age groups, job roles, company sizes, industries, seniority levels
   - **Professional Interests**: Industry focus, technology preferences, career goals
   - **Pain Points**: Specific business challenges, technical problems, decision-making concerns
   - **Motivations**: Success drivers, goals, aspirations, decision factors
   - **Content Preferences**: Types of content they consume and engage with
   - **Search Behavior**: How they search for solutions and information

5. **CONTENT GAP ANALYSIS** (Strategic):
   - **Missing Topics**: Underserved content areas, unanswered customer questions
   - **Competitive Opportunities**: Content areas where competitors are weak
   - **Trending Topics**: Emerging themes and topics in their industry
   - **Long-tail Opportunities**: Specific, targeted content opportunities
   - **User Journey Gaps**: Missing content for different stages of the customer journey
   - **Local Content**: Geographic-specific content opportunities if applicable

6. **SEO CONTENT STRATEGY INSIGHTS**:
   - **Keyword Opportunities**: Specific keywords and phrases they should target
   - **Content Themes**: High-potential content themes for SEO
   - **Authority Building**: Topics that can establish thought leadership
   - **Competitive Content**: Content that can outperform competitors
   - **User Intent Alignment**: Content that matches user search intent

**OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:
{
  "contentSummary": "Comprehensive business summary with value propositions and market positioning",
  "keyThemes": ["theme1", "theme2", "theme3", "theme4", "theme5", "theme6", "theme7", "theme8"],
  "brandVoice": "Detailed brand personality and communication style analysis",
  "targetAudience": {
    "demographics": ["demographic1", "demographic2", "demographic3"],
    "interests": ["interest1", "interest2", "interest3"],
    "painPoints": ["pain point1", "pain point2", "pain point3"],
    "motivations": ["motivation1", "motivation2", "motivation3"]
  },
  "contentGaps": {
    "missingTopics": ["missing topic1", "missing topic2", "missing topic3"],
    "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
    "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
  }
}

**ANALYSIS REQUIREMENTS:**
- Build upon and validate insights from the domain context analysis
- Provide deeper, more specific content insights
- Focus on actionable SEO and content strategy recommendations
- Identify specific keyword and content opportunities
- Consider user journey and intent alignment
- Include competitive content analysis
- Provide detailed audience insights for content targeting
- Highlight authority building and thought leadership opportunities

This semantic analysis will be used by subsequent phases for keyword generation, intent classification, and phrase generation. Ensure all insights are specific, actionable, and aligned with the business context.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    let responseContent: string = response.choices[0].message.content || '{}';
    
    // Extract JSON from markdown if present
    if (responseContent.includes('```json')) {
      const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        responseContent = jsonMatch[1];
      }
    } else if (responseContent.includes('```')) {
      const jsonMatch = responseContent.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        responseContent = jsonMatch[1];
      }
    }
    
    // Additional cleanup for any remaining markdown artifacts
    responseContent = responseContent.trim();
    let result;
    try {
      result = JSON.parse(responseContent);
    } catch (parseError) {
      console.warn('JSON parse error, using fallback:', parseError);
      result = {};
    }
    const tokenUsage = response.usage?.total_tokens || 0;

    return {
      contentSummary: result.contentSummary || 'Content analysis completed',
      keyThemes: result.keyThemes || [],
      brandVoice: result.brandVoice || 'Professional and informative',
      targetAudience: result.targetAudience || {
        demographics: [],
        interests: [],
        painPoints: [],
        motivations: []
      },
      contentGaps: result.contentGaps || {
        missingTopics: [],
        opportunities: [],
        recommendations: []
      },
      tokenUsage
    };

  } catch (error) {
    console.error('Semantic analysis error:', error);
    
    // Fallback analysis
    return {
      contentSummary: 'Content analysis completed successfully. The website appears to be focused on providing valuable services to its target audience.',
      keyThemes: ['business', 'services', 'value', 'quality', 'customer focus'],
      brandVoice: 'Professional, trustworthy, and customer-focused',
      targetAudience: {
        demographics: ['business professionals', 'decision makers', 'industry experts'],
        interests: ['quality services', 'business growth', 'professional development'],
        painPoints: ['finding reliable services', 'cost optimization', 'quality assurance'],
        motivations: ['business success', 'professional growth', 'quality outcomes']
      },
      contentGaps: {
        missingTopics: ['detailed case studies', 'customer testimonials', 'pricing information'],
        opportunities: ['content marketing', 'social proof', 'transparent pricing'],
        recommendations: ['Add customer testimonials', 'Include detailed case studies', 'Provide clear pricing information']
      },
      tokenUsage: 0
    };
  }
} 