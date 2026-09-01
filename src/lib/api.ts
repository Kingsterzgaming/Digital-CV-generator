import type {
  User,
  FullProfileData,
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
  AnalyticsSummary,
  CVDiffResult,
} from '../types/index.ts';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('digitalcv_token') || 'usr_user';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-user-id': token,
    };
  }

  // --- Auth ---
  async resetAllData(): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset data');
    return res.json();
  }
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  }

  async register(data: { email: string; name: string; username: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  }

  async getMe(): Promise<{ user: User; hasProfile: boolean }> {
    const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  }

  async getAllUsers(): Promise<{ users: User[] }> {
    const res = await fetch('/api/auth/users');
    return res.json();
  }

  // --- CV Upload & Onboarding ---
  async uploadCV(file: File): Promise<{
    success: boolean;
    originalFileName: string;
    originalFileUrl: string;
    rawTextLength: number;
    extractedData: any;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('digitalcv_token') || 'usr_user';
    const res = await fetch('/api/cv/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': token,
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload CV');
    }
    return res.json();
  }

  async commitExtractedCV(data: any): Promise<{ success: boolean; fullProfile: FullProfileData }> {
    const res = await fetch('/api/cv/commit', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to commit CV');
    }
    return res.json();
  }

  async reimportCV(file: File): Promise<{
    success: boolean;
    originalFileName: string;
    diff: CVDiffResult;
    newExtracted: any;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('digitalcv_token') || 'usr_user';
    const res = await fetch('/api/cv/reimport-diff', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-user-id': token,
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze CV diff');
    }
    return res.json();
  }

  // --- Profile ---
  async getProfile(): Promise<FullProfileData> {
    const res = await fetch('/api/profile', { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to load profile');
    }
    return res.json();
  }

  async getMyProfile(): Promise<FullProfileData> {
    return this.getProfile();
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  }

  async updateTemplateConfig(config: TemplateConfig): Promise<Profile> {
    const res = await fetch('/api/profile/template', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update template');
    return res.json();
  }

  // --- Experiences ---
  async saveExperience(exp: Partial<Experience>): Promise<Experience> {
    const url = exp.id ? `/api/experiences/${exp.id}` : '/api/experiences';
    const method = exp.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(exp),
    });
    return res.json();
  }

  async deleteExperience(id: string): Promise<void> {
    await fetch(`/api/experiences/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // --- Projects ---
  async saveProject(proj: Partial<Project>): Promise<Project> {
    const url = proj.id ? `/api/projects/${proj.id}` : '/api/projects';
    const method = proj.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(proj),
    });
    return res.json();
  }

  async deleteProject(id: string): Promise<void> {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // --- Skills ---
  async saveSkill(skill: Partial<Skill>): Promise<Skill> {
    const url = skill.id ? `/api/skills/${skill.id}` : '/api/skills';
    const method = skill.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(skill),
    });
    return res.json();
  }

  async deleteSkill(id: string): Promise<void> {
    await fetch(`/api/skills/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // --- Education ---
  async saveEducation(edu: Partial<Education>): Promise<Education> {
    const url = edu.id ? `/api/education/${edu.id}` : '/api/education';
    const method = edu.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(edu),
    });
    return res.json();
  }

  async deleteEducation(id: string): Promise<void> {
    await fetch(`/api/education/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // --- Certifications ---
  async saveCertification(cert: Partial<Certification>): Promise<Certification> {
    const url = cert.id ? `/api/certifications/${cert.id}` : '/api/certifications';
    const method = cert.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(cert),
    });
    return res.json();
  }

  async deleteCertification(id: string): Promise<void> {
    await fetch(`/api/certifications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // --- Achievements ---
  async saveAchievement(ach: Partial<Achievement>): Promise<Achievement> {
    const url = ach.id ? `/api/achievements/${ach.id}` : '/api/achievements';
    const method = ach.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(ach),
    });
    return res.json();
  }

  async deleteAchievement(id: string): Promise<void> {
    await fetch(`/api/achievements/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // --- Publications ---
  async savePublication(pub: Partial<Publication>): Promise<Publication> {
    const url = pub.id ? `/api/publications/${pub.id}` : '/api/publications';
    const method = pub.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(pub),
    });
    return res.json();
  }

  async deletePublication(id: string): Promise<void> {
    await fetch(`/api/publications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // --- Social Links ---
  async saveSocialLinks(links: SocialLink[]): Promise<{ links: SocialLink[] }> {
    const res = await fetch('/api/social-links', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ links }),
    });
    return res.json();
  }

  // --- CV Versions ---
  async getVersions(): Promise<{ versions: CVVersion[] }> {
    const res = await fetch('/api/versions', { headers: this.getHeaders() });
    return res.json();
  }

  async saveVersion(version: Partial<CVVersion>): Promise<CVVersion> {
    const url = version.id ? `/api/versions/${version.id}` : '/api/versions';
    const method = version.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: JSON.stringify(version),
    });
    return res.json();
  }

  async deleteVersion(id: string): Promise<void> {
    await fetch(`/api/versions/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // --- Public Profile ---
  async getPublicProfile(username: string, versionSlug?: string): Promise<{
    user: User;
    fullProfile: FullProfileData;
    activeVersionSlug: string;
  }> {
    const url = versionSlug ? `/api/public/${username}?v=${versionSlug}` : `/api/public/${username}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Profile not found');
    }
    return res.json();
  }

  // --- Analytics ---
  async getAnalytics(): Promise<AnalyticsSummary> {
    const res = await fetch('/api/analytics', { headers: this.getHeaders() });
    return res.json();
  }

  async recordEvent(params: { profileId: string; eventType: string; targetId?: string; referrer?: string; metadata?: any }): Promise<void> {
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch {
      // Non-blocking
    }
  }

  // --- AI Features ---
  async askRecruiterAI(params: {
    username: string;
    query: string;
    versionSlug?: string;
    chatHistory?: { role: string; content: string }[];
  }): Promise<{ answer: string; sources: string[] }> {
    const res = await fetch('/api/ai/recruiter-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to get AI response');
    return res.json();
  }

  async improveText(params: { text: string; type: 'summary' | 'project' | 'experience' | 'headline'; context?: string }): Promise<{ improved: string; rationale: string }> {
    const res = await fetch('/api/ai/improve', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    return res.json();
  }

  async tailorToJob(jobDescription: string): Promise<any> {
    const res = await fetch('/api/ai/tailor', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ jobDescription }),
    });
    return res.json();
  }

  async tailorForJob(params: { jobTitle?: string; jobDescription: string }): Promise<any> {
    const res = await fetch('/api/ai/tailor', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Job tailoring failed');
    return res.json();
  }

  // --- GitHub & Media ---
  async getGitHubRepos(username: string): Promise<{ repositories: any[] }> {
    const res = await fetch(`/api/github/user/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error('GitHub user not found or error');
    return res.json();
  }

  async getQRCode(url: string): Promise<{ dataUrl: string }> {
    const res = await fetch(`/api/qr?url=${encodeURIComponent(url)}`);
    return res.json();
  }

  async uploadMedia(file: File): Promise<{ url: string; fileName: string; size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/file', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  }
}

export const api = new ApiClient();
