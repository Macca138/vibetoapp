import { WorkflowStep } from './types';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: 'Describe Your Idea',
    description: 'Start with a simple description of your app idea, no matter how vague or rough.',
    prompt: 'Tell us about your app idea. What problem does it solve? What inspired you to think of this idea?',
    aiPrompt: 'Help the user refine and clarify their app idea description. Ask follow-up questions to better understand their vision.',
    fields: [
      {
        id: 'appIdea',
        type: 'textarea',
        label: 'Describe your app idea',
        placeholder: 'I want to create an app that...',
        required: true,
        minLength: 50,
        maxLength: 1000,
        helpText: 'Don\'t worry about being perfect - just describe what you have in mind!'
      },
      {
        id: 'inspiration',
        type: 'textarea',
        label: 'What inspired this idea?',
        placeholder: 'I noticed this problem when...',
        maxLength: 500,
        helpText: 'Share the story behind your idea'
      },
      {
        id: 'problemSolving',
        type: 'textarea',
        label: 'What problem does it solve?',
        placeholder: 'This app will help people...',
        required: true,
        maxLength: 500,
        helpText: 'Focus on the main problem your app addresses'
      }
    ]
  },
  {
    id: 2,
    title: 'Define Core Purpose',
    description: 'AI helps you clarify the main problem your app solves and its core value proposition.',
    prompt: 'Let\'s define what makes your app unique and valuable to users.',
    aiPrompt: 'Help the user define a clear value proposition and identify their app\'s unique selling points.',
    fields: [
      {
        id: 'valueProp',
        type: 'textarea',
        label: 'What is your app\'s main value proposition?',
        placeholder: 'My app provides unique value by...',
        required: true,
        maxLength: 300,
        helpText: 'In one clear sentence, what makes your app valuable?'
      },
      {
        id: 'uniqueness',
        type: 'textarea',
        label: 'What makes your app different from existing solutions?',
        placeholder: 'Unlike other apps, mine will...',
        required: true,
        maxLength: 500,
        helpText: 'Focus on your competitive advantages'
      },
      {
        id: 'coreFeatures',
        type: 'textarea',
        label: 'What are the 3 most important features?',
        placeholder: '1. Feature one\n2. Feature two\n3. Feature three',
        required: true,
        maxLength: 400,
        helpText: 'List the essential features that deliver your core value'
      }
    ]
  },
  {
    id: 3,
    title: 'Identify Target Users',
    description: 'Discover and define your ideal users with AI-powered persona generation.',
    prompt: 'Who will use your app? Let\'s create detailed user personas.',
    aiPrompt: 'Help the user identify and define their target audience with detailed user personas.',
    fields: [
      {
        id: 'primaryAudience',
        type: 'textarea',
        label: 'Who is your primary target audience?',
        placeholder: 'My main users are...',
        required: true,
        maxLength: 300,
        helpText: 'Describe your ideal user in detail'
      },
      {
        id: 'userProblems',
        type: 'textarea',
        label: 'What problems do they currently face?',
        placeholder: 'These users struggle with...',
        required: true,
        maxLength: 500,
        helpText: 'What pain points does your audience experience?'
      },
      {
        id: 'userBehavior',
        type: 'textarea',
        label: 'How do they currently solve these problems?',
        placeholder: 'Right now, they use...',
        maxLength: 400,
        helpText: 'What alternatives do they use today?'
      },
      {
        id: 'demographics',
        type: 'textarea',
        label: 'What are their key demographics?',
        placeholder: 'Age range, occupation, tech-savviness...',
        maxLength: 300,
        helpText: 'Age, profession, technical skills, etc.'
      }
    ]
  },
  {
    id: 4,
    title: 'Feature Discovery',
    description: 'Brainstorm and prioritize features that deliver maximum value to your users.',
    prompt: 'Let\'s explore all the features your app could have and prioritize them.',
    aiPrompt: 'Help the user brainstorm comprehensive features and prioritize them based on user value and implementation complexity.',
    fields: [
      {
        id: 'mustHaveFeatures',
        type: 'textarea',
        label: 'Must-have features (MVP)',
        placeholder: '• Feature 1\n• Feature 2\n• Feature 3',
        required: true,
        maxLength: 600,
        helpText: 'Essential features for your minimum viable product'
      },
      {
        id: 'niceToHaveFeatures',
        type: 'textarea',
        label: 'Nice-to-have features',
        placeholder: '• Additional feature 1\n• Additional feature 2',
        maxLength: 600,
        helpText: 'Features to add after your MVP is successful'
      },
      {
        id: 'advancedFeatures',
        type: 'textarea',
        label: 'Advanced/future features',
        placeholder: '• Advanced feature 1\n• Future enhancement',
        maxLength: 600,
        helpText: 'Long-term vision features'
      },
      {
        id: 'integrations',
        type: 'textarea',
        label: 'What integrations do you need?',
        placeholder: 'Social media, payment processors, APIs...',
        maxLength: 400,
        helpText: 'Third-party services your app should connect with'
      }
    ]
  },
  {
    id: 5,
    title: 'User Flow Mapping',
    description: 'Create intuitive user journeys and interaction flows for seamless experiences.',
    prompt: 'Let\'s map out how users will navigate through your app.',
    aiPrompt: 'Help the user design intuitive user flows and identify all the steps users take to accomplish their goals.',
    fields: [
      {
        id: 'userJourney',
        type: 'textarea',
        label: 'Describe the main user journey',
        placeholder: '1. User opens app\n2. User signs up\n3. User...',
        required: true,
        maxLength: 800,
        helpText: 'Step-by-step flow from app open to goal completion'
      },
      {
        id: 'onboardingFlow',
        type: 'textarea',
        label: 'How will you onboard new users?',
        placeholder: 'Tutorial, walkthrough, sample data...',
        required: true,
        maxLength: 500,
        helpText: 'How will first-time users learn to use your app?'
      },
      {
        id: 'navigationStructure',
        type: 'textarea',
        label: 'What will your main navigation look like?',
        placeholder: 'Home, Dashboard, Profile, Settings...',
        required: true,
        maxLength: 400,
        helpText: 'Main menu items and app structure'
      },
      {
        id: 'keyInteractions',
        type: 'textarea',
        label: 'What are the key user interactions?',
        placeholder: 'Tap to create, swipe to delete, search...',
        maxLength: 500,
        helpText: 'Important gestures and interactions'
      }
    ]
  },
  {
    id: 6,
    title: 'Technical Architecture',
    description: 'Get AI recommendations for tech stack, integrations, and system design.',
    prompt: 'Let\'s determine the technical requirements and architecture for your app.',
    aiPrompt: 'Provide technical recommendations for the app\'s architecture, tech stack, and infrastructure based on the requirements.',
    fields: [
      {
        id: 'platformChoice',
        type: 'multiselect',
        label: 'Which platforms do you want to target?',
        required: true,
        options: ['iOS', 'Android', 'Web App', 'Desktop'],
        helpText: 'Choose all platforms you want to support'
      },
      {
        id: 'techPreferences',
        type: 'textarea',
        label: 'Do you have any technology preferences?',
        placeholder: 'React Native, Flutter, specific databases...',
        maxLength: 400,
        helpText: 'Any specific technologies you prefer or want to avoid?'
      },
      {
        id: 'dataRequirements',
        type: 'textarea',
        label: 'What data will your app store?',
        placeholder: 'User profiles, posts, images, messages...',
        required: true,
        maxLength: 500,
        helpText: 'Types of data your app needs to handle'
      },
      {
        id: 'scalabilityNeeds',
        type: 'select',
        label: 'Expected user scale',
        required: true,
        options: ['Less than 1,000 users', '1,000 - 10,000 users', '10,000 - 100,000 users', '100,000+ users'],
        helpText: 'How many users do you expect in the first year?'
      },
      {
        id: 'specialRequirements',
        type: 'textarea',
        label: 'Any special technical requirements?',
        placeholder: 'Real-time features, offline support, heavy computations...',
        maxLength: 400,
        helpText: 'Performance, security, or feature requirements'
      }
    ]
  },
  {
    id: 7,
    title: 'Revenue Model',
    description: 'Explore monetization strategies tailored to your app and target market.',
    prompt: 'How will your app generate revenue? Let\'s explore different monetization strategies.',
    aiPrompt: 'Help the user choose the most appropriate monetization strategy based on their app type and target audience.',
    fields: [
      {
        id: 'revenueModel',
        type: 'multiselect',
        label: 'Which revenue models interest you?',
        required: true,
        options: [
          'Freemium (Free with premium features)',
          'Subscription (Monthly/yearly)',
          'One-time purchase',
          'In-app purchases',
          'Advertising',
          'Commission/Transaction fees',
          'Enterprise/B2B sales'
        ],
        helpText: 'Select all models you\'re considering'
      },
      {
        id: 'pricingStrategy',
        type: 'textarea',
        label: 'What pricing are you considering?',
        placeholder: '$9.99/month, $99/year, $2.99 one-time...',
        maxLength: 300,
        helpText: 'Rough pricing ideas for your monetization'
      },
      {
        id: 'valueJustification',
        type: 'textarea',
        label: 'Why would users pay for your app?',
        placeholder: 'Users will pay because it saves them time...',
        required: true,
        maxLength: 500,
        helpText: 'What value justifies the cost to users?'
      },
      {
        id: 'competitorPricing',
        type: 'textarea',
        label: 'How do competitors price their solutions?',
        placeholder: 'Similar apps charge $5-15/month...',
        maxLength: 400,
        helpText: 'Research on existing market pricing'
      }
    ]
  },
  {
    id: 8,
    title: 'MVP Definition',
    description: 'Define your minimum viable product with clear milestones and priorities.',
    prompt: 'Let\'s define what your MVP should include and create a development roadmap.',
    aiPrompt: 'Help the user define a realistic MVP scope and create a development timeline with clear milestones.',
    fields: [
      {
        id: 'mvpScope',
        type: 'textarea',
        label: 'What will be included in your MVP?',
        placeholder: 'Core features for version 1.0...',
        required: true,
        maxLength: 600,
        helpText: 'Minimum features needed to validate your concept'
      },
      {
        id: 'successMetrics',
        type: 'textarea',
        label: 'How will you measure MVP success?',
        placeholder: 'User signups, engagement rate, revenue...',
        required: true,
        maxLength: 400,
        helpText: 'Key metrics to track your app\'s performance'
      },
      {
        id: 'developmentTimeline',
        type: 'textarea',
        label: 'What\'s your target timeline?',
        placeholder: '3 months for MVP, 6 months for full launch...',
        maxLength: 300,
        helpText: 'Realistic timeline for development and launch'
      },
      {
        id: 'launchStrategy',
        type: 'textarea',
        label: 'How will you launch and promote your app?',
        placeholder: 'Beta testing, social media, app store optimization...',
        maxLength: 500,
        helpText: 'Your go-to-market strategy'
      },
      {
        id: 'postLaunchPlans',
        type: 'textarea',
        label: 'What are your post-launch plans?',
        placeholder: 'Feature updates, user feedback implementation...',
        maxLength: 400,
        helpText: 'How will you iterate after launch?'
      }
    ]
  },
  {
    id: 9,
    title: 'Export & Execute',
    description: 'Export your complete app specification in multiple formats ready for development.',
    prompt: 'Congratulations! Let\'s package everything into actionable documentation.',
    aiPrompt: 'Generate comprehensive documentation and next steps based on all the user\'s responses.',
    fields: [
      {
        id: 'documentFormat',
        type: 'multiselect',
        label: 'Which formats would you like to export?',
        required: true,
        options: [
          'PDF Report',
          'Developer Requirements Doc',
          'Business Plan Summary',
          'User Stories',
          'Technical Specifications',
          'Pitch Deck Outline'
        ],
        helpText: 'Choose all formats you need'
      },
      {
        id: 'nextSteps',
        type: 'select',
        label: 'What\'s your next step?',
        required: true,
        options: [
          'Find a developer/team',
          'Learn to code myself',
          'Seek funding/investment',
          'Create a prototype',
          'Validate with users',
          'Refine the concept more'
        ],
        helpText: 'What will you do with this specification?'
      },
      {
        id: 'additionalHelp',
        type: 'multiselect',
        label: 'What additional help do you need?',
        options: [
          'Finding developers',
          'Cost estimation',
          'Legal/IP advice',
          'Marketing strategy',
          'Funding guidance',
          'Technical mentorship'
        ],
        helpText: 'Areas where you\'d like more support'
      },
      {
        id: 'feedback',
        type: 'textarea',
        label: 'How was your VibeToApp experience?',
        placeholder: 'This process helped me...',
        maxLength: 500,
        helpText: 'Share your thoughts on this workflow'
      }
    ]
  }
];

export const getWorkflowStep = (stepId: number): WorkflowStep | undefined => {
  return WORKFLOW_STEPS.find(step => step.id === stepId);
};

export const getTotalSteps = (): number => {
  return WORKFLOW_STEPS.length;
};

export const getNextStepId = (currentStepId: number): number | null => {
  if (currentStepId >= WORKFLOW_STEPS.length) return null;
  return currentStepId + 1;
};

export const getPreviousStepId = (currentStepId: number): number | null => {
  if (currentStepId <= 1) return null;
  return currentStepId - 1;
};