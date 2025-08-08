[![GitHub stars](https://img.shields.io/github/stars/Excel Mock Interview/Excel Mock Interview?style=social)](https://github.com/Excel Mock Interview/Excel Mock Interview/stargazers)

# Excel Mock Interview - AI-powered voice interviewer for hiring 💼

Excel Mock Interview is an open source platform for companies to conduct AI powered hiring interviews with their candidates. Now featuring specialized Excel Mock Interviewer for technical skill assessment.

<img src="https://github.com/user-attachments/assets/fa92ade1-02ea-4332-b5ed-97056dea01c3" alt="Excel Mock Interview Logo" width="800">

## Key Features

### General Interview Platform
- **🎯 Interview Creation:** Instantly generate tailored interview questions from any job description.
- **🔗 One-Click Sharing:** Generate and share unique interview links with candidates in seconds.
- **🎙️ AI Voice Interviews:** Let our AI conduct natural, conversational interviews that adapt to candidate responses.
- **📊 Smart Analysis:** Get detailed insights and scores for each interview response, powered by advanced AI.
- **📈 Comprehensive Dashboard:** Track all candidate performances and overall stats.

### Excel Mock Interviewer 📊
- **🧮 Dual Assessment:** Combines voice-based conceptual questions with hands-on spreadsheet tasks.
- **📋 Skill Level Configuration:** Configurable assessments for basic, intermediate, and advanced Excel proficiency.
- **⚡ Real-time Evaluation:** AI-powered assessment of both conceptual responses and practical spreadsheet work.
- **📈 Interactive Spreadsheet:** Embedded Luckysheet component for authentic Excel-like experience.
- **🎯 Comprehensive Analytics:** Multi-layered feedback system with benchmarking and improvement plans.
- **⏱️ Structured Flow:** 5-state interview progression from introduction to detailed feedback.

## Initial Setup

1. Clone the project.

```bash
git clone https://github.com/Excel Mock Interview/Excel Mock Interview.git
```

2. Copy the existing environment template file

```bash
cp .env.example .env
```

## Clerk Setup ([Clerk](https://clerk.com/))

We use Clerk for authentication. Set up Clerk environment variables in the `.env` file. Free plan should be more than enough.

1. Navigate to [Clerk](https://dashboard.clerk.com/) and create an application following the [setup guide](https://clerk.com/docs/quickstarts/setup-clerk).

<img src="https://github.com/user-attachments/assets/faa72830-10b0-4dfd-8f07-792e7520b6a2" alt="Clerk Environment Variables" width="800">

2. Your `.env` (NOT `.env.local`) file should have the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` variables populated with **no inverted commas**

3. Enable organizations in your Clerk application by navigating to the [Organization Settings](https://dashboard.clerk.com/last-active?path=organizations-settings&_gl=1*58xbvk*_gcl_au*MTEzODk3NzAyMy4xNzM4NjQzMzU3*_ga*MzUyMTk4NzIwLjE3Mzg2NDM0NzY.*_ga_1WMF5X234K*MTczODczNzkxOC4zLjEuMTczODczNzkyNi4wLjAuMA..) page.

<img src="https://github.com/user-attachments/assets/381cd138-439a-4b4f-ae87-50414fb1d64b" alt="Clerk Organization Settings" width="800">

4. Make sure you create an organization and invite your email to it.

## Database Setup ([Supabase](https://supabase.com/))

Supabase is used for storing the data. It's really simple to set up and the free plan should suffice.

1. Create a project (Note down your project's password)
2. Got to SQL Editor and copy the SQL code from `supabase_schema.sql`

<img src="https://github.com/user-attachments/assets/a31c14b8-45ca-417c-8927-aceb36fa5990" alt="Supabase SQL Editor" height="200">

3. Run the SQL code to confirm the tables are created.
4. Copy the supabase url and anon key from the project settings and paste it in the `.env` file in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Retell AI Setup ([Retell AI](https://retell.ai/))

We use Retell AI to manage all the voice calls. They manage storage of recordings and provide a simple SDK to integrate with. They provide free credits to start with and will have to pay as you go.

1. Create an API key from [Retell AI Dashboard](https://dashboard.retellai.com/apiKey) and add it to the `.env` file in `RETELL_API_KEY`

## Add OpenAI API Key

We use OpenAI to generate questions for interviews and analyze responses. This would not be that costly.

1. Go to [OpenAI](https://platform.openai.com/api-keys) and create an API key
2. Add the API key to the `.env` file in `OPENAI_API_KEY`

## Getting Started locally

First install the packages:

```bash
yarn
```

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
