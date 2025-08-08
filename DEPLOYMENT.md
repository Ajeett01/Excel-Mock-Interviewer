# Deployment Guide - AI-Powered Excel Mock Interviewer

## Overview

This guide covers the deployment of the Excel Mock Interview platform with the Excel Mock Interviewer feature. The system requires several external services and specific configuration for optimal performance.

## Prerequisites

### Required Services
- **Vercel** (or similar hosting platform) - Application hosting
- **Supabase** - Database and authentication backend
- **Clerk** - User authentication and organization management
- **OpenAI** - AI-powered question generation and evaluation
- **Retell AI** - Voice interview capabilities

### System Requirements
- Node.js 18+ 
- Yarn package manager
- Modern web browser with WebRTC support
- Stable internet connection for real-time features

## Environment Configuration

### 1. Clone and Setup
```bash
git clone https://github.com/Excel Mock Interview/Excel Mock Interview.git
cd Excel Mock Interview
cp .env.example .env
yarn install
```

### 2. Database Setup (Supabase)

#### Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note your project URL and anon key
4. Go to SQL Editor and run the schema from `supabase_schema.sql`

#### Configure Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### Verify Tables
Ensure these Excel-specific tables are created:
- `excel_interviews`
- `excel_conceptual_questions`
- `excel_conceptual_responses`
- `excel_practical_tasks`
- `excel_task_submissions`
- `excel_evaluations`
- `excel_analytics`

### 3. Authentication Setup (Clerk)

#### Create Clerk Application
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Enable organizations in settings
4. Configure redirect URLs:
   - Sign-in: `/dashboard`
   - Sign-up: `/dashboard`
   - After sign-out: `/`

#### Configure Environment Variables
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_secret
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 4. AI Services Setup

#### OpenAI Configuration
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Set up billing and usage limits
3. Configure environment variable:
```env
OPENAI_API_KEY=sk-proj-your_openai_key
```

#### Retell AI Configuration
1. Create account at [Retell AI](https://retell.ai/)
2. Get API key from dashboard
3. Configure environment variable:
```env
RETELL_API_KEY=key_your_retell_key
```

### 5. Excel Interview Configuration

#### Basic Configuration
```env
EXCEL_INTERVIEW_TIMEOUT=3600000          # 1 hour timeout
EXCEL_MAX_TASKS_PER_LEVEL=5              # Max tasks per skill level
EXCEL_ENABLE_VOICE_RECORDING=true        # Enable voice features
EXCEL_AUTO_SAVE_INTERVAL=30000           # Auto-save every 30 seconds
EXCEL_EVALUATION_DELAY=2000              # 2 second evaluation delay
EXCEL_DEFAULT_SKILL_LEVEL=basic          # Default skill level
EXCEL_ENABLE_ANALYTICS=true              # Enable analytics
EXCEL_ENABLE_BENCHMARKING=true           # Enable benchmarking
```

#### Application URLs
```env
NEXT_PUBLIC_LIVE_URL=your-domain.com     # Production URL
```

## Build Configuration

### Next.js Configuration
The `next.config.js` file includes specific configuration for Luckysheet:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  transpilePackages: ['luckysheet'],
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;
```

### Package Dependencies
Ensure these Excel-specific dependencies are installed:
```json
{
  "dependencies": {
    "luckysheet": "^2.1.13",
    "@types/luckysheet": "^2.1.3"
  }
}
```

## Deployment Platforms

### Vercel Deployment (Recommended)

#### 1. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your GitHub repository
3. Configure build settings:
   - Framework: Next.js
   - Build Command: `yarn build`
   - Output Directory: `.next`

#### 2. Environment Variables
Add all environment variables from your `.env` file to Vercel:
1. Go to Project Settings → Environment Variables
2. Add each variable individually
3. Set appropriate environments (Production, Preview, Development)

#### 3. Domain Configuration
1. Add custom domain in Project Settings
2. Configure DNS records as instructed
3. Enable HTTPS (automatic with Vercel)

#### 4. Build Optimization
```javascript
// vercel.json (optional)
{
  "functions": {
    "pages/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"]
}
```

### Alternative Platforms

#### Netlify
```toml
# netlify.toml
[build]
  command = "yarn build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### Railway
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
```

## Database Migration

### Initial Setup
```sql
-- Run in Supabase SQL Editor
-- This creates all necessary tables and relationships
\i supabase_schema.sql
```

### Data Seeding (Optional)
```sql
-- Insert sample skill configurations
INSERT INTO excel_skill_configs (level, name, description, duration_minutes)
VALUES 
  ('basic', 'Basic Excel Skills', 'Fundamental operations', 20),
  ('intermediate', 'Intermediate Excel Skills', 'Advanced functions', 30),
  ('advanced', 'Advanced Excel Skills', 'Expert techniques', 45);
```

## Performance Optimization

### 1. Caching Strategy
```javascript
// next.config.js additions
const nextConfig = {
  // ... existing config
  headers: async () => [
    {
      source: '/api/excel-interviews/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=60, stale-while-revalidate=300',
        },
      ],
    },
  ],
};
```

### 2. Bundle Optimization
```javascript
// Optimize Luckysheet loading
const nextConfig = {
  // ... existing config
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['luckysheet'],
  },
};
```

### 3. Database Indexing
```sql
-- Add indexes for better performance
CREATE INDEX idx_excel_interviews_user_id ON excel_interviews(user_id);
CREATE INDEX idx_excel_interviews_created_at ON excel_interviews(created_at);
CREATE INDEX idx_excel_evaluations_interview_id ON excel_evaluations(excel_interview_id);
```

## Monitoring and Analytics

### 1. Application Monitoring
- **Vercel Analytics** - Built-in performance monitoring
- **Sentry** - Error tracking and performance monitoring
- **LogRocket** - Session replay and debugging

### 2. Database Monitoring
- **Supabase Dashboard** - Built-in database metrics
- **Custom Analytics** - Excel interview completion rates and performance

### 3. AI Usage Monitoring
- **OpenAI Usage Dashboard** - Token usage and costs
- **Custom Metrics** - Evaluation accuracy and response times

## Security Configuration

### 1. CORS Configuration
```javascript
// pages/api/excel-interviews/[...params].js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_LIVE_URL);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // ... rest of handler
}
```

### 2. Rate Limiting
```javascript
// lib/rate-limit.js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export default ratelimit;
```

### 3. Input Validation
```javascript
// lib/validation.js
import { z } from 'zod';

export const excelInterviewSchema = z.object({
  skillLevel: z.enum(['basic', 'intermediate', 'advanced']),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
});
```

## Troubleshooting

### Common Issues

#### 1. Luckysheet Not Loading
```javascript
// Check webpack configuration
// Ensure proper fallbacks are set
config.resolve.fallback = {
  fs: false,
  net: false,
  tls: false,
};
```

#### 2. Database Connection Issues
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/excel_interviews"
```

#### 3. OpenAI API Errors
```javascript
// Check API key and usage limits
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [...],
  max_tokens: 1000, // Ensure within limits
});
```

### Performance Issues

#### 1. Slow Spreadsheet Loading
- Optimize initial data size
- Implement lazy loading for large datasets
- Use CDN for Luckysheet assets

#### 2. High API Costs
- Implement response caching
- Optimize prompt lengths
- Use appropriate model tiers

#### 3. Database Query Optimization
- Add proper indexes
- Optimize query patterns
- Use connection pooling

## Maintenance

### Regular Tasks
1. **Monitor API Usage** - Check OpenAI and Retell AI usage
2. **Database Cleanup** - Archive old interview data
3. **Performance Review** - Monitor response times and error rates
4. **Security Updates** - Keep dependencies updated
5. **Backup Verification** - Ensure database backups are working

### Scaling Considerations
1. **Database Scaling** - Consider read replicas for high traffic
2. **CDN Implementation** - Use CDN for static assets
3. **Caching Layer** - Implement Redis for session data
4. **Load Balancing** - Consider multiple deployment regions

---

For additional support, refer to:
- [EXCEL_INTERVIEWER.md](EXCEL_INTERVIEWER.md) - Feature documentation
- [TESTING.md](TESTING.md) - Testing guidelines
- Platform-specific documentation for Vercel, Supabase, etc.