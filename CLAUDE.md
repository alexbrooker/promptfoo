# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Frontend API Calls

When making API calls from the React app (`src/app`), always use the `callApi` function from `@app/utils/api` instead of direct `fetch()` calls. This ensures proper API base URL handling.

```typescript
import { callApi } from '@app/utils/api';

// Correct
const response = await callApi('/traces/evaluation/123');

// Incorrect - will fail in development
const response = await fetch('/api/traces/evaluation/123');
```

## Build Commands

- `npm run build` - Build the project
- `npm run build:clean` - Clean the dist directory
- `npm run build:watch` - Watch for changes and rebuild TypeScript files
- `npm run lint` - Run ESLint (max 0 warnings)
- `npm run lint:src` - Run ESLint on src directory
- `npm run lint:tests` - Run ESLint on test directory
- `npm run lint:site` - Run ESLint on site directory
- `npm run format` - Format with Prettier
- `npm run format:check` - Check formatting without making changes
- `npm run f` - Format only changed files
- `npm run l` - Lint only changed files
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:integration` - Run integration tests
- `npm run test:redteam:integration` - Run red team integration tests
- `npx jest path/to/test-file` - Run a specific test
- `npm run dev` - Start development environment (both server and app)
- `npm run dev:app` - Start only the frontend app in dev mode
- `npm run dev:server` - Start only the server in dev mode
- `npm run tsc` - Run TypeScript compiler
- `npm run db:generate` - Generate database migrations with Drizzle
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle studio for database management
- `npm run jsonSchema:generate` - Generate JSON schema for configuration
- `npm run citation:generate` - Generate citation file

## CLI Commands

- `promptfoo` or `pf` - Access the CLI tool

## Code Style Guidelines

- Use TypeScript with strict type checking
- Follow established import order with @trivago/prettier-plugin-sort-imports
- Use consistent curly braces for all control statements
- Prefer const over let; avoid var
- Use object shorthand syntax whenever possible
- Use async/await for asynchronous code
- Follow Jest best practices with describe/it blocks
- Use consistent error handling with proper type checks

## Project Conventions

- Use CommonJS modules (type: "commonjs" in package.json)
- Node.js version requirement (>=18.0.0)
- Follow file structure: core logic in src/, tests in test/
- Examples belong in examples/ with clear README.md
- Document provider configurations following examples in existing code
- Test both success and error cases for all functionality
- Keep code DRY and use existing utilities where possible
- Use Drizzle ORM for database operations
- Workspaces include src/app and site directories

## Frontend API Call Conventions

- **ALWAYS use `callAuthenticatedApi()` for authenticated backend API calls**
- Import from `@app/utils/api` or `../../../utils/api` (adjust path as needed)
- Never use raw `fetch()` with manual Authorization headers for backend API calls
- The `callAuthenticatedApi()` utility automatically handles:
  - Authentication headers
  - Proper API routing
  - Error handling for unauthenticated requests
- Pattern: Replace `fetch('/api/endpoint', { headers: { 'Authorization': ... } })` with `callAuthenticatedApi('/endpoint')`
- This prevents "Unexpected token '<'" JSON parse errors from HTML login pages

## SaaS MVP Setup Plan

- Define core product value proposition
- Create initial user authentication flow
- Develop minimal viable dashboard
- Implement basic payment integration
- Set up scalable infrastructure
- Define initial feature set
- Create onboarding and signup process
- Establish basic analytics tracking

## Onboarding Flow Implementation

🎯 Complete Onboarding Flow Implementation

Key Features

- 4-step onboarding process with progress indicator
- Supabase integration for user profile management
- Protected routing that ensures onboarding completion
- Material-UI components for consistent design
- Form validation and data persistence

Onboarding Steps

1. Personal Information - Name and company
2. Chatbot Details - AI role, industry, and use case
3. Compliance & Operations - Country and compliance requirements
4. Terms & Conditions - Legal acceptance

Files Created/Modified

New Components:

- /src/app/src/pages/onboarding/page.tsx - Main onboarding container
- /src/app/src/pages/onboarding/components/PersonalInfoStep.tsx
- /src/app/src/pages/onboarding/components/ChatbotDetailsStep.tsx
- /src/app/src/pages/onboarding/components/ComplianceStep.tsx
- /src/app/src/pages/onboarding/components/TermsStep.tsx
- /src/app/src/hooks/useUserInitialization.tsx

Enhanced Files:

- userStore.ts - Added onboarding data management and Supabase integration
- ProtectedRoute.tsx - Added onboarding completion check
- App.tsx - Integrated onboarding route and user initialization
- user_sql_setup.sql - Updated database schema

Database Schema

The profiles table includes:

- Personal info (name, company)
- AI details (chatbot_role, industry, use_case)
- Compliance (compliance_needs[], country_of_operation)
- Completion tracking (terms_accepted, onboarding_completed)

User Flow

1. User logs in → Automatic redirect to onboarding if not completed
2. Progress through 4 steps with validation
3. Data saved to Supabase on each step
4. Terms acceptance required to complete
5. Redirect to main app once onboarding finished

The implementation ensures users complete onboarding before accessing the main application while providing a
smooth, guided experience with proper data collection for compliance and personalization needs.
