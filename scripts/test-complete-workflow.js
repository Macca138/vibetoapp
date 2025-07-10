// Test complete 9-step workflow with authenticated user
const http = require('http');
const querystring = require('querystring');

// Session token from authenticated user - you'll need to get this from browser
const sessionToken = 'eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..mMSCr1c71lhyMIgs.X4qDO17gTtqiCZ48HWfn4N-wVwfKCOV20E1Tc9nb-hx7zZl7faAoz5-2xps1qAco1IR0598YSaqaVJ2GC8Of1-3Wk4K1OZRSJ_ArHv6zRUGk22E4i8zYTfDS50cAhoN83RQzaa6BAD3eRKGSWPoPRod86ERo773ZAlyuwOsHaeBD8n16oryXr9SrTlnxkI02SXc1JIi5yNfU57Bha7tJ9SDubhEhyEJYG2dMdouqXANVZ2xr14fAhCTvhplhSOilcD-uBmg.cdNXRId4JIo4coMuezA2mw';

async function testCompleteWorkflow() {
  console.log('🚀 Testing Complete 9-Step Workflow');
  console.log('====================================');

  // Step 1: Create a new project
  console.log('\n1. Creating new project...');
  const projectData = {
    name: `E2E Test Project ${Date.now()}`,
    description: 'End-to-end testing project for complete workflow'
  };

  const createProjectResponse = await makeAuthenticatedRequest(
    'POST',
    '/api/projects',
    JSON.stringify(projectData),
    {'Content-Type': 'application/json'}
  );

  console.log('Create Project Response:', createProjectResponse.status);
  
  if (createProjectResponse.status !== 200) {
    console.log('❌ Failed to create project');
    console.log('Response:', createProjectResponse.data);
    return;
  }

  const projectResponse = JSON.parse(createProjectResponse.data);
  const project = projectResponse.project;
  console.log('✅ Project created:', project.id);

  // Test workflow steps 1-9 with correct field names
  const workflowSteps = [
    {
      step: 1,
      name: 'Articulate Idea',
      data: {
        projectId: project.id,
        appIdea: 'A comprehensive habit tracking app that helps users build and maintain daily routines through gamification, social features, and AI-powered insights. The app will provide intuitive tracking, visual progress reports, and personalized recommendations to keep users motivated.',
        inspiration: 'Inspired by successful habit apps like Habitica and Streaks, but with enhanced AI features',
        problemSolving: 'Users struggle to maintain consistency with habit building due to lack of motivation, forgetting to track, and inability to see meaningful progress over time.'
      }
    },
    {
      step: 2,
      name: 'Define Target Audience',
      data: {
        projectId: project.id,
        valueProp: 'Comprehensive habit tracking with AI-powered insights and gamification',
        uniqueness: 'Combines habit tracking with AI coaching and social accountability features',
        coreFeatures: 'Habit creation, daily tracking, progress visualization, AI recommendations, social sharing'
      }
    },
    {
      step: 3,
      name: 'Market Research',
      data: {
        projectId: project.id,
        primaryAudience: 'Health-conscious young professionals aged 25-35 who want to build better daily routines',
        userProblems: 'Lack of consistency, forgetting to track habits, no meaningful progress feedback, lack of motivation',
        userBehavior: 'Use smartphones daily, interested in self-improvement, prefer gamified experiences',
        demographics: 'Age 25-35, college-educated, urban professionals, tech-savvy, health-conscious'
      }
    },
    {
      step: 4,
      name: 'Feature Planning',
      data: {
        projectId: project.id,
        mustHaveFeatures: 'Habit creation and editing, daily check-ins, progress tracking, basic statistics',
        niceToHaveFeatures: 'Social sharing, custom rewards, streak tracking, habit categories',
        advancedFeatures: 'AI coaching, predictive analytics, integration with health apps, team challenges',
        integrations: 'Apple Health, Google Fit, Fitbit, calendar apps, notification systems'
      }
    },
    {
      step: 5,
      name: 'User Experience Design',
      data: {
        projectId: project.id,
        userJourney: 'Onboarding -> Habit setup -> Daily tracking -> Progress review -> Goal adjustment',
        onboardingFlow: 'Welcome screen -> Goal setting -> First habit creation -> Tutorial walkthrough',
        navigationStructure: 'Tab-based navigation: Dashboard, Habits, Progress, Profile',
        keyInteractions: 'Swipe to complete habits, long press for details, pull to refresh, tap for quick actions'
      }
    },
    {
      step: 6,
      name: 'Technical Architecture',
      data: {
        projectId: project.id,
        platformChoice: ['iOS', 'Android'],
        techPreferences: 'React Native for cross-platform development, Node.js backend, PostgreSQL database',
        dataRequirements: 'User profiles, habit definitions, daily check-ins, progress metrics, AI model data',
        scalabilityNeeds: 'Support for 100K+ users, real-time sync, offline functionality',
        specialRequirements: 'Push notifications, data export, GDPR compliance, health data integration'
      }
    },
    {
      step: 7,
      name: 'Revenue Model',
      data: {
        projectId: project.id,
        revenueModel: 'Freemium with premium subscription model',
        pricingStrategy: 'Free basic features, $4.99/month premium, $49.99/year premium',
        targetRevenue: '$100K monthly recurring revenue within 18 months',
        monetizationTimeline: 'Launch free version, introduce premium after 3 months, scale to $100K MRR in 18 months'
      }
    },
    {
      step: 8,
      name: 'MVP Definition',
      data: {
        projectId: project.id,
        coreFeatures: ['Basic habit tracking', 'Simple progress view', 'Daily reminders', 'Streak counting'],
        timelinePreference: '3 months development, 1 month testing and refinement',
        successMetrics: ['100 DAU', '70% week 1 retention', '4.0+ app store rating', '20% conversion to premium'],
        launchStrategy: 'Soft launch with beta users, gather feedback, iterate, then public launch with marketing campaign'
      }
    },
    {
      step: 9,
      name: 'Export & Execute',
      data: {
        projectId: project.id,
        documentFormat: ['PDF', 'Markdown'],
        nextSteps: ['Begin development', 'Set up analytics', 'Plan beta testing', 'Create marketing materials'],
        timeline: '4 months total: 3 months development, 1 month testing and launch preparation',
        preferredApproach: 'Agile development with weekly sprints, continuous user feedback, iterative improvements'
      }
    }
  ];

  // Test each workflow step
  for (const stepData of workflowSteps) {
    console.log(`\n${stepData.step}. Testing ${stepData.name}...`);
    
    const response = await makeAuthenticatedRequest(
      'POST',
      `/api/workflow/step${stepData.step}`,
      JSON.stringify(stepData.data),
      {'Content-Type': 'application/json'}
    );

    console.log(`Step ${stepData.step} Response:`, response.status);
    
    if (response.status === 200) {
      console.log(`✅ Step ${stepData.step} completed`);
    } else {
      console.log(`❌ Step ${stepData.step} failed`);
      console.log('Response:', response.data);
    }
  }

  console.log('\n🎉 Complete workflow test finished!');
}

function makeAuthenticatedRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Test Script',
        'Cookie': `next-auth.session-token=${sessionToken}`,
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

testCompleteWorkflow().catch(console.error);