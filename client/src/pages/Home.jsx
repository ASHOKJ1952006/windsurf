import { Link } from 'react-router-dom'
import { BookOpen, Users, Award, TrendingUp, Briefcase, MessageSquare, Sparkles, Rocket, Zap, Star, ArrowRight } from 'lucide-react'

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Flying Books */}
        <div className="flying-book">📖</div>
        <div className="flying-book book-with-flip">📚</div>
        <div className="flying-book">📕</div>
        <div className="flying-book book-with-flip">📗</div>
        <div className="flying-book">📘</div>
        <div className="flying-book book-with-flip">📙</div>
      </div>

      {/* Hero Section */}
      <div className="relative py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6 animate-fade-in-down">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">Welcome to the Future of Learning</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
                Learn Without Limits
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-gray-300 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Master new skills with personalized learning paths, expert mentorship, and a thriving community
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/courses" className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300">
                <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                Explore Courses
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-gray-800/50 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold border-2 border-orange-500/30 hover:border-orange-500 hover:bg-gray-800/70 shadow-lg transform hover:scale-105 transition-all duration-300">
                <Zap className="h-5 w-5 text-orange-400" />
                Get Started Free
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-1">10K+</div>
                <div className="text-sm text-gray-400">Active Learners</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-1">500+</div>
                <div className="text-sm text-gray-400">Expert Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400 mb-1">95%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose <span className="text-orange-400">E-Learn</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to accelerate your learning journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="feature-card group">
              <div className="feature-icon-wrapper">
                <BookOpen className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">Expert-Led Courses</h3>
              <p className="text-gray-400">
                Learn from industry professionals with real-world experience
              </p>
            </div>
            
            <div className="feature-card group" style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon-wrapper">
                <Users className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">1-on-1 Mentorship</h3>
              <p className="text-gray-400">
                Get personalized guidance from experienced mentors
              </p>
            </div>
            
            <div className="feature-card group" style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon-wrapper">
                <Award className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">Earn Certificates</h3>
              <p className="text-gray-400">
                Showcase your achievements with verified certificates
              </p>
            </div>
            
            <div className="feature-card group" style={{ animationDelay: '0.3s' }}>
              <div className="feature-icon-wrapper">
                <TrendingUp className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">AI Recommendations</h3>
              <p className="text-gray-400">
                Get personalized course suggestions based on your goals
              </p>
            </div>
            
            <div className="feature-card group" style={{ animationDelay: '0.4s' }}>
              <div className="feature-icon-wrapper">
                <MessageSquare className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">Community Forum</h3>
              <p className="text-gray-400">
                Connect with learners and get help from the community
              </p>
            </div>
            
            <div className="feature-card group" style={{ animationDelay: '0.5s' }}>
              <div className="feature-icon-wrapper">
                <Briefcase className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">Job Board</h3>
              <p className="text-gray-400">
                Find opportunities that match your newly acquired skills
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cta-card">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <Star className="h-6 w-6 text-orange-400 animate-pulse" />
                <Star className="h-8 w-8 text-orange-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <Star className="h-6 w-6 text-orange-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of learners achieving their goals every day
              </p>
              
              <Link to="/register" className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-orange-500/50 transform hover:scale-105 transition-all duration-300">
                <Zap className="h-6 w-6" />
                Sign Up Now
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <p className="text-sm text-gray-500 mt-6">
                No credit card required • Free forever plan available
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
