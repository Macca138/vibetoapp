import puppeteer from 'puppeteer';

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name?: string;
    email: string;
  };
  workflow?: {
    id: string;
    currentStep: number;
    isCompleted: boolean;
    completedAt?: Date;
    startedAt: Date;
    responses: {
      id: string;
      stepId: number;
      responses: any;
      completed: boolean;
      aiSuggestions?: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
  };
}

interface PDFGenerationResult {
  buffer: Buffer;
  filename: string;
  metadata: {
    projectName: string;
    generatedAt: Date;
    totalSteps: number;
    completedSteps: number;
  };
}

// Workflow step definitions for better PDF formatting
const WORKFLOW_STEPS = {
  1: { title: 'Project Vision & Goals', description: 'Define the core vision and objectives' },
  2: { title: 'Market Research & Analysis', description: 'Research target market and competition' },
  3: { title: 'User Personas & Journey Mapping', description: 'Define target users and their journey' },
  4: { title: 'Feature Prioritization', description: 'Prioritize features and functionality' },
  5: { title: 'Information Architecture', description: 'Structure content and navigation' },
  6: { title: 'Technical Architecture', description: 'Define technical requirements and stack' },
  7: { title: 'UI/UX Design Planning', description: 'Plan user interface and experience' },
  8: { title: 'Branding & Visual Identity', description: 'Define brand elements and visual style' },
  9: { title: 'Content Strategy', description: 'Plan content creation and management' },
  10: { title: 'Development Roadmap', description: 'Create development timeline and milestones' },
  11: { title: 'Testing Strategy', description: 'Plan testing approach and quality assurance' },
  12: { title: 'Launch Strategy', description: 'Plan product launch and go-to-market' },
  13: { title: 'Marketing & Growth', description: 'Define marketing and growth strategies' },
  14: { title: 'Analytics & KPIs', description: 'Set up tracking and success metrics' },
  15: { title: 'Risk Assessment', description: 'Identify and plan for potential risks' },
  16: { title: 'Resource Planning', description: 'Plan team and resource allocation' },
  17: { title: 'Final Review & Next Steps', description: 'Review progress and plan next actions' },
};

export async function generateProjectPDF(project: ProjectData): Promise<PDFGenerationResult> {
  let browser = null;
  
  try {
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    
    // Set page format and margins
    await page.setViewport({ width: 1200, height: 1600 });

    // Generate HTML content for the PDF
    const htmlContent = generatePDFHTML(project);
    
    // Set content and wait for fonts/images to load
    await page.setContent(htmlContent, { 
      waitUntil: ['networkidle0', 'domcontentloaded'] 
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          ${project.name} - Project Report
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
          Generated on ${new Date().toLocaleDateString()} | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
    });

    const completedSteps = project.workflow?.responses.filter(r => r.completed).length || 0;
    const totalSteps = project.workflow?.responses.length || 0;

    return {
      buffer: Buffer.from(pdfBuffer),
      filename: `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`,
      metadata: {
        projectName: project.name,
        generatedAt: new Date(),
        totalSteps,
        completedSteps,
      },
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generatePDFHTML(project: ProjectData): string {
  const completedSteps = project.workflow?.responses.filter(r => r.completed).length || 0;
  const totalSteps = project.workflow?.responses.length || 0;
  const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${project.name} - Project Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #6366f1;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .project-title {
          font-size: 2.5em;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 10px;
        }
        
        .project-meta {
          color: #6b7280;
          font-size: 1.1em;
        }
        
        .overview {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #6366f1;
        }
        
        .overview h2 {
          color: #1f2937;
          margin-bottom: 15px;
          font-size: 1.5em;
        }
        
        .progress-bar {
          background: #e5e7eb;
          height: 20px;
          border-radius: 10px;
          overflow: hidden;
          margin: 15px 0;
        }
        
        .progress-fill {
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          height: 100%;
          width: ${completionPercentage}%;
          transition: width 0.3s ease;
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        
        .stat {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-value {
          font-size: 2em;
          font-weight: bold;
          color: #6366f1;
        }
        
        .stat-label {
          color: #6b7280;
          font-size: 0.9em;
          margin-top: 5px;
        }
        
        .workflow-section {
          margin-top: 40px;
        }
        
        .section-title {
          font-size: 1.8em;
          color: #1f2937;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        
        .step {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .step-header {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          padding: 15px 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .step-title {
          font-size: 1.2em;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .step-description {
          color: #6b7280;
          font-size: 0.9em;
        }
        
        .step-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 500;
          margin-left: 10px;
        }
        
        .status-completed {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        .step-content {
          padding: 20px;
        }
        
        .response-field {
          margin-bottom: 15px;
        }
        
        .field-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 5px;
          display: block;
        }
        
        .field-value {
          color: #6b7280;
          background: #f9fafb;
          padding: 10px;
          border-radius: 4px;
          border-left: 3px solid #d1d5db;
        }
        
        .ai-suggestions {
          background: #ede9fe;
          border: 1px solid #c4b5fd;
          border-radius: 6px;
          padding: 15px;
          margin-top: 15px;
        }
        
        .ai-suggestions h4 {
          color: #5b21b6;
          margin-bottom: 10px;
          font-size: 1em;
        }
        
        .ai-suggestions-content {
          color: #6b46c1;
          font-size: 0.9em;
          line-height: 1.5;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 0.9em;
        }
        
        @media print {
          .step {
            page-break-inside: avoid;
          }
          
          .step-header {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="project-title">${project.name}</div>
          <div class="project-meta">
            Created by ${project.user.name || project.user.email} | 
            Started ${project.createdAt.toLocaleDateString()}
            ${project.workflow?.completedAt ? `| Completed ${project.workflow.completedAt.toLocaleDateString()}` : ''}
          </div>
        </div>

        <!-- Project Overview -->
        <div class="overview">
          <h2>Project Overview</h2>
          ${project.description ? `<p>${project.description}</p>` : ''}
          
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${completionPercentage}%</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat">
              <div class="stat-value">${completedSteps}</div>
              <div class="stat-label">Steps Done</div>
            </div>
            <div class="stat">
              <div class="stat-value">${totalSteps}</div>
              <div class="stat-label">Total Steps</div>
            </div>
          </div>
        </div>

        <!-- Workflow Steps -->
        <div class="workflow-section">
          <h2 class="section-title">Workflow Progress</h2>
          
          ${project.workflow?.responses.map(response => {
            const stepInfo = WORKFLOW_STEPS[response.stepId as keyof typeof WORKFLOW_STEPS] || {
              title: `Step ${response.stepId}`,
              description: ''
            };
            
            return `
              <div class="step">
                <div class="step-header">
                  <div class="step-title">
                    ${response.stepId}. ${stepInfo.title}
                    <span class="step-status ${response.completed ? 'status-completed' : 'status-pending'}">
                      ${response.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <div class="step-description">${stepInfo.description}</div>
                </div>
                
                <div class="step-content">
                  ${response.completed ? generateResponseFields(response.responses) : '<p>This step has not been completed yet.</p>'}
                  
                  ${response.aiSuggestions ? `
                    <div class="ai-suggestions">
                      <h4>AI Suggestions</h4>
                      <div class="ai-suggestions-content">${response.aiSuggestions}</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('') || '<p>No workflow data available.</p>'}
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Generated by VibeToApp on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>This report contains ${totalSteps} workflow steps with ${completedSteps} completed (${completionPercentage}% progress)</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateResponseFields(responses: any): string {
  if (!responses || typeof responses !== 'object') {
    return '<p>No response data available.</p>';
  }

  return Object.entries(responses).map(([key, value]) => {
    if (!value) return '';
    
    const fieldLabel = key.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    let fieldValue = '';
    
    if (Array.isArray(value)) {
      fieldValue = value.map(item => `• ${item}`).join('<br>');
    } else if (typeof value === 'object') {
      fieldValue = JSON.stringify(value, null, 2);
    } else {
      fieldValue = String(value);
    }
    
    return `
      <div class="response-field">
        <span class="field-label">${fieldLabel}:</span>
        <div class="field-value">${fieldValue}</div>
      </div>
    `;
  }).join('');
}