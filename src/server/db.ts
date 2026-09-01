import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  User,
  Profile,
  Experience,
  Education,
  Skill,
  Project,
  Certification,
  Achievement,
  Publication,
  SocialLink,
  CVVersion,
  TemplateConfig,
  AnalyticsEvent,
  FullProfileData,
} from '../types/index.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  version: number;
  users: (User & { passwordHash: string })[];
  profiles: Profile[];
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
  publications: Publication[];
  socialLinks: SocialLink[];
  versions: CVVersion[];
  analyticsEvents: AnalyticsEvent[];
  cvFiles: { id: string; userId: string; fileName: string; fileUrl: string; rawText: string; uploadedAt: string }[];
}

const defaultTemplateConfig: TemplateConfig = {
  templateId: 'modern-clean',
  colorScheme: 'indigo',
  fontFamily: 'plus-jakarta',
  themeMode: 'dark',
  sectionOrder: [
    'hero',
    'about',
    'skills',
    'experience',
    'internships',
    'projects',
    'education',
    'certifications',
    'achievements',
    'publications',
    'contact',
    'social',
  ],
  visibleSections: {
    hero: true,
    about: true,
    skills: true,
    experience: true,
    internships: true,
    projects: true,
    education: true,
    certifications: true,
    achievements: true,
    publications: true,
    contact: true,
    social: true,
  },
  layoutStyle: 'spacious',
};

// Initialize clean database without fabricated personas or dummy data
function initializeCleanDatabase(): DatabaseSchema {
  const userId = 'usr_user';
  const profileId = 'prf_user';

  const user: User & { passwordHash: string } = {
    id: userId,
    email: 'prateekchauhan948@gmail.com',
    name: 'Prateek Chauhan',
    username: 'prateek',
    avatarUrl: '',
    createdAt: new Date().toISOString(),
    passwordHash: 'user123',
  };

  const profile: Profile = {
    id: profileId,
    userId,
    fullName: 'Prateek Chauhan',
    headline: '',
    summary: '',
    email: 'prateekchauhan948@gmail.com',
    phone: '',
    location: '',
    avatarUrl: '',
    templateConfig: { ...defaultTemplateConfig },
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    version: 1,
    users: [user],
    profiles: [profile],
    experiences: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
    publications: [],
    socialLinks: [],
    versions: [],
    analyticsEvents: [],
    cvFiles: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          return parsed;
        }
      } catch (err) {
        console.error('Error reading database file, re-initializing seed data:', err);
      }
    }
    const initial = initializeCleanDatabase();
    this.saveDataDirect(initial);
    return initial;
  }

  public resetToCleanSlate(): DatabaseSchema {
    this.data = initializeCleanDatabase();
    this.save();
    return this.data;
  }

  private saveDataDirect(data: DatabaseSchema) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  private save() {
    this.saveDataDirect(this.data);
  }

  // --- Users ---
  getUserById(id: string): User | undefined {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return undefined;
    const { passwordHash, ...clean } = user;
    return clean;
  }

  getUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserByUsername(username: string): User | undefined {
    const user = this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return undefined;
    const { passwordHash, ...clean } = user;
    return clean;
  }

  createUser(params: { email: string; name: string; username: string; passwordHash: string; avatarUrl?: string }): User {
    const newUser: User & { passwordHash: string } = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      email: params.email.trim(),
      name: params.name.trim(),
      username: params.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      avatarUrl: params.avatarUrl,
      createdAt: new Date().toISOString(),
      passwordHash: params.passwordHash,
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash, ...clean } = newUser;
    return clean;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    this.data.users[userIndex] = {
      ...this.data.users[userIndex],
      ...updates,
    };
    this.save();
    const { passwordHash, ...clean } = this.data.users[userIndex];
    return clean;
  }

  getAllUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...clean }) => clean);
  }

  // --- Profiles ---
  getProfileByUserId(userId: string): Profile | undefined {
    return this.data.profiles.find(p => p.userId === userId);
  }

  getProfileById(id: string): Profile | undefined {
    return this.data.profiles.find(p => p.id === id);
  }

  getProfileByUsername(username: string): Profile | undefined {
    const user = this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return undefined;
    return this.data.profiles.find(p => p.userId === user.id);
  }

  createProfile(params: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Profile {
    const newProfile: Profile = {
      ...params,
      id: `prf_${crypto.randomUUID().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.profiles.push(newProfile);
    this.save();
    return newProfile;
  }

  updateProfile(id: string, updates: Partial<Profile>): Profile | undefined {
    const idx = this.data.profiles.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.profiles[idx] = {
      ...this.data.profiles[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.profiles[idx];
  }

  // --- Full Profile Data Accessor ---
  getFullProfileByUserId(userId: string): FullProfileData | undefined {
    const profile = this.getProfileByUserId(userId);
    if (!profile) return undefined;
    return this.getFullProfileById(profile.id);
  }

  getFullProfileByUsername(username: string): FullProfileData | undefined {
    const profile = this.getProfileByUsername(username);
    if (!profile) return undefined;
    return this.getFullProfileById(profile.id);
  }

  getFullProfileById(profileId: string): FullProfileData | undefined {
    const profile = this.data.profiles.find(p => p.id === profileId);
    if (!profile) return undefined;

    return {
      profile,
      experiences: this.data.experiences.filter(e => e.profileId === profileId).sort((a, b) => a.order - b.order),
      education: this.data.education.filter(e => e.profileId === profileId).sort((a, b) => a.order - b.order),
      skills: this.data.skills.filter(s => s.profileId === profileId),
      projects: this.data.projects.filter(p => p.profileId === profileId).sort((a, b) => a.order - b.order),
      certifications: this.data.certifications.filter(c => c.profileId === profileId),
      achievements: this.data.achievements.filter(a => a.profileId === profileId),
      publications: this.data.publications.filter(p => p.profileId === profileId),
      socialLinks: this.data.socialLinks.filter(s => s.id.startsWith(profileId) || (s as any).profileId === profileId || this.data.socialLinks.includes(s)),
      versions: this.data.versions.filter(v => v.profileId === profileId),
    };
  }

  // --- Bulk Replace / Commit from Extracted CV ---
  commitExtractedCV(userId: string, data: {
    profile: Partial<Profile>;
    experiences: Omit<Experience, 'id' | 'profileId'>[];
    education: Omit<Education, 'id' | 'profileId'>[];
    skills: Omit<Skill, 'id' | 'profileId'>[];
    projects: Omit<Project, 'id' | 'profileId'>[];
    certifications: Omit<Certification, 'id' | 'profileId'>[];
    achievements: Omit<Achievement, 'id' | 'profileId'>[];
    publications: Omit<Publication, 'id' | 'profileId'>[];
    socialLinks: Omit<SocialLink, 'id'>[];
    rawCvText?: string;
    originalCvFileName?: string;
    originalCvFileUrl?: string;
  }): FullProfileData {
    let profile = this.getProfileByUserId(userId);
    const profileId = profile ? profile.id : `prf_${crypto.randomUUID().slice(0, 8)}`;

    const templateConfig = profile?.templateConfig || defaultTemplateConfig;

    if (!profile) {
      profile = {
        id: profileId,
        userId,
        fullName: data.profile.fullName || 'Candidate Name',
        headline: data.profile.headline || 'Professional Specialist',
        summary: data.profile.summary || '',
        email: data.profile.email || '',
        phone: data.profile.phone || '',
        location: data.profile.location || '',
        avatarUrl: data.profile.avatarUrl || '',
        originalCvFileName: data.originalCvFileName,
        originalCvFileUrl: data.originalCvFileUrl,
        originalCvParsedAt: new Date().toISOString(),
        rawCvText: data.rawCvText || '',
        templateConfig,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.profiles.push(profile);
    } else {
      profile.fullName = data.profile.fullName || profile.fullName;
      profile.headline = data.profile.headline || profile.headline;
      profile.summary = data.profile.summary || profile.summary;
      profile.email = data.profile.email || profile.email;
      if (data.profile.phone !== undefined) profile.phone = data.profile.phone;
      if (data.profile.location !== undefined) profile.location = data.profile.location;
      if (data.profile.avatarUrl !== undefined) profile.avatarUrl = data.profile.avatarUrl;
      profile.originalCvFileName = data.originalCvFileName || profile.originalCvFileName;
      profile.originalCvFileUrl = data.originalCvFileUrl || profile.originalCvFileUrl;
      profile.originalCvParsedAt = new Date().toISOString();
      profile.rawCvText = data.rawCvText || profile.rawCvText;
      profile.updatedAt = new Date().toISOString();
    }

    // Clean existing relational data for this profile
    this.data.experiences = this.data.experiences.filter(e => e.profileId !== profileId);
    this.data.education = this.data.education.filter(e => e.profileId !== profileId);
    this.data.skills = this.data.skills.filter(s => s.profileId !== profileId);
    this.data.projects = this.data.projects.filter(p => p.profileId !== profileId);
    this.data.certifications = this.data.certifications.filter(c => c.profileId !== profileId);
    this.data.achievements = this.data.achievements.filter(a => a.profileId !== profileId);
    this.data.publications = this.data.publications.filter(p => p.profileId !== profileId);

    // Insert new records with IDs
    const createdExperiences: Experience[] = data.experiences.map((item, idx) => ({
      ...item,
      id: `exp_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
      order: idx + 1,
    }));
    this.data.experiences.push(...createdExperiences);

    const createdEducation: Education[] = data.education.map((item, idx) => ({
      ...item,
      id: `edu_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
      order: idx + 1,
    }));
    this.data.education.push(...createdEducation);

    const createdSkills: Skill[] = data.skills.map(item => ({
      ...item,
      id: `skl_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
    }));
    this.data.skills.push(...createdSkills);

    const createdProjects: Project[] = data.projects.map((item, idx) => ({
      ...item,
      id: `prj_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
      order: idx + 1,
    }));
    this.data.projects.push(...createdProjects);

    const createdCertifications: Certification[] = data.certifications.map(item => ({
      ...item,
      id: `cert_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
    }));
    this.data.certifications.push(...createdCertifications);

    const createdAchievements: Achievement[] = data.achievements.map(item => ({
      ...item,
      id: `ach_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
    }));
    this.data.achievements.push(...createdAchievements);

    const createdPublications: Publication[] = data.publications.map(item => ({
      ...item,
      id: `pub_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
    }));
    this.data.publications.push(...createdPublications);

    // Social Links
    this.data.socialLinks = this.data.socialLinks.filter(s => !(s as any).profileId || (s as any).profileId !== profileId);
    const createdSocialLinks: SocialLink[] = data.socialLinks.map(s => ({
      ...s,
      id: `soc_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
    } as any));
    this.data.socialLinks.push(...createdSocialLinks);

    // Default CV version if none exists
    const existingVersions = this.data.versions.filter(v => v.profileId === profileId);
    if (existingVersions.length === 0) {
      const defaultVersion: CVVersion = {
        id: `ver_${crypto.randomUUID().slice(0, 8)}`,
        profileId,
        slug: 'general',
        name: 'General Version',
        targetRole: profile.headline || 'Full Profile',
        customHeadline: profile.headline,
        customSummary: profile.summary,
        selectedProjectIds: createdProjects.map(p => p.id),
        highlightedSkillIds: createdSkills.slice(0, 8).map(s => s.id),
        selectedExperienceIds: createdExperiences.map(e => e.id),
        isDefault: true,
        createdAt: new Date().toISOString(),
      };
      this.data.versions.push(defaultVersion);
    }

    this.save();
    return this.getFullProfileById(profileId)!;
  }

  // --- Sub-Entity CRUD ---
  // Experiences
  saveExperience(exp: Experience): Experience {
    const idx = this.data.experiences.findIndex(e => e.id === exp.id);
    if (idx >= 0) {
      this.data.experiences[idx] = exp;
    } else {
      if (!exp.id) exp.id = `exp_${crypto.randomUUID().slice(0, 8)}`;
      this.data.experiences.push(exp);
    }
    this.save();
    return exp;
  }

  deleteExperience(id: string, profileId: string): boolean {
    const initialLen = this.data.experiences.length;
    this.data.experiences = this.data.experiences.filter(e => !(e.id === id && e.profileId === profileId));
    this.save();
    return this.data.experiences.length < initialLen;
  }

  // Projects
  saveProject(project: Project): Project {
    const idx = this.data.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      this.data.projects[idx] = project;
    } else {
      if (!project.id) project.id = `prj_${crypto.randomUUID().slice(0, 8)}`;
      this.data.projects.push(project);
    }
    this.save();
    return project;
  }

  deleteProject(id: string, profileId: string): boolean {
    const initialLen = this.data.projects.length;
    this.data.projects = this.data.projects.filter(p => !(p.id === id && p.profileId === profileId));
    this.save();
    return this.data.projects.length < initialLen;
  }

  // Skills
  saveSkill(skill: Skill): Skill {
    const idx = this.data.skills.findIndex(s => s.id === skill.id);
    if (idx >= 0) {
      this.data.skills[idx] = skill;
    } else {
      if (!skill.id) skill.id = `skl_${crypto.randomUUID().slice(0, 8)}`;
      this.data.skills.push(skill);
    }
    this.save();
    return skill;
  }

  deleteSkill(id: string, profileId: string): boolean {
    const initialLen = this.data.skills.length;
    this.data.skills = this.data.skills.filter(s => !(s.id === id && s.profileId === profileId));
    this.save();
    return this.data.skills.length < initialLen;
  }

  // Education
  saveEducation(edu: Education): Education {
    const idx = this.data.education.findIndex(e => e.id === edu.id);
    if (idx >= 0) {
      this.data.education[idx] = edu;
    } else {
      if (!edu.id) edu.id = `edu_${crypto.randomUUID().slice(0, 8)}`;
      this.data.education.push(edu);
    }
    this.save();
    return edu;
  }

  deleteEducation(id: string, profileId: string): boolean {
    const initialLen = this.data.education.length;
    this.data.education = this.data.education.filter(e => !(e.id === id && e.profileId === profileId));
    this.save();
    return this.data.education.length < initialLen;
  }

  // Certifications
  saveCertification(cert: Certification): Certification {
    const idx = this.data.certifications.findIndex(c => c.id === cert.id);
    if (idx >= 0) {
      this.data.certifications[idx] = cert;
    } else {
      if (!cert.id) cert.id = `cert_${crypto.randomUUID().slice(0, 8)}`;
      this.data.certifications.push(cert);
    }
    this.save();
    return cert;
  }

  deleteCertification(id: string, profileId: string): boolean {
    const initialLen = this.data.certifications.length;
    this.data.certifications = this.data.certifications.filter(c => !(c.id === id && c.profileId === profileId));
    this.save();
    return this.data.certifications.length < initialLen;
  }

  // Achievements
  saveAchievement(ach: Achievement): Achievement {
    const idx = this.data.achievements.findIndex(a => a.id === ach.id);
    if (idx >= 0) {
      this.data.achievements[idx] = ach;
    } else {
      if (!ach.id) ach.id = `ach_${crypto.randomUUID().slice(0, 8)}`;
      this.data.achievements.push(ach);
    }
    this.save();
    return ach;
  }

  deleteAchievement(id: string, profileId: string): boolean {
    const initialLen = this.data.achievements.length;
    this.data.achievements = this.data.achievements.filter(a => !(a.id === id && a.profileId === profileId));
    this.save();
    return this.data.achievements.length < initialLen;
  }

  // Publications
  savePublication(pub: Publication): Publication {
    const idx = this.data.publications.findIndex(p => p.id === pub.id);
    if (idx >= 0) {
      this.data.publications[idx] = pub;
    } else {
      if (!pub.id) pub.id = `pub_${crypto.randomUUID().slice(0, 8)}`;
      this.data.publications.push(pub);
    }
    this.save();
    return pub;
  }

  deletePublication(id: string, profileId: string): boolean {
    const initialLen = this.data.publications.length;
    this.data.publications = this.data.publications.filter(p => !(p.id === id && p.profileId === profileId));
    this.save();
    return this.data.publications.length < initialLen;
  }

  // Social Links
  saveSocialLinks(profileId: string, links: SocialLink[]): SocialLink[] {
    this.data.socialLinks = this.data.socialLinks.filter(s => (s as any).profileId !== profileId);
    const updated = links.map(l => ({
      ...l,
      id: l.id || `soc_${crypto.randomUUID().slice(0, 8)}`,
      profileId,
    } as any));
    this.data.socialLinks.push(...updated);
    this.save();
    return updated;
  }

  // CV Versions
  getCVVersions(profileId: string): CVVersion[] {
    return this.data.versions.filter(v => v.profileId === profileId);
  }

  saveCVVersion(version: CVVersion): CVVersion {
    const idx = this.data.versions.findIndex(v => v.id === version.id);
    if (idx >= 0) {
      this.data.versions[idx] = version;
    } else {
      if (!version.id) version.id = `ver_${crypto.randomUUID().slice(0, 8)}`;
      this.data.versions.push(version);
    }
    // If set to default, ensure others are false
    if (version.isDefault) {
      this.data.versions.forEach(v => {
        if (v.profileId === version.profileId && v.id !== version.id) {
          v.isDefault = false;
        }
      });
    }
    this.save();
    return version;
  }

  deleteCVVersion(id: string, profileId: string): boolean {
    const initialLen = this.data.versions.length;
    this.data.versions = this.data.versions.filter(v => !(v.id === id && v.profileId === profileId));
    this.save();
    return this.data.versions.length < initialLen;
  }

  // Analytics
  recordAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): void {
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `evt_${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.analyticsEvents.push(newEvent);
    // Keep max 2000 events to manage file size
    if (this.data.analyticsEvents.length > 2000) {
      this.data.analyticsEvents = this.data.analyticsEvents.slice(-1500);
    }
    this.save();
  }

  getAnalyticsSummary(profileId: string): {
    totalViews: number;
    viewsByDay: { date: string; views: number }[];
    resumeDownloads: number;
    projectClicks: number;
    githubClicks: number;
    liveDemoClicks: number;
    popularSections: { section: string; views: number }[];
    referrers: { source: string; count: number }[];
  } {
    const events = this.data.analyticsEvents.filter(e => e.profileId === profileId);

    const views = events.filter(e => e.eventType === 'page_view');
    const downloads = events.filter(e => e.eventType === 'resume_download').length;
    const projectClicks = events.filter(e => e.eventType === 'project_click').length;
    const githubClicks = events.filter(e => e.eventType === 'github_click').length;
    const liveDemoClicks = events.filter(e => e.eventType === 'live_demo_click').length;

    // Daily breakdown for last 7 days
    const dayMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dayMap[key] = 0;
    }

    views.forEach(v => {
      const day = v.timestamp.split('T')[0];
      if (dayMap[day] !== undefined) {
        dayMap[day]++;
      }
    });

    const viewsByDay = Object.entries(dayMap).map(([date, count]) => ({ date, views: count }));

    // Referrers
    const refMap: Record<string, number> = {};
    views.forEach(v => {
      const ref = v.referrer || 'Direct / Bookmark';
      refMap[ref] = (refMap[ref] || 0) + 1;
    });
    const referrers = Object.entries(refMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Popular Sections
    const sectionEvents = events.filter(e => e.eventType === 'section_view');
    const secMap: Record<string, number> = {
      Projects: 0,
      Experience: 0,
      Skills: 0,
      Education: 0,
      Certifications: 0,
    };
    sectionEvents.forEach(s => {
      const sec = s.targetId || 'Overview';
      secMap[sec] = (secMap[sec] || 0) + 1;
    });
    const popularSections = Object.entries(secMap).map(([section, count]) => ({ section, views: count }));

    return {
      totalViews: views.length,
      viewsByDay,
      resumeDownloads: downloads,
      projectClicks,
      githubClicks,
      liveDemoClicks,
      popularSections,
      referrers,
    };
  }

  // Uploaded CV Records
  saveCVFileRecord(record: { userId: string; fileName: string; fileUrl: string; rawText: string }): void {
    this.data.cvFiles.push({
      id: `cv_${crypto.randomUUID().slice(0, 8)}`,
      ...record,
      uploadedAt: new Date().toISOString(),
    });
    this.save();
  }
}

export const db = new Database();
