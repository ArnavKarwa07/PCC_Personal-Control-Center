import React, { useEffect, useState } from 'react';
import { Card, Button, Badge, Input, Modal } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import type { CareerTab } from '../../stores/careerStore';
import { useCareerStore } from '../../stores/careerStore';
import type {
  ResumeVersion,
  Skill,
  SkillProficiency,
} from '../../types';
import './CareerPage.css';


const PROFICIENCY_LEVELS: SkillProficiency[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
  'Master',
];

export const CareerPage: React.FC = () => {
  const { toast } = useToast();
  const {
    summary,
    achievements,
    skills,
    certifications,
    experiences,
    resumes,
    activeTab,
    filterCategory,
    searchQuery,
    resumeRelevantOnly,
    setActiveTab,
    setFilterCategory,
    setSearchQuery,
    setResumeRelevantOnly,
    fetchAll,
    addAchievement,
    updateAchievement,
    deleteAchievement,
    addSkill,
    updateSkill,
    deleteSkill,
    addCertification,
    deleteCertification,
    addExperience,
    deleteExperience,
    addResume,
    deleteResume,
  } = useCareerStore();

  // Modals state
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [viewResume, setViewResume] = useState<ResumeVersion | null>(null);

  // Form states for Achievement
  const [achTitle, setAchTitle] = useState('');
  const [achDesc, setAchDesc] = useState('');
  const [achCategory, setAchCategory] = useState('Architecture');
  const [achDate, setAchDate] = useState(new Date().toISOString().split('T')[0]);
  const [achEvidence, setAchEvidence] = useState('');
  const [achResumeRel, setAchResumeRel] = useState(true);
  const [achLinkedinRel, setAchLinkedinRel] = useState(true);

  // Form states for Skill
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('Backend');
  const [skillProficiency, setSkillProficiency] = useState<SkillProficiency>('Expert');

  // Form states for Experience
  const [expCompany, setExpCompany] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expIsCurrent, setExpIsCurrent] = useState(false);

  // Form states for Certification
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certCredId, setCertCredId] = useState('');

  // Form states for Resume
  const [resVersionName, setResVersionName] = useState('');
  const [resTargetRole, setResTargetRole] = useState('');
  const [resContent, setResContent] = useState('');
  const [resNotes, setResNotes] = useState('');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Categories list for achievements & skills
  const achievementCategories = [
    'all',
    ...Array.from(new Set(achievements.map((a) => a.category).filter(Boolean) as string[])),
  ];

  const skillCategories = [
    'all',
    ...Array.from(new Set(skills.map((s) => s.category).filter(Boolean) as string[])),
  ];

  // Filtered achievements
  const filteredAchievements = achievements.filter((a) => {
    const matchesCat = filterCategory === 'all' || a.category?.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesResume = !resumeRelevantOnly || a.resume_relevant;
    return matchesCat && matchesSearch && matchesResume;
  });

  // Filtered skills
  const filteredSkills = skills.filter((s) => {
    const matchesCat = filterCategory === 'all' || s.category?.toLowerCase() === filterCategory.toLowerCase();
    const matchesSearch =
      !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Grouped skills by category
  const skillsByCategory = filteredSkills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  // Handlers
  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achTitle) return;

    await addAchievement({
      title: achTitle,
      description: achDesc,
      category: achCategory,
      date: achDate,
      evidence: achEvidence,
      resume_relevant: achResumeRel,
      linkedin_relevant: achLinkedinRel,
    });

    toast.success(`Logged achievement: "${achTitle}"`);
    setIsAchievementModalOpen(false);
    setAchTitle('');
    setAchDesc('');
    setAchEvidence('');
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName) return;

    await addSkill({
      name: skillName,
      category: skillCategory,
      proficiency: skillProficiency,
    });

    toast.success(`Added skill: "${skillName}" (${skillProficiency})`);
    setIsSkillModalOpen(false);
    setSkillName('');
  };

  const handleCycleSkillProficiency = async (skill: Skill, direction: 1 | -1) => {
    const currentIdx = PROFICIENCY_LEVELS.indexOf(skill.proficiency as SkillProficiency);
    const startIdx = currentIdx >= 0 ? currentIdx : 1;
    const nextIdx = Math.max(0, Math.min(PROFICIENCY_LEVELS.length - 1, startIdx + direction));
    const nextLevel = PROFICIENCY_LEVELS[nextIdx];

    await updateSkill(skill.id, { proficiency: nextLevel });
    toast.info(`Updated "${skill.name}" proficiency to ${nextLevel}`);
  };

  const handleCreateExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany || !expRole) return;

    await addExperience({
      company: expCompany,
      role: expRole,
      start_date: expStartDate || undefined,
      end_date: expIsCurrent ? undefined : expEndDate || undefined,
      description: expDesc,
      is_current: expIsCurrent,
    });

    toast.success(`Logged role: ${expRole} at ${expCompany}`);
    setIsExperienceModalOpen(false);
    setExpCompany('');
    setExpRole('');
    setExpDesc('');
  };

  const handleCreateCertification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName) return;

    await addCertification({
      name: certName,
      issuer: certIssuer,
      date_obtained: certDate || undefined,
      expiry_date: certExpiry || undefined,
      credential_id: certCredId,
    });

    toast.success(`Recorded credential: "${certName}"`);
    setIsCertModalOpen(false);
    setCertName('');
    setCertIssuer('');
    setCertCredId('');
  };

  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resVersionName) return;

    await addResume({
      version_name: resVersionName,
      target_role: resTargetRole,
      content: resContent,
      notes: resNotes,
    });

    toast.success(`Saved resume version: "${resVersionName}"`);
    setIsResumeModalOpen(false);
    setResVersionName('');
    setResTargetRole('');
    setResContent('');
    setResNotes('');
  };

  const handleCopyText = (text?: string, label: string = 'Content') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const getProficiencyVariant = (
    prof?: string
  ): 'success' | 'primary' | 'warning' | 'neutral' => {
    switch (prof) {
      case 'Master':
        return 'success';
      case 'Expert':
        return 'primary';
      case 'Advanced':
        return 'primary';
      case 'Intermediate':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="pcc-career-page">
      {/* Top Header */}
      <div className="pcc-career-header">
        <div>
          <h1 className="pcc-career-title">Career & Professional Growth</h1>
          <p className="pcc-career-subtitle">
            Accomplishments log, verified skills matrix, credential tracker, and targeted CV snapshots
          </p>
        </div>
        <div className="pcc-career-header__actions">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAchievementModalOpen(true)}
          >
            + Log Win
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSkillModalOpen(true)}
          >
            + Add Skill
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExperienceModalOpen(true)}
          >
            + Add Role
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCertModalOpen(true)}
          >
            + Add Credential
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsResumeModalOpen(true)}
          >
            + New Resume
          </Button>
        </div>
      </div>

      {/* High-Level Telemetry Cards */}
      <div className="pcc-career-stats">
        <Card glass padding="md" className="pcc-career-stat-card">
          <span className="pcc-career-stat__label">Achievements Logged</span>
          <div className="pcc-career-stat__value">
            {summary?.achievements_count ?? achievements.length}
          </div>
          <div className="pcc-career-stat__footer">
            <Badge variant="success" size="sm">
              {summary?.resume_relevant_achievements ??
                achievements.filter((a) => a.resume_relevant).length}{' '}
              Resume-Ready
            </Badge>
          </div>
        </Card>

        <Card glass padding="md" className="pcc-career-stat-card">
          <span className="pcc-career-stat__label">Skills Inventory</span>
          <div className="pcc-career-stat__value">
            {summary?.skills_count ?? skills.length}
          </div>
          <div className="pcc-career-stat__footer">
            <Badge variant="primary" size="sm">
              {skills.filter((s) => s.proficiency === 'Master' || s.proficiency === 'Expert').length} Master/Expert
            </Badge>
          </div>
        </Card>

        <Card glass padding="md" className="pcc-career-stat-card">
          <span className="pcc-career-stat__label">Certifications</span>
          <div className="pcc-career-stat__value">
            {summary?.certifications_count ?? certifications.length}
          </div>
          <div className="pcc-career-stat__footer">
            <Badge variant="neutral" size="sm">
              All Verified
            </Badge>
          </div>
        </Card>

        <Card glass padding="md" className="pcc-career-stat-card">
          <span className="pcc-career-stat__label">Career History</span>
          <div className="pcc-career-stat__value">
            {experiences.length} Roles
          </div>
          <div className="pcc-career-stat__footer">
            <span style={{ color: 'var(--color-primary)' }}>
              {experiences.find((e) => e.is_current)?.company || 'Active'}
            </span>
          </div>
        </Card>

        <Card glass padding="md" className="pcc-career-stat-card">
          <span className="pcc-career-stat__label">Resume Versions</span>
          <div className="pcc-career-stat__value">
            {summary?.resume_versions_count ?? resumes.length}
          </div>
          <div className="pcc-career-stat__footer">
            <span>Tailored & Ready</span>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="pcc-career-nav">
        {[
          { id: 'overview', label: 'Portfolio Overview' },
          { id: 'achievements', label: `Wins & Milestones (${achievements.length})` },
          { id: 'skills', label: `Skill Matrix (${skills.length})` },
          { id: 'experiences', label: `Experience Journey (${experiences.length})` },
          { id: 'certifications', label: `Certifications (${certifications.length})` },
          { id: 'resumes', label: `Resume Hub (${resumes.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`pcc-career-nav__tab ${activeTab === t.id ? 'pcc-career-nav__tab--active' : ''}`}
            onClick={() => {
              setActiveTab(t.id as CareerTab);
              setFilterCategory('all');
              setSearchQuery('');
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="pcc-career-overview-grid">
          <div className="pcc-overview-main">
            {/* Current Active Role Highlight */}
            {experiences.find((e) => e.is_current) && (
              <Card glass padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="pcc-career-stat__label">Current Active Position</span>
                    <h2 style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-size-xl)' }}>
                      {experiences.find((e) => e.is_current)?.role}
                    </h2>
                    <div style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)', marginTop: '2px' }}>
                      {experiences.find((e) => e.is_current)?.company}
                    </div>
                  </div>
                  <Badge variant="success">Active Role</Badge>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-3)' }}>
                  {experiences.find((e) => e.is_current)?.description}
                </p>
              </Card>
            )}

            {/* Recent Key Accomplishments */}
            <Card glass padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Recent Key Accomplishments</h2>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('achievements')}>
                  View All ({achievements.length}) →
                </Button>
              </div>

              <div className="pcc-achievements-list">
                {achievements.slice(0, 3).map((ach) => (
                  <div
                    key={ach.id}
                    style={{
                      padding: 'var(--space-3)',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
                        {ach.title}
                      </h4>
                      {ach.category && <Badge variant="neutral" size="sm">{ach.category}</Badge>}
                    </div>
                    {ach.description && (
                      <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {ach.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--font-size-xs)' }}>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>{ach.date}</span>
                      {ach.evidence && (
                        <a
                          href={ach.evidence}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                        >
                          View Evidence ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="pcc-overview-side">
            {/* Top Verified Skills */}
            <Card glass padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>Key Competencies</h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('skills')}>
                  Matrix →
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {skills.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{s.name}</span>
                    <Badge size="sm" variant={getProficiencyVariant(s.proficiency)}>
                      {s.proficiency || 'Advanced'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Active Credentials */}
            <Card glass padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>Credentials</h3>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('certifications')}>
                  All ({certifications.length}) →
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {certifications.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{c.name}</div>
                    <div style={{ color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{c.issuer}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACHIEVEMENTS & WINS
         ========================================================================= */}
      {activeTab === 'achievements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Filters Bar */}
          <div className="pcc-career-filters">
            <div className="pcc-career-filters__search">
              <Input
                id="search-achievements"
                placeholder="Search accomplishments, evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="pcc-career-filters__categories">
              {achievementCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`pcc-category-chip ${filterCategory === cat ? 'pcc-category-chip--active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}

              <button
                type="button"
                className={`pcc-toggle-btn ${resumeRelevantOnly ? 'pcc-toggle-btn--active' : ''}`}
                onClick={() => setResumeRelevantOnly(!resumeRelevantOnly)}
              >
                ★ Resume Only
              </button>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="pcc-achievements-list">
            {filteredAchievements.map((ach) => (
              <Card key={ach.id} glass padding="md" className="pcc-achievement-card">
                <div className="pcc-achievement-card__header">
                  <div>
                    <h3 className="pcc-achievement-card__title">{ach.title}</h3>
                    <div className="pcc-achievement-card__meta">
                      {ach.category && <Badge variant="neutral" size="sm">{ach.category}</Badge>}
                      {ach.date && <span className="pcc-achievement-card__date">{ach.date}</span>}
                    </div>
                  </div>

                  <div className="pcc-achievement-card__actions">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        updateAchievement(ach.id, {
                          resume_relevant: !ach.resume_relevant,
                        });
                        toast.info(`Toggled resume relevance`);
                      }}
                      title="Toggle Resume Relevance"
                    >
                      {ach.resume_relevant ? '★ On Resume' : '☆ Not on Resume'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ color: 'var(--color-error)' }}
                      onClick={() => {
                        deleteAchievement(ach.id);
                        toast.info(`Removed achievement`);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {ach.description && (
                  <p className="pcc-achievement-card__desc">{ach.description}</p>
                )}

                <div className="pcc-achievement-card__footer">
                  <div className="pcc-achievement-card__badges">
                    {ach.resume_relevant && (
                      <Badge variant="success" size="sm">Resume Ready</Badge>
                    )}
                    {ach.linkedin_relevant && (
                      <Badge variant="primary" size="sm">LinkedIn Featured</Badge>
                    )}
                  </div>

                  {ach.evidence && (
                    <a
                      href={ach.evidence}
                      target="_blank"
                      rel="noreferrer"
                      className="pcc-achievement-card__evidence"
                    >
                      🔗 {ach.evidence.replace(/^https?:\/\//, '').slice(0, 32)}... ↗
                    </a>
                  )}
                </div>
              </Card>
            ))}

            {filteredAchievements.length === 0 && (
              <Card glass padding="lg" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No accomplishments matched your search or filters. Click <strong>+ Log Win</strong> above to record a milestone.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SKILLS MATRIX
         ========================================================================= */}
      {activeTab === 'skills' && (
        <div className="pcc-skills-matrix-container">
          <div className="pcc-career-filters">
            <div className="pcc-career-filters__search">
              <Input
                id="search-skills"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="pcc-career-filters__categories">
              {skillCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`pcc-category-chip ${filterCategory === cat ? 'pcc-category-chip--active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(skillsByCategory).map(([category, items]) => (
            <div key={category} className="pcc-skills-category-group">
              <h3 className="pcc-skills-category-title">
                {category} <Badge variant="neutral" size="sm">{items.length}</Badge>
              </h3>

              <div className="pcc-skills-grid">
                {items.map((skill) => (
                  <div key={skill.id} className="pcc-skill-card">
                    <div className="pcc-skill-card__info">
                      <span className="pcc-skill-card__name">{skill.name}</span>
                      <span className="pcc-skill-card__cat">{skill.category}</span>
                    </div>

                    <div className="pcc-skill-card__actions">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCycleSkillProficiency(skill, -1)}
                        title="Decrease Level"
                      >
                        -
                      </Button>
                      <Badge size="sm" variant={getProficiencyVariant(skill.proficiency)}>
                        {skill.proficiency || 'Intermediate'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCycleSkillProficiency(skill, 1)}
                        title="Increase Level"
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        style={{ color: 'var(--color-error)' }}
                        onClick={() => {
                          deleteSkill(skill.id);
                          toast.info(`Deleted skill: ${skill.name}`);
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(skillsByCategory).length === 0 && (
            <Card glass padding="lg" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No skills found matching your query. Click <strong>+ Add Skill</strong> to register your expertise.
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: EXPERIENCE JOURNEY
         ========================================================================= */}
      {activeTab === 'experiences' && (
        <div className="pcc-experience-timeline">
          {experiences.map((exp) => (
            <div key={exp.id} className="pcc-experience-item">
              <div className="pcc-experience-item__dot" />
              <Card glass padding="md" className="pcc-experience-card">
                <div className="pcc-experience-card__header">
                  <div>
                    <h3 className="pcc-experience-card__role">{exp.role}</h3>
                    <div className="pcc-experience-card__company">{exp.company}</div>
                    <div className="pcc-experience-card__dates">
                      {exp.start_date || 'Past'} — {exp.is_current ? 'Present' : exp.end_date || 'Past'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    {exp.is_current && <Badge variant="success">Current Role</Badge>}
                    <Button
                      size="sm"
                      variant="ghost"
                      style={{ color: 'var(--color-error)' }}
                      onClick={() => {
                        deleteExperience(exp.id);
                        toast.info(`Removed experience record`);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {exp.description && (
                  <p className="pcc-experience-card__desc">{exp.description}</p>
                )}
              </Card>
            </div>
          ))}

          {experiences.length === 0 && (
            <Card glass padding="lg" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No employment history recorded yet. Click <strong>+ Add Role</strong> above to build your career timeline.
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: CERTIFICATIONS & CREDENTIALS
         ========================================================================= */}
      {activeTab === 'certifications' && (
        <div className="pcc-certifications-grid">
          {certifications.map((cert) => (
            <Card key={cert.id} glass padding="md" className="pcc-cert-card">
              <div>
                <h3 className="pcc-cert-card__name">{cert.name}</h3>
                {cert.issuer && <div className="pcc-cert-card__issuer">Issuer: {cert.issuer}</div>}
              </div>

              <div className="pcc-cert-card__details">
                {cert.date_obtained && <div>Earned: {cert.date_obtained}</div>}
                <div>Expires: {cert.expiry_date || 'Lifetime Validity'}</div>
                {cert.credential_id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
                    <span>ID: {cert.credential_id}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyText(cert.credential_id, 'Credential ID')}
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </div>

              <div className="pcc-cert-card__actions">
                <Button
                  size="sm"
                  variant="ghost"
                  style={{ color: 'var(--color-error)' }}
                  onClick={() => {
                    deleteCertification(cert.id);
                    toast.info(`Removed credential: ${cert.name}`);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}

          {certifications.length === 0 && (
            <Card glass padding="lg" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No credentials logged. Click <strong>+ Add Credential</strong> to track your certifications.
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: RESUME SNAPSHOTS HUB
         ========================================================================= */}
      {activeTab === 'resumes' && (
        <div className="pcc-resumes-grid">
          {resumes.map((res) => (
            <Card key={res.id} glass padding="md" className="pcc-resume-card">
              <div className="pcc-resume-card__header">
                <div>
                  <h3 className="pcc-resume-card__title">{res.version_name}</h3>
                  {res.target_role && (
                    <div className="pcc-resume-card__role">Target: {res.target_role}</div>
                  )}
                </div>
                <Badge variant="primary" size="sm">Snapshot</Badge>
              </div>

              {res.content && (
                <div className="pcc-resume-card__preview">
                  {res.content.slice(0, 180)}...
                </div>
              )}

              {res.notes && (
                <div className="pcc-resume-card__notes">💡 Note: {res.notes}</div>
              )}

              <div className="pcc-resume-card__actions">
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewResume(res)}
                  >
                    View & Copy
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  style={{ color: 'var(--color-error)' }}
                  onClick={() => {
                    deleteResume(res.id);
                    toast.info(`Deleted resume snapshot`);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}

          {resumes.length === 0 && (
            <Card glass padding="lg" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              No resume versions created yet. Click <strong>+ New Resume</strong> to curate tailored versions.
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* Modal: Log Achievement */}
      <Modal
        isOpen={isAchievementModalOpen}
        onClose={() => setIsAchievementModalOpen(false)}
        title="Log Career Win or Milestone"
      >
        <form onSubmit={handleCreateAchievement} className="pcc-modal-form">
          <Input
            id="ach-title-input"
            label="Achievement Title *"
            placeholder="e.g. Architected Distributed Cache Sync"
            value={achTitle}
            onChange={(e) => setAchTitle(e.target.value)}
            required
          />

          <div className="pcc-form-row">
            <div className="pcc-form-group">
              <label htmlFor="ach-category-select" className="pcc-form-label">Category</label>
              <select
                id="ach-category-select"
                className="pcc-select"
                value={achCategory}
                onChange={(e) => setAchCategory(e.target.value)}
              >
                <option value="Architecture">Architecture</option>
                <option value="Frontend Engineering">Frontend Engineering</option>
                <option value="Backend Engineering">Backend Engineering</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Thought Leadership">Thought Leadership</option>
                <option value="Product Delivery">Product Delivery</option>
              </select>
            </div>

            <Input
              id="ach-date-input"
              label="Date Accomplished"
              type="date"
              value={achDate}
              onChange={(e) => setAchDate(e.target.value)}
            />
          </div>

          <div className="pcc-form-group">
            <label htmlFor="ach-desc-input" className="pcc-form-label">Description & Impact</label>
            <textarea
              id="ach-desc-input"
              className="pcc-textarea"
              placeholder="Detail the problem, solution, metrics improved, or outcomes achieved..."
              value={achDesc}
              onChange={(e) => setAchDesc(e.target.value)}
            />
          </div>

          <Input
            id="ach-evidence-input"
            label="Evidence / URL / PR Link"
            placeholder="https://github.com/... or https://..."
            value={achEvidence}
            onChange={(e) => setAchEvidence(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
            <label className="pcc-checkbox-label">
              <input
                type="checkbox"
                checked={achResumeRel}
                onChange={(e) => setAchResumeRel(e.target.checked)}
              />
              Include in Tailored Resumes
            </label>
            <label className="pcc-checkbox-label">
              <input
                type="checkbox"
                checked={achLinkedinRel}
                onChange={(e) => setAchLinkedinRel(e.target.checked)}
              />
              Feature on LinkedIn / Portfolio
            </label>
          </div>

          <div className="pcc-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAchievementModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Achievement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Skill */}
      <Modal
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
        title="Add Skill to Inventory"
      >
        <form onSubmit={handleCreateSkill} className="pcc-modal-form">
          <Input
            id="skill-name-input"
            label="Skill / Technology Name *"
            placeholder="e.g. Distributed Consensus, Rust, GraphQL"
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            required
          />

          <div className="pcc-form-row">
            <div className="pcc-form-group">
              <label htmlFor="skill-category-select" className="pcc-form-label">Domain Category</label>
              <select
                id="skill-category-select"
                className="pcc-select"
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value)}
              >
                <option value="Backend">Backend</option>
                <option value="Frontend">Frontend</option>
                <option value="Architecture">Architecture</option>
                <option value="DevOps">DevOps</option>
                <option value="AI & Systems">AI & Systems</option>
                <option value="Soft Skills">Soft Skills</option>
              </select>
            </div>

            <div className="pcc-form-group">
              <label htmlFor="skill-prof-select" className="pcc-form-label">Proficiency Level</label>
              <select
                id="skill-prof-select"
                className="pcc-select"
                value={skillProficiency}
                onChange={(e) => setSkillProficiency(e.target.value as SkillProficiency)}
              >
                {PROFICIENCY_LEVELS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pcc-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSkillModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Skill
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Experience */}
      <Modal
        isOpen={isExperienceModalOpen}
        onClose={() => setIsExperienceModalOpen(false)}
        title="Add Employment & Career Role"
      >
        <form onSubmit={handleCreateExperience} className="pcc-modal-form">
          <div className="pcc-form-row">
            <Input
              id="exp-company-input"
              label="Company / Organization *"
              placeholder="e.g. PCC Labs, Acme Inc."
              value={expCompany}
              onChange={(e) => setExpCompany(e.target.value)}
              required
            />
            <Input
              id="exp-role-input"
              label="Job Role / Position *"
              placeholder="e.g. Principal Systems Architect"
              value={expRole}
              onChange={(e) => setExpRole(e.target.value)}
              required
            />
          </div>

          <div className="pcc-form-row">
            <Input
              id="exp-start-input"
              label="Start Date"
              type="date"
              value={expStartDate}
              onChange={(e) => setExpStartDate(e.target.value)}
            />
            {!expIsCurrent && (
              <Input
                id="exp-end-input"
                label="End Date"
                type="date"
                value={expEndDate}
                onChange={(e) => setExpEndDate(e.target.value)}
              />
            )}
          </div>

          <label className="pcc-checkbox-label">
            <input
              type="checkbox"
              checked={expIsCurrent}
              onChange={(e) => setExpIsCurrent(e.target.checked)}
            />
            Currently working in this role
          </label>

          <div className="pcc-form-group">
            <label htmlFor="exp-desc-input" className="pcc-form-label">Role Highlights & Responsibilities</label>
            <textarea
              id="exp-desc-input"
              className="pcc-textarea"
              placeholder="Key responsibilities, team leadership, architectural contributions..."
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
            />
          </div>

          <div className="pcc-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExperienceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Certification */}
      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Add Certification / Credential"
      >
        <form onSubmit={handleCreateCertification} className="pcc-modal-form">
          <Input
            id="cert-name-input"
            label="Certification Name *"
            placeholder="e.g. AWS Certified Solutions Architect"
            value={certName}
            onChange={(e) => setCertName(e.target.value)}
            required
          />

          <Input
            id="cert-issuer-input"
            label="Issuing Organization"
            placeholder="e.g. Amazon Web Services, CNCF, Meta"
            value={certIssuer}
            onChange={(e) => setCertIssuer(e.target.value)}
          />

          <div className="pcc-form-row">
            <Input
              id="cert-date-input"
              label="Date Obtained"
              type="date"
              value={certDate}
              onChange={(e) => setCertDate(e.target.value)}
            />
            <Input
              id="cert-expiry-input"
              label="Expiry Date (optional)"
              type="date"
              value={certExpiry}
              onChange={(e) => setCertExpiry(e.target.value)}
            />
          </div>

          <Input
            id="cert-cred-id-input"
            label="Credential ID / License Number"
            placeholder="e.g. AWS-SAP-982310"
            value={certCredId}
            onChange={(e) => setCertCredId(e.target.value)}
          />

          <div className="pcc-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCertModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Credential
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Resume Version */}
      <Modal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        title="Create Tailored Resume Snapshot"
      >
        <form onSubmit={handleCreateResume} className="pcc-modal-form">
          <div className="pcc-form-row">
            <Input
              id="res-version-input"
              label="Version Name *"
              placeholder="e.g. Principal Systems Architect (2026)"
              value={resVersionName}
              onChange={(e) => setResVersionName(e.target.value)}
              required
            />
            <Input
              id="res-role-input"
              label="Target Role"
              placeholder="e.g. Staff Full Stack Engineer"
              value={resTargetRole}
              onChange={(e) => setResTargetRole(e.target.value)}
            />
          </div>

          <div className="pcc-form-group">
            <label htmlFor="res-content-input" className="pcc-form-label">Resume Markdown Content</label>
            <textarea
              id="res-content-input"
              className="pcc-textarea"
              style={{ minHeight: '220px', fontFamily: 'var(--font-mono, monospace)' }}
              placeholder="# Name&#10;## Summary&#10;## Experience&#10;## Skills"
              value={resContent}
              onChange={(e) => setResContent(e.target.value)}
            />
          </div>

          <Input
            id="res-notes-input"
            label="Notes & Focus Strategy"
            placeholder="e.g. Tailored for high-scale distributed systems and Staff/Principal roles"
            value={resNotes}
            onChange={(e) => setResNotes(e.target.value)}
          />

          <div className="pcc-modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResumeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Snapshot
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Resume Version */}
      {viewResume && (
        <Modal
          isOpen={Boolean(viewResume)}
          onClose={() => setViewResume(null)}
          title={`Resume: ${viewResume.version_name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {viewResume.target_role && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                  Target Role:
                </span>{' '}
                <strong>{viewResume.target_role}</strong>
              </div>
            )}

            <pre
              style={{
                background: 'var(--color-bg-secondary)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                maxHeight: '400px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {viewResume.content || 'No content provided.'}
            </pre>

            {viewResume.notes && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                Strategy notes: {viewResume.notes}
              </div>
            )}

            <div className="pcc-modal-actions">
              <Button
                variant="primary"
                onClick={() => handleCopyText(viewResume.content, 'Resume Markdown')}
              >
                📋 Copy Markdown
              </Button>
              <Button variant="outline" onClick={() => setViewResume(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CareerPage;
