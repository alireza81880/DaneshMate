import React, { useState, useEffect } from 'react';
import { Home, Mic, BarChart2, User, Palette, X } from 'lucide-react';
import type { PaletteTheme } from '../../App';

export type RadialTabId = 'home' | 'notes' | 'reports' | 'profile' | 'settings';

export interface RadialMenuProps {
  activeTab: RadialTabId;
  isOpen: boolean;
  sessionLogsCount: number;
  theme: PaletteTheme;
  onSelectTab: (tab: RadialTabId) => void;
  onToggle: () => void;
  onClose: () => void;
}

interface RadialMenuItemConfig {
  id: RadialTabId;
  label: string;
  icon: React.ReactNode;
  angleDeg: number;
}

// Module-level static item definitions (prevents recreating icon VNodes on every App render)
// Ordered RTL from right (+X, 22°) to left (-X, 158°) on an elevated upward arc
const RADIAL_MENU_ITEMS: readonly RadialMenuItemConfig[] = [
  { id: 'home', label: 'داشبورد', icon: <Home className="w-5 h-5" />, angleDeg: 22 },
  { id: 'notes', label: 'یادداشت‌ها', icon: <Mic className="w-5 h-5" />, angleDeg: 56 },
  { id: 'reports', label: 'گزارشات', icon: <BarChart2 className="w-5 h-5" />, angleDeg: 90 },
  { id: 'profile', label: 'پروفایل', icon: <User className="w-5 h-5" />, angleDeg: 124 },
  { id: 'settings', label: 'تنظیمات پوسته', icon: <Palette className="w-5 h-5" />, angleDeg: 158 },
];

export const RadialMenu: React.FC<RadialMenuProps> = React.memo(({
  activeTab,
  isOpen,
  sessionLogsCount,
  theme,
  onSelectTab,
  onToggle,
  onClose,
}) => {
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 390
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const radius = viewportWidth < 360 ? 104 : viewportWidth < 400 ? 116 : 128;
  const liftY = viewportWidth < 360 ? -16 : -18;

  const activeItemIcon =
    RADIAL_MENU_ITEMS.find((r) => r.id === activeTab)?.icon || <Home className="w-6 h-6" />;

  return (
    <>
      {/* Backdrop blur dismiss layer */}
      {isOpen && (
        <div
          onClick={onClose}
          className={`fixed inset-0 z-40 transition-opacity duration-200 ${
            theme.isDark ? 'bg-black/65 backdrop-blur-md' : 'bg-slate-900/30 backdrop-blur-sm'
          }`}
          aria-hidden="true"
        />
      )}

      {/* Anchored Floating Radial Circle Orb at bottom-center above Android System Navigation Bar */}
      <div
        style={{
          bottom: 'calc(var(--safe-area-inset-bottom, 0px) + 1.25rem)',
        }}
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-auto select-none"
      >
        {/* Elevated Upward Fan-Out Arc (22° right to 158° left for RTL visual order) */}
        {RADIAL_MENU_ITEMS.map((item, index) => {
          const angleRad = (item.angleDeg * Math.PI) / 180;
          const targetX = Math.round(Math.cos(angleRad) * radius);
          const targetY = -Math.round(Math.sin(angleRad) * radius) + liftY;

          const isSelected = activeTab === item.id;
          const badgeCount = item.id === 'notes' && sessionLogsCount > 0 ? sessionLogsCount : undefined;

          return (
            <div
              key={item.id}
              style={{
                transform: isOpen
                  ? `translate(${targetX}px, ${targetY}px) scale(1)`
                  : 'translate(0px, 0px) scale(0)',
                opacity: isOpen ? 1 : 0,
                pointerEvents: isOpen ? 'auto' : 'none',
                transition: `all 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.15) ${index * 0.025}s`,
              }}
              className="absolute flex flex-col items-center justify-center"
            >
              <button
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                style={{
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.isDark
                    ? theme.cardBg
                    : '#FFFFFF',
                  borderColor: isSelected ? theme.primaryLight : theme.primary,
                  boxShadow: isSelected
                    ? `0 0 22px ${theme.glowColor}, 0 10px 26px rgba(0,0,0,0.32)`
                    : theme.isDark
                    ? `0 10px 26px rgba(0,0,0,0.55), 0 0 12px ${theme.glowColor}`
                    : `0 8px 22px rgba(15,23,42,0.14), 0 0 10px ${theme.glowColor}`,
                  color: isSelected ? '#FFFFFF' : theme.primary,
                }}
                className="w-13 h-13 rounded-full border-2 flex items-center justify-center backdrop-blur-2xl cursor-pointer hover:scale-110 active:scale-95 transition-transform relative"
                title={item.label}
                aria-label={item.label}
                aria-current={isSelected ? 'page' : undefined}
              >
                {item.icon}
                {badgeCount && (
                  <span
                    style={{ backgroundColor: theme.secondaryAccent || '#EC4899' }}
                    className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-sm"
                  >
                    {badgeCount}
                  </span>
                )}
              </button>

              {/* Readable Label */}
              <div
                style={{
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.isDark
                    ? 'rgba(10, 13, 22, 0.94)'
                    : 'rgba(255, 255, 255, 0.96)',
                  borderColor: isSelected ? theme.primaryLight : theme.borderLuminous,
                  color: isSelected
                    ? '#FFFFFF'
                    : theme.isDark
                    ? '#F8FAFC'
                    : '#0F172A',
                  boxShadow: theme.isDark
                    ? '0 4px 14px rgba(0,0,0,0.65)'
                    : '0 4px 12px rgba(15,23,42,0.12)',
                }}
                className="px-2.5 py-0.5 mt-1.5 rounded-lg text-[10px] font-extrabold border tracking-tight whitespace-nowrap pointer-events-none transition-colors"
              >
                {item.label}
              </div>
            </div>
          );
        })}

        {/* Subtle Ambient Ring when Collapsed */}
        {!isOpen && (
          <span
            style={{
              borderColor: theme.primary,
            }}
            className="absolute w-18 h-18 rounded-full border-2 animate-ping opacity-20 pointer-events-none"
          />
        )}

        {/* Central Orb Trigger Button */}
        <button
          type="button"
          onClick={onToggle}
          style={{
            backgroundColor: isOpen
              ? theme.primary
              : theme.isDark
              ? theme.cardBg
              : '#FFFFFF',
            borderColor: isOpen ? theme.primaryLight : theme.primary,
            boxShadow: theme.isDark
              ? `0 12px 32px rgba(0, 0, 0, 0.65), 0 0 24px ${theme.glowColor}`
              : `0 10px 28px rgba(15, 23, 42, 0.16), 0 0 16px ${theme.glowColor}`,
            color: isOpen ? '#FFFFFF' : theme.primary,
          }}
          className="w-15 h-15 rounded-full flex items-center justify-center border-2 backdrop-blur-2xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 relative group"
          aria-label={isOpen ? 'بستن منوی شعاعی' : 'باز کردن منوی ناوبری شعاعی'}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform duration-200 rotate-90" />
          ) : (
            activeItemIcon
          )}

          {!isOpen && (
            <span
              style={{ backgroundColor: theme.primary }}
              className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
            />
          )}
        </button>
      </div>
    </>
  );
});

RadialMenu.displayName = 'RadialMenu';
