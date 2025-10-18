/**
 * Test script to verify portfolio routes load correctly
 * Run with: node test-portfolio-routes.js
 */

console.log('🧪 Testing Portfolio Routes...\n');

try {
  // Test 1: Load Portfolio Model
  console.log('1. Loading Portfolio model...');
  const Portfolio = require('./models/Portfolio');
  console.log('   ✅ Portfolio model loaded successfully');

  // Test 2: Load PortfolioAnalytics Model
  console.log('2. Loading PortfolioAnalytics model...');
  const PortfolioAnalytics = require('./models/PortfolioAnalytics');
  console.log('   ✅ PortfolioAnalytics model loaded successfully');

  // Test 3: Load GitHub Service
  console.log('3. Loading GitHub service...');
  const githubService = require('./services/githubService');
  console.log('   ✅ GitHub service loaded successfully');

  // Test 4: Load LinkedIn Service
  console.log('4. Loading LinkedIn service...');
  const linkedinService = require('./services/linkedinService');
  console.log('   ✅ LinkedIn service loaded successfully');

  // Test 5: Load Portfolio Controller
  console.log('5. Loading Portfolio controller...');
  const portfolioController = require('./controllers/portfolioController');
  console.log('   ✅ Portfolio controller loaded successfully');
  console.log('   Available methods:', Object.keys(portfolioController).join(', '));

  // Test 6: Load Portfolio Routes
  console.log('6. Loading Portfolio routes...');
  const portfolioRoutes = require('./routes/portfolios');
  console.log('   ✅ Portfolio routes loaded successfully');

  console.log('\n✅ All portfolio components loaded successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your server: npm run dev');
  console.log('   2. Access portfolio editor at: http://localhost:5173/portfolio/editor');
  console.log('   3. API endpoint: http://localhost:5000/api/portfolios/my');

} catch (error) {
  console.error('\n❌ Error loading portfolio components:');
  console.error(error.message);
  console.error('\n📝 Stack trace:');
  console.error(error.stack);
  process.exit(1);
}
