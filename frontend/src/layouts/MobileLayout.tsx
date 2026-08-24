import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useNotificationStore } from "../stores/notificationStore";
import {
  Avatar,
  Badge,
  Dropdown,
  Modal,
  Input,
  Button,
} from "../components/ui";
import { useToast } from "../hooks/useToast";
import { useAutoSync } from "../hooks/useAutoSync";
import { MOBILE_NAV_ITEMS, ALL_PCC_PAGES, renderNavIcon } from "./navConfig";
import { cn } from "../utils";
import "./MobileLayout.css";

import { useTaskStore } from "../stores/taskStore";
import { useProjectStore } from "../stores/projectStore";
import { useNoteStore } from "../stores/noteStore";

export const MobileLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = { email: "owner@pcc.local", name: "Owner", role: "owner" };
  const { getUnreadCount } = useNotificationStore();
  useAutoSync();
  const { toast } = useToast();

  const unreadCount = getUnreadCount();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickType, setQuickType] = useState<"task" | "project" | "note">(
    "task",
  );

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;

    try {
      if (quickType === "task") {
        await useTaskStore
          .getState()
          .addTask({ title, status: "todo", priority: "medium" });
      } else if (quickType === "project") {
        await useProjectStore
          .getState()
          .addProject({ title, status: "active", category: "General" });
      } else if (quickType === "note") {
        await useNoteStore
          .getState()
          .addNote({ title, content: "", category: "General" });
      }
      toast.success(`Created new ${quickType}: "${title}"`);
    } catch {
      toast.error(`Failed to create ${quickType}`);
    }

    setQuickTitle("");
    setIsQuickAddOpen(false);
  };

  const userMenuItems = [
    {
      id: "profile",
      label: "My Profile",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      onClick: () => navigate("/settings"),
    },
  ];

  return (
    <div className="pcc-mobile-layout">
      {/* Mobile Top Header */}
      <header className="pcc-mobile-header">
        <div className="pcc-mobile-header__brand" onClick={() => navigate("/")}>
          <img
            src="/logo.png"
            alt="PCC Logo"
            className="pcc-mobile-header__logo-img"
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              objectFit: "contain",
            }}
          />
        </div>

        <div className="pcc-mobile-header__actions">
          <div
            className="pcc-mobile-header__icon-btn"
            onClick={() => navigate("/notifications")}
            title="Notifications"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <Badge
                variant="accent"
                size="sm"
                className="pcc-mobile-header__badge"
              >
                {unreadCount}
              </Badge>
            )}
          </div>

          <Dropdown
            trigger={<Avatar name={user?.name || "User"} size="sm" />}
            items={userMenuItems}
            align="right"
          />
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="pcc-mobile-content">
        <Outlet />
      </main>

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        id="mobile-fab-quick-add"
        className="pcc-mobile-fab"
        onClick={() => setIsQuickAddOpen(true)}
        aria-label="Quick Add"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Fixed Bottom Navigation */}
      <nav className="pcc-mobile-nav" aria-label="Mobile Navigation">
        {MOBILE_NAV_ITEMS.map((item) => {
          if (item.id === "mob-more" || item.path === "#more") {
            const isMoreActive =
              isMoreDrawerOpen ||
              !["/", "/tasks", "/calendar"].includes(location.pathname);
            return (
              <button
                key={item.id}
                type="button"
                id={item.id}
                className={cn(
                  "pcc-mobile-nav__item",
                  isMoreActive && "pcc-mobile-nav__item--active",
                )}
                onClick={() => setIsMoreDrawerOpen((prev) => !prev)}
                aria-label="Open More Pages Navigation Drawer"
              >
                <span className="pcc-mobile-nav__icon">
                  {renderNavIcon(item.iconName)}
                </span>
                <span className="pcc-mobile-nav__label">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              id={item.id}
              className={({ isActive }) =>
                cn(
                  "pcc-mobile-nav__item",
                  isActive && "pcc-mobile-nav__item--active",
                )
              }
            >
              <span className="pcc-mobile-nav__icon">
                {renderNavIcon(item.iconName)}
              </span>
              <span className="pcc-mobile-nav__label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* More Navigation Drawer (Access to all 24 PCC pages) */}
      {isMoreDrawerOpen && (
        <div
          className="pcc-mobile-drawer-overlay"
          onClick={() => setIsMoreDrawerOpen(false)}
        >
          <div
            className="pcc-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pcc-mobile-drawer__header">
              <div className="pcc-mobile-drawer__title">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    width: 20,
                    height: 20,
                    color: "var(--color-accent)",
                  }}
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>All PCC Pages ({ALL_PCC_PAGES.length})</span>
              </div>
              <button
                type="button"
                className="pcc-mobile-drawer__close-btn"
                onClick={() => setIsMoreDrawerOpen(false)}
                aria-label="Close drawer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: 18, height: 18 }}
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="pcc-mobile-drawer__grid">
              {ALL_PCC_PAGES.map((page) => {
                const isActive = location.pathname === page.path;
                return (
                  <button
                    key={page.id}
                    type="button"
                    className={cn(
                      "pcc-mobile-drawer__item",
                      isActive && "pcc-mobile-drawer__item--active",
                    )}
                    onClick={() => {
                      navigate(page.path);
                      setIsMoreDrawerOpen(false);
                    }}
                  >
                    <span className="pcc-mobile-drawer__item-icon">
                      {renderNavIcon(page.iconName)}
                    </span>
                    <span className="pcc-mobile-drawer__item-label">
                      {page.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      <Modal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        title="Quick Create"
        size="sm"
      >
        <form onSubmit={handleQuickAddSubmit} className="pcc-quick-add-form">
          <div className="pcc-quick-add-form__types">
            {(["task", "project", "note"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={cn(
                  "pcc-quick-add-form__type-pill",
                  quickType === type && "pcc-quick-add-form__type-pill--active",
                )}
                onClick={() => setQuickType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <Input
            id="mobile-quick-add-input"
            label="Title"
            placeholder={`What ${quickType} are you working on?`}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            autoFocus
          />

          <div className="pcc-quick-add-form__footer">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
