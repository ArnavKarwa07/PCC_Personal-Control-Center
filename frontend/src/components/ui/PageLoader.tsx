import React from 'react';
import './PageLoader.css';

export interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Loading workspace...',
  fullScreen = false,
}) => {
  return (
    <div
      className={`pcc-page-loader ${fullScreen ? 'pcc-page-loader--fullscreen' : ''}`}
      role="status"
      aria-label="Loading page"
    >
      {/* Top Shimmer Progress Bar */}
      <div className="pcc-page-loader__top-bar">
        <div className="pcc-page-loader__top-bar-fill" />
      </div>

      {/* Main Glassmorphism Loading Container */}
      <div className="pcc-page-loader__card">
        <div className="pcc-page-loader__brand-avatar">
          <div className="pcc-page-loader__ring pcc-page-loader__ring--outer" />
          <div className="pcc-page-loader__ring pcc-page-loader__ring--inner" />
          <img
            src="/logo.png"
            alt="PCC Logo"
            className="pcc-page-loader__logo"
          />
        </div>

        <div className="pcc-page-loader__text-container">
          <span className="pcc-page-loader__title">Personal Control Center</span>
          <p className="pcc-page-loader__subtitle">
            {message}
            <span className="pcc-page-loader__dots">
              <span className="pcc-page-loader__dot">.</span>
              <span className="pcc-page-loader__dot">.</span>
              <span className="pcc-page-loader__dot">.</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
