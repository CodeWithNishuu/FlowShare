import { useSettingsStore } from '../stores/settingsStore';

export function useSettings() {
  const settings = useSettingsStore();
  return {
    ...settings,
    update: settings.updateSettings,
    reset: settings.resetSettings,
  };
}
