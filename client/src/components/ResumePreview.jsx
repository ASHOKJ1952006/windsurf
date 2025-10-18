import React, { forwardRef } from 'react'
import { Mail, Phone, MapPin, Globe, Github, Linkedin, Calendar } from 'lucide-react'

const ResumePreview = forwardRef(({ resumeData, template = 'professional' }, ref) => {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatDateRange = (startDate, endDate, current) => {
    const start = formatDate(startDate)
    const end = current ? 'Present' : formatDate(endDate)
    return `${start} - ${end}`
  }

  // Professional Template
  const ProfessionalTemplate = () => (
    <div className="bg-white text-black min-h-[297mm] w-[210mm] mx-auto p-8 font-sans">
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-6 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {resumeData.contact?.fullName || 'Your Name'}
        </h1>
        {resumeData.headline && (
          <h2 className="text-xl text-blue-600 font-semibold mb-4">
            {resumeData.headline}
          </h2>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {resumeData.contact?.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {resumeData.contact.email}
            </div>
          )}
          {resumeData.contact?.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              {resumeData.contact.phone}
            </div>
          )}
          {resumeData.contact?.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {resumeData.contact.location}
            </div>
          )}
          {resumeData.contact?.linkedin && (
            <div className="flex items-center">
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </div>
          )}
          {resumeData.contact?.github && (
            <div className="flex items-center">
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </div>
          )}
          {resumeData.contact?.portfolio && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Portfolio
            </div>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      {resumeData.summary && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            PROFESSIONAL SUMMARY
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {resumeData.summary}
          </p>
        </div>
      )}

      {/* Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            PROFESSIONAL EXPERIENCE
          </h3>
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-900">{exp.position}</h4>
                  <p className="text-blue-600 font-semibold">{exp.company}</p>
                  {exp.location && <p className="text-gray-600 text-sm">{exp.location}</p>}
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </div>
                </div>
              </div>
              {exp.achievements && exp.achievements.length > 0 && (
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-4">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i}>{achievement}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resumeData.education && resumeData.education.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            EDUCATION
          </h3>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                  <p className="text-blue-600">{edu.institution}</p>
                  {edu.field && <p className="text-gray-600 text-sm">{edu.field}</p>}
                </div>
                <div className="text-right text-sm text-gray-600">
                  {edu.gpa && <p>GPA: {edu.gpa}</p>}
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {resumeData.skills && resumeData.skills.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            TECHNICAL SKILLS
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {resumeData.skills.map((skill, index) => (
              <div key={index} className="text-gray-700 text-sm">
                • {skill.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {resumeData.projects && resumeData.projects.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            PROJECTS
          </h3>
          {resumeData.projects.map((project, index) => (
            <div key={index} className="mb-3">
              <h4 className="font-bold text-gray-900">{project.name}</h4>
              {project.description && (
                <p className="text-gray-700 text-sm">{project.description}</p>
              )}
              {project.technologies && (
                <p className="text-blue-600 text-sm mt-1">
                  Technologies: {project.technologies.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {resumeData.certifications && resumeData.certifications.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
            CERTIFICATIONS
          </h3>
          {resumeData.certifications.map((cert, index) => (
            <div key={index} className="mb-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">{cert.name}</span>
                <span className="text-gray-600 text-sm">{formatDate(cert.date)}</span>
              </div>
              {cert.issuer && <p className="text-blue-600 text-sm">{cert.issuer}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Modern Template
  const ModernTemplate = () => (
    <div className="bg-white text-black min-h-[297mm] w-[210mm] mx-auto font-sans">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-1/3 bg-gray-900 text-white p-6">
          {/* Profile */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {resumeData.contact?.fullName || 'Your Name'}
            </h1>
            {resumeData.headline && (
              <p className="text-blue-300 font-semibold text-sm">
                {resumeData.headline}
              </p>
            )}
          </div>

          {/* Contact */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-blue-300">CONTACT</h3>
            <div className="space-y-3 text-sm">
              {resumeData.contact?.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-blue-300" />
                  <span className="break-all">{resumeData.contact.email}</span>
                </div>
              )}
              {resumeData.contact?.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-blue-300" />
                  {resumeData.contact.phone}
                </div>
              )}
              {resumeData.contact?.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-3 text-blue-300" />
                  {resumeData.contact.location}
                </div>
              )}
              {resumeData.contact?.linkedin && (
                <div className="flex items-center">
                  <Linkedin className="h-4 w-4 mr-3 text-blue-300" />
                  <span className="text-xs">LinkedIn Profile</span>
                </div>
              )}
              {resumeData.contact?.github && (
                <div className="flex items-center">
                  <Github className="h-4 w-4 mr-3 text-blue-300" />
                  <span className="text-xs">GitHub Profile</span>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 text-blue-300">SKILLS</h3>
              <div className="space-y-2">
                {resumeData.skills.map((skill, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>{skill.name}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{ 
                          width: skill.proficiency === 'expert' ? '90%' : 
                                 skill.proficiency === 'advanced' ? '75%' : 
                                 skill.proficiency === 'intermediate' ? '60%' : '40%' 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {resumeData.languages && resumeData.languages.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4 text-blue-300">LANGUAGES</h3>
              <div className="space-y-2 text-sm">
                {resumeData.languages.map((lang, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{lang.name}</span>
                    <span className="text-blue-300">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="w-2/3 p-6">
          {/* Professional Summary */}
          {resumeData.summary && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
                PROFILE
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {resumeData.summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {resumeData.experience && resumeData.experience.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
                EXPERIENCE
              </h3>
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{exp.position}</h4>
                      <p className="text-blue-600 font-semibold">{exp.company}</p>
                      {exp.location && <p className="text-gray-600 text-sm">{exp.location}</p>}
                    </div>
                    <div className="text-right text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                      {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                    </div>
                  </div>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-4">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {resumeData.education && resumeData.education.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
                EDUCATION
              </h3>
              {resumeData.education.map((edu, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{edu.degree}</h4>
                      <p className="text-blue-600 font-semibold">{edu.institution}</p>
                      {edu.field && <p className="text-gray-600 text-sm">{edu.field}</p>}
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {edu.gpa && <p className="bg-gray-100 px-2 py-1 rounded mb-1">GPA: {edu.gpa}</p>}
                      <div className="bg-gray-100 px-2 py-1 rounded">
                        {formatDateRange(edu.startDate, edu.endDate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {resumeData.projects && resumeData.projects.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
                PROJECTS
              </h3>
              {resumeData.projects.map((project, index) => (
                <div key={index} className="mb-4">
                  <h4 className="text-lg font-bold text-gray-900">{project.name}</h4>
                  {project.description && (
                    <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                  )}
                  {project.technologies && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Creative Template
  const CreativeTemplate = () => (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 text-black min-h-[297mm] w-[210mm] mx-auto p-8 font-sans">
      {/* Header */}
      <div className="text-center mb-8 relative">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-2">
            {resumeData.contact?.fullName || 'Your Name'}
          </h1>
          {resumeData.headline && (
            <h2 className="text-xl font-light opacity-90">
              {resumeData.headline}
            </h2>
          )}
        </div>
        
        <div className="flex justify-center flex-wrap gap-4 mt-4 text-sm">
          {resumeData.contact?.email && (
            <div className="flex items-center bg-white px-3 py-2 rounded-full shadow">
              <Mail className="h-4 w-4 mr-2 text-purple-600" />
              {resumeData.contact.email}
            </div>
          )}
          {resumeData.contact?.phone && (
            <div className="flex items-center bg-white px-3 py-2 rounded-full shadow">
              <Phone className="h-4 w-4 mr-2 text-purple-600" />
              {resumeData.contact.phone}
            </div>
          )}
          {resumeData.contact?.location && (
            <div className="flex items-center bg-white px-3 py-2 rounded-full shadow">
              <MapPin className="h-4 w-4 mr-2 text-purple-600" />
              {resumeData.contact.location}
            </div>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      {resumeData.summary && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-bold text-purple-600 mb-4 text-center">
              About Me
            </h3>
            <p className="text-gray-700 leading-relaxed text-center">
              {resumeData.summary}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Experience */}
          {resumeData.experience && resumeData.experience.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-4 text-center">
                Experience
              </h3>
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <h4 className="font-bold text-gray-900">{exp.position}</h4>
                  <p className="text-purple-600 font-semibold">{exp.company}</p>
                  <p className="text-gray-600 text-sm">
                    {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                  </p>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <ul className="list-disc list-inside text-gray-700 text-sm mt-2 space-y-1">
                      {exp.achievements.slice(0, 2).map((achievement, i) => (
                        <li key={i}>{achievement}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-4 text-center">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, index) => (
                  <span key={index} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Education */}
          {resumeData.education && resumeData.education.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-4 text-center">
                Education
              </h3>
              {resumeData.education.map((edu, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                  <p className="text-purple-600 font-semibold">{edu.institution}</p>
                  {edu.field && <p className="text-gray-600 text-sm">{edu.field}</p>}
                  <p className="text-gray-600 text-sm">
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </p>
                  {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {resumeData.projects && resumeData.projects.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-2xl font-bold text-purple-600 mb-4 text-center">
                Projects
              </h3>
              {resumeData.projects.map((project, index) => (
                <div key={index} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                  <h4 className="font-bold text-gray-900">{project.name}</h4>
                  {project.description && (
                    <p className="text-gray-700 text-sm">{project.description}</p>
                  )}
                  {project.technologies && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.slice(0, 3).map((tech, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderTemplate = () => {
    switch (template) {
      case 'modern':
        return <ModernTemplate />
      case 'creative':
        return <CreativeTemplate />
      case 'professional':
      default:
        return <ProfessionalTemplate />
    }
  }

  return (
    <div ref={ref} className="resume-preview">
      {renderTemplate()}
    </div>
  )
})

ResumePreview.displayName = 'ResumePreview'

export default ResumePreview
