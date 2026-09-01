# DigitalCV

> AI-powered digital CV & portfolio generator

DigitalCV is a full-stack SaaS platform that converts a user's existing
CV/resume into a modern, interactive, professional, and shareable
digital profile.

## Core Concept

The uploaded CV is the **initial source of profile information**. After
the user reviews and confirms the extracted information, the normalized
profile stored in PostgreSQL becomes the **source of truth**.

``` text
CV Upload
  ↓
CV Parsing
  ↓
AI-Assisted Extraction
  ↓
Structured Profile Data
  ↓
User Review & Editing
  ↓
PostgreSQL
  ↓
Dynamic Digital CV
  ├── Public Website
  ├── PDF Resume
  ├── QR Code
  ├── AI Recruiter Assistant
  └── Analytics
```

**Never hardcode personal information. Never fabricate information.**

## Features

-   PDF/DOCX CV upload
-   First-launch CV onboarding
-   AI-assisted CV parsing and structured extraction
-   Editable extraction review before saving
-   Dynamic digital CV / portfolio website
-   Professional templates and customization
-   Project showcase with screenshots, GitHub and live-demo links
-   Profile, experience, education, skills, certifications and
    achievement management
-   CV re-import with change detection and user approval
-   Multiple role-specific CV versions
-   AI assistance for summaries, projects, experience and job-specific
    tailoring
-   AI recruiter assistant grounded only in the selected public CV
    version
-   Optional GitHub integration
-   Optional LinkedIn integration through supported APIs/import
    mechanisms; no scraping
-   Recruiter mode
-   Profile analytics
-   QR code generation
-   Shareable public profile URLs
-   PDF resume generation from database profile data
-   Optional custom domains
-   Light/dark mode
-   Secure multi-user architecture

## First-Launch Flow

``` text
New User
  ↓
Sign Up / Login
  ↓
Check Profile
  ↓
No CV?
  ↓
Upload CV
  ↓
Parse & Extract
  ↓
Review / Edit
  ↓
Confirm
  ↓
Save to Database
  ↓
Generate Digital CV
  ↓
Dashboard
```

If profile data already exists, skip onboarding and open the dashboard.

Missing information must remain empty rather than being invented.

## Profile Data

The system can manage:

-   Personal information
-   Professional headline and summary
-   Contact information and location
-   Technical and soft skills
-   Work experience and internships
-   Education
-   Projects
-   Certifications
-   Achievements and awards
-   Publications
-   Languages
-   GitHub, LinkedIn and other professional links

## Digital CV

Each user receives a public URL such as:

``` text
https://yourdomain.com/username
```

The public profile dynamically retrieves the selected user's data from
the backend. Empty sections should not be displayed.

## Project Showcase

Projects can contain:

-   Title
-   Description
-   Technologies
-   Dates
-   Role
-   Screenshots
-   GitHub repository
-   Live demo
-   Links
-   Optional video/demo

## Multiple CV Versions

Users can create versions such as:

``` text
General CV
Backend Developer
AI/ML Developer
Unity Developer
Data Scientist
```

Each version can emphasize different projects, skills, summaries, and
experience without duplicating the underlying profile data.

## AI Recruiter Assistant

Recruiters can ask questions such as:

``` text
"What backend technologies does this candidate know?"
"What projects has this candidate worked on?"
"Does this candidate have Python experience?"
"What experience does this candidate have with AI?"
```

The assistant must answer only from the selected public CV/profile
version. If information is unavailable, it must say so instead of
guessing.

## CV Re-import

When a newer CV is uploaded:

1.  Parse the new CV.
2.  Extract structured information.
3.  Compare it with the existing profile.
4.  Detect additions, removals, and changes.
5.  Show the differences.
6.  Let the user accept or reject changes.
7.  Update the database only after confirmation.

Never silently overwrite manually edited information.

## PDF Resume

Generate a professional PDF directly from the stored profile data:

``` text
Database Profile
  ↓
Resume Template
  ↓
PDF Generator
  ↓
Updated Resume
```

The PDF and digital CV must use the same underlying profile data.

## Tech Stack

### Frontend

-   React / Next.js
-   Tailwind CSS
-   Responsive and accessible UI

### Backend

-   Python
-   FastAPI
-   REST APIs

### Database

-   PostgreSQL

### AI

-   LLM-based CV parsing
-   Structured information extraction
-   AI content assistance
-   Grounded recruiter assistant

### Storage

Object/file storage for CVs, profile photos, certificates, project
screenshots, videos, and portfolio media.

### Deployment

-   Docker
-   Environment-based configuration
-   Cloud deployment ready

## Backend APIs

Implement APIs for:

-   Authentication
-   Users and profiles
-   CV upload and parsing
-   CV re-import
-   Profile CRUD
-   Projects
-   Experience
-   Education
-   Skills
-   Certifications
-   Achievements
-   Publications
-   Templates
-   CV versions
-   Public profiles
-   Analytics
-   AI features
-   GitHub integration
-   PDF generation
-   QR generation

Include validation, authentication, authorization, rate limiting,
logging, migrations, error handling, and API documentation.

## Database

Use normalized PostgreSQL entities for:

``` text
Users
Profiles
CVs
CV Versions
Experiences
Education
Skills
Projects
Certifications
Achievements
Publications
Social Links
Templates
Uploaded Files
Analytics / Events
```

Every user-specific record must be associated with the correct user.

## Security

Implement:

-   Password hashing
-   Secure authentication
-   Authorization
-   Input validation
-   File type/size validation
-   Secure file handling
-   API rate limiting
-   Environment-based secrets
-   User data isolation
-   Protection against common web attacks
-   Prompt-injection protection
-   Cross-user data access protection

## Main Interfaces

1.  Landing Page
2.  Login
3.  Signup
4.  First-Launch CV Upload
5.  CV Processing
6.  CV Extraction Review/Edit
7.  User Dashboard
8.  Profile Editor
9.  Project Manager
10. Experience Manager
11. Education Manager
12. Skills Manager
13. Certification Manager
14. Template Selector
15. Live CV Preview
16. CV Version Manager
17. Analytics Dashboard
18. AI Assistant
19. Public Digital CV
20. Recruiter Mode
21. Settings

## Architecture Rules

1.  Never hardcode personal CV information.
2.  Never fabricate CV information.
3.  The uploaded CV is the initial source of profile data.
4.  After confirmation, PostgreSQL becomes the source of truth.
5.  All CV content must come from backend/database data.
6.  User edits must persist.
7.  Database changes must be reflected in the public CV.
8.  AI suggestions require user approval before being stored.
9.  AI recruiter answers must use only the selected public CV version.
10. Users must never access another user's private data.
11. Missing information must remain empty.
12. Templates must be independent of profile data.
13. CV re-import must not silently overwrite edits.
14. The original uploaded CV should be retained separately from
    normalized profile data.

## Development Requirements

Build a **real functional full-stack application**, not just a UI
mockup.

Include:

-   Working frontend
-   Working backend
-   PostgreSQL database
-   Authentication
-   PDF/DOCX CV parsing
-   Structured data extraction
-   Editable extracted data
-   Database persistence
-   Dynamic public CV
-   Multiple CV versions
-   Template system
-   AI features
-   AI recruiter assistant
-   File storage
-   PDF generation
-   QR generation
-   Analytics
-   GitHub integration structure
-   Docker configuration
-   Environment configuration
-   Database migrations
-   API documentation
-   Unit and integration tests
-   Clear setup documentation

Keep the architecture modular, scalable, maintainable, and ready for
future features such as premium templates, custom domains, AI job
matching, recruiter accounts, subscriptions, advanced analytics,
additional integrations, team/company profiles, and SEO optimization.

## Project Status

**In Development**
