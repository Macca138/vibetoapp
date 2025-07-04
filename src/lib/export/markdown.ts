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

interface MarkdownGenerationResult {
  content: string;
  filename: string;
  metadata: {
    projectName: string;
    generatedAt: Date;
    totalSteps: number;
    completedSteps: number;
    wordCount: number;
  };
}

// Workflow step definitions
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

export async function generateProjectMarkdown(project: ProjectData): Promise<MarkdownGenerationResult> {
  try {
    const completedSteps = project.workflow?.responses.filter(r => r.completed).length || 0;
    const totalSteps = project.workflow?.responses.length || 0;
    const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const markdownContent = generateMarkdownContent(project, completedSteps, totalSteps, completionPercentage);
    
    // Count words (rough estimate)
    const wordCount = markdownContent.split(/\s+/).length;

    return {
      content: markdownContent,
      filename: `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.md`,
      metadata: {
        projectName: project.name,
        generatedAt: new Date(),
        totalSteps,
        completedSteps,
        wordCount,
      },
    };

  } catch (error) {
    console.error('Error generating Markdown:', error);
    throw new Error(`Failed to generate Markdown: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function generateMarkdownContent(
  project: ProjectData, 
  completedSteps: number, 
  totalSteps: number, 
  completionPercentage: number
): string {
  const content = `# ${project.name}

> **Project Report** - Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

---

## 📋 Project Overview

**Created by:** ${project.user.name || project.user.email}  
**Start Date:** ${project.createdAt.toLocaleDateString()}  
**Last Updated:** ${project.updatedAt.toLocaleDateString()}  
${project.workflow?.completedAt ? `**Completed:** ${project.workflow.completedAt.toLocaleDateString()}` : '**Status:** In Progress'}

${project.description ? `**Description:** ${project.description}\n` : ''}

### 📊 Progress Summary

- **Completion:** ${completionPercentage}% (${completedSteps}/${totalSteps} steps)
- **Current Step:** ${project.workflow?.currentStep || 'N/A'}
- **Status:** ${project.workflow?.isCompleted ? '✅ Completed' : '🔄 In Progress'}

${generateProgressBar(completionPercentage)}

---

## 🎯 Workflow Progress

${project.workflow?.responses.map(response => {
  const stepInfo = WORKFLOW_STEPS[response.stepId as keyof typeof WORKFLOW_STEPS] || {
    title: `Step ${response.stepId}`,
    description: ''
  };
  
  return generateStepMarkdown(response, stepInfo);
}).join('\n\n---\n\n') || 'No workflow data available.'}

---

## 📈 Summary

This project report contains **${totalSteps}** workflow steps with **${completedSteps}** completed, representing **${completionPercentage}%** progress toward completion.

${project.workflow?.isCompleted ? 
  '🎉 **Congratulations!** This project has been successfully completed.' : 
  `⏳ **Next Steps:** Continue with Step ${(project.workflow?.currentStep || 1)} to advance the project.`
}

---

*Generated by VibeToApp - AI-Powered Project Planning Platform*
`;

  return content;
}

function generateProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 5); // 20 chars total, so 5% per char
  const empty = 20 - filled;
  
  return `\`\`\`
Progress: [${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%
\`\`\``;
}

function generateStepMarkdown(response: any, stepInfo: { title: string; description: string }): string {
  const statusIcon = response.completed ? '✅' : '⏳';
  const statusText = response.completed ? 'Completed' : 'Pending';
  
  let stepContent = `### ${statusIcon} Step ${response.stepId}: ${stepInfo.title}

**Status:** ${statusText}  
**Description:** ${stepInfo.description}  
**Last Updated:** ${new Date(response.updatedAt).toLocaleDateString()}

`;

  if (response.completed && response.responses) {
    stepContent += `#### 📝 Responses\n\n`;
    stepContent += generateResponseMarkdown(response.responses);
  } else {
    stepContent += `> ⏳ This step has not been completed yet.\n`;
  }

  if (response.aiSuggestions) {
    stepContent += `\n#### 🤖 AI Suggestions\n\n`;
    stepContent += `> ${response.aiSuggestions.replace(/\n/g, '\n> ')}\n`;
  }

  return stepContent;
}

function generateResponseMarkdown(responses: any): string {
  if (!responses || typeof responses !== 'object') {
    return '> No response data available.\n';
  }

  return Object.entries(responses).map(([key, value]) => {
    if (!value) return '';
    
    const fieldLabel = key.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    let fieldValue = '';
    
    if (Array.isArray(value)) {
      fieldValue = value.map(item => `- ${item}`).join('\n');
    } else if (typeof value === 'object') {
      fieldValue = `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
    } else {
      fieldValue = String(value);
    }
    
    return `**${fieldLabel}:**\n${fieldValue}\n`;
  }).filter(Boolean).join('\n');
}

// Utility function to validate markdown content
export function validateMarkdownContent(content: string): boolean {
  try {
    // Basic validation checks
    if (!content || content.trim().length === 0) return false;
    if (!content.includes('#')) return false; // Should have at least one heading
    return true;
  } catch (error) {
    return false;
  }
}

// Utility function to get markdown metadata
export function getMarkdownMetadata(content: string): {
  headingCount: number;
  linkCount: number;
  imageCount: number;
  codeBlockCount: number;
} {
  const headingCount = (content.match(/^#+\s/gm) || []).length;
  const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
  const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;
  const codeBlockCount = (content.match(/```/g) || []).length / 2;

  return {
    headingCount,
    linkCount,
    imageCount,
    codeBlockCount: Math.floor(codeBlockCount),
  };
}