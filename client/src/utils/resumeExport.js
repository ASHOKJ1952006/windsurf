// Resume Export Utilities
// This file provides comprehensive export functionality for resumes

/**
 * Export resume as PDF using browser's print functionality
 * This is a fallback method that works without external dependencies
 */
export const exportAsPDF = (resumeData, template = 'professional') => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      
      if (!printWindow) {
        reject(new Error('Failed to open print window. Please allow popups.'))
        return
      }

      // Generate HTML content for the resume
      const htmlContent = generateResumeHTML(resumeData, template)
      
      // Write content to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${resumeData.title || 'Resume'}</title>
          <meta charset="UTF-8">
          <style>
            ${getResumeCSS(template)}
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `)
      
      printWindow.document.close()
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
          resolve('PDF export initiated')
        }, 500)
      }
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Export resume as image using HTML5 Canvas
 * This method captures the resume as a PNG image
 */
export const exportAsImage = (elementRef, filename = 'resume') => {
  return new Promise((resolve, reject) => {
    try {
      if (!elementRef || !elementRef.current) {
        reject(new Error('Resume element not found'))
        return
      }

      // Use html2canvas if available, otherwise use fallback
      if (window.html2canvas) {
        window.html2canvas(elementRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794, // A4 width in pixels at 96 DPI
          height: 1123 // A4 height in pixels at 96 DPI
        }).then(canvas => {
          // Create download link
          const link = document.createElement('a')
          link.download = `${filename}.png`
          link.href = canvas.toDataURL('image/png')
          
          // Trigger download
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          resolve('Image exported successfully')
        }).catch(reject)
      } else {
        // Fallback: Use browser's built-in screenshot capability
        exportAsImageFallback(elementRef, filename)
          .then(resolve)
          .catch(reject)
      }
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Fallback image export using browser screenshot API
 */
const exportAsImageFallback = (elementRef, filename) => {
  return new Promise((resolve, reject) => {
    try {
      // This is a simplified fallback - in a real implementation,
      // you might want to use a server-side screenshot service
      const element = elementRef.current
      
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size to A4 proportions
      canvas.width = 794
      canvas.height = 1123
      
      // Fill with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add text indicating this is a fallback
      ctx.fillStyle = '#333333'
      ctx.font = '16px Arial'
      ctx.fillText('Resume Export (Install html2canvas for better quality)', 50, 50)
      ctx.fillText('Use Print to PDF for best results', 50, 80)
      
      // Create download link
      const link = document.createElement('a')
      link.download = `${filename}.png`
      link.href = canvas.toDataURL('image/png')
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      resolve('Fallback image exported')
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Export resume as JSON for backup/sharing
 */
export const exportAsJSON = (resumeData, filename = 'resume-data') => {
  return new Promise((resolve, reject) => {
    try {
      const dataStr = JSON.stringify(resumeData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `${filename}.json`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(link.href)
      resolve('JSON exported successfully')
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Export resume as plain text
 */
export const exportAsText = (resumeData, filename = 'resume') => {
  return new Promise((resolve, reject) => {
    try {
      const textContent = generateResumeText(resumeData)
      const dataBlob = new Blob([textContent], { type: 'text/plain' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `${filename}.txt`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(link.href)
      resolve('Text file exported successfully')
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate HTML content for resume
 */
const generateResumeHTML = (resumeData, template) => {
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

  let html = `
    <div class="resume-container">
      <header class="resume-header">
        <h1>${resumeData.contact?.fullName || 'Your Name'}</h1>
        ${resumeData.headline ? `<h2 class="headline">${resumeData.headline}</h2>` : ''}
        <div class="contact-info">
          ${resumeData.contact?.email ? `<span>📧 ${resumeData.contact.email}</span>` : ''}
          ${resumeData.contact?.phone ? `<span>📞 ${resumeData.contact.phone}</span>` : ''}
          ${resumeData.contact?.location ? `<span>📍 ${resumeData.contact.location}</span>` : ''}
          ${resumeData.contact?.linkedin ? `<span>💼 LinkedIn</span>` : ''}
          ${resumeData.contact?.github ? `<span>🔗 GitHub</span>` : ''}
        </div>
      </header>
  `

  // Professional Summary
  if (resumeData.summary) {
    html += `
      <section class="resume-section">
        <h3>Professional Summary</h3>
        <p>${resumeData.summary}</p>
      </section>
    `
  }

  // Experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    html += `
      <section class="resume-section">
        <h3>Professional Experience</h3>
        ${resumeData.experience.map(exp => `
          <div class="experience-item">
            <div class="experience-header">
              <div>
                <h4>${exp.position}</h4>
                <p class="company">${exp.company}</p>
                ${exp.location ? `<p class="location">${exp.location}</p>` : ''}
              </div>
              <div class="date-range">
                ${formatDateRange(exp.startDate, exp.endDate, exp.current)}
              </div>
            </div>
            ${exp.achievements && exp.achievements.length > 0 ? `
              <ul class="achievements">
                ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('')}
      </section>
    `
  }

  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    html += `
      <section class="resume-section">
        <h3>Education</h3>
        ${resumeData.education.map(edu => `
          <div class="education-item">
            <div class="education-header">
              <div>
                <h4>${edu.degree}</h4>
                <p class="institution">${edu.institution}</p>
                ${edu.field ? `<p class="field">${edu.field}</p>` : ''}
              </div>
              <div class="date-range">
                ${edu.gpa ? `GPA: ${edu.gpa}<br>` : ''}
                ${formatDateRange(edu.startDate, edu.endDate)}
              </div>
            </div>
          </div>
        `).join('')}
      </section>
    `
  }

  // Skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    html += `
      <section class="resume-section">
        <h3>Technical Skills</h3>
        <div class="skills-grid">
          ${resumeData.skills.map(skill => `<span class="skill-tag">${skill.name}</span>`).join('')}
        </div>
      </section>
    `
  }

  // Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    html += `
      <section class="resume-section">
        <h3>Projects</h3>
        ${resumeData.projects.map(project => `
          <div class="project-item">
            <h4>${project.name}</h4>
            ${project.description ? `<p>${project.description}</p>` : ''}
            ${project.technologies ? `<p class="technologies">Technologies: ${project.technologies.join(', ')}</p>` : ''}
          </div>
        `).join('')}
      </section>
    `
  }

  html += '</div>'
  return html
}

/**
 * Generate CSS styles for resume templates
 */
const getResumeCSS = (template) => {
  const baseCSS = `
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background: white;
    }
    
    .resume-container {
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
      padding: 0.5in;
    }
    
    .resume-header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .resume-header h1 {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }
    
    .headline {
      font-size: 1.25rem;
      color: #2563eb;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }
    
    .contact-info {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.9rem;
      color: #6b7280;
    }
    
    .resume-section {
      margin-bottom: 1.5rem;
      page-break-inside: avoid;
    }
    
    .resume-section h3 {
      font-size: 1.25rem;
      font-weight: bold;
      color: #1f2937;
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 0.25rem;
      margin-bottom: 1rem;
    }
    
    .experience-item, .education-item, .project-item {
      margin-bottom: 1rem;
      page-break-inside: avoid;
    }
    
    .experience-header, .education-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    
    .experience-header h4, .education-header h4 {
      font-size: 1.1rem;
      font-weight: bold;
      margin: 0;
      color: #1f2937;
    }
    
    .company, .institution {
      color: #2563eb;
      font-weight: 600;
      margin: 0.25rem 0;
    }
    
    .location, .field {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0;
    }
    
    .date-range {
      text-align: right;
      font-size: 0.9rem;
      color: #6b7280;
      white-space: nowrap;
    }
    
    .achievements {
      margin: 0.5rem 0 0 1rem;
      padding: 0;
    }
    
    .achievements li {
      margin-bottom: 0.25rem;
      color: #4b5563;
    }
    
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .skill-tag {
      background: #f3f4f6;
      color: #374151;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      border: 1px solid #d1d5db;
    }
    
    .technologies {
      color: #2563eb;
      font-size: 0.9rem;
      font-style: italic;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .resume-container {
        box-shadow: none;
        margin: 0;
        padding: 0;
      }
    }
  `

  // Add template-specific styles
  switch (template) {
    case 'modern':
      return baseCSS + `
        .resume-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 0.5rem;
          border: none;
        }
        
        .resume-header h1 {
          color: white;
        }
        
        .headline {
          color: #e0e7ff;
        }
        
        .contact-info {
          color: #e0e7ff;
        }
      `
    
    case 'creative':
      return baseCSS + `
        .resume-container {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          padding: 2rem;
          border-radius: 1rem;
        }
        
        .resume-section {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .resume-header {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
      `
    
    default:
      return baseCSS
  }
}

/**
 * Generate plain text version of resume
 */
const generateResumeText = (resumeData) => {
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

  let text = ''
  
  // Header
  text += `${resumeData.contact?.fullName || 'Your Name'}\n`
  text += '='.repeat((resumeData.contact?.fullName || 'Your Name').length) + '\n\n'
  
  if (resumeData.headline) {
    text += `${resumeData.headline}\n\n`
  }
  
  // Contact Information
  text += 'CONTACT INFORMATION\n'
  text += '-------------------\n'
  if (resumeData.contact?.email) text += `Email: ${resumeData.contact.email}\n`
  if (resumeData.contact?.phone) text += `Phone: ${resumeData.contact.phone}\n`
  if (resumeData.contact?.location) text += `Location: ${resumeData.contact.location}\n`
  if (resumeData.contact?.linkedin) text += `LinkedIn: ${resumeData.contact.linkedin}\n`
  if (resumeData.contact?.github) text += `GitHub: ${resumeData.contact.github}\n`
  text += '\n'
  
  // Professional Summary
  if (resumeData.summary) {
    text += 'PROFESSIONAL SUMMARY\n'
    text += '-------------------\n'
    text += `${resumeData.summary}\n\n`
  }
  
  // Experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    text += 'PROFESSIONAL EXPERIENCE\n'
    text += '----------------------\n'
    resumeData.experience.forEach(exp => {
      text += `${exp.position} at ${exp.company}\n`
      if (exp.location) text += `${exp.location}\n`
      text += `${formatDateRange(exp.startDate, exp.endDate, exp.current)}\n`
      if (exp.achievements && exp.achievements.length > 0) {
        exp.achievements.forEach(achievement => {
          text += `• ${achievement}\n`
        })
      }
      text += '\n'
    })
  }
  
  // Education
  if (resumeData.education && resumeData.education.length > 0) {
    text += 'EDUCATION\n'
    text += '---------\n'
    resumeData.education.forEach(edu => {
      text += `${edu.degree}\n`
      text += `${edu.institution}\n`
      if (edu.field) text += `${edu.field}\n`
      if (edu.gpa) text += `GPA: ${edu.gpa}\n`
      text += `${formatDateRange(edu.startDate, edu.endDate)}\n\n`
    })
  }
  
  // Skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    text += 'TECHNICAL SKILLS\n'
    text += '---------------\n'
    text += resumeData.skills.map(skill => skill.name).join(', ') + '\n\n'
  }
  
  // Projects
  if (resumeData.projects && resumeData.projects.length > 0) {
    text += 'PROJECTS\n'
    text += '--------\n'
    resumeData.projects.forEach(project => {
      text += `${project.name}\n`
      if (project.description) text += `${project.description}\n`
      if (project.technologies) text += `Technologies: ${project.technologies.join(', ')}\n`
      text += '\n'
    })
  }
  
  return text
}

/**
 * Check if html2canvas is available
 */
export const isHtml2CanvasAvailable = () => {
  return typeof window !== 'undefined' && window.html2canvas
}

/**
 * Load html2canvas dynamically
 */
export const loadHtml2Canvas = () => {
  return new Promise((resolve, reject) => {
    if (isHtml2CanvasAvailable()) {
      resolve(window.html2canvas)
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    script.onload = () => {
      if (window.html2canvas) {
        resolve(window.html2canvas)
      } else {
        reject(new Error('Failed to load html2canvas'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load html2canvas'))
    document.head.appendChild(script)
  })
}
