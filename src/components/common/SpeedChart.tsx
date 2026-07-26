import React from 'react';
import { SpeedDataPoint } from '../../types';

interface SpeedChartProps {
  data: SpeedDataPoint[];
  height?: number;
}

export const SpeedChart: React.FC<SpeedChartProps> = ({ data, height = 140 }) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-gray-500 bg-gray-900/40 rounded-xl border border-gray-800">
        Waiting for speed telemetry...
      </div>
    );
  }

  const maxSpeed = Math.max(
    1000000, // min scale 1 MB/s
    ...data.map((d) => Math.max(d.uploadSpeed, d.downloadSpeed))
  );

  const pointsCount = data.length;
  const svgWidth = 500;
  const svgHeight = height;
  const padding = 10;

  const getX = (idx: number) => padding + (idx / (pointsCount - 1)) * (svgWidth - 2 * padding);
  const getY = (speed: number) => svgHeight - padding - (speed / maxSpeed) * (svgHeight - 2 * padding);

  const uploadPoints = data.map((d, i) => `${getX(i)},${getY(d.uploadSpeed)}`).join(' ');
  const downloadPoints = data.map((d, i) => `${getX(i)},${getY(d.downloadSpeed)}`).join(' ');

  const uploadArea = `${getX(0)},${svgHeight - padding} ${uploadPoints} ${getX(pointsCount - 1)},${svgHeight - padding}`;
  const downloadArea = `${getX(0)},${svgHeight - padding} ${downloadPoints} ${getX(pointsCount - 1)},${svgHeight - padding}`;

  const formatSpeed = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB/s`;
    return `${bytes} B/s`;
  };

  const currentUpload = data[data.length - 1]?.uploadSpeed || 0;
  const currentDownload = data[data.length - 1]?.downloadSpeed || 0;

  return (
    <div className="w-full bg-gray-900/60 backdrop-blur-md p-4 rounded-xl border border-gray-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
            <span>Upload: {formatSpeed(currentUpload)}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <span>Download: {formatSpeed(currentDownload)}</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Max: {formatSpeed(maxSpeed)}</span>
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#374151" strokeDasharray="3 3" strokeOpacity="0.5" />

        {/* Upload Area & Line */}
        <polygon points={uploadArea} fill="url(#uploadGradient)" />
        <polyline points={uploadPoints} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Download Area & Line */}
        <polygon points={downloadArea} fill="url(#downloadGradient)" />
        <polyline points={downloadPoints} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
