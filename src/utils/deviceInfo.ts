import { DeviceType, OperatingSystem } from '../types';

export function detectBrowserAndOS(): {
  browser: string;
  os: OperatingSystem;
  deviceType: DeviceType;
  defaultName: string;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      browser: 'Browser',
      os: 'Windows',
      deviceType: 'Desktop',
      defaultName: 'FlowShare Device',
    };
  }

  const ua = navigator.userAgent;

  // OS Detection
  let os: OperatingSystem = 'Windows';
  if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'iOS';
  } else if (/Android/.test(ua)) {
    os = 'Android';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'macOS';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  } else if (/Windows/.test(ua)) {
    os = 'Windows';
  }

  // Device Type Detection
  let deviceType: DeviceType = 'Desktop';
  if (os === 'Android' || os === 'iOS') {
    deviceType = /Tablet|iPad/i.test(ua) ? 'Tablet' : 'Mobile';
  } else if (/Laptop|MacBook/i.test(ua)) {
    deviceType = 'Laptop';
  }

  // Browser Detection
  let browser = 'Chrome';
  if (ua.includes('Edg/')) {
    browser = 'Edge';
  } else if (ua.includes('OPR/') || ua.includes('Opera')) {
    browser = 'Opera';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if ((navigator as any).brave) {
    browser = 'Brave';
  } else if (ua.includes('Chrome')) {
    browser = 'Chrome';
  }

  // Unique per session tab fallback if needed
  let sessionTag = '';
  try {
    if (typeof sessionStorage !== 'undefined') {
      let savedTag = sessionStorage.getItem('flowshare_session_tag');
      if (!savedTag) {
        savedTag = Math.floor(100 + Math.random() * 900).toString();
        sessionStorage.setItem('flowshare_session_tag', savedTag);
      }
      sessionTag = ` #${savedTag}`;
    }
  } catch (e) {}

  const defaultName = `${browser} (${os}${sessionTag})`;

  return { browser, os, deviceType, defaultName };
}
