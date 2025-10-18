import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Mail, Phone, MapPin, Globe, Github, Linkedin, Twitter, 
  Download, ExternalLink, Star, GitFork, Code, Award, 
  BookOpen, Briefcase, GraduationCap, Heart, Share2,
  Calendar, TrendingUp, Eye
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PublicPortfolio = () => {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('about');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchPortfolio();
    
    // Generate visitor ID
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitorId', visitorId);
    }
  }, [slug]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/portfolios/public/${slug}`);
      setPortfolio(data.portfolio);
    } catch (error) {
      console.error('Fetch portfolio error:', error);
      toast.error('Portfolio not found');
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (type, target, metadata = {}) => {
    try {
      await api.post('/portfolios/track', {
        portfolioId: portfolio._id,
        type,
        target,
        metadata
      });
    } catch (error) {
      console.error('Track interaction error:', error);
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    trackInteraction('project-view', project._id, { title: project.title });
  };

  const handleDownloadResume = () => {
    trackInteraction('resume-download', 'resume');
    toast.success('Resume download started');
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Portfolio link copied to clipboard!');
      trackInteraction('share', 'portfolio');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Portfolio Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">The portfolio you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const { user, hero, about, skills, experience, education, projects, certifications, courses, achievements, github, social, sections } = portfolio;

  // Sort sections by order
  const sortedSections = sections?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
  const visibleSections = sortedSections.filter(s => s.visible);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div 
        className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20"
        style={hero?.backgroundImage ? { backgroundImage: `url(${hero.backgroundImage})`, backgroundSize: 'cover' } : {}}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Image */}
            <div className="relative">
              <img 
                src={about?.profileImage || user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.name}&size=200`}
                alt={user?.name}
                className="w-40 h-40 rounded-full border-4 border-white shadow-2xl object-cover"
              />
              {about?.availability === 'available' && (
                <span className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>

            {/* Hero Content */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold mb-2">{user?.name}</h1>
              <p className="text-2xl font-light mb-4 opacity-90">{hero?.subtitle || hero?.tagline}</p>
              {hero?.title && <p className="text-lg mb-6">{hero.title}</p>}
              
              {/* Social Links */}
              <div className="flex gap-4 justify-center md:justify-start mb-6">
                {social?.email && (
                  <a href={`mailto:${social.email}`} className="text-white hover:text-primary-200 transition">
                    <Mail className="h-6 w-6" />
                  </a>
                )}
                {social?.linkedin && (
                  <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-200 transition">
                    <Linkedin className="h-6 w-6" />
                  </a>
                )}
                {social?.github && (
                  <a href={social.github} target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-200 transition">
                    <Github className="h-6 w-6" />
                  </a>
                )}
                {social?.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-200 transition">
                    <Twitter className="h-6 w-6" />
                  </a>
                )}
                {social?.website && (
                  <a href={social.website} target="_blank" rel="noopener noreferrer" className="text-white hover:text-primary-200 transition">
                    <Globe className="h-6 w-6" />
                  </a>
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-4 flex-wrap justify-center md:justify-start">
                {hero?.ctaLink && (
                  <a href={hero.ctaLink} className="btn bg-white text-primary-600 hover:bg-gray-100">
                    {hero.ctaText || 'Contact Me'}
                  </a>
                )}
                <button onClick={handleDownloadResume} className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600">
                  <Download className="h-5 w-5 mr-2" />
                  Download Resume
                </button>
                <button onClick={handleShare} className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 shadow-md z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto">
            {visibleSections.map(section => (
              <button
                key={section.name}
                onClick={() => setActiveSection(section.name)}
                className={`py-4 px-4 font-medium whitespace-nowrap border-b-2 transition ${
                  activeSection === section.name
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-primary-600'
                }`}
              >
                {section.name.charAt(0).toUpperCase() + section.name.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About Section */}
        {activeSection === 'about' && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">About Me</h2>
            <div className="card">
              <p className="text-lg text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {about?.longBio || about?.bio}
              </p>
              
              {about?.location && (
                <div className="flex items-center gap-2 mt-6 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-5 w-5" />
                  <span>{about.location}</span>
                </div>
              )}
              
              {about?.yearsOfExperience && (
                <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400">
                  <Briefcase className="h-5 w-5" />
                  <span>{about.yearsOfExperience}+ years of experience</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {activeSection === 'skills' && skills && skills.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Skills & Expertise</h2>
            
            {/* Group skills by category */}
            {['technical', 'soft', 'language', 'tool', 'framework'].map(category => {
              const categorySkills = skills.filter(s => s.category === category && s.showInPortfolio);
              if (categorySkills.length === 0) return null;
              
              return (
                <div key={category} className="card mb-6">
                  <h3 className="text-xl font-semibold mb-4 capitalize">{category} Skills</h3>
                  <div className="space-y-4">
                    {categorySkills.map((skill, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{skill.name}</span>
                          {skill.proficiency && (
                            <span className="text-sm text-gray-500">{skill.proficiency}%</span>
                          )}
                        </div>
                        {skill.proficiency && (
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{ width: `${skill.proficiency}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Experience Section */}
        {activeSection === 'experience' && experience && experience.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Work Experience</h2>
            <div className="space-y-6">
              {experience.filter(exp => exp.showInPortfolio).map((exp, index) => (
                <div key={index} className="card">
                  <div className="flex items-start gap-4">
                    {exp.companyLogo && (
                      <img src={exp.companyLogo} alt={exp.company} className="w-16 h-16 rounded object-cover" />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{exp.position}</h3>
                      <p className="text-primary-600 font-medium">{exp.company}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        {exp.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {exp.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          {' - '}
                          {exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="mt-4 text-gray-700 dark:text-gray-300">{exp.description}</p>
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {exp.achievements.map((achievement, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                              <Star className="h-4 w-4 text-primary-600 flex-shrink-0 mt-1" />
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {activeSection === 'projects' && projects && projects.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {projects.filter(p => p.visibility === 'public').map((project) => (
                <div 
                  key={project._id}
                  onClick={() => handleProjectClick(project)}
                  className="card hover:shadow-xl transition cursor-pointer"
                >
                  {project.thumbnail && (
                    <img src={project.thumbnail} alt={project.title} className="w-full h-48 object-cover rounded-t-lg -mt-6 -mx-6 mb-4" />
                  )}
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                  
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="badge badge-primary">{tech}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    {project.demoUrl && (
                      <a 
                        href={project.demoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          trackInteraction('project-click', project._id, { type: 'demo' });
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Live Demo
                      </a>
                    )}
                    {project.githubUrl && (
                      <a 
                        href={project.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          trackInteraction('github-click', project._id);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        <Github className="h-4 w-4 mr-1" />
                        Code
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GitHub Section */}
        {activeSection === 'github' && github?.connected && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">GitHub Contributions</h2>
            
            {/* GitHub Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="card text-center">
                <div className="text-3xl font-bold text-primary-600">{github.stats?.totalRepos || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Repositories</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-yellow-600">{github.stats?.totalStars || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Stars</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-green-600">{github.stats?.totalCommits || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Commits</div>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-blue-600">{github.stats?.totalPRs || 0}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pull Requests</div>
              </div>
            </div>

            {/* Repositories */}
            <h3 className="text-2xl font-semibold mb-4">Repositories</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {github.repositories
                ?.filter(repo => repo.showInPortfolio)
                .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                .map((repo) => (
                  <a 
                    key={repo.id}
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card hover:shadow-xl transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{repo.name}</h4>
                      {repo.pinned && (
                        <span className="badge badge-primary">Pinned</span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {repo.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <Code className="h-4 w-4" />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {repo.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        {repo.forks}
                      </span>
                    </div>
                    {repo.topics && repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {repo.topics.slice(0, 5).map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {activeSection === 'certifications' && certifications && certifications.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Certifications</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {certifications.filter(cert => cert.showInPortfolio).map((cert, index) => (
                <div key={index} className="card">
                  <div className="flex items-start gap-4">
                    <Award className="h-12 w-12 text-primary-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{cert.customTitle || cert.certificate?.courseName}</h3>
                      <p className="text-primary-600">{cert.certificate?.issuedBy || 'E-Learning Platform'}</p>
                      {cert.certificate?.issuedAt && (
                        <p className="text-sm text-gray-500 mt-2">
                          Issued: {new Date(cert.certificate.issuedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                      )}
                      {cert.certificate?.certificateId && (
                        <p className="text-xs text-gray-500 mt-1">ID: {cert.certificate.certificateId}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Section */}
        {activeSection === 'courses' && courses && courses.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Completed Courses</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {courses.filter(c => c.showInPortfolio).map((courseItem, index) => (
                <div key={index} className="card">
                  <div className="flex items-start gap-4">
                    <BookOpen className="h-12 w-12 text-primary-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{courseItem.course?.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {courseItem.course?.description?.substring(0, 100)}...
                      </p>
                      {courseItem.course?.instructor && (
                        <p className="text-sm text-gray-500 mt-2">
                          Instructor: {courseItem.course.instructor.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {activeSection === 'education' && education && education.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Education</h2>
            <div className="space-y-6">
              {education.filter(edu => edu.showInPortfolio).map((edu, index) => (
                <div key={index} className="card">
                  <div className="flex items-start gap-4">
                    <GraduationCap className="h-12 w-12 text-primary-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{edu.degree}</h3>
                      {edu.field && <p className="text-gray-600 dark:text-gray-400">{edu.field}</p>}
                      <p className="text-primary-600 font-medium mt-1">{edu.institution}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                        {edu.startDate && (
                          <span>
                            {new Date(edu.startDate).getFullYear()}
                            {' - '}
                            {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                          </span>
                        )}
                        {edu.gpa && <span>GPA: {edu.gpa}</span>}
                      </div>
                      {edu.achievements && edu.achievements.length > 0 && (
                        <ul className="mt-4 space-y-1 text-sm">
                          {edu.achievements.map((achievement, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Star className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} {user?.name}. Built with E-Learning Platform.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <button onClick={handleShare} className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition">
              <Share2 className="h-5 w-5" />
            </button>
            {portfolio.analytics?.totalViews > 0 && (
              <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Eye className="h-5 w-5" />
                {portfolio.analytics.totalViews} views
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicPortfolio;
