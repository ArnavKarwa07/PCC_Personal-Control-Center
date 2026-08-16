import { create } from 'zustand';
import {
  Achievement,
  CareerSummary,
  Certification,
  Experience,
  ResumeVersion,
  Skill,
} from '../types';
import { careerApi } from '../services/api';
import { generateId } from '../utils';

export type CareerTab =
  | 'overview'
  | 'achievements'
  | 'skills'
  | 'experiences'
  | 'certifications'
  | 'resumes';

interface CareerStore {
  summary: CareerSummary | null;
  achievements: Achievement[];
  skills: Skill[];
  certifications: Certification[];
  experiences: Experience[];
  resumes: ResumeVersion[];
  isLoading: boolean;
  error: string | null;
  activeTab: CareerTab;
  filterCategory: string;
  searchQuery: string;
  resumeRelevantOnly: boolean;

  // Actions
  setActiveTab: (tab: CareerTab) => void;
  setFilterCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setResumeRelevantOnly: (val: boolean) => void;

  fetchAll: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchCertifications: () => Promise<void>;
  fetchExperiences: () => Promise<void>;
  fetchResumes: () => Promise<void>;

  addAchievement: (data: Partial<Achievement>) => Promise<Achievement>;
  updateAchievement: (id: string, data: Partial<Achievement>) => Promise<void>;
  deleteAchievement: (id: string) => Promise<void>;

  addSkill: (data: Partial<Skill>) => Promise<Skill>;
  updateSkill: (id: string, data: Partial<Skill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;

  addCertification: (data: Partial<Certification>) => Promise<Certification>;
  updateCertification: (id: string, data: Partial<Certification>) => Promise<void>;
  deleteCertification: (id: string) => Promise<void>;

  addExperience: (data: Partial<Experience>) => Promise<Experience>;
  updateExperience: (id: string, data: Partial<Experience>) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;

  addResume: (data: Partial<ResumeVersion>) => Promise<ResumeVersion>;
  updateResume: (id: string, data: Partial<ResumeVersion>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Architected PCC Personal Control Center Core OS',
    description:
      'Engineered ultra-responsive multi-agent personal cockpit with FastAPI async telemetry, React 18 frontend, and sub-10ms state updates.',
    date: '2026-07-28',
    category: 'Architecture',
    evidence: 'https://github.com/ArnavKarwa07/PCC_Personal-Control-Center',
    resume_relevant: true,
    linkedin_relevant: true,
  },
  {
    id: 'ach-2',
    title: 'Optimized Real-Time State Synchronization Pipeline',
    description:
      'Eliminated duplicate REST payloads and achieved WCAG AA accessible light-themed glassmorphism design tokens across 24 modules.',
    date: '2026-06-15',
    category: 'Frontend Engineering',
    evidence: 'https://pcc.internal/telemetry-benchmark',
    resume_relevant: true,
    linkedin_relevant: true,
  },
  {
    id: 'ach-3',
    title: 'Published Technical Monograph on Distributed Consensus',
    description:
      'Authored deep-dive whitepaper detailing Raft leader election, distributed log compaction, and event-driven microservices.',
    date: '2026-04-10',
    category: 'Thought Leadership',
    evidence: 'https://arnavkarwa.dev/publications/raft-consensus-2026',
    resume_relevant: false,
    linkedin_relevant: true,
  },
  {
    id: 'ach-4',
    title: 'Automated Multi-Service CI/CD Infrastructure with Docker',
    description:
      'Designed self-healing automated deployment pipelines cutting test run cycles by 65% with hermetic SQLite fixtures.',
    date: '2026-02-20',
    category: 'DevOps & Cloud',
    evidence: 'https://github.com/actions/workflows',
    resume_relevant: true,
    linkedin_relevant: false,
  },
];

const INITIAL_SKILLS: Skill[] = [
  { id: 'sk-1', name: 'FastAPI & Python 3.12', category: 'Backend', proficiency: 'Expert' },
  { id: 'sk-2', name: 'React 18 & TypeScript', category: 'Frontend', proficiency: 'Master' },
  { id: 'sk-3', name: 'SQLAlchemy 2.0 & PostgreSQL', category: 'Backend', proficiency: 'Expert' },
  { id: 'sk-4', name: 'Glassmorphic Micro-Interactions & CSS3', category: 'Frontend', proficiency: 'Expert' },
  { id: 'sk-5', name: 'Distributed Systems & Raft', category: 'Architecture', proficiency: 'Advanced' },
  { id: 'sk-6', name: 'Docker & Containerization', category: 'DevOps', proficiency: 'Expert' },
  { id: 'sk-7', name: 'Redis Caching & PubSub', category: 'Backend', proficiency: 'Advanced' },
  { id: 'sk-8', name: 'Autonomous Agent Architecture', category: 'AI & Systems', proficiency: 'Advanced' },
  { id: 'sk-9', name: 'Technical Leadership & Mentorship', category: 'Soft Skills', proficiency: 'Expert' },
];

const INITIAL_EXPERIENCES: Experience[] = [
  {
    id: 'exp-1',
    company: 'PCC Autonomous Systems Labs',
    role: 'Principal Full Stack Architect',
    start_date: '2025-01-01',
    description:
      'Leading overall system design, API contracts, and high-performance UI engineering for personal productivity telemetry. Driving zero-latency agentic workflows.',
    is_current: true,
  },
  {
    id: 'exp-2',
    company: 'Nexus Distributed Tech',
    role: 'Senior Software Engineer',
    start_date: '2023-06-01',
    end_date: '2024-12-31',
    description:
      'Built distributed cache hierarchies, REST/WebSocket streaming interfaces, and accessible design system components used across 5 enterprise apps.',
    is_current: false,
  },
  {
    id: 'exp-3',
    company: 'Quantum Byte Innovations',
    role: 'Software Engineer',
    start_date: '2021-08-01',
    end_date: '2023-05-31',
    description:
      'Implemented real-time analytics dashboards, asynchronous message workers, and robust relational data models with Python and React.',
    is_current: false,
  },
];

const INITIAL_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-1',
    name: 'AWS Certified Solutions Architect – Professional',
    issuer: 'Amazon Web Services',
    date_obtained: '2025-09-15',
    expiry_date: '2028-09-15',
    credential_id: 'AWS-SAP-982310',
  },
  {
    id: 'cert-2',
    name: 'Certified Kubernetes Administrator (CKA)',
    issuer: 'Cloud Native Computing Foundation (CNCF)',
    date_obtained: '2024-11-20',
    expiry_date: '2027-11-20',
    credential_id: 'CKA-2400-88129',
  },
  {
    id: 'cert-3',
    name: 'Meta Front-End Developer Professional Certificate',
    issuer: 'Meta / Coursera',
    date_obtained: '2023-04-10',
    credential_id: 'META-FE-77291',
  },
];

const INITIAL_RESUMES: ResumeVersion[] = [
  {
    id: 'res-1',
    version_name: 'Principal Full Stack Architect (2026)',
    target_role: 'Principal Systems & Full Stack Architect',
    content: `# Arnav Karwa — Principal Full Stack Architect
**Location:** India | **Email:** arnav@example.com | **Portfolio:** github.com/ArnavKarwa07

---

### Professional Summary
Principal Systems Architect with 5+ years specializing in distributed systems, ultra-responsive web applications, and autonomous agent ecosystems. Expert in FastAPI, Python 3.12, TypeScript, React 18, and zero-latency client caching.

---

### Core Competencies
- **Architecture:** Distributed Systems, Event-Driven Services, Raft Consensus, Clean Architecture
- **Backend:** FastAPI, Python, SQLAlchemy, PostgreSQL, Redis, Celery, Pydantic V2
- **Frontend:** React 18, TypeScript, Zustand, Vite, Glassmorphic Design Systems, WCAG AA
- **DevOps:** Docker, Kubernetes, CI/CD GitHub Actions, Linux Systems Administration

---

### Selected Key Accomplishments
- Architected PCC (Personal Control Center) multi-agent operating system coordinating 20+ feature domains with sub-10ms UI latency.
- Reduced server telemetry serialization overhead by 45% using high-throughput Pydantic schemas.
`,
    notes: 'Optimized for high-scale distributed systems and Staff/Principal Full Stack positions.',
  },
  {
    id: 'res-2',
    version_name: 'Lead Frontend & Product Engineer',
    target_role: 'Staff / Lead Frontend Engineer',
    content: `# Arnav Karwa — Staff Frontend Engineer
Focused on design systems, micro-interactions, WCAG AA accessibility, and client-side performance engineering.

### Highlights
- Created bespoke glassmorphic UI token ecosystem with light theme defaults.
- Spearheaded modular state management with Zustand and optimistic local rollbacks.
`,
    notes: 'Tailored for Design-Systems-Heavy and UI/UX focused engineering roles.',
  },
];

export const useCareerStore = create<CareerStore>((set, get) => ({
  summary: null,
  achievements: INITIAL_ACHIEVEMENTS,
  skills: INITIAL_SKILLS,
  certifications: INITIAL_CERTIFICATIONS,
  experiences: INITIAL_EXPERIENCES,
  resumes: INITIAL_RESUMES,
  isLoading: false,
  error: null,
  activeTab: 'overview',
  filterCategory: 'all',
  searchQuery: '',
  resumeRelevantOnly: false,

  setActiveTab: (activeTab) => set({ activeTab }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setResumeRelevantOnly: (resumeRelevantOnly) => set({ resumeRelevantOnly }),

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await Promise.allSettled([
        get().fetchSummary(),
        get().fetchAchievements(),
        get().fetchSkills(),
        get().fetchCertifications(),
        get().fetchExperiences(),
        get().fetchResumes(),
      ]);
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch career data' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await careerApi.getSummary();
      set({ summary });
    } catch {
      // Keep optimistic local calculation
      const { achievements, skills, certifications, experiences, resumes } = get();
      set({
        summary: {
          achievements_count: achievements.length,
          resume_relevant_achievements: achievements.filter((a) => a.resume_relevant).length,
          skills_count: skills.length,
          certifications_count: certifications.length,
          experiences_count: experiences.length,
          resume_versions_count: resumes.length,
          recent_achievements: achievements.slice(0, 5),
          current_experiences: experiences.filter((e) => e.is_current),
        },
      });
    }
  },

  fetchAchievements: async () => {
    try {
      const res = await careerApi.getAchievements();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        set({ achievements: res.data });
      }
    } catch (err) {
      console.warn('API sync fallback for achievements:', err);
    }
  },

  fetchSkills: async () => {
    try {
      const res = await careerApi.getSkills();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        set({ skills: res.data });
      }
    } catch (err) {
      console.warn('API sync fallback for skills:', err);
    }
  },

  fetchCertifications: async () => {
    try {
      const res = await careerApi.getCertifications();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        set({ certifications: res.data });
      }
    } catch (err) {
      console.warn('API sync fallback for certifications:', err);
    }
  },

  fetchExperiences: async () => {
    try {
      const res = await careerApi.getExperiences();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        set({ experiences: res.data });
      }
    } catch (err) {
      console.warn('API sync fallback for experiences:', err);
    }
  },

  fetchResumes: async () => {
    try {
      const res = await careerApi.getResumes();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        set({ resumes: res.data });
      }
    } catch (err) {
      console.warn('API sync fallback for resumes:', err);
    }
  },

  addAchievement: async (data) => {
    const tempItem: Achievement = {
      id: generateId(),
      title: data.title || 'New Achievement',
      description: data.description,
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || 'General',
      evidence: data.evidence,
      resume_relevant: Boolean(data.resume_relevant),
      linkedin_relevant: Boolean(data.linkedin_relevant),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ achievements: [tempItem, ...state.achievements] }));
    get().fetchSummary();

    try {
      const res = await careerApi.createAchievement(data);
      if (res.data) {
        set((state) => ({
          achievements: state.achievements.map((a) => (a.id === tempItem.id ? res.data : a)),
        }));
        return res.data;
      }
    } catch (err) {
      console.warn('Persisted locally. Server sync error:', err);
    }
    return tempItem;
  },

  updateAchievement: async (id, data) => {
    set((state) => ({
      achievements: state.achievements.map((a) => (a.id === id ? { ...a, ...data } : a)),
    }));
    get().fetchSummary();

    try {
      await careerApi.updateAchievement(id, data);
    } catch (err) {
      console.warn('Server sync error for updateAchievement:', err);
    }
  },

  deleteAchievement: async (id) => {
    set((state) => ({
      achievements: state.achievements.filter((a) => a.id !== id),
    }));
    get().fetchSummary();

    try {
      await careerApi.deleteAchievement(id);
    } catch (err) {
      console.warn('Server sync error for deleteAchievement:', err);
    }
  },

  addSkill: async (data) => {
    const tempItem: Skill = {
      id: generateId(),
      name: data.name || 'New Skill',
      category: data.category || 'Technical',
      proficiency: data.proficiency || 'Intermediate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ skills: [...state.skills, tempItem] }));
    get().fetchSummary();

    try {
      const res = await careerApi.createSkill(data);
      if (res.data) {
        set((state) => ({
          skills: state.skills.map((s) => (s.id === tempItem.id ? res.data : s)),
        }));
        return res.data;
      }
    } catch (err) {
      console.warn('Persisted locally. Server sync error:', err);
    }
    return tempItem;
  },

  updateSkill: async (id, data) => {
    set((state) => ({
      skills: state.skills.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
    try {
      await careerApi.updateSkill(id, data);
    } catch (err) {
      console.warn('Server sync error for updateSkill:', err);
    }
  },

  deleteSkill: async (id) => {
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id),
    }));
    get().fetchSummary();

    try {
      await careerApi.deleteSkill(id);
    } catch (err) {
      console.warn('Server sync error for deleteSkill:', err);
    }
  },

  addCertification: async (data) => {
    const tempItem: Certification = {
      id: generateId(),
      name: data.name || 'New Certification',
      issuer: data.issuer || 'Issuer',
      date_obtained: data.date_obtained,
      expiry_date: data.expiry_date,
      credential_id: data.credential_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ certifications: [tempItem, ...state.certifications] }));
    get().fetchSummary();

    try {
      const res = await careerApi.createCertification(data);
      if (res.data) {
        set((state) => ({
          certifications: state.certifications.map((c) => (c.id === tempItem.id ? res.data : c)),
        }));
        return res.data;
      }
    } catch (err) {
      console.warn('Persisted locally. Server sync error:', err);
    }
    return tempItem;
  },

  updateCertification: async (id, data) => {
    set((state) => ({
      certifications: state.certifications.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    try {
      await careerApi.updateCertification(id, data);
    } catch (err) {
      console.warn('Server sync error for updateCertification:', err);
    }
  },

  deleteCertification: async (id) => {
    set((state) => ({
      certifications: state.certifications.filter((c) => c.id !== id),
    }));
    get().fetchSummary();

    try {
      await careerApi.deleteCertification(id);
    } catch (err) {
      console.warn('Server sync error for deleteCertification:', err);
    }
  },

  addExperience: async (data) => {
    const tempItem: Experience = {
      id: generateId(),
      company: data.company || 'Company',
      role: data.role || 'Role',
      start_date: data.start_date,
      end_date: data.end_date,
      description: data.description,
      is_current: Boolean(data.is_current),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ experiences: [tempItem, ...state.experiences] }));
    get().fetchSummary();

    try {
      const res = await careerApi.createExperience(data);
      if (res.data) {
        set((state) => ({
          experiences: state.experiences.map((e) => (e.id === tempItem.id ? res.data : e)),
        }));
        return res.data;
      }
    } catch (err) {
      console.warn('Persisted locally. Server sync error:', err);
    }
    return tempItem;
  },

  updateExperience: async (id, data) => {
    set((state) => ({
      experiences: state.experiences.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
    get().fetchSummary();

    try {
      await careerApi.updateExperience(id, data);
    } catch (err) {
      console.warn('Server sync error for updateExperience:', err);
    }
  },

  deleteExperience: async (id) => {
    set((state) => ({
      experiences: state.experiences.filter((e) => e.id !== id),
    }));
    get().fetchSummary();

    try {
      await careerApi.deleteExperience(id);
    } catch (err) {
      console.warn('Server sync error for deleteExperience:', err);
    }
  },

  addResume: async (data) => {
    const tempItem: ResumeVersion = {
      id: generateId(),
      version_name: data.version_name || 'Resume Version',
      target_role: data.target_role,
      content: data.content,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => ({ resumes: [tempItem, ...state.resumes] }));
    get().fetchSummary();

    try {
      const res = await careerApi.createResume(data);
      if (res.data) {
        set((state) => ({
          resumes: state.resumes.map((r) => (r.id === tempItem.id ? res.data : r)),
        }));
        return res.data;
      }
    } catch (err) {
      console.warn('Persisted locally. Server sync error:', err);
    }
    return tempItem;
  },

  updateResume: async (id, data) => {
    set((state) => ({
      resumes: state.resumes.map((r) => (r.id === id ? { ...r, ...data } : r)),
    }));
    try {
      await careerApi.updateResume(id, data);
    } catch (err) {
      console.warn('Server sync error for updateResume:', err);
    }
  },

  deleteResume: async (id) => {
    set((state) => ({
      resumes: state.resumes.filter((r) => r.id !== id),
    }));
    get().fetchSummary();

    try {
      await careerApi.deleteResume(id);
    } catch (err) {
      console.warn('Server sync error for deleteResume:', err);
    }
  },
}));
