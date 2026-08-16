import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import './FitnessPage.css';

export const FitnessPage: React.FC = () => {
  const { toast } = useToast();
  const [waterMl, setWaterMl] = useState(2100);
  const [sleepHours] = useState(7.5);
  const [streakDays, setStreakDays] = useState(12);

  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('');
  const [workouts, setWorkouts] = useState([
    { id: '1', name: 'Upper Body Strength', duration: 45, date: 'Today' },
    { id: '2', name: 'HIIT & Hydration Routine', duration: 30, date: 'Yesterday' },
  ]);

  const handleLogWater = (ml: number) => {
    setWaterMl((prev) => prev + ml);
    toast.success(`Logged +${ml}ml Water`);
  };

  const handleAddWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutName || !duration) return;
    const dur = parseInt(duration, 10);
    const newWk = { id: String(Date.now()), name: workoutName, duration: dur, date: 'Just now' };
    setWorkouts([newWk, ...workouts]);
    setStreakDays((prev) => prev + 1);
    toast.success(`Logged workout: "${workoutName}" (${dur} mins)`);
    setWorkoutName('');
    setDuration('');
  };

  const waterPercentage = Math.min(100, Math.round((waterMl / 3000) * 100));

  return (
    <div className="pcc-fitness-page">
      <div className="pcc-fitness-header">
        <div>
          <h1 className="pcc-fitness-title">Health & Fitness Telemetry</h1>
          <p className="pcc-fitness-subtitle">Workout logs, hydration progress, sleep recovery, and habit streaks</p>
        </div>
      </div>

      <div className="pcc-fitness-grid">
        <Card glass padding="lg" className="pcc-fitness-card">
          <span className="pcc-fitness-card__label">Active Streak</span>
          <div className="pcc-fitness-card__value">{streakDays} Days 🔥</div>
          <Badge variant="success" size="sm">Personal Record</Badge>
        </Card>

        <Card glass padding="lg" className="pcc-fitness-card pcc-fitness-card--water">
          <div className="pcc-fitness-card__water-header">
            <div>
              <span className="pcc-fitness-card__label">Hydration Target</span>
              <div className="pcc-fitness-card__value">{waterMl} / 3000 ml</div>
            </div>
            <Badge variant={waterPercentage >= 100 ? "success" : "info"} size="sm">
              {waterPercentage >= 100 ? "Goal Reached! 🎉" : `${waterPercentage}%`}
            </Badge>
          </div>

          <div className="pcc-water-wave-gauge" role="img" aria-label={`Hydration progress ${waterPercentage}%`}>
            <div
              className="pcc-water-wave-gauge__fill"
              style={{ height: `${waterPercentage}%` }}
            >
              <svg
                className="pcc-water-wave-gauge__wave pcc-water-wave-gauge__wave--front"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
              >
                <path d="M 0 30 Q 150 5, 300 30 T 600 30 Q 750 5, 900 30 T 1200 30 L 1200 120 L 0 120 Z" />
              </svg>
              <svg
                className="pcc-water-wave-gauge__wave pcc-water-wave-gauge__wave--back"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
              >
                <path d="M 0 30 Q 150 55, 300 30 T 600 30 Q 750 55, 900 30 T 1200 30 L 1200 120 L 0 120 Z" />
              </svg>
            </div>
            <div className="pcc-water-wave-gauge__overlay">
              <span className="pcc-water-wave-gauge__percentage">{waterPercentage}%</span>
              <span className="pcc-water-wave-gauge__status">
                {waterMl >= 3000 ? 'Fully Hydrated' : `${3000 - waterMl} ml remaining`}
              </span>
            </div>
          </div>

          <div className="pcc-progress-bar">
            <div className="pcc-progress-bar__fill" style={{ width: `${waterPercentage}%` }} />
          </div>
        </Card>

        <Card glass padding="lg" className="pcc-fitness-card">
          <span className="pcc-fitness-card__label">Sleep Recovery</span>
          <div className="pcc-fitness-card__value">{sleepHours} hrs 🌙</div>
          <span className="pcc-fitness-card__subtext">Optimal REM & Deep Sleep</span>
        </Card>
      </div>

      <div className="pcc-fitness-content">
        <Card glass padding="lg" className="pcc-fitness-section">
          <h2>Log Workout Session</h2>
          <form onSubmit={handleAddWorkout} className="pcc-workout-form">
            <Input
              id="fit-name"
              label="Workout Title"
              placeholder="e.g. Legs & Core, 5km Run"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              required
            />
            <Input
              id="fit-duration"
              label="Duration (minutes)"
              type="number"
              placeholder="e.g. 45"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <Button type="submit" variant="primary">Record Session</Button>
          </form>

          <div className="pcc-quick-water">
            <span className="pcc-quick-water__label">Quick Hydration Log:</span>
            <div className="pcc-quick-water__buttons">
              <button
                type="button"
                className="pcc-water-btn"
                onClick={() => handleLogWater(250)}
              >
                +250ml Glass
              </button>
              <button
                type="button"
                className="pcc-water-btn"
                onClick={() => handleLogWater(500)}
              >
                +500ml Bottle
              </button>
            </div>
          </div>
        </Card>

        <Card glass padding="lg" className="pcc-fitness-section">
          <h2>Recent Activity Sessions</h2>
          <div className="pcc-workouts-list">
            {workouts.map((w) => (
              <div key={w.id} className="pcc-workout-item">
                <div>
                  <div className="pcc-workout-item__name">{w.name}</div>
                  <div className="pcc-workout-item__date">{w.date}</div>
                </div>
                <Badge variant="neutral">{w.duration} mins</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FitnessPage;
