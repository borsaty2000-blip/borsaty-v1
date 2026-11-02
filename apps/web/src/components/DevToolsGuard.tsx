'use client';

import { useEffect } from 'react';

export default function DevToolsGuard() {
  useEffect(() => {
    // 1. Console deterrent warning
    const warningTitle = '%c⚠️ BORSATY AI — PROPRIETARY SYSTEM';
    const warningStyle1 = 'color: #ef4444; font-size: 20px; font-weight: 900; -webkit-text-stroke: 1px black;';
    const warningBody =
      '%cThis is a proprietary financial analysis platform. Unauthorized access, automated scraping, decompilation, or reverse engineering of quantitative algorithms is strictly prohibited and violates platform Terms of Service. All sessions are logged and telemetry is monitored.';
    const warningStyle2 = 'color: #f59e0b; font-size: 13px; font-weight: 600;';

    try {
      console.log(warningTitle, warningStyle1);
      console.log(warningBody, warningStyle2);
    } catch {
      // Ignore in non-standard environments
    }

    // 2. Keyboard shortcut suppression (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl + Shift + I / J / C (or Cmd + Opt + I / J / C on Mac)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)
      ) {
        e.preventDefault();
        return false;
      }

      // Ctrl + U (View Source)
      if ((e.ctrlKey || e.metaKey) && ['u', 'U'].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };

    // 3. Context menu (right-click) suppression, exempting inputs & textareas
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName.toLowerCase();
        // Allow right click on form inputs or contenteditable elements
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          target.isContentEditable ||
          target.closest('input') ||
          target.closest('textarea')
        ) {
          return true;
        }
      }
      e.preventDefault();
      return false;
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
  }, []);

  return null;
}
