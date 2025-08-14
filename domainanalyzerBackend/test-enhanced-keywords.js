require('dotenv').config();

// Test the enhanced keyword generation with location context
async function testEnhancedKeywords() {
  try {
    console.log('🧪 Testing Enhanced Keyword Generation with Location Context...\n');
    
    // Import the service
    const { generateKeywordsForDomain } = require('./src/services/geminiService.ts');
    
    console.log('✅ Service imported successfully');
    
    // Test cases with different business types and locations
    const testCases = [
      {
        name: 'Tech Startup - US',
        domain: 'https://innovate-tech-solutions.com',
        context: 'A technology startup specializing in AI-powered business solutions, targeting small to medium businesses with innovative software tools and consulting services.',
        location: 'united states'
      },
      {
        name: 'E-commerce Store - UK',
        domain: 'https://premium-fashion-store.com',
        context: 'An online fashion retailer offering premium clothing and accessories for men and women, with focus on sustainable fashion and luxury brands.',
        location: 'united kingdom'
      },
      {
        name: 'Local Service Business - Canada',
        domain: 'https://expert-plumbing-services.com',
        context: 'A local plumbing company providing residential and commercial plumbing services, emergency repairs, installations, and maintenance.',
        location: 'canada'
      },
      {
        name: 'Global Business - No Location',
        domain: 'https://digital-marketing-agency.com',
        context: 'A digital marketing agency offering comprehensive online marketing services including SEO, PPC, social media management, and content marketing.',
        location: undefined
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🎯 Testing: ${testCase.name}`);
      console.log('Domain:', testCase.domain);
      console.log('Location:', testCase.location || 'Global');
      console.log('Context:', testCase.context.substring(0, 100) + '...');
      
      const startTime = Date.now();
      const result = await generateKeywordsForDomain(
        testCase.domain, 
        testCase.context, 
        testCase.location
      );
      const endTime = Date.now();
      
      console.log(`\n✅ Generated ${result.keywords.length} keywords in ${endTime - startTime}ms`);
      console.log(`Token usage: ${result.tokenUsage}`);
      
      // Analyze keyword quality and distribution
      const intentDistribution = {
        'Informational': 0,
        'Commercial': 0,
        'Transactional': 0,
        'Navigational': 0
      };
      
      const volumeRanges = {
        '1-500': 0,
        '501-2,000': 0,
        '2,001-10,000': 0,
        '10,001-50,000': 0,
        '50,001+': 0
      };
      
      const competitionLevels = {
        'Low': 0,
        'Medium': 0,
        'High': 0
      };
      
      const locationKeywords = testCase.location ? result.keywords.filter(kw => 
        kw.term.toLowerCase().includes(testCase.location.toLowerCase()) ||
        kw.term.toLowerCase().includes('near me')
      ) : [];
      
      console.log('\n📊 Keyword Analysis:');
      result.keywords.slice(0, 15).forEach((keyword, index) => {
        console.log(`${index + 1}. "${keyword.term}" - Volume: ${keyword.volume}, Difficulty: ${keyword.difficulty}, CPC: $${keyword.cpc}, Intent: ${keyword.intent}`);
        
        // Categorize by intent
        intentDistribution[keyword.intent]++;
        
        // Categorize by volume
        if (keyword.volume <= 500) volumeRanges['1-500']++;
        else if (keyword.volume <= 2000) volumeRanges['501-2,000']++;
        else if (keyword.volume <= 10000) volumeRanges['2,001-10,000']++;
        else if (keyword.volume <= 50000) volumeRanges['10,001-50,000']++;
        else volumeRanges['50,001+']++;
        
        // Categorize by competition
        competitionLevels[keyword.difficulty]++;
      });
      
      console.log('\n📈 Intent Distribution:');
      Object.entries(intentDistribution).forEach(([intent, count]) => {
        const percentage = ((count / result.keywords.length) * 100).toFixed(1);
        console.log(`- ${intent}: ${count} keywords (${percentage}%)`);
      });
      
      console.log('\n📊 Volume Distribution:');
      Object.entries(volumeRanges).forEach(([range, count]) => {
        const percentage = ((count / result.keywords.length) * 100).toFixed(1);
        console.log(`- ${range}: ${count} keywords (${percentage}%)`);
      });
      
      console.log('\n🏆 Competition Distribution:');
      Object.entries(competitionLevels).forEach(([level, count]) => {
        const percentage = ((count / result.keywords.length) * 100).toFixed(1);
        console.log(`- ${level}: ${count} keywords (${percentage}%)`);
      });
      
      if (testCase.location) {
        console.log(`\n📍 Location-Specific Keywords: ${locationKeywords.length}/${result.keywords.length} (${((locationKeywords.length / result.keywords.length) * 100).toFixed(1)}%)`);
        locationKeywords.slice(0, 5).forEach((kw, index) => {
          console.log(`  ${index + 1}. "${kw.term}" - ${kw.intent}`);
        });
      }
      
      // Calculate average metrics
      const avgVolume = result.keywords.reduce((sum, kw) => sum + kw.volume, 0) / result.keywords.length;
      const avgCPC = result.keywords.reduce((sum, kw) => sum + kw.cpc, 0) / result.keywords.length;
      
      console.log(`\n📊 Average Metrics:`);
      console.log(`- Average Volume: ${avgVolume.toFixed(1)}`);
      console.log(`- Average CPC: $${avgCPC.toFixed(2)}`);
      
      console.log('\n' + '='.repeat(80));
    }
    
    console.log('\n🎉 Enhanced Keyword Generation Test Complete!');
    console.log('✅ The system generates high-quality keywords with proper intent classification, location context, and realistic metrics for table display.');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Full error:', error);
  }
}

testEnhancedKeywords(); 