# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AUTO is a Next.js automation platform that provides web-based interfaces for various data extraction and automation tasks. The project includes:

- **Next.js Frontend**: React-based dashboard for automation workflows
- **Playwright Backend**: Python automation scripts for browser automation (Jonas Premier, Locus, etc.)
- **API Integration**: Next.js API routes connecting frontend to Python automation
- **Requirements System**: Structured requirements gathering using Claude commands

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python, Playwright for browser automation
- **API**: Next.js API routes (REST)
- **Database**: File-based storage for automation results
- **Authentication**: Jonas Premier cloud authentication

## Architecture

### Frontend Structure (Refactored - Modern Next.js 15 Patterns)

The frontend now follows modern Next.js patterns with proper server/client component separation:

```
app/
├── page.tsx                 # Server component (main entry point)
├── types/
│   └── index.ts            # TypeScript interfaces and types
├── constants/
│   └── targets.tsx         # Target system configurations
├── lib/
│   ├── utils.ts            # Utility functions
│   └── jonas-api.ts        # API integration logic
└── components/
    ├── dashboard/          # Main dashboard components
    │   ├── auto-dashboard.tsx    # Main client component controller
    │   ├── dashboard-header.tsx  # Header with navigation
    │   └── target-selector.tsx   # System selection grid
    ├── jonas/              # Jonas Premier workflow
    │   ├── jonas-flow.tsx         # Jonas workflow controller
    │   ├── jonas-mode-selector.tsx
    │   ├── jonas-data-type-selector.tsx
    │   ├── vendor-email-selector.tsx
    │   ├── account-config.tsx
    │   └── [other existing components...]
    ├── amos/               # AMOS monitoring workflow
    │   ├── amos-flow.tsx          # AMOS workflow controller
    │   ├── monitoring-platform-selector.tsx
    │   ├── locus-config.tsx
    │   └── powertrack-config.tsx
    ├── wpr/                # Weekly Progress Reports
    │   ├── wpr-flow.tsx           # WPR workflow controller
    │   ├── wpr-list.tsx
    │   ├── wpr-results.tsx
    │   └── wpr-config.tsx
    └── shared/             # Reusable components
        ├── processing-view.tsx    # Progress indicator
        └── results-view.tsx       # Success/download view
```

#### Component Architecture
- **Server Components**: Main `page.tsx` for optimal performance
- **Client Components**: Interactive dashboard and workflows marked with "use client"
- **Flow Controllers**: Each system (Jonas, AMOS, WPR) has a dedicated flow controller
- **Shared Components**: Reusable UI components across all workflows
- **Type Safety**: Centralized TypeScript definitions

### Backend Structure
- `playwright/` - Python automation scripts
  - `jonas/` - Jonas Premier automation
  - `locus_automation/` - Locus platform automation
- `app/api/` - Next.js API routes

### Requirements System
- `.claude/commands/` - Custom Claude commands for requirements gathering
- `requirements/` - Structured requirements documentation

## Quick Start

To get the Jonas automation working with browser visibility:

```bash
# 1. Set up Python environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt
playwright install

# 3. Start the Next.js app
npm install
npm run dev
```

Now you can access http://localhost:3000, select Jonas, and the "Show browser window" option will work!

## Development Commands

### Frontend Development
```bash
npm run dev        # Start Next.js development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Python Automation Setup

#### Initial Setup (Required for Jonas automation)
```bash
# 1. Create Python virtual environment
python -m venv .venv

# 2. Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Install Playwright browsers
playwright install

# 5. Verify installation
python -c "import playwright; print('✓ Playwright installed successfully')"
```

#### Running Automation
```bash
# Make sure virtual environment is activated first
python jonas/jonas_browser.py    # Run Jonas automation directly
# OR use the web interface at http://localhost:3000
```

#### Troubleshooting
- If you get "ModuleNotFoundError: No module named 'playwright'", make sure virtual environment is activated
- Virtual environment must be created in the project root (not in playwright/ folder)
- Use `python -m venv .venv` (not `python3` if you have issues)

## Requirements Gathering System

The project includes an intelligent requirements gathering system via Claude commands:

### Available Commands
- `/requirements-start [description]` - Begin gathering requirements for a new feature
- `/requirements-status` - Check current requirement progress  
- `/requirements-current` - View active requirement details
- `/requirements-list` - List all requirements with status
- `/requirements-end` - Finalize current requirements
- `/requirements-remind` - Remind AI to follow requirements rules

### Process Flow
1. **Initial Request**: Use `/requirements-start` with feature description
2. **Discovery Questions**: Answer 5 yes/no questions about the feature
3. **Code Analysis**: AI autonomously analyzes relevant codebase
4. **Expert Questions**: Answer 5 detailed yes/no questions with code context
5. **Requirements Doc**: Comprehensive specification generated automatically

### Example Usage
```bash
/requirements-start add export functionality to Jonas reports
# Answer discovery questions (yes/no with smart defaults)
# AI analyzes existing export patterns
# Answer expert questions about implementation
# Get detailed requirements with file paths and patterns
```

Requirements are stored in `requirements/` directory with automatic tracking and progress management.

## Development Guidelines

### Component Development
When working with this codebase:

1. **Server vs Client Components**:
   - Use server components by default for better performance
   - Only add "use client" when state, events, or browser APIs are needed
   - Keep server components simple - they render once on the server

2. **Component Organization**:
   - Each automation system (Jonas, AMOS, WPR) has its own folder
   - Flow controllers manage state and navigation for each system
   - Shared components go in `/shared/` for reusability
   - Types are centralized in `/types/index.ts`

3. **Adding New Features**:
   - Create new components in appropriate system folders
   - Update type definitions in `/types/index.ts`
   - Add business logic to `/lib/` files
   - Follow existing patterns for consistency

4. **File Structure Rules**:
   - `*-flow.tsx` = Main workflow controller with state management
   - `*-config.tsx` = Configuration forms
   - `*-selector.tsx` = Selection interfaces
   - `*-view.tsx` = Display/result components

### Testing
When testing components:
- Test flow controllers for state management
- Test individual forms for user input validation
- Use existing components as reference for patterns

---

*This CLAUDE.md reflects the refactored architecture following modern Next.js 15 patterns for better maintainability and performance.*