export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
  customDomain?: string;
}

export interface SocialLink {
  id: string;
  platform:
    | 'github'
    | 'linkedin'
    | 'twitter'
    | 'x'
    | 'portfolio'
    | 'youtube'
    | 'dribbble'
    | 'medium'
    | 'discord'
    | 'instagram'
    | 'twitch'
    | 'substack'
    | 'telegram'
    | 'leetcode'
    | 'codeforces'
    | 'other'
    | string;
  label: string;
  url: string;
  username?: string;
}

export interface Experience {
  id: string;
  profileId: string;
  company: string;
  role: string;
  location?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  highlights: string[];
  technologies: string[];
  order: number;
}

export interface Education {
  id: string;
  profileId: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  gpa?: string;
  honors?: string;
  courses: string[];
  order: number;
}

export interface Skill {
  id: string;
  profileId: string;
  name: string;
  category: 'technical' | 'soft' | 'tools' | 'languages' | 'frameworks' | 'other';
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  highlighted?: boolean;
}

export interface Project {
  id: string;
  profileId: string;
  title: string;
  tagline?: string;
  description: string;
  role?: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  demoVideoUrl?: string;
  screenshots: string[];
  startDate?: string;
  endDate?: string;
  featured: boolean;
  order: number;
  stars?: number;
  isImportedFromGithub?: boolean;
}

export interface Certification {
  id: string;
  profileId: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateFileUrl?: string;
}

export interface Achievement {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  date?: string;
  issuer?: string;
  link?: string;
}

export interface Publication {
  id: string;
  profileId: string;
  title: string;
  publisher?: string;
  publishedDate?: string;
  url?: string;
  description?: string;
  authors?: string;
}

export interface CVVersion {
  id: string;
  profileId: string;
  slug: string;
  name: string;
  targetRole: string;
  customHeadline?: string;
  customSummary?: string;
  selectedProjectIds: string[];
  highlightedSkillIds: string[];
  selectedExperienceIds: string[];
  isDefault: boolean;
  createdAt: string;
}

export type TemplateType =
  | 'modern-clean'
  | 'executive'
  | 'executive-serif'
  | 'terminal'
  | 'tech-terminal'
  | 'bento'
  | 'bento-grid'
  | 'minimalist'
  | 'minimalist-line';

export interface ExtractedCVData {
  profile: {
    fullName: string;
    headline: string;
    summary: string;
    email: string;
    phone?: string;
    location?: string;
  };
  experiences: {
    company: string;
    role: string;
    location?: string;
    type?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description: string;
    highlights?: string[];
    technologies?: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
    gpa?: string;
    honors?: string;
    courses?: string[];
  }[];
  skills: {
    name: string;
    category?: 'technical' | 'soft' | 'tools' | 'languages' | 'frameworks' | 'other';
    proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }[];
  projects: {
    title: string;
    tagline?: string;
    description: string;
    technologies?: string[];
    githubUrl?: string;
    liveUrl?: string;
    startDate?: string;
    endDate?: string;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    issueDate?: string;
    credentialUrl?: string;
  }[];
  achievements?: {
    title: string;
    description?: string;
    date?: string;
    issuer?: string;
  }[];
}

export interface TailorJobResponse {
  matchingSkills: string[];
  missingSkills: string[];
  tailoredHeadline: string;
  tailoredSummary: string;
  recommendations: string[];
}

export interface TemplateConfig {
  templateId?: TemplateType;
  type?: TemplateType;
  colorScheme?: 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'slate' | 'ocean';
  accentColor?: string;
  theme?: 'dark' | 'light' | 'system';
  fontFamily?: 'sans' | 'serif' | 'mono' | 'plus-jakarta' | 'cabinet-grotesk' | 'instrument-serif' | 'jetbrains-mono' | 'space-grotesk';
  themeMode?: 'dark' | 'light' | 'system';
  sectionOrder?: string[];
  visibleSections?: {
    hero?: boolean;
    about?: boolean;
    experience?: boolean;
    internships?: boolean;
    projects?: boolean;
    skills?: boolean;
    education?: boolean;
    certifications?: boolean;
    achievements?: boolean;
    publications?: boolean;
    contact?: boolean;
    social?: boolean;
  };
  layoutStyle?: 'compact' | 'spacious' | 'card-grid' | 'timeline';
  layoutSpacing?: string;
  showGithubStats?: boolean;
  showVisitorCounter?: boolean;
  enableRecruiterChat?: boolean;
}

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  headline: string;
  summary: string;
  email: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  originalCvFileName?: string;
  originalCvFileUrl?: string;
  originalCvParsedAt?: string;
  rawCvText?: string;
  templateConfig: TemplateConfig;
  customDomain?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CVDiffResult {
  additions: { section: string; item: any }[];
  removals: { section: string; item: any }[];
  modifications: { section: string; current: any; proposed: any; field: string }[];
  summary: string;
}

export interface AnalyticsEvent {
  id: string;
  profileId: string;
  eventType: 'page_view' | 'resume_download' | 'project_click' | 'github_click' | 'live_demo_click' | 'recruiter_chat' | 'section_view';
  targetId?: string;
  metadata?: Record<string, any>;
  referrer?: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  viewsByDay: { date: string; views: number }[];
  resumeDownloads: number;
  projectClicks: number;
  githubClicks: number;
  liveDemoClicks: number;
  popularSections: { section: string; views: number }[];
  referrers: { source: string; count: number }[];
}

export interface RecruiterChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface FullProfileData {
  profile: Profile;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
  publications: Publication[];
  socialLinks: SocialLink[];
  versions: CVVersion[];
}

export type AIKeyStatus = 'active' | 'healthy' | 'exhausted' | 'error' | 'untested';

export interface AIKeyEntry {
  id: string;
  name: string;
  masked: string;
  source: 'env' | 'custom';
  status: AIKeyStatus;
  isActive: boolean;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastUsedAt?: string;
  lastTestedAt?: string;
  lastError?: string;
  latencyMs?: number;
  cooldownRemainingSeconds?: number;
}

export interface AIKeyPoolStatus {
  activeKeyId: string | null;
  totalKeys: number;
  healthyKeys: number;
  exhaustedKeys: number;
  errorKeys: number;
  isFallbackMode: boolean;
  keys: AIKeyEntry[];
}
