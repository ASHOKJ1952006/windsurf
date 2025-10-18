const Resume = require('../models/Resume');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// @desc    Get all user resumes
// @route   GET /api/resumes
// @access  Private
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      count: resumes.length,
      resumes
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Check ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume'
      });
    }
    
    // Increment view count
    resume.viewCount += 1;
    await resume.save();
    
    res.json({
      success: true,
      resume
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create resume
// @route   POST /api/resumes
// @access  Private
exports.createResume = async (req, res) => {
  try {
    const resumeData = {
      ...req.body,
      user: req.user.id
    };
    
    const resume = await Resume.create(resumeData);
    
    // Calculate initial scores
    resume.calculateATSScore();
    resume.generateKeywords();
    await resume.save();
    
    res.status(201).json({
      success: true,
      resume
    });
  } catch (error) {
    console.error('Create resume error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update resume
// @route   PUT /api/resumes/:id
// @access  Private
exports.updateResume = async (req, res) => {
  try {
    let resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Check ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this resume'
      });
    }
    
    resume = await Resume.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Recalculate scores
    resume.calculateATSScore();
    resume.generateKeywords();
    await resume.save();
    
    res.json({
      success: true,
      resume
    });
  } catch (error) {
    console.error('Update resume error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Check ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resume'
      });
    }
    
    await resume.deleteOne();
    
    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Generate AI suggestions
// @route   POST /api/resumes/:id/ai-suggestions
// @access  Private
exports.generateAISuggestions = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Check ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Generate suggestions
    const suggestions = {
      summary: [],
      experience: [],
      skills: [],
      general: []
    };
    
    // Summary suggestions
    if (!resume.summary || resume.summary.length < 100) {
      suggestions.summary.push('Add a professional summary (150-200 words) highlighting your key skills and achievements');
    }
    
    if (resume.summary && !resume.summary.toLowerCase().includes(resume.targetRole?.toLowerCase())) {
      suggestions.summary.push(`Include your target role "${resume.targetRole}" in your summary`);
    }
    
    // Experience suggestions
    resume.experience.forEach((exp, index) => {
      if (!exp.achievements || exp.achievements.length === 0) {
        suggestions.experience.push(`Add quantifiable achievements to "${exp.position}" role`);
      }
      
      if (exp.achievements && exp.achievements.some(a => !(/\d/.test(a)))) {
        suggestions.experience.push(`Add metrics and numbers to achievements in "${exp.position}"`);
      }
    });
    
    // Skills suggestions
    if (resume.skills.length < 8) {
      suggestions.skills.push('Add more relevant skills (aim for 10-15 skills)');
    }
    
    const technicalSkills = resume.skills.filter(s => s.category === 'technical');
    if (technicalSkills.length === 0) {
      suggestions.skills.push('Add technical skills relevant to your field');
    }
    
    // General ATS suggestions
    if (resume.contact.linkedin) {
      suggestions.general.push('✓ LinkedIn profile included - good for ATS');
    } else {
      suggestions.general.push('Add your LinkedIn profile URL');
    }
    
    if (resume.skills.length >= 10) {
      suggestions.general.push('✓ Strong skills section for ATS optimization');
    }
    
    // Calculate scores
    const atsScore = resume.calculateATSScore();
    resume.generateKeywords();
    
    // Generate improvement recommendations
    const improvements = [];
    
    if (atsScore < 70) {
      improvements.push('Increase ATS score by adding more quantifiable achievements');
      improvements.push('Use industry-standard job titles and keywords');
      improvements.push('Include relevant certifications and technical skills');
    }
    
    resume.aiSuggestions.improvements = improvements;
    await resume.save();
    
    res.json({
      success: true,
      suggestions,
      atsScore,
      keywords: resume.aiSuggestions.keywords,
      improvements
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export resume as PDF
// @route   GET /api/resumes/:id/export/pdf
// @access  Private
exports.exportPDF = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Check ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.title.replace(/\s+/g, '_')}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Header - Name and Contact
    doc.fontSize(24).font('Helvetica-Bold').text(resume.contact.fullName, { align: 'center' });
    doc.moveDown(0.5);
    
    // Contact Info
    const contactInfo = [
      resume.contact.email,
      resume.contact.phone,
      resume.contact.location
    ].filter(Boolean).join(' | ');
    
    doc.fontSize(10).font('Helvetica').text(contactInfo, { align: 'center' });
    
    const links = [
      resume.contact.linkedin,
      resume.contact.github,
      resume.contact.portfolio
    ].filter(Boolean).join(' | ');
    
    if (links) {
      doc.fontSize(9).text(links, { align: 'center', color: '#2563eb' });
    }
    
    doc.moveDown(1.5);
    
    // Professional Summary
    if (resume.summary) {
      doc.fontSize(14).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(resume.summary, { align: 'justify' });
      doc.moveDown(1);
    }
    
    // Experience
    if (resume.experience.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('EXPERIENCE');
      doc.moveDown(0.5);
      
      resume.experience.forEach((exp) => {
        doc.fontSize(12).font('Helvetica-Bold').text(exp.position);
        doc.fontSize(11).font('Helvetica').text(`${exp.company} | ${exp.location || ''}`);
        
        const startDate = new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const endDate = exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        doc.fontSize(10).text(`${startDate} - ${endDate}`);
        doc.moveDown(0.5);
        
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach((achievement) => {
            doc.fontSize(10).font('Helvetica').text(`• ${achievement}`, { indent: 20 });
          });
        }
        
        doc.moveDown(1);
      });
    }
    
    // Education
    if (resume.education.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('EDUCATION');
      doc.moveDown(0.5);
      
      resume.education.forEach((edu) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`${edu.degree} ${edu.field ? `in ${edu.field}` : ''}`);
        doc.fontSize(10).font('Helvetica').text(edu.institution);
        if (edu.gpa) {
          doc.text(`GPA: ${edu.gpa}`);
        }
        doc.moveDown(0.8);
      });
    }
    
    // Skills
    if (resume.skills.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('SKILLS');
      doc.moveDown(0.5);
      
      const skillsByCategory = {};
      resume.skills.forEach(skill => {
        if (!skillsByCategory[skill.category]) {
          skillsByCategory[skill.category] = [];
        }
        skillsByCategory[skill.category].push(skill.name);
      });
      
      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`${category.charAt(0).toUpperCase() + category.slice(1)}: `, { continued: true });
        doc.font('Helvetica').text(skills.join(', '));
        doc.moveDown(0.5);
      });
    }
    
    // Certifications
    if (resume.certifications.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').text('CERTIFICATIONS');
      doc.moveDown(0.5);
      
      resume.certifications.forEach((cert) => {
        doc.fontSize(10).font('Helvetica').text(`• ${cert.name} - ${cert.issuer}`, { indent: 20 });
      });
    }
    
    // Finalize PDF
    doc.end();
    
    // Update download count
    resume.downloadCount += 1;
    resume.lastExportedAt = new Date();
    await resume.save();
    
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export resume as DOCX
// @route   GET /api/resumes/:id/export/docx
// @access  Private
exports.exportDOCX = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Check ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const sections = [];
    
    // Name and contact
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.contact.fullName,
            bold: true,
            size: 32
          })
        ],
        alignment: 'center'
      })
    );
    
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${resume.contact.email} | ${resume.contact.phone || ''} | ${resume.contact.location || ''}`,
            size: 20
          })
        ],
        alignment: 'center',
        spacing: { after: 200 }
      })
    );
    
    // Summary
    if (resume.summary) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'PROFESSIONAL SUMMARY',
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 200, after: 100 }
        })
      );
      
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resume.summary,
              size: 22
            })
          ],
          spacing: { after: 200 }
        })
      );
    }
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    });
    
    // Generate and send
    const buffer = await Packer.toBuffer(doc);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.title.replace(/\s+/g, '_')}.docx"`);
    res.send(buffer);
    
    // Update download count
    resume.downloadCount += 1;
    resume.lastExportedAt = new Date();
    await resume.save();
    
  } catch (error) {
    console.error('Export DOCX error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export resume as plain text
// @route   GET /api/resumes/:id/export/txt
// @access  Private
exports.exportTXT = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }
    
    // Check ownership
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    let text = '';
    
    // Header
    text += `${resume.contact.fullName}\n`;
    text += `${resume.contact.email} | ${resume.contact.phone || ''} | ${resume.contact.location || ''}\n`;
    if (resume.contact.linkedin) text += `LinkedIn: ${resume.contact.linkedin}\n`;
    text += '\n';
    
    // Summary
    if (resume.summary) {
      text += 'PROFESSIONAL SUMMARY\n';
      text += '='.repeat(50) + '\n';
      text += `${resume.summary}\n\n`;
    }
    
    // Experience
    if (resume.experience.length > 0) {
      text += 'EXPERIENCE\n';
      text += '='.repeat(50) + '\n';
      
      resume.experience.forEach((exp) => {
        text += `${exp.position}\n`;
        text += `${exp.company} | ${exp.location || ''}\n`;
        const startDate = new Date(exp.startDate).toLocaleDateString();
        const endDate = exp.current ? 'Present' : new Date(exp.endDate).toLocaleDateString();
        text += `${startDate} - ${endDate}\n`;
        
        if (exp.achievements) {
          exp.achievements.forEach((achievement) => {
            text += `• ${achievement}\n`;
          });
        }
        text += '\n';
      });
    }
    
    // Education
    if (resume.education.length > 0) {
      text += 'EDUCATION\n';
      text += '='.repeat(50) + '\n';
      
      resume.education.forEach((edu) => {
        text += `${edu.degree} ${edu.field ? `in ${edu.field}` : ''}\n`;
        text += `${edu.institution}\n`;
        if (edu.gpa) text += `GPA: ${edu.gpa}\n`;
        text += '\n';
      });
    }
    
    // Skills
    if (resume.skills.length > 0) {
      text += 'SKILLS\n';
      text += '='.repeat(50) + '\n';
      text += resume.skills.map(s => s.name).join(', ') + '\n\n';
    }
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.title.replace(/\s+/g, '_')}.txt"`);
    res.send(text);
    
    // Update download count
    resume.downloadCount += 1;
    resume.lastExportedAt = new Date();
    await resume.save();
    
  } catch (error) {
    console.error('Export TXT error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
