# Claude Development Context

## Critical Workflow Architecture Understanding

**IMPORTANT**: The workflow_step_prompts.md file contains the **internal system prompts** that power each step, NOT what users see.

### Correct Workflow Architecture:

1. **User Experience Layer**: Simple, clean interface where users answer questions and review outputs
2. **System Prompt Layer**: Sophisticated prompts (from workflow_step_prompts.md) that process user input behind the scenes
3. **Data Flow Layer**: Automatic handoff of validated outputs between steps

### How Each Step Works:

1. **User Input**: User answers simple questions (e.g., "Describe your app idea")
2. **Internal Processing**: System uses complex prompt from workflow_step_prompts.md to analyze and refine input
3. **User Output**: Show refined, structured output to user (project outline, specifications, etc.)
4. **User Validation**: "Are you happy with this analysis/output?"
5. **Data Handoff**: When confirmed, output automatically feeds into next step's system prompt

### Key Principles:

- **Hide Complexity**: Users never see the meta-prompting or system prompt generation
- **Progressive Refinement**: Each step builds on previous validated outputs
- **Proprietary Value**: The sophisticated system prompts are internal IP, not exposed to users
- **Seamless Flow**: Data flows automatically between steps when user confirms satisfaction

### Example Flow:
```
Step 1: User describes app idea → Prompt Generator system prompt processes it → Show refined project outline → User confirms → Refined outline feeds into Step 2

Step 2: Takes Step 1 output + user responses → SaaS Founder system prompt processes → Show detailed project spec → User confirms → Detailed spec feeds into Step 3

[Continue for all 9 steps]
```

### Implementation Requirements:

1. Each step component should use the corresponding system prompt from workflow_step_prompts.md
2. User interface shows only simple questions and clean outputs
3. System prompts remain hidden and proprietary
4. Implement confirmation mechanism before data handoff
5. Automatic data flow between steps when user validates output

**This architecture must be replicated for all 9 workflow steps.**

## Development Commands

Run tests: `npm test`
Run linting: `npm run lint`
Run type checking: `npm run typecheck`
Start development: `npm run dev`

## Database

PostgreSQL with Prisma ORM
Connection: localhost:5432/vibetoapp_dev

## APIs

Gemini 2.0 Flash for AI processing
Authentication via NextAuth.js with Google/GitHub providers
Stripe for payments