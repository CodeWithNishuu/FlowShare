import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Laptop,
  Palette,
  ShieldCheck,
  Folder,
  CheckCircle,
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';

const settingsSchema = z.object({
  deviceName: z.string().min(2, 'Device name must be at least 2 characters').max(32, 'Max 32 characters'),
  language: z.string(),
  downloadFolder: z.string().min(1, 'Download folder path required'),
  bandwidthLimitMbps: z.number().min(0),
  transferLimitGb: z.number().min(0),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const accentColors = [
  { label: 'Indigo', hex: '#6366f1' },
  { label: 'Cyan', hex: '#06b6d4' },
  { label: 'Emerald', hex: '#10b981' },
  { label: 'Violet', hex: '#8b5cf6' },
  { label: 'Rose', hex: '#f43f5e' },
  { label: 'Amber', hex: '#f59e0b' },
];

export const Settings: React.FC = () => {
  const settings = useSettings();
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      deviceName: settings.deviceName,
      language: settings.language,
      downloadFolder: settings.downloadFolder,
      bandwidthLimitMbps: settings.bandwidthLimitMbps,
      transferLimitGb: settings.transferLimitGb,
    },
  });

  useEffect(() => {
    setValue('deviceName', settings.deviceName);
    setValue('language', settings.language);
    setValue('downloadFolder', settings.downloadFolder);
    setValue('bandwidthLimitMbps', settings.bandwidthLimitMbps);
    setValue('transferLimitGb', settings.transferLimitGb);
  }, [settings.deviceName, settings.language, settings.downloadFolder, settings.bandwidthLimitMbps, settings.transferLimitGb, setValue]);

  const onSubmit = (data: SettingsFormData) => {
    settings.update(data);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <SettingsIcon className="w-7 h-7 text-indigo-400" />
          <span>Application Settings</span>
        </h1>
        <p className="text-sm text-gray-400">
          Configure local device identity, theme aesthetics, security preferences, and transfer limits.
        </p>
      </div>

      {/* Settings Grid */}
      <form onChange={handleSubmit(onSubmit)} className="space-y-6">
        {/* Device Identity */}
        <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Laptop className="w-5 h-5 text-indigo-400" />
            <span>Device Identity</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                Device Name (Visible on LAN)
              </label>
              <input
                type="text"
                {...register('deviceName')}
                onChange={(e) => {
                  register('deviceName').onChange(e);
                  settings.update({ deviceName: e.target.value });
                }}
                className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 font-medium"
              />
              {errors.deviceName && (
                <p className="text-xs text-rose-400 mt-1">{errors.deviceName.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Language</label>
              <select
                {...register('language')}
                onChange={(e) => {
                  register('language').onChange(e);
                  settings.update({ language: e.target.value });
                }}
                className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm border border-gray-700 focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance & Themes */}
        <div className="bg-gray-900/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Palette className="w-5 h-5 text-cyan-400" />
            <span>Theme & Accent Color</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center space-x-2 min-h-[44px] p-3 rounded-2xl border transition-all ${
                theme === 'dark'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs sm:text-sm">Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center space-x-2 min-h-[44px] p-3 rounded-2xl border transition-all ${
                theme === 'light'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm">Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex items-center justify-center space-x-2 min-h-[44px] p-3 rounded-2xl border transition-all ${
                theme === 'system'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                  : 'bg-gray-800/40 border-gray-700/50 text-gray-400 hover:text-white'
              }`}
            >
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm">System</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">Accent Palette</label>
            <div className="flex flex-wrap items-center gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setAccentColor(color.hex)}
                  className={`w-9 h-9 rounded-full transition-transform flex items-center justify-center min-h-[36px] min-w-[36px] ${
                    accentColor === color.hex ? 'scale-110 ring-4 ring-white/20' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  {accentColor === color.hex && <CheckCircle className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Network Preferences */}
        <div className="bg-gray-900/80 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Security & Network Preferences</span>
          </h3>

          <div className="space-y-3 divide-y divide-gray-800/60 text-xs">
            {/* Visibility to Others */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-semibold text-white">Visible to Others on LAN</p>
                <p className="text-gray-400">Control who can discover this device on the local network</p>
              </div>
              <select
                value={settings.visibility || 'everyone'}
                onChange={(e) => settings.update({ visibility: e.target.value as any })}
                className="bg-gray-800 text-gray-200 px-3 py-1.5 rounded-xl border border-gray-700 focus:outline-none text-xs"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">Trusted Contacts Only</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-semibold text-white">ECDH + AES-256-GCM Encryption</p>
                <p className="text-gray-400">Encrypt file chunks before streaming over WebRTC</p>
              </div>
              <button
                type="button"
                onClick={() => settings.update({ encryptionEnabled: !settings.encryptionEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                  settings.encryptionEnabled ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    settings.encryptionEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-semibold text-white">Auto-Accept Trusted Devices</p>
                <p className="text-gray-400">Bypass approval prompt for paired contacts</p>
              </div>
              <button
                type="button"
                onClick={() => settings.update({ autoAcceptTrusted: !settings.autoAcceptTrusted })}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                  settings.autoAcceptTrusted ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    settings.autoAcceptTrusted ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-semibold text-white">System Notifications</p>
                <p className="text-gray-400">Play audio chime & browser popups on transfer complete</p>
              </div>
              <button
                type="button"
                onClick={() => settings.update({ notifications: !settings.notifications })}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                  settings.notifications ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Directory & Bandwidth Limits */}
        <div className="bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Folder className="w-5 h-5 text-amber-400" />
            <span>Download Path & Limits</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                Save Files Directory
              </label>
              <input
                type="text"
                {...register('downloadFolder')}
                onChange={(e) => {
                  register('downloadFolder').onChange(e);
                  settings.update({ downloadFolder: e.target.value });
                }}
                className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm border border-gray-700 focus:outline-none font-mono"
              />
              {errors.downloadFolder && (
                <p className="text-xs text-rose-400 mt-1">{errors.downloadFolder.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                Custom Signaling Server URL (Optional for Vercel/Cloud deployment)
              </label>
              <input
                type="text"
                value={settings.signalingServerUrl || ''}
                onChange={(e) => {
                  settings.update({ signalingServerUrl: e.target.value });
                }}
                placeholder="e.g. wss://your-signaling-server.onrender.com or ws://192.168.1.5:4000"
                className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm border border-gray-700 focus:outline-none font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                If deployed on Vercel, enter your laptop local IP (e.g. ws://192.168.x.x:4000) or public WSS server URL to discover devices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                  Bandwidth Speed Cap (0 = Unlimited)
                </label>
                <input
                  type="number"
                  {...register('bandwidthLimitMbps', { valueAsNumber: true })}
                  onChange={(e) => {
                    register('bandwidthLimitMbps', { valueAsNumber: true }).onChange(e);
                    settings.update({ bandwidthLimitMbps: Number(e.target.value) });
                  }}
                  placeholder="Mbps"
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl text-sm border border-gray-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                  Monthly Transfer Limit (0 = Unlimited)
                </label>
                <input
                  type="number"
                  {...register('transferLimitGb', { valueAsNumber: true })}
                  onChange={(e) => {
                    register('transferLimitGb', { valueAsNumber: true }).onChange(e);
                    settings.update({ transferLimitGb: Number(e.target.value) });
                  }}
                  placeholder="GB"
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-xl text-sm border border-gray-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
