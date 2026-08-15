import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { Spinner } from '../components/ui/Spinner';

// Route Lazy Loading
const DashboardPage = lazy(() => import('../features/dashboard'));
const TasksPage = lazy(() => import('../features/tasks'));
const TaskDetailPage = lazy(() => import('../features/tasks/TaskDetailPage'));
const ProjectsPage = lazy(() => import('../features/projects'));
const ProjectDetailPage = lazy(() => import('../features/projects/ProjectDetailPage'));
const CalendarPage = lazy(() => import('../features/calendar'));
const KnowledgePage = lazy(() => import('../features/knowledge'));
const CareerPage = lazy(() => import('../features/career'));
const LifePage = lazy(() => import('../features/life'));
const GoalsPage = lazy(() => import('../features/goals'));
const FinancesPage = lazy(() => import('../features/finances/FinancesPage'));
const FitnessPage = lazy(() => import('../features/fitness/FitnessPage'));
const ContactsPage = lazy(() => import('../features/contacts/ContactsPage'));
const ReviewsPage = lazy(() => import('../features/reviews'));
const SettingsPage = lazy(() => import('../features/settings'));
const RemindersPage = lazy(() => import('../features/reminders'));
const NotesPage = lazy(() => import('../features/notes'));
const IdeasPage = lazy(() => import('../features/ideas'));
const NotificationsPage = lazy(() => import('../features/notifications'));
const AlarmsPage = lazy(() => import('../features/alarms'));
const TimersPage = lazy(() => import('../features/timers'));
const WeatherPage = lazy(() => import('../features/weather'));
const ClocksPage = lazy(() => import('../features/clocks'));
const SearchPage = lazy(() => import('../features/search'));

// Auth Pages (outside AppShell)
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'));

const PageFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      minHeight: '300px',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    }}
  >
    <Spinner size="lg" />
  </div>
);

export const router = createBrowserRouter([
  // Public Auth Routes (outside AppShell)
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<PageFallback />}>
        <RegisterPage />
      </Suspense>
    ),
  },

  // Main Application Protected Routes (inside AppShell layout)
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'tasks',
        element: (
          <Suspense fallback={<PageFallback />}>
            <TasksPage />
          </Suspense>
        ),
      },
      {
        path: 'tasks/:id',
        element: (
          <Suspense fallback={<PageFallback />}>
            <TaskDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'projects',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProjectsPage />
          </Suspense>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProjectDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'calendar',
        element: (
          <Suspense fallback={<PageFallback />}>
            <CalendarPage />
          </Suspense>
        ),
      },
      {
        path: 'finances',
        element: (
          <Suspense fallback={<PageFallback />}>
            <FinancesPage />
          </Suspense>
        ),
      },
      {
        path: 'fitness',
        element: (
          <Suspense fallback={<PageFallback />}>
            <FitnessPage />
          </Suspense>
        ),
      },
      {
        path: 'contacts',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ContactsPage />
          </Suspense>
        ),
      },
      {
        path: 'goals',
        element: (
          <Suspense fallback={<PageFallback />}>
            <GoalsPage />
          </Suspense>
        ),
      },
      {
        path: 'knowledge',
        element: (
          <Suspense fallback={<PageFallback />}>
            <KnowledgePage />
          </Suspense>
        ),
      },
      {
        path: 'career',
        element: (
          <Suspense fallback={<PageFallback />}>
            <CareerPage />
          </Suspense>
        ),
      },
      {
        path: 'life',
        element: (
          <Suspense fallback={<PageFallback />}>
            <LifePage />
          </Suspense>
        ),
      },
      {
        path: 'reviews',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ReviewsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'reminders',
        element: (
          <Suspense fallback={<PageFallback />}>
            <RemindersPage />
          </Suspense>
        ),
      },
      {
        path: 'notes',
        element: (
          <Suspense fallback={<PageFallback />}>
            <NotesPage />
          </Suspense>
        ),
      },
      {
        path: 'ideas',
        element: (
          <Suspense fallback={<PageFallback />}>
            <IdeasPage />
          </Suspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<PageFallback />}>
            <NotificationsPage />
          </Suspense>
        ),
      },
      {
        path: 'alarms',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AlarmsPage />
          </Suspense>
        ),
      },
      {
        path: 'timers',
        element: (
          <Suspense fallback={<PageFallback />}>
            <TimersPage />
          </Suspense>
        ),
      },
      {
        path: 'weather',
        element: (
          <Suspense fallback={<PageFallback />}>
            <WeatherPage />
          </Suspense>
        ),
      },
      {
        path: 'clocks',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ClocksPage />
          </Suspense>
        ),
      },
      {
        path: 'search',
        element: (
          <Suspense fallback={<PageFallback />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
