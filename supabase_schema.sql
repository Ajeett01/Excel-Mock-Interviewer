-- Create enum types
CREATE TYPE plan AS ENUM ('free', 'pro', 'free_trial_over');
CREATE TYPE excel_skill_level AS ENUM ('basic', 'intermediate', 'advanced');
CREATE TYPE interview_type AS ENUM ('general', 'excel');
CREATE TYPE excel_interview_state AS ENUM ('introduction', 'conceptual_questions', 'practical_tasks', 'feedback_generation', 'conclusion');

-- Create tables
CREATE TABLE organization (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    name TEXT,
    image_url TEXT,
    allowed_responses_count INTEGER,
    plan plan
);

CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    email TEXT,
    organization_id TEXT REFERENCES organization(id)
);

CREATE TABLE interviewer (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    agent_id TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    audio TEXT,
    empathy INTEGER NOT NULL,
    exploration INTEGER NOT NULL,
    rapport INTEGER NOT NULL,
    speed INTEGER NOT NULL
);

-- Enhanced interview table with Excel support
CREATE TABLE interview (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    name TEXT,
    description TEXT,
    objective TEXT,
    organization_id TEXT REFERENCES organization(id),
    user_id TEXT REFERENCES "user"(id),
    interviewer_id INTEGER REFERENCES interviewer(id),
    is_active BOOLEAN DEFAULT true,
    is_anonymous BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    logo_url TEXT,
    theme_color TEXT,
    url TEXT,
    readable_slug TEXT,
    questions JSONB,
    quotes JSONB[],
    insights TEXT[],
    respondents TEXT[],
    question_count INTEGER,
    response_count INTEGER,
    time_duration TEXT,
    -- Excel-specific fields
    interview_type interview_type DEFAULT 'general',
    excel_skill_level excel_skill_level,
    practical_tasks JSONB,
    task_templates JSONB,
    conceptual_question_count INTEGER DEFAULT 0,
    practical_task_count INTEGER DEFAULT 0
);

-- Enhanced response table with Excel analytics
CREATE TABLE response (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id TEXT REFERENCES interview(id),
    name TEXT,
    email TEXT,
    call_id TEXT,
    candidate_status TEXT,
    duration INTEGER,
    details JSONB,
    analytics JSONB,
    is_analysed BOOLEAN DEFAULT false,
    is_ended BOOLEAN DEFAULT false,
    is_viewed BOOLEAN DEFAULT false,
    tab_switch_count INTEGER,
    -- Excel-specific fields
    excel_analytics JSONB,
    spreadsheet_results JSONB,
    current_state excel_interview_state DEFAULT 'introduction',
    state_transitions JSONB,
    conceptual_scores JSONB,
    practical_scores JSONB
);

CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id TEXT REFERENCES interview(id),
    email TEXT,
    feedback TEXT,
    satisfaction INTEGER
);

-- New Excel-specific tables

-- Excel skill configuration table
CREATE TABLE excel_skill_config (
    id SERIAL PRIMARY KEY,
    skill_level excel_skill_level NOT NULL UNIQUE,
    conceptual_topics TEXT[],
    practical_skills TEXT[],
    evaluation_criteria JSONB,
    function_requirements TEXT[],
    complexity_level INTEGER,
    time_allocation JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Spreadsheet task results table
CREATE TABLE spreadsheet_result (
    id SERIAL PRIMARY KEY,
    response_id INTEGER REFERENCES response(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    task_name TEXT,
    initial_state JSONB,
    final_state JSONB,
    user_actions JSONB[],
    formulas_used TEXT[],
    functions_used TEXT[],
    completion_time INTEGER,
    accuracy_score DECIMAL(5,2),
    efficiency_score DECIMAL(5,2),
    best_practices_score DECIMAL(5,2),
    task_feedback TEXT,
    expected_solution JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Excel task templates table
CREATE TABLE excel_task_template (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    skill_level excel_skill_level NOT NULL,
    scenario TEXT,
    initial_data JSONB,
    expected_outcome JSONB,
    evaluation_criteria JSONB,
    time_limit INTEGER,
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
    business_context TEXT,
    required_functions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Interview session state tracking
CREATE TABLE excel_interview_session (
    id SERIAL PRIMARY KEY,
    response_id INTEGER REFERENCES response(id) ON DELETE CASCADE,
    current_state excel_interview_state DEFAULT 'introduction',
    state_data JSONB,
    conceptual_progress JSONB,
    practical_progress JSONB,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration INTEGER,
    state_history JSONB[]
);

-- Insert default Excel skill configurations
INSERT INTO excel_skill_config (skill_level, conceptual_topics, practical_skills, evaluation_criteria, function_requirements, complexity_level, time_allocation) VALUES
('basic',
 ARRAY['Basic formulas', 'Cell references', 'Data formatting', 'Simple charts', 'Basic functions'],
 ARRAY['SUM', 'AVERAGE', 'COUNT', 'Basic formatting', 'Simple charts'],
 '{"formula_accuracy": 70, "efficiency": 60, "best_practices": 50}',
 ARRAY['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN'],
 1,
 '{"conceptual": 10, "practical": 15, "total": 25}'
),
('intermediate',
 ARRAY['Advanced formulas', 'Lookup functions', 'Data validation', 'Pivot tables', 'Conditional formatting'],
 ARRAY['VLOOKUP', 'IF statements', 'Pivot tables', 'Data validation', 'Advanced charts'],
 '{"formula_accuracy": 80, "efficiency": 70, "best_practices": 70}',
 ARRAY['VLOOKUP', 'HLOOKUP', 'IF', 'SUMIF', 'COUNTIF', 'CONCATENATE'],
 2,
 '{"conceptual": 15, "practical": 20, "total": 35}'
),
('advanced',
 ARRAY['Complex formulas', 'Array formulas', 'Macros', 'VBA basics', 'Advanced analytics'],
 ARRAY['INDEX-MATCH', 'Array formulas', 'Macros', 'Advanced pivot tables', 'Data modeling'],
 '{"formula_accuracy": 90, "efficiency": 85, "best_practices": 85}',
 ARRAY['INDEX', 'MATCH', 'INDIRECT', 'OFFSET', 'SUMPRODUCT', 'Array formulas'],
 3,
 '{"conceptual": 20, "practical": 25, "total": 45}'
);
