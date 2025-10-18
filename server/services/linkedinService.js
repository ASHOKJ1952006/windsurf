/**
 * LinkedIn Export Service
 * 
 * LinkedIn doesn't provide a direct API for updating profiles programmatically.
 * Instead, this service generates formatted data that users can copy-paste to LinkedIn.
 * 
 * For enterprise solutions, you would need to apply for LinkedIn Partner Program.
 */

class LinkedInService {
  /**
   * Format experience for LinkedIn
   */
  formatExperience(experience) {
    return experience.map(exp => {
      const startDate = exp.startDate ? new Date(exp.startDate) : null;
      const endDate = exp.current ? null : (exp.endDate ? new Date(exp.endDate) : null);
      
      return {
        title: exp.position,
        company: exp.company,
        location: exp.location,
        startDate: startDate ? {
          month: startDate.getMonth() + 1,
          year: startDate.getFullYear()
        } : null,
        endDate: endDate ? {
          month: endDate.getMonth() + 1,
          year: endDate.getFullYear()
        } : null,
        current: exp.current,
        description: exp.description,
        achievements: exp.achievements?.join('\n• ') || ''
      };
    });
  }

  /**
   * Format education for LinkedIn
   */
  formatEducation(education) {
    return education.map(edu => {
      const startDate = edu.startDate ? new Date(edu.startDate) : null;
      const endDate = edu.endDate ? new Date(edu.endDate) : null;
      
      return {
        school: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.field,
        startDate: startDate ? {
          month: startDate.getMonth() + 1,
          year: startDate.getFullYear()
        } : null,
        endDate: endDate ? {
          month: endDate.getMonth() + 1,
          year: endDate.getFullYear()
        } : null,
        grade: edu.gpa,
        activities: edu.achievements?.join(', ') || ''
      };
    });
  }

  /**
   * Format skills for LinkedIn
   */
  formatSkills(skills) {
    return skills
      .filter(skill => skill.showInPortfolio)
      .map(skill => ({
        name: skill.name,
        endorsements: skill.endorsed ? 'Endorsed' : ''
      }));
  }

  /**
   * Format certifications for LinkedIn
   */
  formatCertifications(certifications, certificates) {
    return certifications.map(cert => {
      const certData = certificates.find(c => c._id.toString() === cert.certificate?.toString());
      
      return {
        name: cert.customTitle || certData?.courseName || 'Certification',
        organization: certData?.issuedBy || 'E-Learning Platform',
        issueDate: certData?.issuedAt ? {
          month: new Date(certData.issuedAt).getMonth() + 1,
          year: new Date(certData.issuedAt).getFullYear()
        } : null,
        credentialId: certData?.certificateId,
        credentialUrl: certData?.pdfUrl,
        description: cert.customDescription
      };
    });
  }

  /**
   * Format projects for LinkedIn
   */
  formatProjects(projects) {
    return projects
      .filter(project => project.visibility === 'public')
      .map(project => ({
        name: project.title,
        description: project.description,
        url: project.demoUrl || project.githubUrl,
        startDate: project.startDate ? {
          month: new Date(project.startDate).getMonth() + 1,
          year: new Date(project.startDate).getFullYear()
        } : null,
        endDate: project.endDate ? {
          month: new Date(project.endDate).getMonth() + 1,
          year: new Date(project.endDate).getFullYear()
        } : null
      }));
  }

  /**
   * Generate LinkedIn profile text format
   */
  generateProfileText(portfolio, user, certificates = []) {
    let text = '';

    // Headline
    if (portfolio.hero?.subtitle) {
      text += `HEADLINE:\n${portfolio.hero.subtitle}\n\n`;
    }

    // About/Summary
    if (portfolio.about?.bio || portfolio.about?.longBio) {
      text += `ABOUT:\n${portfolio.about.longBio || portfolio.about.bio}\n\n`;
    }

    // Experience
    if (portfolio.experience?.length > 0) {
      text += `EXPERIENCE:\n`;
      text += '=' .repeat(50) + '\n\n';
      
      portfolio.experience.forEach((exp, index) => {
        text += `${index + 1}. ${exp.position}\n`;
        text += `   Company: ${exp.company}\n`;
        if (exp.location) text += `   Location: ${exp.location}\n`;
        
        const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
        const endDate = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
        text += `   Duration: ${startDate} - ${endDate}\n`;
        
        if (exp.description) text += `   \n   ${exp.description}\n`;
        
        if (exp.achievements?.length > 0) {
          text += `   \n   Key Achievements:\n`;
          exp.achievements.forEach(achievement => {
            text += `   • ${achievement}\n`;
          });
        }
        text += '\n';
      });
      text += '\n';
    }

    // Education
    if (portfolio.education?.length > 0) {
      text += `EDUCATION:\n`;
      text += '=' .repeat(50) + '\n\n';
      
      portfolio.education.forEach((edu, index) => {
        text += `${index + 1}. ${edu.degree}${edu.field ? ` in ${edu.field}` : ''}\n`;
        text += `   Institution: ${edu.institution}\n`;
        
        const startDate = edu.startDate ? new Date(edu.startDate).getFullYear() : '';
        const endDate = edu.endDate ? new Date(edu.endDate).getFullYear() : '';
        if (startDate || endDate) {
          text += `   Duration: ${startDate} - ${endDate}\n`;
        }
        
        if (edu.gpa) text += `   GPA: ${edu.gpa}\n`;
        text += '\n';
      });
      text += '\n';
    }

    // Skills
    if (portfolio.skills?.length > 0) {
      text += `SKILLS:\n`;
      text += '=' .repeat(50) + '\n';
      
      const skillsByCategory = {};
      portfolio.skills
        .filter(s => s.showInPortfolio)
        .forEach(skill => {
          const category = skill.category || 'other';
          if (!skillsByCategory[category]) {
            skillsByCategory[category] = [];
          }
          skillsByCategory[category].push(skill.name);
        });
      
      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        text += `\n${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
        text += skills.join(', ') + '\n';
      });
      text += '\n\n';
    }

    // Certifications
    if (portfolio.certifications?.length > 0 && certificates.length > 0) {
      text += `CERTIFICATIONS:\n`;
      text += '=' .repeat(50) + '\n\n';
      
      portfolio.certifications.forEach((cert, index) => {
        const certData = certificates.find(c => c._id.toString() === cert.certificate?.toString());
        if (certData) {
          text += `${index + 1}. ${certData.courseName}\n`;
          text += `   Issued by: ${certData.issuedBy || 'E-Learning Platform'}\n`;
          text += `   Date: ${new Date(certData.issuedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}\n`;
          if (certData.certificateId) text += `   Credential ID: ${certData.certificateId}\n`;
          text += '\n';
        }
      });
      text += '\n';
    }

    return text;
  }

  /**
   * Generate JSON format for programmatic use
   */
  generateExportData(portfolio, user, certificates = []) {
    return {
      profile: {
        firstName: user.name?.split(' ')[0],
        lastName: user.name?.split(' ').slice(1).join(' '),
        headline: portfolio.hero?.subtitle || '',
        summary: portfolio.about?.longBio || portfolio.about?.bio || '',
        location: portfolio.about?.location || '',
        email: user.email,
        phone: portfolio.social?.phone || '',
        website: portfolio.social?.website || '',
      },
      experience: this.formatExperience(portfolio.experience || []),
      education: this.formatEducation(portfolio.education || []),
      skills: this.formatSkills(portfolio.skills || []),
      certifications: this.formatCertifications(portfolio.certifications || [], certificates),
      projects: this.formatProjects(portfolio.projects || []),
      socialLinks: {
        linkedin: portfolio.social?.linkedin,
        github: portfolio.social?.github,
        twitter: portfolio.social?.twitter,
        website: portfolio.social?.website
      }
    };
  }

  /**
   * Generate CSV format for bulk import
   */
  generateCSV(portfolio, user, certificates = []) {
    const data = this.generateExportData(portfolio, user, certificates);
    
    // This is a simplified CSV generation
    // In production, use a proper CSV library
    let csv = '';
    
    // Skills CSV
    csv += 'SKILLS\n';
    csv += 'Name,Category,Proficiency\n';
    data.skills.forEach(skill => {
      csv += `"${skill.name}","${skill.category || 'technical'}","${skill.proficiency || ''}"\n`;
    });
    csv += '\n';
    
    // Experience CSV
    csv += 'EXPERIENCE\n';
    csv += 'Title,Company,Location,Start Date,End Date,Description\n';
    data.experience.forEach(exp => {
      const startDate = exp.startDate ? `${exp.startDate.month}/${exp.startDate.year}` : '';
      const endDate = exp.current ? 'Present' : (exp.endDate ? `${exp.endDate.month}/${exp.endDate.year}` : '');
      csv += `"${exp.title}","${exp.company}","${exp.location || ''}","${startDate}","${endDate}","${exp.description || ''}"\n`;
    });
    
    return csv;
  }
}

module.exports = new LinkedInService();
