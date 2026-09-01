import { jsPDF } from 'jspdf';
import type { FullProfileData, CVVersion } from '../types/index.ts';

export interface PDFResumeOptions {
  template: 'classic-ats' | 'modern-clean' | 'executive';
  includeHighlightsOnly?: boolean;
  version?: CVVersion;
}

export function generatePDFResume(data: FullProfileData, options: PDFResumeOptions = { template: 'modern-clean' }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const profile = data.profile;
  const version = options.version;

  const headline = version?.customHeadline || profile.headline;
  const summary = version?.customSummary || profile.summary;

  // Filter items by version if provided
  let experiences = data.experiences;
  let projects = data.projects;
  let skills = data.skills;

  if (version) {
    if (version.selectedExperienceIds?.length) {
      experiences = data.experiences.filter(e => version.selectedExperienceIds.includes(e.id));
    }
    if (version.selectedProjectIds?.length) {
      projects = data.projects.filter(p => version.selectedProjectIds.includes(p.id));
    }
  }

  function checkPageBreak(requiredHeight: number) {
    if (cursorY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      return true;
    }
    return false;
  }

  // --- HEADER SECTION ---
  if (options.template === 'modern-clean') {
    // Modern Clean: Dark header accent box
    doc.setFillColor(24, 24, 27);
    doc.rect(0, 0, pageWidth, 90, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(profile.fullName, margin, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(200, 200, 210);
    doc.text(headline, margin, 54);

    // Contact info bar
    doc.setFontSize(8.5);
    doc.setTextColor(160, 160, 180);
    const contactLine = [
      profile.email,
      profile.phone,
      profile.location,
      `digitalcv.com/${data.profile.userId ? data.profile.fullName.toLowerCase().replace(/\s+/g, '') : 'profile'}`
    ].filter(Boolean).join('   •   ');
    doc.text(contactLine, margin, 74);

    cursorY = 110;
  } else {
    // Classic ATS / Executive: Minimal text header
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(profile.fullName.toUpperCase(), margin, cursorY);
    cursorY += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(headline, margin, cursorY);
    cursorY += 16;

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const contactLine = [profile.email, profile.phone, profile.location].filter(Boolean).join('  |  ');
    doc.text(contactLine, margin, cursorY);
    cursorY += 12;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.75);
    doc.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 16;
  }

  function renderSectionHeader(title: string) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), margin, cursorY);
    cursorY += 4;

    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(1.5);
    doc.line(margin, cursorY, margin + 40, cursorY);
    cursorY += 12;
  }

  // --- PROFESSIONAL SUMMARY ---
  if (summary) {
    renderSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const splitSummary = doc.splitTextToSize(summary, contentWidth);
    checkPageBreak(splitSummary.length * 11 + 10);
    doc.text(splitSummary, margin, cursorY);
    cursorY += splitSummary.length * 11 + 12;
  }

  // --- WORK EXPERIENCE ---
  if (experiences.length > 0) {
    renderSectionHeader('Work Experience');
    experiences.forEach(exp => {
      checkPageBreak(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(exp.role, margin, cursorY);

      // Date range right-aligned
      const dateStr = `${exp.startDate} – ${exp.isCurrent ? 'Present' : exp.endDate || 'N/A'}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), cursorY);
      cursorY += 12;

      // Company & Location
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`${exp.company}${exp.location ? ` — ${exp.location}` : ''}${exp.type === 'internship' ? ' (Internship)' : ''}`, margin, cursorY);
      cursorY += 12;

      // Description
      if (exp.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitDesc = doc.splitTextToSize(exp.description, contentWidth);
        checkPageBreak(splitDesc.length * 10.5);
        doc.text(splitDesc, margin, cursorY);
        cursorY += splitDesc.length * 10.5 + 4;
      }

      // Highlights
      if (exp.highlights && exp.highlights.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        exp.highlights.forEach(h => {
          const splitH = doc.splitTextToSize(`•  ${h}`, contentWidth - 10);
          checkPageBreak(splitH.length * 10);
          doc.text(splitH, margin + 8, cursorY);
          cursorY += splitH.length * 10 + 2;
        });
      }

      // Tech tags
      if (exp.technologies && exp.technologies.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(99, 102, 241);
        doc.text(`Technologies: ${exp.technologies.join(', ')}`, margin, cursorY + 2);
        cursorY += 12;
      }

      cursorY += 6;
    });
  }

  // --- PROJECTS ---
  if (projects.length > 0) {
    renderSectionHeader('Key Projects & Portfolio');
    projects.forEach(proj => {
      checkPageBreak(35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title, margin, cursorY);

      if (proj.githubUrl || proj.liveUrl) {
        const link = proj.liveUrl || proj.githubUrl || '';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text(link, pageWidth - margin - doc.getTextWidth(link), cursorY);
      }
      cursorY += 11;

      if (proj.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const splitDesc = doc.splitTextToSize(proj.description, contentWidth);
        checkPageBreak(splitDesc.length * 10);
        doc.text(splitDesc, margin, cursorY);
        cursorY += splitDesc.length * 10 + 4;
      }

      if (proj.technologies && proj.technologies.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Tech: ${proj.technologies.join(', ')}`, margin, cursorY);
        cursorY += 12;
      }
    });
  }

  // --- SKILLS MATRIX ---
  if (skills.length > 0) {
    renderSectionHeader('Technical Skills & Expertise');
    const categories: Record<string, string[]> = {};
    skills.forEach(s => {
      const cat = s.category ? s.category.charAt(0).toUpperCase() + s.category.slice(1) : 'Technical';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s.name);
    });

    Object.entries(categories).forEach(([cat, list]) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`${cat}: `, margin, cursorY);

      const labelWidth = doc.getTextWidth(`${cat}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitList = doc.splitTextToSize(list.join(', '), contentWidth - labelWidth);
      doc.text(splitList, margin + labelWidth, cursorY);
      cursorY += splitList.length * 10 + 4;
    });
    cursorY += 6;
  }

  // --- EDUCATION ---
  if (data.education.length > 0) {
    renderSectionHeader('Education');
    data.education.forEach(edu => {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`, margin, cursorY);

      const dateStr = `${edu.startDate} – ${edu.endDate || (edu.isCurrent ? 'Present' : '')}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), cursorY);
      cursorY += 11;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${edu.institution}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}${edu.honors ? ` | ${edu.honors}` : ''}`, margin, cursorY);
      cursorY += 14;
    });
  }

  // --- CERTIFICATIONS & ACHIEVEMENTS ---
  if (data.certifications.length > 0 || data.achievements.length > 0) {
    renderSectionHeader('Certifications & Achievements');
    data.certifications.forEach(c => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${c.name}`, margin, cursorY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(` — ${c.issuer} (${c.issueDate})`, margin + doc.getTextWidth(`• ${c.name}`), cursorY);
      cursorY += 12;
    });
    data.achievements.forEach(a => {
      checkPageBreak(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${a.title}`, margin, cursorY);
      if (a.description) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`: ${a.description}`, margin + doc.getTextWidth(`• ${a.title}`), cursorY);
      }
      cursorY += 12;
    });
  }

  const fileName = `${profile.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`;
  doc.save(fileName);
}
