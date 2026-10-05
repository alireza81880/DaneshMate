import React from 'react';
import { PaletteTheme } from '../../App';
import { ThemeEngineCard } from './ThemeEngineCard';
import { UpdateSettingsCard } from './UpdateSettingsCard';

export interface SettingsScreenProps {
  theme: PaletteTheme;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = React.memo(({
  theme,
  currentThemeId,
  onSelectTheme,
}) => {
  return (
    <div className="space-y-6">
      <ThemeEngineCard
        theme={theme}
        currentThemeId={currentThemeId}
        onSelectTheme={onSelectTheme}
      />
      <UpdateSettingsCard theme={theme} />
    </div>
  );
});
