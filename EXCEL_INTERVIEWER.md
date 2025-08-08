# AI-Powered Excel Mock Interviewer

## Overview

The AI-Powered Excel Mock Interviewer is a comprehensive assessment system that evaluates candidates' Microsoft Excel skills through a combination of conceptual questions and hands-on practical tasks. The system provides real-time feedback, detailed analytics, and personalized improvement recommendations.

## Features

### 🎯 Core Capabilities
- **5-State Interview Flow**: Structured progression through introduction, conceptual questions, practical tasks, feedback generation, and conclusion
- **Dual Assessment Model**: Combines voice-based conceptual evaluation with hands-on spreadsheet tasks
- **Skill Level Configuration**: Configurable assessments for basic, intermediate, and advanced Excel proficiency
- **Real-time Evaluation**: AI-powered assessment of both conceptual responses and practical work
- **Comprehensive Analytics**: Multi-layered feedback system with benchmarking and improvement plans
- **Interactive Spreadsheet**: Embedded Luckysheet component for authentic Excel-like experience

### 📊 Assessment Areas
- **Conceptual Knowledge**: Formulas, functions, data analysis concepts, best practices
- **Practical Skills**: Formula creation, data manipulation, chart creation, pivot tables
- **Efficiency Metrics**: Task completion time, approach optimization, workflow analysis
- **Best Practices**: Data organization, formula structure, error handling

## Architecture

### Database Schema
The system extends the existing database with Excel-specific tables:

```sql
-- Core Excel interview table
CREATE TABLE excel_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id),
  skill_level excel_skill_level NOT NULL,
  current_state excel_interview_state DEFAULT 'introduction',
  -- ... additional fields
);

-- Conceptual questions and responses
CREATE TABLE excel_conceptual_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  excel_interview_id UUID REFERENCES excel_interviews(id),
  question_text TEXT NOT NULL,
  expected_concepts TEXT[],
  difficulty_level excel_skill_level NOT NULL
);

-- Practical tasks and evaluations
CREATE TABLE excel_practical_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  excel_interview_id UUID REFERENCES excel_interviews(id),
  task_type excel_task_type NOT NULL,
  task_description TEXT NOT NULL,
  initial_data JSONB,
  expected_outcome JSONB
);
```

### State Management
The interview follows a structured 5-state flow:

1. **Introduction** - Welcome and skill level selection
2. **Conceptual Questions** - Voice-based knowledge assessment
3. **Practical Tasks** - Hands-on spreadsheet exercises
4. **Feedback Generation** - AI analysis and scoring
5. **Conclusion** - Results presentation and recommendations

### Component Architecture

```
ExcelInterviewFlow (Main Orchestrator)
├── ExcelInterviewSetup (Configuration)
├── ConceptualQuestionCard (Voice Assessment)
├── SpreadsheetWorkspace (Practical Tasks)
│   ├── LuckysheetWrapper (Spreadsheet Engine)
│   ├── TaskInstructions (Guidance)
│   └── ProgressTracker (Timer & Status)
└── ExcelFeedbackDisplay (Results & Analytics)
```

## Configuration

### Skill Levels
The system supports three configurable skill levels:

#### Basic Level
- **Conceptual Focus**: Basic formulas, cell references, simple functions
- **Practical Tasks**: Data entry, basic calculations, simple formatting
- **Duration**: 15-20 minutes
- **Evaluation Criteria**: Accuracy, basic formula usage, data organization

#### Intermediate Level
- **Conceptual Focus**: Advanced functions, data analysis, conditional logic
- **Practical Tasks**: Complex formulas, data validation, basic charts
- **Duration**: 25-30 minutes
- **Evaluation Criteria**: Formula complexity, efficiency, problem-solving approach

#### Advanced Level
- **Conceptual Focus**: Advanced analytics, pivot tables, macros, optimization
- **Practical Tasks**: Complex data analysis, advanced charting, automation
- **Duration**: 35-45 minutes
- **Evaluation Criteria**: Advanced techniques, optimization, best practices

### Task Types
- **Formula Creation**: Building complex calculations
- **Data Analysis**: Statistical analysis and insights
- **Chart Creation**: Visualizing data effectively
- **Data Manipulation**: Sorting, filtering, transforming data
- **Pivot Tables**: Advanced data summarization
- **Conditional Formatting**: Visual data enhancement

## API Endpoints

### Interview Management
- `POST /api/excel-interviews` - Create new Excel interview
- `GET /api/excel-interviews/:id` - Get interview details
- `PUT /api/excel-interviews/:id/state` - Update interview state
- `DELETE /api/excel-interviews/:id` - Delete interview

### Question Generation
- `POST /api/excel-interviews/:id/questions` - Generate conceptual questions
- `POST /api/excel-interviews/:id/tasks` - Generate practical tasks

### Evaluation
- `POST /api/excel-interviews/:id/evaluate-conceptual` - Evaluate conceptual responses
- `POST /api/excel-interviews/:id/evaluate-practical` - Evaluate practical work
- `POST /api/excel-interviews/:id/generate-feedback` - Generate comprehensive feedback

### Analytics
- `GET /api/excel-interviews/:id/analytics` - Get detailed analytics
- `GET /api/excel-interviews/:id/report` - Generate assessment report

## Usage Guide

### For Administrators

#### Setting Up an Interview
1. Navigate to the Excel Interview section
2. Select the appropriate skill level (Basic/Intermediate/Advanced)
3. Configure time limits and task preferences
4. Generate the interview session

#### Monitoring Progress
- Real-time state tracking through the dashboard
- Live spreadsheet interaction monitoring
- Automatic progression through interview states

### For Candidates

#### Interview Flow
1. **Introduction**: System explanation and skill level confirmation
2. **Conceptual Questions**: Voice-based responses to Excel knowledge questions
3. **Practical Tasks**: Hands-on work in the embedded spreadsheet
4. **Automatic Evaluation**: AI analysis of both conceptual and practical work
5. **Results**: Comprehensive feedback and improvement recommendations

#### Spreadsheet Interface
- Full Excel-like functionality through Luckysheet
- Real-time action tracking and validation
- Task-specific guidance and progress indicators
- Timer and completion status display

## Evaluation System

### Conceptual Assessment
- **Response Analysis**: AI evaluation of spoken/written responses
- **Concept Coverage**: Verification of key Excel concepts mentioned
- **Accuracy Scoring**: Correctness of explanations and examples
- **Depth Analysis**: Level of understanding demonstrated

### Practical Assessment
- **Formula Accuracy**: Correctness of created formulas and functions
- **Efficiency Metrics**: Time taken and approach optimization
- **Best Practices**: Code quality, error handling, data organization
- **Task Completion**: Achievement of specified objectives

### Scoring Algorithm
```typescript
interface ExcelEvaluationResult {
  overall_score: number; // 0-100
  conceptual_score: number; // 0-100
  practical_score: number; // 0-100
  efficiency_score: number; // 0-100
  best_practices_score: number; // 0-100
}
```

## Analytics & Reporting

### Individual Analytics
- **Skill Breakdown**: Performance across different Excel areas
- **Competency Matrix**: Strengths and improvement areas
- **Benchmarking**: Comparison with skill level expectations
- **Progress Tracking**: Performance trends over time

### Aggregate Analytics
- **Skill Distribution**: Overall candidate skill levels
- **Common Challenges**: Frequently missed concepts or tasks
- **Performance Trends**: Success rates across different areas
- **Improvement Opportunities**: System-wide learning insights

## Testing

### Test Coverage
- **Unit Tests**: Individual component and service testing
- **Integration Tests**: API endpoint and database interaction testing
- **End-to-End Tests**: Complete interview flow testing
- **Performance Tests**: Spreadsheet interaction and evaluation speed

### Test Utilities
The system includes comprehensive test utilities:
- Mock data generators for all Excel interview entities
- Spreadsheet interaction simulators
- AI response mocking for consistent testing
- Performance benchmarking tools

## Deployment

### Environment Variables
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Excel Interview Configuration
EXCEL_INTERVIEW_TIMEOUT=3600000  # 1 hour in milliseconds
EXCEL_MAX_TASKS_PER_LEVEL=5
EXCEL_ENABLE_VOICE_RECORDING=true
```

### Build Configuration
The system requires specific Next.js configuration for Luckysheet integration:

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  transpilePackages: ['luckysheet'],
};
```

## Troubleshooting

### Common Issues

#### Spreadsheet Not Loading
- Verify Luckysheet dependencies are installed
- Check Next.js webpack configuration
- Ensure proper CSS imports for Luckysheet styles

#### AI Evaluation Errors
- Verify OpenAI API key configuration
- Check API rate limits and usage
- Validate prompt templates and response parsing

#### Database Connection Issues
- Verify Supabase configuration
- Check database schema migrations
- Validate table permissions and RLS policies

### Performance Optimization
- Implement spreadsheet action debouncing
- Use lazy loading for large datasets
- Optimize AI prompt lengths for faster responses
- Cache frequently used evaluation results

## Future Enhancements

### Planned Features
- **Multi-language Support**: Interviews in different languages
- **Advanced Analytics**: Machine learning-based insights
- **Custom Task Builder**: Admin interface for creating custom tasks
- **Integration APIs**: Connect with HR systems and learning platforms
- **Mobile Optimization**: Responsive design for tablet interviews

### Technical Improvements
- **Real-time Collaboration**: Multiple evaluators for single interview
- **Advanced Spreadsheet Features**: Support for more Excel functions
- **Performance Monitoring**: Detailed system performance analytics
- **Security Enhancements**: Advanced authentication and data protection

## Support

For technical support or feature requests, please refer to:
- System documentation in `/docs`
- API documentation at `/api-docs`
- Test examples in `/src/__tests__`
- Configuration examples in `/examples`

---

*This documentation is maintained alongside the codebase and updated with each release.*