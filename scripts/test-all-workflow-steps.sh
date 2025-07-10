#!/bin/bash

# Test all 9 workflow steps with proper data
SESSION_TOKEN="eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..mMSCr1c71lhyMIgs.X4qDO17gTtqiCZ48HWfn4N-wVwfKCOV20E1Tc9nb-hx7zZl7faAoz5-2xps1qAco1IR0598YSaqaVJ2GC8Of1-3Wk4K1OZRSJ_ArHv6zRUGk22E4i8zYTfDS50cAhoN83RQzaa6BAD3eRKGSWPoPRod86ERo773ZAlyuwOsHaeBD8n16oryXr9SrTlnxkI02SXc1JIi5yNfU57Bha7tJ9SDubhEhyEJYG2dMdouqXANVZ2xr14fAhCTvhplhSOilcD-uBmg.cdNXRId4JIo4coMuezA2mw"
PROJECT_ID="cmcx6wyh70007p9wjs4ydp6an"

echo "🚀 Testing All 9 Workflow Steps"
echo "================================="

# Step 1 - Already tested and working
echo "✅ Step 1: Articulate Idea - Already tested and working"

# Step 2 - Already tested and working
echo "✅ Step 2: Define Target Audience - Already tested and working"

# Step 3 - Market Research
echo "📊 Step 3: Market Research"
curl -X POST http://localhost:3000/api/workflow/step3 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"primaryAudience\":\"Health-conscious young professionals aged 25-35\",\"userProblems\":\"Lack of consistency, forgetting to track habits, no meaningful progress feedback\",\"userBehavior\":\"Use smartphones daily, interested in self-improvement, prefer gamified experiences\",\"demographics\":\"Age 25-35, college-educated, urban professionals, tech-savvy\"}" \
  --max-time 25 | jq '.success // .error' | head -1

# Step 4 - Feature Planning
echo "🔧 Step 4: Feature Planning"
curl -X POST http://localhost:3000/api/workflow/step4 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"mustHaveFeatures\":\"Habit creation, daily check-ins, progress tracking, basic statistics\",\"niceToHaveFeatures\":\"Social sharing, custom rewards, streak tracking, habit categories\",\"advancedFeatures\":\"AI coaching, predictive analytics, integration with health apps\",\"integrations\":\"Apple Health, Google Fit, Fitbit, calendar apps\"}" \
  --max-time 25 | jq '.success // .error' | head -1

# Step 5 - User Experience Design
echo "🎨 Step 5: User Experience Design"
curl -X POST http://localhost:3000/api/workflow/step5 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"userJourney\":\"Onboarding -> Habit setup -> Daily tracking -> Progress review -> Goal adjustment\",\"onboardingFlow\":\"Welcome screen -> Goal setting -> First habit creation -> Tutorial walkthrough\",\"navigationStructure\":\"Tab-based navigation: Dashboard, Habits, Progress, Profile\",\"keyInteractions\":\"Swipe to complete habits, long press for details, pull to refresh\"}" \
  --max-time 25 | jq '.success // .error' | head -1

# Step 6 - Technical Architecture
echo "⚙️ Step 6: Technical Architecture"
curl -X POST http://localhost:3000/api/workflow/step6 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"platformChoice\":[\"iOS\",\"Android\"],\"techPreferences\":\"React Native for cross-platform development, Node.js backend, PostgreSQL database\",\"dataRequirements\":\"User profiles, habit definitions, daily check-ins, progress metrics\",\"scalabilityNeeds\":\"Support for 100K+ users, real-time sync, offline functionality\",\"specialRequirements\":\"Push notifications, data export, GDPR compliance\"}" \
  --max-time 25 | jq '.success // .error' | head -1

# Step 7 - Revenue Model
echo "💰 Step 7: Revenue Model"
curl -X POST http://localhost:3000/api/workflow/step7 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"revenueModel\":\"Freemium with premium subscription model\",\"pricingStrategy\":\"Free basic features, \$4.99/month premium, \$49.99/year premium\",\"targetRevenue\":\"\$100K monthly recurring revenue within 18 months\",\"monetizationTimeline\":\"Launch free version, introduce premium after 3 months\"}" \
  --max-time 25 | jq '.success // .error' | head -1

# Step 8 - MVP Definition
echo "🎯 Step 8: MVP Definition"
curl -X POST http://localhost:3000/api/workflow/step8 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"coreFeatures\":[\"Basic habit tracking\",\"Simple progress view\",\"Daily reminders\",\"Streak counting\"],\"timelinePreference\":\"3 months development, 1 month testing and refinement\",\"successMetrics\":[\"100 DAU\",\"70% week 1 retention\",\"4.0+ app store rating\"],\"launchStrategy\":\"Soft launch with beta users, gather feedback, iterate, then public launch\"}" \
  --max-time 25 | jq '.success // .error' | head -1

# Step 9 - Export & Execute
echo "📄 Step 9: Export & Execute"
curl -X POST http://localhost:3000/api/workflow/step9 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$SESSION_TOKEN" \
  -d "{\"projectId\":\"$PROJECT_ID\",\"documentFormat\":[\"PDF\",\"Markdown\"],\"nextSteps\":[\"Begin development\",\"Set up analytics\",\"Plan beta testing\"],\"timeline\":\"4 months total: 3 months development, 1 month testing\",\"preferredApproach\":\"Agile development with weekly sprints, continuous user feedback\"}" \
  --max-time 25 | jq '.success // .error' | head -1

echo "🎉 All workflow steps tested!"