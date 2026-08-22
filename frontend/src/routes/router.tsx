import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { PageLoader, RouteErrorElement } from '../components/ui';

// Route Lazy Loading
const DashboardPage = lazy(() => import('../features/dashboard'));
const TasksPage = lazy(() => import('../features/tasks'));
const TaskDetailPage = lazy(() => import('../features/tasks/TaskDetailPage'));
const ProjectsPage = lazy(() => import('../features/projects'));
const ProjectDetailPage = lazy(() => import('../features/projects/ProjectDetailPage'));
const CalendarPage = lazy(() => import('../features/calendar'));
const GoalsPage = lazy(() => import('../features/goals'));
const ContactsPage = lazy(() => import('../features/contacts/ContactsPage'));
const SettingsPage = lazy(() => import('../features/settings'));
const RemindersPage = lazy(() => import('../features/reminders'));
const NotesPage = lazy(() => import('../features/notes'));
const IdeasPage = lazy(() => import('../features/ideas'));
const NotificationsPage = lazy(() => import('../features/notifications'));
const AlarmsPage = lazy(() => import('../features/alarms'));
const TimersPage = lazy(() => import('../features/timers'));
const WeatherPage = lazy(() => import('../features/weather'));

const PageFallback: React.FC = () => <PageLoader message="Loading module..." />;

export const router = createBrowserRouter([
  // Single-Tenant Redirects for legacy /login or /register URLs
  // Main Application Protected Routes (inside AppShell layout)
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorElement />,
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
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
