# AI Agent Operating Guidelines & Workflow Rules (`AGENT_WORKFLOW.md`)

This document outlines mandatory operating rules, development workflows, quality assurance checks, and git safety protocols for AI coding assistants working on the **Personal Control Center (PCC)** codebase.

---

## 1. Branching & Git Release Rules

- **CRITICAL**: Code must **ONLY** be committed and pushed to the `staging` branch (`origin/staging`).
- **NEVER** push directly to or merge with `main`. The user manually handles all production merges to `main`.
- Every push to `staging` must be accompanied by empirical verification (zero TypeScript compilation errors, 100% clean production build).

```bash
# Typical Agent Git Workflow
git add .
git commit -m "feat(scope): descriptive commit message"
git push origin staging
```

---

## 2. Localization & Currency Standards

- **Default Country Assumption**: **India (IN)**.
- **Default Location Standard**: **Pune, India** (default weather telemetry & location).
- **Default Currency Symbol**: **`₹` (INR - Indian Rupee)**.
- **NEVER** default to `$` (USD) or non-INR currencies unless explicitly requested by the user.

---

## 3. Mandatory Pre-Commit Quality Checks

Before declaring any task completed or committing code, the agent MUST run:

```bash
cd frontend
npm run build
```

The build must complete with exit code `0` (`tsc && vite build`). If any TypeScript error or Vite bundling error occurs, the agent MUST resolve it before pushing.

---

## 4. UI & Layout Best Practices

1. **No Subtitles Under Main Headers**: Feature pages display `<h1>Title</h1>` only. Avoid adding `<p>` subtitle descriptions under page headers.
2. **Button Icon Spacing**: Always pass icons to `<Button>` via the `icon={<svg />}` prop. Avoid placing raw SVG elements directly inside button children without flex spacing.
3. **Screen Reader Utility (`.sr-only`)**: Always apply `.sr-only` to visually hidden text inside spinning or animated containers to prevent text layout jitter.
4. **Loading Containers**: Always style `.pcc-*-loading` containers with fixed flex alignment (`display: flex; align-items: center; gap: 12px; min-height: 56px;`) to prevent layout shifts.

---

## 5. Summary Checklist for Agents

- [ ] Am I on the `staging` branch?
- [ ] Have I verified default currency is `₹` (INR) and default location is Pune, IN?
- [ ] Did I run `npm run build` with zero TypeScript errors?
- [ ] Did I push exclusively to `origin/staging`?
