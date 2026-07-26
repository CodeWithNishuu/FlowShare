import React from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  speedText?: string;
  subText?: string;
  color?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 280,
  strokeWidth = 16,
  label,
  speedText,
  subText,
  color = '#6366f1',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-800/80 fill-none"
        />

        {/* Animated Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          strokeLinecap="round"
          className="fill-none"
          style={{ filter: 'url(#glow)' }}
        />
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        <span className="text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
          {Math.round(percentage)}%
        </span>
        {speedText && (
          <span className="mt-1 text-sm font-semibold text-cyan-400 bg-cyan-950/60 px-3 py-0.5 rounded-full border border-cyan-500/30">
            {speedText}
          </span>
        )}
        {label && <span className="mt-2 text-xs font-medium text-gray-400 max-w-[180px] truncate">{label}</span>}
        {subText && <span className="text-xs text-gray-500 mt-0.5">{subText}</span>}
      </div>
    </div>
  );
};
