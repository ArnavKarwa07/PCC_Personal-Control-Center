import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import { Button } from './Button';
import './ErrorBoundary.css';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallbackContent
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * RouteErrorElement for React Router's createBrowserRouter `errorElement` prop.
 */
export const RouteErrorElement: React.FC = () => {
  const routeError = useRouteError() as
    | Error
    | { statusText?: string; message?: string; stack?: string }
    | null;
  return <ErrorFallbackContent error={routeError} isRouteError />;
};

interface ErrorFallbackProps {
  error: Error | { statusText?: string; message?: string; stack?: string } | null;
  onReset?: () => void;
  isRouteError?: boolean;
}

export const ErrorFallbackContent: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const errorMessage =
    error instanceof Error
      ? error.message
      : (error as { message?: string; statusText?: string })?.message ||
        (error as { statusText?: string })?.statusText ||
        'An unexpected application error occurred.';

  const errorStack =
    error instanceof Error
      ? error.stack
      : (error as { stack?: string })?.stack || JSON.stringify(error, null, 2);

  const isChunkError =
    errorMessage.toLowerCase().includes('failed to fetch dynamically imported module') ||
    errorMessage.toLowerCase().includes('loading chunk') ||
    errorMessage.toLowerCase().includes('importing a module script failed');

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleCopyError = () => {
    const textToCopy = `PCC Error Diagnostic:\nMessage: ${errorMessage}\nStack: ${errorStack || 'N/A'}\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="pcc-error-boundary">
      <div className="pcc-error-boundary__card">
        <div className="pcc-error-boundary__icon-wrapper">
          {isChunkError ? (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </div>

        <h1 className="pcc-error-boundary__title">
          {isChunkError ? 'Module Load Interrupted' : 'Something Went Wrong'}
        </h1>

        <p className="pcc-error-boundary__subtitle">
          {isChunkError
            ? 'A component failed to load, which usually happens when the dev server is restarted or updated mid-use. Reloading will fetch the latest application state.'
            : 'An unexpected runtime exception was caught. You can try refreshing the page or navigating back to the home.'}
        </p>

        <div className="pcc-error-boundary__actions">
          <Button variant="primary" onClick={handleReload} id="error-btn-reload">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Reload Application
          </Button>

          <Button variant="outline" onClick={handleGoHome} id="error-btn-home">
            Go to Dashboard
          </Button>

          {onReset && (
            <Button variant="secondary" onClick={onReset} id="error-btn-retry">
              Try Again
            </Button>
          )}
        </div>

        <div className="pcc-error-boundary__details-container">
          <button
            type="button"
            className="pcc-error-boundary__toggle-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>{showDetails ? 'Hide Technical Details' : 'Show Technical Details'}</span>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showDetails && (
            <div className="pcc-error-boundary__log">
              <div className="pcc-error-boundary__log-header">
                <span className="pcc-error-boundary__log-msg">{errorMessage}</span>
                <button
                  type="button"
                  className="pcc-error-boundary__copy-btn"
                  onClick={handleCopyError}
                >
                  {copied ? 'Copied!' : 'Copy Stack'}
                </button>
              </div>
              {errorStack && <pre className="pcc-error-boundary__stack">{errorStack}</pre>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
