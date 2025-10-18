import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, Users, Clock, TrendingUp, MousePointer, Download, 
  Mail, Globe, MapPin, Monitor, Smartphone, Tablet, BarChart3,
  Calendar, ExternalLink, ArrowUp, ArrowDown
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PortfolioAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/portfolios/analytics?timeRange=${timeRange}`);
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Fetch analytics error:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { overview, timeRange: timeRangeData, traffic, engagement } = analytics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Portfolio Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your portfolio performance and visitor insights
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button onClick={() => navigate('/portfolio/editor')} className="btn btn-outline">
            Back to Editor
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{overview?.totalViews || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
          {timeRangeData?.totalViews > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
              <ArrowUp className="h-4 w-4" />
              {timeRangeData.totalViews} in selected period
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{overview?.uniqueVisitors || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Unique Visitors</div>
          {timeRangeData?.uniqueVisitors > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600 mt-2">
              <ArrowUp className="h-4 w-4" />
              {timeRangeData.uniqueVisitors} in selected period
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {Math.floor((overview?.averageTimeOnPage || 0) / 60)}:{((overview?.averageTimeOnPage || 0) % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Time on Page</div>
          <div className="text-xs text-gray-500 mt-2">
            {Math.floor((timeRangeData?.avgSessionDuration || 0) / 60)}m {(timeRangeData?.avgSessionDuration || 0) % 60}s per session
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-1">{overview?.bounceRate || 0}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Bounce Rate</div>
          <div className="text-xs text-gray-500 mt-2">
            Lower is better
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <MousePointer className="h-8 w-8 text-primary-600" />
            <div>
              <div className="text-2xl font-bold">{engagement?.projectClicks || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Project Clicks</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Download className="h-8 w-8 text-primary-600" />
            <div>
              <div className="text-2xl font-bold">{engagement?.resumeDownloads || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Resume Downloads</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-8 w-8 text-primary-600" />
            <div>
              <div className="text-2xl font-bold">{engagement?.contactSubmissions || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Contact Form Submissions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Views Over Time */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary-600" />
            Views Over Time
          </h2>
          
          {timeRangeData?.viewsByDay && Object.keys(timeRangeData.viewsByDay).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(timeRangeData.viewsByDay)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .slice(0, 10)
                .map(([date, count]) => (
                  <div key={date} className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 w-24">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(timeRangeData.viewsByDay))) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium w-12 text-right">{count}</div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Top Referrers */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <ExternalLink className="h-6 w-6 text-primary-600" />
            Top Referrers
          </h2>
          
          {traffic?.topReferrers && traffic.topReferrers.length > 0 ? (
            <div className="space-y-4">
              {traffic.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium capitalize">{referrer.source}</div>
                      <div className="text-sm text-gray-500">{referrer.count} visits</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round((referrer.count / timeRangeData?.totalViews) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No referrer data</p>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary-600" />
            Device Breakdown
          </h2>
          
          {traffic?.devices && Object.keys(traffic.devices).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(traffic.devices).map(([device, count]) => {
                const Icon = device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor;
                const total = Object.values(traffic.devices).reduce((a, b) => a + b, 0);
                const percentage = Math.round((count / total) * 100);
                
                return (
                  <div key={device}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium capitalize">{device}</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No device data</p>
          )}
        </div>

        {/* Top Locations */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary-600" />
            Top Locations
          </h2>
          
          {traffic?.topLocations && traffic.topLocations.length > 0 ? (
            <div className="space-y-3">
              {traffic.topLocations.map((location, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{location.country}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ 
                          width: `${(location.count / traffic.topLocations[0].count) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{location.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No location data</p>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-8 card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          Tips to Improve Your Portfolio Performance
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Share your portfolio on LinkedIn, Twitter, and other social media platforms</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Add your portfolio link to your email signature and resume</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Keep your projects and experience sections updated with latest work</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Use high-quality images and demos for your projects</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Make sure your contact information is easily accessible</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PortfolioAnalytics;
