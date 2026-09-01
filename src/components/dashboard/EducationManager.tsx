import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import type { Education, Certification, Achievement } from '../../types/index.ts';

export const EducationManager: React.FC = () => {
  const { fullProfile, setLocalFullProfile } = useAuth();
  const [isAddingEdu, setIsAddingEdu] = useState<boolean>(false);
  const [isAddingCert, setIsAddingCert] = useState<boolean>(false);

  const [eduForm, setEduForm] = useState<Partial<Education>>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    gpa: '',
    honors: '',
    courses: [],
  });

  const [certForm, setCertForm] = useState<Partial<Certification>>({
    name: '',
    issuer: '',
    issueDate: '',
    credentialUrl: '',
  });

  if (!fullProfile) return null;
  const education = fullProfile.education || [];
  const certifications = fullProfile.certifications || [];
  const achievements = fullProfile.achievements || [];

  const handleSaveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.institution || !eduForm.degree) return;
    try {
      const saved = await api.saveEducation(eduForm);
      setLocalFullProfile(prev => prev ? {
        ...prev,
        education: [...prev.education, saved],
      } : null);
      setIsAddingEdu(false);
      setEduForm({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' });
    } catch (err) {
      console.error('Failed to save education:', err);
    }
  };

  const handleDeleteEdu = async (id: string) => {
    try {
      await api.deleteEducation(id);
      setLocalFullProfile(prev => prev ? {
        ...prev,
        education: prev.education.filter(e => e.id !== id),
      } : null);
    } catch (err) {
      console.error('Failed to delete education:', err);
    }
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.name || !certForm.issuer) return;
    try {
      const saved = await api.saveCertification(certForm);
      setLocalFullProfile(prev => prev ? {
        ...prev,
        certifications: [...prev.certifications, saved],
      } : null);
      setIsAddingCert(false);
      setCertForm({ name: '', issuer: '', issueDate: '' });
    } catch (err) {
      console.error('Failed to save cert:', err);
    }
  };

  const handleDeleteCert = async (id: string) => {
    try {
      await api.deleteCertification(id);
      setLocalFullProfile(prev => prev ? {
        ...prev,
        certifications: prev.certifications.filter(c => c.id !== id),
      } : null);
    } catch (err) {
      console.error('Failed to delete cert:', err);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* 1. Education Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-white">Education & Degrees</h2>
            <p className="text-xs text-neutral-400">Academic credentials stored in PostgreSQL.</p>
          </div>
          {!isAddingEdu && (
            <button
              onClick={() => setIsAddingEdu(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Degree</span>
            </button>
          )}
        </div>

        {isAddingEdu && (
          <form onSubmit={handleSaveEdu} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">University / Institution *</label>
                <input
                  type="text"
                  required
                  value={eduForm.institution}
                  onChange={e => setEduForm({ ...eduForm, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Degree & Major *</label>
                <input
                  type="text"
                  required
                  value={eduForm.degree}
                  onChange={e => setEduForm({ ...eduForm, degree: e.target.value })}
                  placeholder="e.g. Master of Science in Computer Science"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Years Attended</label>
                <input
                  type="text"
                  value={eduForm.startDate}
                  onChange={e => setEduForm({ ...eduForm, startDate: e.target.value })}
                  placeholder="e.g. 2018 - 2022"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">GPA / Honors</label>
                <input
                  type="text"
                  value={eduForm.honors || ''}
                  onChange={e => setEduForm({ ...eduForm, honors: e.target.value })}
                  placeholder="e.g. GPA 3.9 / Magna Cum Laude"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddingEdu(false)} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-xs text-neutral-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                Save Degree
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {education.map(edu => (
            <div key={edu.id} className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</h4>
                <p className="text-xs text-indigo-400">{edu.institution}</p>
                <p className="text-[11px] text-neutral-400">{edu.startDate} – {edu.endDate || 'Present'} {edu.honors && `• ${edu.honors}`}</p>
              </div>
              <button onClick={() => handleDeleteEdu(edu.id)} className="text-neutral-500 hover:text-rose-400 p-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Certifications Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-white">Certifications & Licenses</h2>
            <p className="text-xs text-neutral-400">Industry certifications and verified badges.</p>
          </div>
          {!isAddingCert && (
            <button
              onClick={() => setIsAddingCert(true)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certification</span>
            </button>
          )}
        </div>

        {isAddingCert && (
          <form onSubmit={handleSaveCert} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Certification Name *</label>
                <input
                  type="text"
                  required
                  value={certForm.name}
                  onChange={e => setCertForm({ ...certForm, name: e.target.value })}
                  placeholder="e.g. AWS Solutions Architect Professional"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Issuing Body *</label>
                <input
                  type="text"
                  required
                  value={certForm.issuer}
                  onChange={e => setCertForm({ ...certForm, issuer: e.target.value })}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Issue Date</label>
                <input
                  type="text"
                  value={certForm.issueDate}
                  onChange={e => setCertForm({ ...certForm, issueDate: e.target.value })}
                  placeholder="e.g. 2023"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddingCert(false)} className="px-3 py-1.5 rounded-lg bg-neutral-800 text-xs text-neutral-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                Save Certification
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {certifications.map(cert => (
            <div key={cert.id} className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">{cert.name}</h4>
                <p className="text-xs text-indigo-400">{cert.issuer} ({cert.issueDate})</p>
              </div>
              <button onClick={() => handleDeleteCert(cert.id)} className="text-neutral-500 hover:text-rose-400 p-2">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
