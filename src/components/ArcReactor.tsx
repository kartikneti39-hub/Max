import React, { useEffect, useState } from 'react';
import { JarvisMode } from '../types/jarvis';
import { Mic, MicOff, Volume2, Cpu, Sparkles } from 'lucide-react';

interface ArcReactorProps {
  mode: JarvisMode;
  onToggleMic: () => void;
  statusText?: string;
  theme?: 'cyan' | 'gold' | 'crimson' | 'emerald';
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  mode,
  onToggleMic,
  statusText,
  theme = 'cyan',
}) => {
  const [waveAmplitudes, setWaveAmplitudes] = useState<number[]>([12, 24, 40, 18, 32, 48, 22, 16]);

  // Audio wave animation simulation for speaking/listening
  useEffect(() => {
    if (mode === 'listening' || mode === 'speaking') {
      const interval = setInterval(() => {
        setWaveAmplitudes(
          Array.from({ length: 12 }, () => Math.floor(Math.random() * 45) + 10)
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setWaveAmplitudes([12, 16, 20, 14, 18, 22, 15, 12]);
    }
  }, [mode]);

  // Theme color definitions
  const themeColors = {
    cyan: {
      primary: '#38bdf8',
      secondary: '#0284c7',
      glow: 'rgba(56, 189, 248, 0.4)',
      bgRing: '#032948',
    },
    gold: {
      primary: '#facc15',
      secondary: '#ca8a04',
      glow: 'rgba(250, 204, 21, 0.4)',
      bgRing: '#423306',
    },
    crimson: {
      primary: '#ef4444',
      secondary: '#b91c1c',
      glow: 'rgba(239, 68, 68, 0.4)',
      bgRing: '#450a0a',
    },
    emerald: {
      primary: '#10b981',
      secondary: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)',
      bgRing: '#064e3b',
    },
  }[theme];

  const getStatusLabel = () => {
    switch (mode) {
      case 'listening':
        return 'LISTENING FOR COMMAND...';
      case 'processing':
        return 'SYNAPSE COMPUTATION...';
      case 'speaking':
        return 'JARVIS TRANSMITTING...';
      case 'action':
        return 'EXECUTING PROTOCOL...';
      default:
        return 'JARVIS CORE ONLINE';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 select-none relative">
      {/* Reactor Wrapper with Pulsing Rings */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        {/* Outermost Radar sweep ring */}
        <div
          className={`absolute inset-0 rounded-full border border-dashed opacity-40 ${
            mode === 'listening' || mode === 'processing'
              ? 'animate-spin-slow'
              : 'opacity-20'
          }`}
          style={{ borderColor: themeColors.primary }}
        />

        {/* Outer segment ring */}
        <div
          className={`absolute w-[92%] h-[92%] rounded-full border-2 border-opacity-60 transition-transform duration-700 ${
            mode === 'listening' ? 'scale-105 animate-spin-reverse' : 'animate-spin-slow'
          }`}
          style={{
            borderColor: themeColors.secondary,
            borderStyle: 'dashed',
            borderWidth: '2px',
          }}
        />

        {/* Ambient Glow */}
        <div
          className={`absolute w-44 h-44 rounded-full blur-2xl transition-all duration-500 ${
            mode === 'listening'
              ? 'scale-125 opacity-70'
              : mode === 'speaking'
              ? 'scale-110 opacity-60'
              : 'opacity-30'
          }`}
          style={{ backgroundColor: themeColors.primary }}
        />

        {/* SVG Arc Reactor Structure */}
        <svg
          className="w-full h-full absolute inset-0 transition-transform duration-500"
          viewBox="0 0 300 300"
        >
          <defs>
            <radialGradient id={`coreGlow-${theme}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="45%" stopColor={themeColors.primary} stopOpacity="0.8" />
              <stop offset="85%" stopColor={themeColors.secondary} stopOpacity="0.3" />
              <stop offset="100%" stopColor="#040812" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Compass Tick Marks */}
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1="150"
              y1="10"
              x2="150"
              y2={i % 6 === 0 ? "24" : "18"}
              stroke={themeColors.primary}
              strokeWidth={i % 6 === 0 ? "2.5" : "1"}
              strokeOpacity={i % 2 === 0 ? "0.8" : "0.3"}
              transform={`rotate(${i * 15} 150 150)`}
            />
          ))}

          {/* Heavy Segments of Arc Reactor */}
          <g transform={mode === 'processing' ? 'rotate(90 150 150)' : 'rotate(0 150 150)'} className="transition-transform duration-1000">
            {Array.from({ length: 10 }).map((_, i) => (
              <rect
                key={i}
                x="144"
                y="36"
                width="12"
                height="22"
                rx="3"
                fill={themeColors.primary}
                opacity={mode === 'listening' ? 0.9 : 0.65}
                transform={`rotate(${i * 36} 150 150)`}
              />
            ))}
          </g>

          {/* Inner Glowing Track */}
          <circle
            cx="150"
            cy="150"
            r="82"
            fill="none"
            stroke={themeColors.primary}
            strokeWidth="3"
            strokeDasharray="14 8"
            className={mode === 'listening' ? 'animate-spin-slow' : ''}
          />

          <circle
            cx="150"
            cy="150"
            r="66"
            fill={`url(#coreGlow-${theme})`}
            opacity="0.85"
          />

          {/* Inner Core Housing */}
          <circle
            cx="150"
            cy="150"
            r="48"
            fill="#050e1f"
            stroke={themeColors.primary}
            strokeWidth="3"
          />
        </svg>

        {/* Center Interactive Button (Push to Talk / Status) */}
        <button
          onClick={onToggleMic}
          aria-label="Toggle Voice Command"
          className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl cursor-pointer ${
            mode === 'listening'
              ? 'bg-cyan-500/20 ring-4 ring-cyan-400 ring-opacity-80 scale-105'
              : mode === 'processing'
              ? 'bg-amber-500/20 ring-4 ring-amber-400 ring-opacity-80 animate-pulse'
              : mode === 'speaking'
              ? 'bg-sky-500/20 ring-2 ring-sky-300 animate-pulse'
              : 'bg-[#061224] hover:bg-[#0b1d3a] ring-2 ring-cyan-500/40 hover:ring-cyan-400'
          }`}
        >
          {mode === 'listening' ? (
            <>
              <Mic className="w-8 h-8 text-cyan-300 animate-bounce" />
              <span className="text-[10px] font-tech text-cyan-300 tracking-widest mt-1">LISTENING</span>
            </>
          ) : mode === 'processing' ? (
            <>
              <Cpu className="w-8 h-8 text-amber-300 animate-spin" />
              <span className="text-[10px] font-tech text-amber-300 tracking-widest mt-1">THINKING</span>
            </>
          ) : mode === 'speaking' ? (
            <>
              <Volume2 className="w-8 h-8 text-sky-300 animate-pulse" />
              <span className="text-[10px] font-tech text-sky-300 tracking-widest mt-1">SPEAKING</span>
            </>
          ) : (
            <>
              <Mic className="w-8 h-8 text-cyan-400 group-hover:text-white transition-colors" />
              <span className="text-[10px] font-hud text-cyan-400 tracking-wider mt-1">TAP TO TALK</span>
            </>
          )}
        </button>
      </div>

      {/* Futuristic Audio Visualizer Wave Spectrum */}
      <div className="flex items-center gap-1.5 h-10 mt-3 px-6 py-1 bg-black/40 rounded-full border border-cyan-900/50">
        {waveAmplitudes.map((h, idx) => (
          <div
            key={idx}
            className="w-1.5 rounded-full transition-all duration-100"
            style={{
              height: `${Math.max(6, h * 0.7)}px`,
              backgroundColor:
                mode === 'listening'
                  ? themeColors.primary
                  : mode === 'processing'
                  ? '#facc15'
                  : mode === 'speaking'
                  ? '#38bdf8'
                  : 'rgba(56, 189, 248, 0.25)',
              boxShadow:
                mode === 'listening' || mode === 'speaking'
                  ? `0 0 8px ${themeColors.primary}`
                  : 'none',
            }}
          />
        ))}
      </div>

      {/* Status HUD readout */}
      <div className="mt-3 text-center">
        <p className="text-xs font-tech tracking-[0.2em] uppercase font-semibold text-cyan-400 flex items-center justify-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              mode === 'listening'
                ? 'bg-red-500 animate-ping'
                : mode === 'processing'
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          {statusText || getStatusLabel()}
        </p>
      </div>
    </div>
  );
};
