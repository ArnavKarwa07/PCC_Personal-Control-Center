const fs = require('fs');
const path = require('path');

const layouts = ['DesktopLayout.tsx', 'MobileLayout.tsx'];

for (const layout of layouts) {
  const filePath = path.join(__dirname, 'frontend', 'src', 'layouts', layout);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('import { useAutoSync }')) {
    content = content.replace("import { useToast } from '../hooks/useToast';", "import { useToast } from '../hooks/useToast';\nimport { useAutoSync } from '../hooks/useAutoSync';");
  }

  if (!content.includes('const { isOnline, isSyncing, pendingQueueCount }')) {
    content = content.replace('const { getUnreadCount } = useNotificationStore();', 'const { getUnreadCount } = useNotificationStore();\n  const { isOnline, isSyncing, pendingQueueCount } = useAutoSync();');
  }

  const badgeHtml = `
            {/* Sync Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '4px 8px', borderRadius: '12px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              {!isOnline ? (
                <><span style={{ color: '#ef4444' }}>🔴</span> Offline</>
              ) : isSyncing ? (
                <><span style={{ color: '#f59e0b' }}>🟡</span> {pendingQueueCount > 0 ? \`Syncing (\${pendingQueueCount})\` : 'Syncing'}</>
              ) : (
                <><span style={{ color: '#10b981' }}>🟢</span> Online</>
              )}
            </div>
`;

  // Desktop Layout
  if (layout === 'DesktopLayout.tsx' && !content.includes('Sync Badge')) {
    content = content.replace('<div className="pcc-desktop-header__actions">', '<div className="pcc-desktop-header__actions">\n' + badgeHtml);
  }

  // Mobile Layout
  if (layout === 'MobileLayout.tsx' && !content.includes('Sync Badge')) {
    content = content.replace('<div className="pcc-mobile-header__actions">', '<div className="pcc-mobile-header__actions">\n' + badgeHtml);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Layouts patched');
