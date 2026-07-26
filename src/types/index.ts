export type DeviceType = 'Desktop' | 'Mobile' | 'Tablet' | 'Laptop';
export type OperatingSystem = 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS';
export type ConnectionQuality = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type ConnectionStatus = 'Disconnected' | 'Connecting' | 'Connected' | 'Paired' | 'Failed';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  os: OperatingSystem;
  ip: string;
  battery?: number | null;
  signalStrength: number; // 0-100%
  connectionQuality: ConnectionQuality;
  latency: number; // ms
  isOnline: boolean;
  lastSeen?: number;
  connectionStatus?: ConnectionStatus;
  isTrusted?: boolean;
}

export interface SelectedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  path?: string; // for folder uploads
  fileObj?: File;
  lastModified?: number;
}

export type TransferStatus = 
  | 'idle'
  | 'requesting'
  | 'waiting_approval'
  | 'connecting'
  | 'transferring'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'rejected';

export interface TransferFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  transferredBytes: number;
  progress: number; // 0-100
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'paused';
  fileObj?: File;
  blobUrl?: string;
  checksum?: string;
}

export interface TransferSession {
  id: string;
  direction: 'send' | 'receive';
  peerDevice: Device;
  files: TransferFileItem[];
  currentFileIndex: number;
  totalFiles: number;
  totalBytes: number;
  transferredBytes: number;
  overallProgress: number; // 0-100%
  uploadSpeed: number; // Bytes per sec
  downloadSpeed: number; // Bytes per sec
  averageSpeed: number; // Bytes per sec
  etaSeconds: number;
  elapsedSeconds: number;
  status: TransferStatus;
  startedAt: number | null;
  endedAt: number | null;
  error?: string;
  isEncrypted: boolean;
}

export interface SpeedDataPoint {
  timestamp: number;
  uploadSpeed: number;
  downloadSpeed: number;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  direction: 'sent' | 'received';
  senderName: string;
  receiverName: string;
  peerDeviceId: string;
  peerDeviceName: string;
  transferSpeed: number; // average B/s
  transferTimeSec: number;
  date: string; // ISO or formatted date
  timestamp: number;
  status: 'Completed' | 'Failed' | 'Cancelled' | 'Pending';
  blobUrl?: string;
  path?: string;
}

export interface Settings {
  deviceName: string;
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  language: string;
  downloadFolder: string;
  notifications: boolean;
  autoAcceptTrusted: boolean;
  encryptionEnabled: boolean;
  visibility: 'everyone' | 'contacts' | 'hidden';
  bandwidthLimitMbps: number; // 0 for unlimited
  transferLimitGb: number; // 0 for unlimited
  autoSaveToDownloads: boolean;
  signalingServerUrl?: string;
}

export interface NetworkStats {
  ip: string;
  subnet: string;
  interfaceName: string;
  signalStrength: number;
  uploadSpeed: number;
  downloadSpeed: number;
  latency: number;
  healthScore: number; // 0-100
  totalBytesSent: number;
  totalBytesReceived: number;
}

export interface SignalingPayload {
  type: string;
  senderId?: string;
  targetId?: string;
  payload?: any;
}
