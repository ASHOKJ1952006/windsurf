const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a certificate PDF
 * @param {Object} certificateData - Certificate details
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateCertificatePDF = async (certificateData) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        studentName,
        courseName,
        completedAt,
        certificateId,
        grade,
        instructorName
      } = certificateData;

      // Create a new PDF document in landscape mode
      const doc = new PDFDocument({
        size: [842, 595], // A4 landscape (width x height in points)
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Colors
      const primaryColor = '#3b82f6'; // Blue
      const goldColor = '#f59e0b';
      const darkGray = '#1f2937';
      const lightGray = '#6b7280';

      // Add decorative border
      doc.lineWidth(10);
      doc.strokeColor(primaryColor);
      doc.rect(20, 20, 802, 555).stroke();
      
      doc.lineWidth(3);
      doc.strokeColor(goldColor);
      doc.rect(30, 30, 782, 535).stroke();

      // Add decorative corner elements
      const cornerSize = 40;
      doc.lineWidth(2);
      doc.strokeColor(primaryColor);
      
      // Top-left corner
      doc.moveTo(40, 60).lineTo(40, 40).lineTo(60, 40).stroke();
      // Top-right corner
      doc.moveTo(802, 60).lineTo(802, 40).lineTo(782, 40).stroke();
      // Bottom-left corner
      doc.moveTo(40, 535).lineTo(40, 555).lineTo(60, 555).stroke();
      // Bottom-right corner
      doc.moveTo(802, 535).lineTo(802, 555).lineTo(782, 555).stroke();

      // Add E-learn branding/logo at top
      doc.fontSize(32)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text('E-LEARN', 0, 70, { align: 'center' });

      doc.fontSize(12)
        .fillColor(lightGray)
        .font('Helvetica')
        .text('Online Learning Platform', 0, 110, { align: 'center' });

      // Add decorative line
      doc.moveTo(300, 140)
        .lineTo(542, 140)
        .strokeColor(goldColor)
        .lineWidth(2)
        .stroke();

      // Certificate title
      doc.fontSize(28)
        .fillColor(darkGray)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', 0, 160, { align: 'center' });

      // "This is to certify that"
      doc.fontSize(14)
        .fillColor(lightGray)
        .font('Helvetica')
        .text('This is to certify that', 0, 210, { align: 'center' });

      // Student name (highlighted)
      doc.fontSize(26)
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .text(studentName, 0, 240, { align: 'center' });

      // Add underline for name
      const nameWidth = doc.widthOfString(studentName);
      const centerX = 421; // Half of 842
      doc.moveTo(centerX - nameWidth / 2, 270)
        .lineTo(centerX + nameWidth / 2, 270)
        .strokeColor(goldColor)
        .lineWidth(1)
        .stroke();

      // "has successfully completed"
      doc.fontSize(14)
        .fillColor(lightGray)
        .font('Helvetica')
        .text('has successfully completed the course', 0, 290, { align: 'center' });

      // Course name
      doc.fontSize(22)
        .fillColor(darkGray)
        .font('Helvetica-Bold')
        .text(courseName, 100, 325, { 
          align: 'center',
          width: 642
      });

      // Grade/Achievement (if provided)
      if (grade) {
        doc.fontSize(12)
          .fillColor(goldColor)
          .font('Helvetica-Bold')
          .text(`Grade: ${grade}`, 0, 380, { align: 'center' });
      }

      // Completion date
      const formattedDate = new Date(completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.fontSize(12)
        .fillColor(lightGray)
        .font('Helvetica')
        .text(`Awarded on ${formattedDate}`, 0, 410, { align: 'center' });

      // Add signature lines at bottom
      const signatureY = 470;
      
      // Left signature (Instructor)
      doc.moveTo(120, signatureY)
        .lineTo(280, signatureY)
        .strokeColor(darkGray)
        .lineWidth(1)
        .stroke();
      
      doc.fontSize(11)
        .fillColor(darkGray)
        .font('Helvetica-Bold')
        .text(instructorName || 'Course Instructor', 120, signatureY + 10, {
          width: 160,
          align: 'center'
        });
      
      doc.fontSize(9)
        .fillColor(lightGray)
        .font('Helvetica')
        .text('Instructor', 120, signatureY + 28, {
          width: 160,
          align: 'center'
        });

      // Right signature (Platform)
      doc.moveTo(562, signatureY)
        .lineTo(722, signatureY)
        .strokeColor(darkGray)
        .lineWidth(1)
        .stroke();
      
      doc.fontSize(11)
        .fillColor(darkGray)
        .font('Helvetica-Bold')
        .text('E-Learn Platform', 562, signatureY + 10, {
          width: 160,
          align: 'center'
        });
      
      doc.fontSize(9)
        .fillColor(lightGray)
        .font('Helvetica')
        .text('Platform Director', 562, signatureY + 28, {
          width: 160,
          align: 'center'
        });

      // Add certificate ID at bottom
      doc.fontSize(8)
        .fillColor(lightGray)
        .font('Helvetica')
        .text(`Certificate ID: ${certificateId}`, 0, 540, { align: 'center' });

      // Add decorative award icon (using text emoji or symbol)
      doc.fontSize(40)
        .fillColor(goldColor)
        .text('🏆', 0, 430, { align: 'center' });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateCertificatePDF
};
