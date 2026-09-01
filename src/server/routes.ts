import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { db } from './db.ts';
import { parseDocumentBuffer } from './parser.ts';
import { extractStructuredCV, answerRecruiterQuery, improveText, tailorToJobDescription } from './ai.ts';
import type { FullProfileData, TemplateConfig } from '../types/index.ts';

const router = Router();

// Configure local file uploads directory
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// Middleware to extract authenticated user from header
function getAuthUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Simple session token lookup or direct user id
    if (token.startsWith('usr_')) return token;
  }
  const sessionUser = req.headers['x-user-id'] as string;
  if (sessionUser) return sessionUser;

  // Fallback to default demo user if available
  const firstUser = db.getAllUsers()[0];
  return firstUser ? firstUser.id : null;
}

// ----------------------------------------------------
// 1. AUTHENTICATION & USER MANAGEMENT
// ----------------------------------------------------

router.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { email, name, username, password } = req.body;
    if (!email || !name || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingEmail = db.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const existingUsername = db.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const user = db.createUser({
      email,
      name,
      username,
      passwordHash: password, // In production with bcrypt
    });

    res.status(201).json({ user, token: user.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.getUserByEmail(email);
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { passwordHash, ...cleanUser } = user;
    res.json({ user: cleanUser, token: cleanUser.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/me', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const profile = db.getProfileByUserId(userId);
  res.json({ user, hasProfile: !!profile });
});

router.get('/auth/users', (req: Request, res: Response) => {
  const users = db.getAllUsers();
  res.json({ users });
});

router.post('/auth/reset', (req: Request, res: Response) => {
  try {
    db.resetToCleanSlate();
    const firstUser = db.getAllUsers()[0];
    res.json({ success: true, user: firstUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. CV UPLOAD & ONBOARDING PIPELINE
// ----------------------------------------------------

// Stage 1: Upload and Parse CV -> Returns extracted data for USER REVIEW (does NOT save to DB yet)
router.post('/cv/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No CV file provided' });
    }

    const file = req.file;
    const rawText = await parseDocumentBuffer(file.buffer, file.mimetype, file.originalname);

    if (!rawText || rawText.length < 30) {
      return res.status(400).json({ error: 'Could not extract sufficient text from the uploaded CV. Please ensure the file is not an empty or password-protected document.' });
    }

    // Save physical file record for history
    const savedFileName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, savedFileName);
    fs.writeFileSync(filePath, file.buffer);
    const fileUrl = `/api/files/${savedFileName}`;

    db.saveCVFileRecord({
      userId,
      fileName: file.originalname,
      fileUrl,
      rawText,
    });

    // Run AI structured extraction
    const extractedData = await extractStructuredCV(rawText);

    res.json({
      success: true,
      originalFileName: file.originalname,
      originalFileUrl: fileUrl,
      rawTextLength: rawText.length,
      extractedData,
    });
  } catch (err: any) {
    console.error('CV upload/parse endpoint error:', err);
    res.status(500).json({ error: err.message || 'Failed to process CV' });
  }
});

// Stage 2: User Confirms Reviewed & Edited Data -> Commits to PostgreSQL Database as Source of Truth
router.post('/cv/commit', (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const data = req.body;
    if (!data || !data.profile) {
      return res.status(400).json({ error: 'Invalid profile data payload' });
    }

    const fullProfile = db.commitExtractedCV(userId, {
      profile: data.profile,
      experiences: data.experiences || [],
      education: data.education || [],
      skills: data.skills || [],
      projects: data.projects || [],
      certifications: data.certifications || [],
      achievements: data.achievements || [],
      publications: data.publications || [],
      socialLinks: data.socialLinks || [],
      rawCvText: data.rawCvText,
      originalCvFileName: data.originalCvFileName,
      originalCvFileUrl: data.originalCvFileUrl,
    });

    res.json({
      success: true,
      message: 'CV data successfully confirmed and committed to database source of truth.',
      fullProfile,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. CV RE-IMPORT & DIFF ENGINE
// ----------------------------------------------------

router.post('/cv/reimport-diff', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const currentProfile = db.getFullProfileByUserId(userId);
    if (!currentProfile) {
      return res.status(404).json({ error: 'No existing profile found. Please complete initial onboarding first.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No CV file provided' });
    }

    const file = req.file;
    const rawText = await parseDocumentBuffer(file.buffer, file.mimetype, file.originalname);
    const newExtracted = await extractStructuredCV(rawText);

    // Compute granular diffs
    const additions: any[] = [];
    const modifications: any[] = [];
    const removals: any[] = [];

    // Experiences diff
    newExtracted.experiences.forEach(newExp => {
      const match = currentProfile.experiences.find(
        curr => curr.company.toLowerCase() === newExp.company.toLowerCase() || curr.role.toLowerCase() === newExp.role.toLowerCase()
      );
      if (!match) {
        additions.push({ section: 'Experience', item: newExp });
      } else if (match.description !== newExp.description && newExp.description.length > 20) {
        modifications.push({ section: 'Experience', current: match, proposed: newExp, field: 'description' });
      }
    });

    // Skills diff
    newExtracted.skills.forEach(newSkill => {
      const exists = currentProfile.skills.some(
        s => s.name.toLowerCase() === newSkill.name.toLowerCase()
      );
      if (!exists) {
        additions.push({ section: 'Skills', item: newSkill });
      }
    });

    // Projects diff
    newExtracted.projects.forEach(newProj => {
      const exists = currentProfile.projects.some(
        p => p.title.toLowerCase() === newProj.title.toLowerCase()
      );
      if (!exists) {
        additions.push({ section: 'Projects', item: newProj });
      }
    });

    // Certifications diff
    newExtracted.certifications.forEach(newCert => {
      const exists = currentProfile.certifications.some(
        c => c.name.toLowerCase() === newCert.name.toLowerCase()
      );
      if (!exists) {
        additions.push({ section: 'Certifications', item: newCert });
      }
    });

    res.json({
      success: true,
      originalFileName: file.originalname,
      diff: {
        additions,
        modifications,
        removals,
        summary: `Detected ${additions.length} new items and ${modifications.length} updated fields.`,
      },
      newExtracted,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. PROFILE & ENTITY CRUD
// ----------------------------------------------------

router.get('/profile', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const fullData = db.getFullProfileByUserId(userId);
  if (!fullData) {
    return res.status(404).json({ error: 'Profile not found. Onboarding required.' });
  }
  res.json(fullData);
});

router.put('/profile', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const current = db.getProfileByUserId(userId);
  if (!current) return res.status(404).json({ error: 'Profile not found' });

  const updated = db.updateProfile(current.id, req.body);
  res.json(updated);
});

router.put('/profile/template', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required' });

  const current = db.getProfileByUserId(userId);
  if (!current) return res.status(404).json({ error: 'Profile not found' });

  const templateConfig: TemplateConfig = req.body;
  const updated = db.updateProfile(current.id, { templateConfig });
  res.json(updated);
});

// Experiences CRUD
router.post('/experiences', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const exp = db.saveExperience({ ...req.body, profileId: profile.id });
  res.json(exp);
});

router.put('/experiences/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const exp = db.saveExperience({ ...req.body, id: req.params.id, profileId: profile.id });
  res.json(exp);
});

router.delete('/experiences/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  db.deleteExperience(req.params.id, profile.id);
  res.json({ success: true });
});

// Projects CRUD
router.post('/projects', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const proj = db.saveProject({ ...req.body, profileId: profile.id });
  res.json(proj);
});

router.put('/projects/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const proj = db.saveProject({ ...req.body, id: req.params.id, profileId: profile.id });
  res.json(proj);
});

router.delete('/projects/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  db.deleteProject(req.params.id, profile.id);
  res.json({ success: true });
});

// Skills CRUD
router.post('/skills', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const skill = db.saveSkill({ ...req.body, profileId: profile.id });
  res.json(skill);
});

router.put('/skills/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const skill = db.saveSkill({ ...req.body, id: req.params.id, profileId: profile.id });
  res.json(skill);
});

router.delete('/skills/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  db.deleteSkill(req.params.id, profile.id);
  res.json({ success: true });
});

// Education CRUD
router.post('/education', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const edu = db.saveEducation({ ...req.body, profileId: profile.id });
  res.json(edu);
});

router.put('/education/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const edu = db.saveEducation({ ...req.body, id: req.params.id, profileId: profile.id });
  res.json(edu);
});

router.delete('/education/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  db.deleteEducation(req.params.id, profile.id);
  res.json({ success: true });
});

// Certifications CRUD
router.post('/certifications', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const cert = db.saveCertification({ ...req.body, profileId: profile.id });
  res.json(cert);
});

router.delete('/certifications/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  db.deleteCertification(req.params.id, profile.id);
  res.json({ success: true });
});

// Achievements CRUD
router.post('/achievements', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const ach = db.saveAchievement({ ...req.body, profileId: profile.id });
  res.json(ach);
});

router.delete('/achievements/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  db.deleteAchievement(req.params.id, profile.id);
  res.json({ success: true });
});

// Publications CRUD
router.post('/publications', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const pub = db.savePublication({ ...req.body, profileId: profile.id });
  res.json(pub);
});

router.delete('/publications/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  db.deletePublication(req.params.id, profile.id);
  res.json({ success: true });
});

// Social Links Save
router.put('/social-links', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const updated = db.saveSocialLinks(profile.id, req.body.links || []);
  res.json({ links: updated });
});

// CV Versions CRUD
router.get('/versions', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const versions = db.getCVVersions(profile.id);
  res.json({ versions });
});

router.post('/versions', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const version = db.saveCVVersion({ ...req.body, profileId: profile.id });
  res.json(version);
});

router.put('/versions/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const version = db.saveCVVersion({ ...req.body, id: req.params.id, profileId: profile.id });
  res.json(version);
});

router.delete('/versions/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  db.deleteCVVersion(req.params.id, profile.id);
  res.json({ success: true });
});

// ----------------------------------------------------
// 5. PUBLIC PROFILE & ANALYTICS
// ----------------------------------------------------

router.get('/public/:username', (req: Request, res: Response) => {
  const { username } = req.params;
  const versionSlug = req.query.v as string | undefined;

  const fullProfile = db.getFullProfileByUsername(username);
  if (!fullProfile || !fullProfile.profile.isPublic) {
    return res.status(404).json({ error: 'Public profile not found or is private' });
  }

  // Record page view event
  db.recordAnalyticsEvent({
    profileId: fullProfile.profile.id,
    eventType: 'page_view',
    referrer: req.headers.referer || req.headers.referrer as string || 'direct',
    metadata: { versionSlug: versionSlug || 'default' },
  });

  const user = db.getUserById(fullProfile.profile.userId);

  res.json({
    user,
    fullProfile,
    activeVersionSlug: versionSlug || 'general',
  });
});

router.post('/analytics/event', (req: Request, res: Response) => {
  const { profileId, eventType, targetId, metadata } = req.body;
  if (!profileId || !eventType) {
    return res.status(400).json({ error: 'profileId and eventType required' });
  }

  db.recordAnalyticsEvent({
    profileId,
    eventType,
    targetId,
    metadata,
    referrer: req.headers.referer || req.headers.referrer as string,
  });

  res.json({ success: true });
});

router.get('/analytics', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.getProfileByUserId(userId);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const summary = db.getAnalyticsSummary(profile.id);
  res.json(summary);
});

// ----------------------------------------------------
// 6. AI FEATURES & RECRUITER ASSISTANT
// ----------------------------------------------------

router.post('/ai/recruiter-chat', async (req: Request, res: Response) => {
  try {
    const { username, query, versionSlug, chatHistory } = req.body;
    if (!username || !query) {
      return res.status(400).json({ error: 'username and query required' });
    }

    const candidateProfile = db.getFullProfileByUsername(username);
    if (!candidateProfile) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }

    // Record recruiter chat interaction
    db.recordAnalyticsEvent({
      profileId: candidateProfile.profile.id,
      eventType: 'recruiter_chat',
      metadata: { queryPreview: query.slice(0, 80) },
    });

    const result = await answerRecruiterQuery({
      query,
      candidateProfile,
      versionSlug,
      chatHistory,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/improve', async (req: Request, res: Response) => {
  try {
    const { text, type, context } = req.body;
    if (!text || !type) {
      return res.status(400).json({ error: 'text and type required' });
    }

    const result = await improveText({ text, type, context });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/tailor', async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const profileData = db.getFullProfileByUserId(userId);
    if (!profileData) return res.status(404).json({ error: 'Profile not found' });

    const { jobDescription } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'Job description required' });

    const analysis = await tailorToJobDescription({ profileData, jobDescription });
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 7. GITHUB INTEGRATION (REAL PUBLIC API)
// ----------------------------------------------------

router.get('/github/user/:githubUser', async (req: Request, res: Response) => {
  try {
    const { githubUser } = req.params;
    const response = await fetch(`https://api.github.com/users/${encodeURIComponent(githubUser)}/repos?sort=updated&per_page=20`, {
      headers: {
        'User-Agent': 'DigitalCV-Platform',
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `GitHub API error: ${response.statusText}` });
    }

    const repos = await response.json();
    const formatted = repos
      .filter((r: any) => !r.fork)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        language: r.language || 'Code',
        stars: r.stargazers_count,
        forks: r.forks_count,
        url: r.html_url,
        homepage: r.homepage || '',
        updatedAt: r.updated_at,
        topics: r.topics || [],
      }));

    res.json({ repositories: formatted });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 8. QR CODE & GENERAL FILE UPLOAD
// ----------------------------------------------------

router.get('/qr', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const qrDataUrl = await QRCode.toDataURL(url, {
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    res.json({ dataUrl: qrDataUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/upload/file', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const savedName = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, savedName);
    fs.writeFileSync(filePath, req.file.buffer);

    res.json({
      url: `/api/files/${savedName}`,
      fileName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve uploaded static files safely
router.get('/files/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  res.sendFile(filePath);
});

export default router;
