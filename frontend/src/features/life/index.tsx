import React, { useState, useEffect } from 'react';
import { Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { goalsApi } from '../../services/api';
import type { DailyWellness, GoalItem, HabitItem } from '../../types';
import './LifePage.css';

const DEFAULT_WELLNESS: DailyWellness = {
  waterMl: 2250,
  waterTargetMl: 3000,
  sleepHours: 7.5,
  sleepTargetHours: 8.0,
  sleepQuality: 'Good',
  workoutCompleted: true,
  workoutTitle: 'Morning Strength & Mobility',
  workoutDuration: 45,
  vitalityScore: 88,
};

const DEFAULT_HABITS: HabitItem[] = [
  { id: '1', name: 'Drink 3L Hydration', icon: '💧', category: 'health', streak: 12, target: '3000 ml', completedToday: true, history: [true, true, true, true, true, true, true] },
  { id: '2', name: 'Daily Workout Session', icon: '🏃', category: 'health', streak: 8, target: '45 mins', completedToday: true, history: [true, true, true, false, true, true, true] },
  { id: '3', name: 'Mindful Meditation', icon: '🧘', category: 'mindset', streak: 5, target: '15 mins', completedToday: false, history: [true, true, true, true, false, false, false] },
  { id: '4', name: 'Deep Work Reading', icon: '📖', category: 'productivity', streak: 14, target: '30 pages', completedToday: true, history: [true, true, true, true, true, true, true] },
];

export const LifePage: React.FC = () => {
  const { toast } = useToast();

  const [wellness, setWellness] = useState<DailyWellness>(() => {
    const saved = localStorage.getItem('pcc_life_wellness');
    return saved ? JSON.parse(saved) : DEFAULT_WELLNESS;
  });

  const [habits, setHabits] = useState<HabitItem[]>(() => {
    const saved = localStorage.getItem('pcc_life_habits');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loadingGoals, setLoadingGoals] = useState<boolean>(true);

  // Quick log modal states
  const [activeModal, setActiveModal] = useState<'sleep' | 'workout' | null>(null);
  const [sleepInput, setSleepInput] = useState<number>(8);
  const [sleepQualityInput, setSleepQualityInput] = useState<DailyWellness['sleepQuality']>('Good');
  const [workoutTitleInput, setWorkoutTitleInput] = useState<string>('');
  const [workoutDurationInput, setWorkoutDurationInput] = useState<number>(30);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('pcc_life_wellness', JSON.stringify(wellness));
  }, [wellness]);

  useEffect(() => {
    localStorage.setItem('pcc_life_habits', JSON.stringify(habits));
  }, [habits]);

  // Fetch real goals from backend
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoadingGoals(true);
        const res = await goalsApi.getAll();
        setGoals(res.data || []);
      } catch (err) {
        setGoals([
          { id: 'g1', name: 'Run Half Marathon', status: 'in_progress', progress: 65 },
          { id: 'g2', name: 'Read 24 Books This Year', status: 'in_progress', progress: 45 },
          { id: 'g3', name: 'Master System Architecture', status: 'in_progress', progress: 80 },
        ] as GoalItem[]);
      } finally {
        setLoadingGoals(false);
      }
    };
    fetchGoals();
  }, []);

  const computeVitalityScore = (
    waterMl: number,
    waterTargetMl: number,
    sleepHours: number,
    sleepTargetHours: number,
    workoutCompleted: boolean
  ): number => {
    const waterPct = Math.min(1, Math.max(0, waterMl / (waterTargetMl || 1)));
    const sleepPct = Math.min(1, Math.max(0, sleepHours / (sleepTargetHours || 1)));
    const workoutPts = workoutCompleted ? 30 : 0;
    return Math.min(100, Math.round(waterPct * 35 + sleepPct * 35 + workoutPts));
  };

  const handleWaterStep = (step: number) => {
    setWellness((prev) => {
      const nextMl = Math.max(0, prev.waterMl + step);
      const score = computeVitalityScore(
        nextMl,
        prev.waterTargetMl,
        prev.sleepHours,
        prev.sleepTargetHours,
        prev.workoutCompleted
      );
      return { ...prev, waterMl: nextMl, vitalityScore: score };
    });
    toast.info(step > 0 ? `+${step}ml water logged` : `${step}ml water updated`);
  };

  const toggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const nextCompleted = !h.completedToday;
          const nextStreak = nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1);
          if (nextCompleted) {
            toast.success(`Marked "${h.name}" completed! 🔥`);
          } else {
            toast.info(`Unchecked "${h.name}"`);
          }
          return { ...h, completedToday: nextCompleted, streak: nextStreak };
        }
        return h;
      })
    );
  };

  const handleLogSleep = () => {
    setWellness((prev) => {
      const score = computeVitalityScore(
        prev.waterMl,
        prev.waterTargetMl,
        sleepInput,
        prev.sleepTargetHours,
        prev.workoutCompleted
      );
      return {
        ...prev,
        sleepHours: sleepInput,
        sleepQuality: sleepQualityInput,
        vitalityScore: score,
      };
    });
    toast.success(`Sleep logged: ${sleepInput} hours (${sleepQualityInput})`);
    setActiveModal(null);
  };

  const handleLogWorkout = () => {
    setWellness((prev) => {
      const score = computeVitalityScore(
        prev.waterMl,
        prev.waterTargetMl,
        prev.sleepHours,
        prev.sleepTargetHours,
        true
      );
      return {
        ...prev,
        workoutCompleted: true,
        workoutTitle: workoutTitleInput || 'Custom Workout Session',
        workoutDuration: workoutDurationInput,
        vitalityScore: score,
      };
    });
    toast.success(`Workout logged: ${workoutTitleInput || 'Session'} (${workoutDurationInput} mins) 💪`);
    setActiveModal(null);
  };

  return (
    <div className="pcc-life-container">
      {/* Header */}
      <div className="pcc-life-header">
        <div>
          <h1 className="pcc-life-header__title">Life OS & Wellness Cockpit</h1>
          <p className="pcc-life-header__subtitle">
            Unified telemetry tracking for daily habits, fitness, sleep, hydration, and long-term life goals.
          </p>
        </div>
      </div>

      {/* Vitality Score Banner */}
      <div className="pcc-life-vitality-banner">
        <div className="pcc-life-vitality-score">
          <div className="pcc-life-vitality-badge">{wellness.vitalityScore}%</div>
          <div className="pcc-life-vitality-details">
            <h3>Daily Vitality Index</h3>
            <p>Calculated live from your hydration ({(wellness.waterMl / 1000).toFixed(1)}L), sleep ({wellness.sleepHours}h), and workout metrics.</p>
          </div>
        </div>

        <div className="pcc-life-quick-actions">
          <Button variant="secondary" size="sm" onClick={() => handleWaterStep(250)}>
            💧 +250ml Water
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setActiveModal('sleep')}>
            🌙 Log Sleep
          </Button>
          <Button variant="primary" size="sm" onClick={() => setActiveModal('workout')}>
            🏋️ Log Workout
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="pcc-life-grid">
        {/* Hydration & Sleep Card */}
        <div className="pcc-life-card">
          <div className="pcc-life-card__header">
            <h3 className="pcc-life-card__title">💧 Hydration & Recovery</h3>
            <Badge variant="success" size="sm">Today</Badge>
          </div>

          <div className="pcc-life-counter-box">
            <div className="pcc-life-counter-info">
              <span className="pcc-life-counter-label">Water Intake</span>
              <span className="pcc-life-counter-value">{wellness.waterMl} / {wellness.waterTargetMl} ml</span>
            </div>
            <div className="pcc-life-counter-controls">
              <Button size="sm" variant="ghost" onClick={() => handleWaterStep(-250)}>-</Button>
              <Button size="sm" variant="secondary" onClick={() => handleWaterStep(250)}>+</Button>
            </div>
          </div>

          <div className="pcc-life-progress-track">
            <div
              className="pcc-life-progress-fill"
              style={{ width: `${Math.min(100, (wellness.waterMl / wellness.waterTargetMl) * 100)}%` }}
            />
          </div>

          <div className="pcc-life-counter-box" style={{ marginTop: '4px' }}>
            <div className="pcc-life-counter-info">
              <span className="pcc-life-counter-label">Sleep Duration</span>
              <span className="pcc-life-counter-value">{wellness.sleepHours} hrs ({wellness.sleepQuality})</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setActiveModal('sleep')}>Edit</Button>
          </div>
        </div>

        {/* Fitness Log Card */}
        <div className="pcc-life-card">
          <div className="pcc-life-card__header">
            <h3 className="pcc-life-card__title">🏃 Workout Status</h3>
            <Badge variant={wellness.workoutCompleted ? 'success' : 'warning'} size="sm">
              {wellness.workoutCompleted ? 'Completed' : 'Pending'}
            </Badge>
          </div>

          {wellness.workoutCompleted ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{wellness.workoutTitle}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                ⏱️ Duration: {wellness.workoutDuration} minutes
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-success)', fontWeight: 500 }}>
                ✓ Logged for today session
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-text-muted)' }}>
              No workout logged yet for today.
            </div>
          )}

          <Button
            variant={wellness.workoutCompleted ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setActiveModal('workout')}
            style={{ marginTop: 'auto' }}
          >
            {wellness.workoutCompleted ? 'Update Workout' : 'Log Workout Session'}
          </Button>
        </div>

        {/* Habit Streaks Card */}
        <div className="pcc-life-card">
          <div className="pcc-life-card__header">
            <h3 className="pcc-life-card__title">⚡ Active Habit Streaks</h3>
            <Badge variant="info" size="sm">{habits.filter((h) => h.completedToday).length}/{habits.length} Done</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {habits.map((habit) => (
              <div key={habit.id} className="pcc-life-habit-item">
                <div className="pcc-life-habit-left">
                  <span className="pcc-life-habit-icon">{habit.icon}</span>
                  <div>
                    <div className="pcc-life-habit-name">{habit.name}</div>
                    <div className="pcc-life-habit-streak">🔥 {habit.streak} day streak</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={habit.completedToday ? 'secondary' : 'outline'}
                  onClick={() => toggleHabit(habit.id)}
                >
                  {habit.completedToday ? '✓ Done' : 'Check In'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Active Life Goals Card */}
        <div className="pcc-life-card" style={{ gridColumn: '1 / -1' }}>
          <div className="pcc-life-card__header">
            <h3 className="pcc-life-card__title">🎯 Active Goals Progress</h3>
            <Badge variant="primary" size="sm">{goals.length} Goals</Badge>
          </div>

          {loadingGoals ? (
            <div>Loading goals telemetry...</div>
          ) : goals.length === 0 ? (
            <div>No active goals found. Add goals in the Goals module.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {goals.slice(0, 4).map((goal) => (
                <div
                  key={goal.id}
                  style={{
                    padding: '12px 16px',
                    background: 'var(--color-bg-subtle)',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{goal.name}</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="pcc-life-progress-track">
                    <div className="pcc-life-progress-fill" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sleep Modal */}
      <Modal
        isOpen={activeModal === 'sleep'}
        onClose={() => setActiveModal(null)}
        title="🌙 Log Sleep Session"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Hours Slept
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleepInput}
              onChange={(e) => setSleepInput(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Sleep Quality
            </label>
            <select
              value={sleepQualityInput}
              onChange={(e) => setSleepQualityInput(e.target.value as any)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Deep & Restorative">Deep & Restorative ✨</option>
              <option value="Good">Good 😊</option>
              <option value="Fair">Fair 😐</option>
              <option value="Poor">Poor 😴</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleLogSleep}>Save Sleep Log</Button>
          </div>
        </div>
      </Modal>

      {/* Workout Modal */}
      <Modal
        isOpen={activeModal === 'workout'}
        onClose={() => setActiveModal(null)}
        title="🏋️ Log Workout Session"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Workout Title / Activity
            </label>
            <input
              type="text"
              placeholder="e.g. Upper Body Hypertrophy, 5km Run"
              value={workoutTitleInput}
              onChange={(e) => setWorkoutTitleInput(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Duration (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={workoutDurationInput}
              onChange={(e) => setWorkoutDurationInput(parseInt(e.target.value) || 30)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button variant="ghost" onClick={() => setActiveModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleLogWorkout}>Save Workout</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LifePage;
