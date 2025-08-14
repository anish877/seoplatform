# Enhanced Phrases Unified System - Expert Prompt Framework

## Overview

The Enhanced Phrases Unified System is a sophisticated AI-powered platform that generates optimized search phrases through a comprehensive 7-step analysis pipeline. This system leverages expert-level prompts across multiple domains including brand intelligence, community analysis, competitive research, search behavior patterns, and phrase generation.

## System Architecture

### Core Flow
```
1. Semantic Content Analysis (Brand Intelligence)
2. Community Data Mining (Reddit/Quora via SERP API)
3. Competitor Research (Community-Driven Intelligence)
4. Search Pattern Analysis (Behavioral Intelligence)
5. Creating Optimized Intent Phrases (Expert Generation)
6. Intent Classification (Integrated)
7. Relevance Score (Integrated)
```

---

## 1. Expert Brand Intelligence Analysis

### Purpose
Conduct comprehensive brand intelligence analysis using expert brand strategist and digital anthropologist methodologies.

### Expert Prompt Framework

#### **Core Mission**
You are an expert brand strategist and digital anthropologist with 15+ years of experience analyzing online communities and brand positioning.

#### **Analysis Framework**

**1. Brand Voice & Tone Architecture**
- Voice Personality: Core personality traits (authoritative, approachable, innovative)
- Tonal Range: Emotional spectrum from formal to casual communication
- Communication Style: Sentence structure, vocabulary complexity, rhetorical devices
- Brand Archetype: Primary brand archetype (Hero, Sage, Creator, etc.)
- Linguistic Patterns: Recurring phrases, terminology, and communication conventions

**2. Target Audience Segmentation**
- Primary Demographics: Age, gender, income, education, location
- Psychographics: Values, interests, lifestyle patterns, pain points
- Digital Behavior: Platform preferences, content consumption habits, engagement patterns
- Purchase Journey: Decision-making process, influencing factors, conversion triggers
- Community Dynamics: How audiences interact, share, and advocate

**3. Industry Positioning & Themes**
- Market Category: Primary and secondary industry classifications
- Competitive Landscape: Position relative to competitors and market leaders
- Value Proposition: Unique selling points and differentiation factors
- Thematic Pillars: Core topics and subject matter expertise
- Trend Alignment: How brand aligns with industry and cultural trends

**4. Content Strategy & Messaging**
- Content Formats: Preferred content types and presentation styles
- Messaging Hierarchy: Primary, secondary, and supporting messages
- Storytelling Approach: Narrative techniques and content themes
- Visual Identity Cues: Implied design and aesthetic preferences
- Engagement Mechanisms: How content drives interaction and conversion

**5. Community Ecosystem Analysis**
- Community Type: Nature of audience gathering (professional, enthusiast, customer-based)
- Belonging Signals: What makes someone part of this community
- Shared Language: Industry jargon, insider terminology, cultural references
- Social Dynamics: Leadership structures, influence patterns, knowledge sharing
- Territory Mapping: Where this community exists online and offline

**6. Strategic FAQ Intelligence**
Generate 15-20 high-value questions covering:
- Service/Product FAQs: Core offering questions
- Industry Education: Knowledge-building questions
- Decision Support: Comparison and evaluation questions
- Implementation: How-to and process questions
- Troubleshooting: Problem-solving scenarios

#### **Output Schema**
```json
{
  "brandVoice": {
    "personality": [],
    "toneSpectrum": "",
    "communicationStyle": "",
    "archetype": "",
    "linguisticPatterns": []
  },
  "targetAudience": {
    "primaryDemographics": {},
    "psychographics": {},
    "digitalBehavior": {},
    "purchaseJourney": [],
    "communityDynamics": ""
  },
  "industryThemes": {
    "marketCategory": "",
    "competitivePosition": "",
    "valueProposition": [],
    "thematicPillars": [],
    "trendAlignment": []
  },
  "contentStrategy": {
    "preferredFormats": [],
    "messagingHierarchy": {},
    "storytellingApproach": "",
    "visualCues": [],
    "engagementMechanisms": []
  },
  "communityContext": {
    "communityType": "",
    "belongingSignals": [],
    "sharedLanguage": [],
    "socialDynamics": "",
    "territoryMapping": []
  },
  "strategicFAQs": {
    "serviceQuestions": [],
    "industryEducation": [],
    "decisionSupport": [],
    "implementation": [],
    "troubleshooting": []
  },
  "confidenceLevel": "",
  "assumptions": [],
  "recommendedValidation": []
}
```

---

## 2. Expert Community Data Analysis Framework

### Purpose
Analyze authentic community discussions from Reddit and Quora to extract actionable insights about user behaviors, pain points, solutions, and market intelligence.

### Expert Prompt Framework

#### **Core Intelligence Mission**
Analyze authentic community discussions from Reddit and Quora to extract actionable insights about user behaviors, pain points, solutions, and market intelligence for strategic decision-making.

#### **Advanced Community Intelligence Framework**

**1. Multi-Platform Data Analysis**

*Reddit Intelligence Extraction:*
- Subreddit Context Analysis: Which communities are discussing related topics
- Discussion Thread Patterns: Problem-solution conversation flows
- User Expertise Levels: Identifying novice vs expert contributors
- Sentiment Evolution: How opinions develop through comment threads
- Viral Content Indicators: Posts that generate high engagement

*Quora Intelligence Extraction:*
- Question Quality Assessment: Depth and specificity of user inquiries
- Answer Authority Analysis: Credibility and expertise signals
- Knowledge Gap Identification: Frequently asked but poorly answered questions
- Solution Effectiveness Patterns: Which answers get most upvotes/views
- Expert Contributor Insights: Professional perspectives and recommendations

**2. Strategic Pain Point Intelligence**

*Problem Categorization Framework:*
- Functional Pain Points: Features, performance, usability issues
- Emotional Pain Points: Frustration, anxiety, confidence concerns
- Economic Pain Points: Cost, ROI, budget constraint discussions
- Social Pain Points: Status, peer pressure, community acceptance issues
- Process Pain Points: Workflow, integration, implementation challenges

*Pain Point Prioritization Matrix:*
- Frequency Score: How often the pain point is mentioned
- Intensity Score: Emotional weight and urgency in discussions
- Solution Gap Score: How poorly current solutions address the pain
- Market Impact Score: Potential business opportunity size

**3. Solution Intelligence Mining**

*Solution Effectiveness Analysis:*
- Recommended Solutions: What community members actually suggest
- Success Story Patterns: Solutions that worked for users
- Implementation Challenges: Obstacles users face when adopting solutions
- Alternative Approach Discovery: Creative workarounds and hacks
- Tool and Service Mentions: Specific products/services recommended

*Community Wisdom Extraction:*
- Best Practices: Consistently recommended approaches
- Anti-Patterns: Solutions users warn against
- Implementation Tips: Practical advice for successful execution
- Resource Recommendations: Books, courses, tools, experts mentioned
- Success Metrics: How users measure solution effectiveness

**4. Market Intelligence & Trends**

*Trend Pattern Recognition:*
- Emerging Topics: New discussions gaining momentum
- Declining Interests: Topics losing community attention
- Seasonal Patterns: Time-based discussion volume changes
- Technology Adoption Curves: How users discuss new vs established solutions
- Market Maturity Indicators: Sophistication level of community discussions

*Competitive Intelligence from Community:*
- Brand Mentions: Companies/services discussed positively/negatively
- Feature Comparisons: Head-to-head capability discussions
- Migration Stories: Why users switched between solutions
- Pricing Discussions: Cost-related community conversations
- Support Experience Sharing: Customer service quality insights

#### **Output Schema**
```json
{
  "sources": {
    "redditSources": [
      {
        "url": "[Reddit URL]",
        "subreddit": "[Subreddit name]",
        "title": "[Post title]",
        "relevanceScore": "[1-10]",
        "keyInsights": ["[insight 1]", "[insight 2]"]
      }
    ],
    "quoraSources": [
      {
        "url": "[Quora URL]",
        "title": "[Question title]",
        "answerQuality": "[High/Medium/Low]",
        "relevanceScore": "[1-10]",
        "keyInsights": ["[insight 1]", "[insight 2]"]
      }
    ],
    "totalAnalyzed": "[Number of posts/questions]",
    "dataQuality": "[High/Medium/Low with explanation]"
  },
  "summary": {
    "primaryQuestions": [
      {
        "question": "[User question or concern]",
        "frequency": "[How often mentioned]",
        "platforms": ["[reddit/quora]"],
        "userTypes": ["[beginner/intermediate/expert]"],
        "urgencyLevel": "[High/Medium/Low]"
      }
    ],
    "criticalPainPoints": [
      {
        "painPoint": "[Specific user problem]",
        "category": "[Functional/Emotional/Economic/Social/Process]",
        "frequency": "[How often mentioned]",
        "intensityScore": "[1-10]",
        "currentSolutions": ["[existing solution 1]", "[existing solution 2]"],
        "solutionGaps": ["[gap 1]", "[gap 2]"],
        "marketOpportunity": "[High/Medium/Low with explanation]"
      }
    ],
    "recommendedSolutions": [
      {
        "solution": "[Community-recommended solution]",
        "endorsementLevel": "[Strong/Moderate/Weak]",
        "successStories": "[Number of positive mentions]",
        "implementationChallenges": ["[challenge 1]", "[challenge 2]"],
        "userTypes": ["[who recommends this solution]"],
        "alternatives": ["[alternative solution 1]", "[alternative solution 2]"]
      }
    ],
    "sentimentAnalysis": {
      "overallSentiment": "[Positive/Neutral/Negative with score 1-10]",
      "sentimentByTopic": {
        "[Topic/Category]": {
          "sentiment": "[Positive/Neutral/Negative]",
          "confidence": "[High/Medium/Low]",
          "keyThemes": ["[theme 1]", "[theme 2]"]
        }
      },
      "emotionalTriggers": ["[trigger 1]", "[trigger 2]", "..."],
      "satisfactionGaps": ["[gap 1]", "[gap 2]", "..."]
    },
    "emergingTrends": [
      {
        "trend": "[Trend description]",
        "momentum": "[Growing/Stable/Declining]",
        "timeframe": "[When this trend is happening]",
        "implications": ["[implication 1]", "[implication 2]"],
        "opportunities": ["[opportunity 1]", "[opportunity 2]"]
      }
    ]
  },
  "communityInsights": {
    "userPersonas": [
      {
        "persona": "[User type/persona name]",
        "characteristics": ["[characteristic 1]", "[characteristic 2]"],
        "primaryNeeds": ["[need 1]", "[need 2]"],
        "painPoints": ["[pain point 1]", "[pain point 2]"],
        "preferredSolutions": ["[solution 1]", "[solution 2]"],
        "decisionFactors": ["[factor 1]", "[factor 2]"],
        "communityBehavior": "[How they engage in discussions]"
      }
    ],
    "knowledgeGaps": [
      {
        "topic": "[Knowledge gap topic]",
        "gapDescription": "[What users don't understand]",
        "questionFrequency": "[How often asked]",
        "answerQuality": "[Quality of current answers]",
        "contentOpportunity": "[Type of content needed]",
        "expertiseLevel": "[Level of expertise needed to address]"
      }
    ],
    "communityLanguage": {
      "commonTerminology": ["[term 1]", "[term 2]", "..."],
      "jargonPatterns": ["[jargon 1]", "[jargon 2]", "..."],
      "emotionalLanguage": ["[emotional phrase 1]", "[emotional phrase 2]", "..."],
      "authoritySignals": ["[authority indicator 1]", "[authority indicator 2]", "..."],
      "trustIndicators": ["[trust signal 1]", "[trust signal 2]", "..."]
    },
    "engagementPatterns": {
      "highEngagementTriggers": ["[trigger 1]", "[trigger 2]", "..."],
      "discussionStarters": ["[starter 1]", "[starter 2]", "..."],
      "controversialTopics": ["[topic 1]", "[topic 2]", "..."],
      "consensusAreas": ["[area 1]", "[area 2]", "..."],
      "expertiseIndicators": ["[indicator 1]", "[indicator 2]", "..."]
    },
    "actionableIntelligence": [
      {
        "insight": "[Key actionable insight]",
        "evidence": "[Supporting evidence from community data]",
        "businessImplication": "[What this means for business strategy]",
        "recommendedAction": "[Specific action to take]",
        "priority": "[High/Medium/Low]",
        "implementation": "[How to implement this insight]"
      }
    ]
  }
}
```

---

## 3. Expert Community-Driven Competitor Intelligence Framework

### Purpose
Conduct deep competitive analysis based on authentic community discussions, extracting real competitor insights from actual user conversations rather than theoretical market analysis.

### Expert Prompt Framework

#### **Core Intelligence Mission**
Conduct deep competitive analysis based on authentic community discussions, extracting real competitor insights from actual user conversations rather than theoretical market analysis. Focus on discovering competitive landscape through the lens of actual user experiences and recommendations.

#### **Advanced Competitive Intelligence Framework**

**1. Community-Based Competitor Discovery**

*Direct Competitor Identification:*
- Brand Mentions: Companies/services explicitly named in discussions
- Recommendation Patterns: Alternatives suggested by community members
- Comparison Contexts: "X vs Y" discussions and debates
- Problem-Solution Mapping: Services mentioned for solving similar problems
- User Migration Stories: "I switched from X to Y because..." narratives

*Indirect Competitor Analysis:*
- Alternative Solutions: Different approaches to solving same problems
- Adjacent Market Players: Services in related but different categories
- DIY/Internal Alternatives: In-house solutions users mention
- Emerging Disruptors: New players getting community attention
- Substitute Products: Non-obvious alternatives users consider

**2. Community Sentiment Intelligence**

*Competitor Strength Indicators:*
- Positive Mentions: Frequency and context of praise
- Recommendation Confidence: How strongly users advocate
- Feature Appreciation: Specific capabilities users love
- Reliability Testimonials: Uptime, consistency, dependability stories
- Success Stories: Concrete results and outcomes shared

*Weakness Detection Signals:*
- Complaint Patterns: Recurring issues and frustrations
- Migration Triggers: Why users left competitors
- Feature Gap Mentions: "I wish X had Y" discussions
- Support Issues: Customer service and help problems
- Pricing Complaints: Cost-related dissatisfaction

**3. Market Positioning Intelligence**

*Positioning Analysis Framework:*
- Value Proposition Clarity: How competitors are perceived to solve problems
- Target Audience Identification: Who recommends/uses each competitor
- Use Case Specialization: Specific scenarios where competitors excel
- Market Segment Focus: Enterprise, SMB, consumer, niche markets
- Geographic Strengths: Regional or local competitive advantages

*Differentiation Pattern Recognition:*
- Unique Selling Points: What makes each competitor distinct
- Feature Differentiation: Capabilities that set competitors apart
- Service Model Variations: Different approaches to service delivery
- Pricing Strategy Insights: How competitors position on value/cost
- Brand Personality Distinctions: How users perceive competitor brands

#### **Output Schema**
```json
{
  "competitors": {
    "directCompetitors": [
      {
        "name": "[Company/Service Name]",
        "url": "[Website URL if mentioned]",
        "mentionFrequency": "[Low/Medium/High]",
        "userSentiment": "[Positive/Neutral/Negative with score 1-10]",
        "primaryStrengths": ["[strength 1]", "[strength 2]", "..."],
        "knownWeaknesses": ["[weakness 1]", "[weakness 2]", "..."],
        "targetAudience": "[Who uses this competitor]",
        "pricingPosition": "[Premium/Mid-market/Budget/Unknown]",
        "keyDifferentiators": ["[differentiator 1]", "[differentiator 2]", "..."],
        "communityQuotes": ["[actual user quote 1]", "[user quote 2]", "..."]
      }
    ],
    "indirectCompetitors": [
      {
        "name": "[Alternative Solution/Company]",
        "category": "[Type of alternative]",
        "threatLevel": "[High/Medium/Low]",
        "userAdoption": "[How frequently mentioned as alternative]",
        "advantages": ["[advantage 1]", "[advantage 2]", "..."],
        "limitations": ["[limitation 1]", "[limitation 2]", "..."],
        "migrationTriggers": ["[why users choose this alternative]", "..."]
      }
    ]
  },
  "analysis": {
    "marketLandscape": {
      "dominantPlayers": ["[top competitor 1]", "[top competitor 2]", "..."],
      "emergingThreats": ["[emerging competitor 1]", "[emerging competitor 2]", "..."],
      "marketGaps": ["[underserved need 1]", "[underserved need 2]", "..."],
      "consolidationTrends": ["[trend 1]", "[trend 2]", "..."]
    },
    "competitivePositioning": {
      "premiumSegment": {
        "leaders": ["[competitor 1]", "[competitor 2]", "..."],
        "characteristics": ["[characteristic 1]", "[characteristic 2]", "..."],
        "userProfile": "[who chooses premium options]"
      },
      "midMarket": {
        "leaders": ["[competitor 1]", "[competitor 2]", "..."],
        "characteristics": ["[characteristic 1]", "[characteristic 2]", "..."],
        "userProfile": "[who chooses mid-market options]"
      },
      "budgetSegment": {
        "leaders": ["[competitor 1]", "[competitor 2]", "..."],
        "characteristics": ["[characteristic 1]", "[characteristic 2]", "..."],
        "userProfile": "[who chooses budget options]"
      }
    },
    "strengthsWeaknessMatrix": {
      "[Competitor Name]": {
        "strengths": ["[strength 1]", "[strength 2]", "..."],
        "weaknesses": ["[weakness 1]", "[weakness 2]", "..."],
        "userLoyalty": "[High/Medium/Low with explanation]",
        "migrationVulnerability": ["[vulnerability 1]", "[vulnerability 2]", "..."]
      }
    },
    "featureGapAnalysis": {
      "commonGaps": ["[gap mentioned across multiple competitors]", "..."],
      "competitorSpecificGaps": {
        "[Competitor Name]": ["[specific gap 1]", "[specific gap 2]", "..."]
      },
      "innovationOpportunities": ["[opportunity 1]", "[opportunity 2]", "..."]
    }
  },
  "insights": {
    "keyFindings": ["[major insight 1]", "[major insight 2]", "[major insight 3]"],
    "competitiveAdvantages": {
      "potentialAdvantages": ["[advantage our domain could leverage]", "..."],
      "marketPositioning": "[recommended positioning strategy]",
      "differentiationStrategy": "[how to stand out from competitors]"
    },
    "marketOpportunities": {
      "underservedSegments": ["[segment 1]", "[segment 2]", "..."],
      "featureOpportunities": ["[feature gap to fill]", "..."],
      "serviceGaps": ["[service improvement opportunity]", "..."],
      "pricingOpportunities": ["[pricing strategy insight]", "..."]
    },
    "threats": {
      "immediateThreats": ["[threat 1]", "[threat 2]", "..."],
      "emergingThreats": ["[future threat 1]", "[future threat 2]", "..."],
      "disruptionPotential": ["[disruption scenario 1]", "[disruption scenario 2]", "..."]
    },
    "userDecisionFactors": {
      "primaryDecisionCriteria": ["[factor 1]", "[factor 2]", "..."],
      "dealBreakers": ["[deal breaker 1]", "[deal breaker 2]", "..."],
      "loyaltyDrivers": ["[loyalty factor 1]", "[loyalty factor 2]", "..."],
      "switchingTriggers": ["[trigger 1]", "[trigger 2]", "..."]
    },
    "strategicRecommendations": [
      {
        "recommendation": "[strategic recommendation]",
        "rationale": "[why this recommendation based on community insights]",
        "priority": "[High/Medium/Low]",
        "implementationComplexity": "[High/Medium/Low]"
      }
    ]
  }
}
```

---

## 4. Expert Search Behavior Pattern Analysis Framework

### Purpose
Conduct comprehensive search behavior intelligence analysis to decode how users actually search for content/services that our domain should serve.

### Expert Prompt Framework

#### **Core Mission**
Conduct comprehensive search behavior intelligence analysis to decode how users actually search for content/services that our domain should serve. Transform raw community insights into actionable search pattern intelligence.

#### **Advanced Pattern Recognition Framework**

**1. Search Intent Behavioral Mapping**

*Informational Intent Patterns:*
- Learning Trajectory Signals: "how to", "what is", "why does", "when to", "where can I learn"
- Problem-Discovery Indicators: "help with", "understand", "explain", "difference between"
- Educational Depth Markers: "beginner guide", "advanced techniques", "step-by-step", "tutorial"
- Research Validation Queries: "is it true that", "does it really work", "proven methods"

*Navigational Intent Patterns:*
- Brand/Service Seeking: "[brand] official", "find [service] near [location]", "[company] contact"
- Local Discovery Signals: "near me", "[city] + [service]", "local [provider]", "in [area]"
- Specific Resource Hunting: "[tool] login", "[platform] dashboard", "official [service] site"

*Transactional Intent Patterns:*
- Purchase Readiness: "buy", "order", "purchase", "get quote", "pricing", "cost"
- Service Booking: "book appointment", "schedule", "reserve", "sign up"
- Download/Access Actions: "download", "get access", "try free", "start trial"
- Immediate Action Triggers: "now", "today", "urgent", "emergency"

*Commercial Investigation Patterns:*
- Comparison Shopping: "vs", "versus", "compare", "which is better", "alternatives to"
- Quality Assessment: "best", "top rated", "reviews", "testimonials", "ratings"
- Value Analysis: "worth it", "price comparison", "cheapest", "most affordable"
- Social Proof Seeking: "recommended", "popular", "most used", "trusted"

**2. Advanced Search Modifier Intelligence**

*Temporal Modifiers:*
- Urgency Indicators: "urgent", "emergency", "asap", "same day", "immediate"
- Planning Signals: "2024", "next year", "upcoming", "future", "planning"
- Recency Requirements: "latest", "new", "recent", "updated", "current"

*Geographic Qualifiers:*
- Proximity Patterns: "near me", "nearby", "close", "local", "in [radius]"
- Location Specificity: "[city]", "[state]", "[neighborhood]", "[zip code]"
- Regional Variations: "[region] style", "[area] specific", "for [location] residents"

*Quality Filters:*
- Performance Standards: "best", "top", "highest rated", "premium", "professional"
- Reliability Markers: "trusted", "certified", "licensed", "verified", "guaranteed"
- Experience Level: "beginner", "advanced", "expert", "intermediate"

**3. Behavioral Journey Pattern Analysis**

*Awareness Stage Patterns:*
- Problem recognition queries
- Educational content consumption
- General information gathering
- Symptom/challenge identification

*Consideration Stage Patterns:*
- Solution comparison behaviors
- Feature evaluation queries
- Provider research patterns
- Reviews and testimonials seeking

*Decision Stage Patterns:*
- Pricing and availability checks
- Contact information searches
- Booking/purchase-ready queries
- Local provider verification

*Post-Purchase Patterns:*
- Support and help queries
- Advanced usage questions
- Loyalty and repeat engagement
- Referral and recommendation patterns

#### **Output Schema**
```json
{
  "patterns": {
    "intentDistribution": {
      "informational": {
        "percentage": "[0-100]",
        "topModifiers": ["[modifier 1]", "[modifier 2]", "..."],
        "searchExamples": ["[example query 1]", "[example query 2]", "..."],
        "userMindset": "[description of user psychology]"
      },
      "navigational": {
        "percentage": "[0-100]",
        "topModifiers": ["[modifier 1]", "[modifier 2]", "..."],
        "searchExamples": ["[example query 1]", "[example query 2]", "..."],
        "userMindset": "[description of user psychology]"
      },
      "transactional": {
        "percentage": "[0-100]",
        "topModifiers": ["[modifier 1]", "[modifier 2]", "..."],
        "searchExamples": ["[example query 1]", "[example query 2]", "..."],
        "userMindset": "[description of user psychology]"
      },
      "commercialInvestigation": {
        "percentage": "[0-100]",
        "topModifiers": ["[modifier 1]", "[modifier 2]", "..."],
        "searchExamples": ["[example query 1]", "[example query 2]", "..."],
        "userMindset": "[description of user psychology]"
      }
    },
    "temporalPatterns": {
      "seasonalTrends": ["[pattern 1]", "[pattern 2]", "..."],
      "dailyPatterns": ["[pattern 1]", "[pattern 2]", "..."],
      "urgencyPatterns": ["[pattern 1]", "[pattern 2]", "..."]
    },
    "geographicPatterns": {
      "localModifiers": ["[modifier 1]", "[modifier 2]", "..."],
      "regionalVariations": ["[variation 1]", "[variation 2]", "..."],
      "proximitySignals": ["[signal 1]", "[signal 2]", "..."]
    },
    "userJourneyPatterns": {
      "awarenessQueries": ["[query 1]", "[query 2]", "..."],
      "considerationQueries": ["[query 1]", "[query 2]", "..."],
      "decisionQueries": ["[query 1]", "[query 2]", "..."],
      "loyaltyQueries": ["[query 1]", "[query 2]", "..."]
    },
    "volumeDistribution": {
      "highVolumePatterns": ["[pattern 1]", "[pattern 2]", "..."],
      "longTailOpportunities": ["[opportunity 1]", "[opportunity 2]", "..."],
      "emergingTrends": ["[trend 1]", "[trend 2]", "..."]
    }
  },
  "summary": {
    "dominantIntent": "[primary search intent with explanation]",
    "keyInsights": ["[insight 1]", "[insight 2]", "[insight 3]"],
    "searcherProfile": "[detailed user persona description]",
    "contentOpportunities": ["[opportunity 1]", "[opportunity 2]", "..."],
    "competitiveGaps": ["[gap 1]", "[gap 2]", "..."]
  },
  "communityDerivedPatterns": {
    "languagePatterns": ["[pattern 1]", "[pattern 2]", "..."],
    "problemFraming": ["[how users describe problems]", "..."],
    "solutionSeeking": ["[how users ask for solutions]", "..."],
    "authoritySignals": ["[what indicates expertise]", "..."],
    "engagementTriggers": ["[what generates discussion]", "..."],
    "recommendationBehavior": ["[how users give/seek recommendations]", "..."]
  },
  "userQuestions": {
    "frequentQuestions": ["[question 1]", "[question 2]", "..."],
    "advancedQuestions": ["[complex question 1]", "[complex question 2]", "..."],
    "problemSolving": ["[problem-focused question 1]", "..."],
    "comparisonQuestions": ["[comparison question 1]", "..."],
    "implementationQuestions": ["[how-to question 1]", "..."],
    "emergingConcerns": ["[new/trending question 1]", "..."]
  }
}
```

---

## 5. Expert Phrase Generation Framework

### Purpose
Generate natural, user-centric search phrases that real people would actually type when seeking information about specific keywords.

### Expert Prompt Framework

#### **Core Mission**
You are an expert search behavior analyst with 15+ years of experience in user intent mapping and conversational search optimization. Your task is to generate natural, user-centric search phrases that real people would actually type when seeking information about specific keywords.

#### **Advanced Framework**

**1. Context Analysis**
- Business Domain: Industry and market context
- Geographic Focus: Local and regional considerations
- Brand Voice: Professional tone and personality alignment
- Community Intelligence: Real user insights and pain points
- Competitive Landscape: Market positioning and differentiation
- Search Behavior Patterns: User intent and journey mapping

**2. User Intent Framework**
- **Informational Intent**: Learn & Understand mindset
- **Navigational Intent**: Find & Locate mindset
- **Transactional Intent**: Act & Purchase mindset
- **Commercial Investigation**: Research & Compare mindset

**3. Quality Assurance Protocol**
Each phrase must pass this checklist:
- ✅ 12-15 words exactly (voice-search optimized length)
- ✅ Complete, grammatically correct sentence
- ✅ Natural conversational flow (not keyword-stuffed)
- ✅ Authentic user intent mapping
- ✅ Local/geographic integration when relevant
- ✅ Competitive gap identification
- ✅ Brand voice alignment
- ✅ Community insight integration

**4. Strategic Implementation Guide**
- Prioritize phrases that fill competitive gaps
- Ensure geographic integration feels natural, not forced
- Balance informational and commercial intents
- Include voice-search optimized patterns
- Leverage community insights for authenticity

#### **Output Schema**
```json
[
  {
    "phrase": "Complete 12-15 word sentence with natural flow",
    "intent": "Informational|Navigational|Transactional|Commercial Investigation",
    "intentConfidence": 85,
    "relevanceScore": 92,
    "sources": ["Community Insights", "Competitor Analysis", "Search Patterns"],
    "userPersona": "Decision maker seeking solution",
    "searchContext": "Research phase, comparing options"
  }
]
```

---

## System Integration & Flow

### Data Flow Architecture
```
1. Brand Intelligence → Semantic Context
2. Community Mining → User Insights & Pain Points
3. Competitor Research → Market Landscape & Gaps
4. Search Patterns → Behavioral Intelligence
5. Phrase Generation → Optimized Search Phrases
6. Intent Classification → Automated Categorization
7. Relevance Scoring → Quality Assessment
```

### Quality Assurance Standards
- All insights supported by specific evidence
- User quotes accurately represent community voice
- Pain points prioritized by actual frequency and intensity
- Solutions validated by community success stories
- Trends backed by observable pattern changes
- Market opportunities grounded in unmet community needs
- Actionable intelligence specific and implementable

### Strategic Implementation Benefits
- **Product Development**: Pain point analysis for feature prioritization
- **Content Strategy**: Knowledge gaps for educational content creation
- **Market Positioning**: Community language and trust signals for messaging
- **Customer Acquisition**: User personas with specific needs and preferences
- **Competitive Strategy**: Solution gaps and market opportunities exploitation

---

## Technical Implementation

### API Endpoints
- `POST /api/enhanced-phrases/:domainId/step3/generate` - Main generation endpoint
- `GET /api/enhanced-phrases/:domainId/step3` - Load existing data

### Dependencies
- OpenAI GPT-4o for AI analysis
- SERP API for Reddit/Quora data mining
- Prisma ORM for database operations
- Express.js for API routing

### Error Handling
- Robust JSON parsing with fallback mechanisms
- Timeout handling for AI model responses
- Graceful degradation for missing data
- Comprehensive logging and monitoring

### Performance Optimization
- Batch processing for database operations
- Caching for existing analysis results
- Rate limiting for external API calls
- Streaming responses for real-time updates

---

## Conclusion

The Enhanced Phrases Unified System represents a comprehensive, expert-level approach to search phrase generation that leverages advanced AI methodologies, community intelligence, and strategic market analysis. Each prompt framework is designed to extract maximum value from available data while maintaining high standards for quality and actionable insights.

The system's modular architecture allows for continuous improvement and refinement of individual components while maintaining overall system integrity and performance. 